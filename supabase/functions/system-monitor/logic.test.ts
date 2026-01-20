/// <reference lib="deno.ns" />

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  evaluateRule,
  evaluateErrorRateRule,
  evaluateErrorPatternRule,
  evaluateFunctionHealthRule,
  isInCooldown,
  findAlertsToAutoResolve,
  evaluateAllRules,
  parseLogLine,
  parseLogs,
  isPatternSafe,
  safeCreateRegex,
  safeRegexTest,
  type AlertRule,
  type Alert,
  type LogEntry,
} from "./logic.ts";

// ============================================================
// TEST FIXTURES
// ============================================================

const NOW = new Date("2026-01-20T12:00:00Z");

function createLogEntry(overrides: Partial<LogEntry> = {}): LogEntry {
  return {
    timestamp: new Date(NOW.getTime() - 5 * 60 * 1000).toISOString(), // 5 min ago
    level: "error",
    message: "Test error message",
    function_name: "test-function",
    ...overrides,
  };
}

function createErrorRateRule(overrides: Partial<AlertRule> = {}): AlertRule {
  return {
    id: "rule-error-rate",
    name: "High Error Rate",
    description: "Test rule",
    rule_type: "error_rate",
    target_functions: null,
    config: { threshold: 5, window_minutes: 15 },
    severity: "critical",
    cooldown_minutes: 30,
    is_enabled: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function createErrorPatternRule(overrides: Partial<AlertRule> = {}): AlertRule {
  return {
    id: "rule-error-pattern",
    name: "Timeout Detection",
    description: "Test rule",
    rule_type: "error_pattern",
    target_functions: null,
    config: { pattern: "timeout|timed out", case_sensitive: false },
    severity: "warning",
    cooldown_minutes: 60,
    is_enabled: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function createFunctionHealthRule(overrides: Partial<AlertRule> = {}): AlertRule {
  return {
    id: "rule-function-health",
    name: "Consecutive Failures",
    description: "Test rule",
    rule_type: "function_health",
    target_functions: null,
    config: { consecutive_failures: 3 },
    severity: "critical",
    cooldown_minutes: 60,
    is_enabled: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function createAlert(overrides: Partial<Alert> = {}): Alert {
  return {
    id: "alert-1",
    rule_id: "rule-error-rate",
    title: "Test Alert",
    message: "Test message",
    severity: "warning",
    context: {},
    status: "pending",
    acknowledged_at: null,
    acknowledged_by: null,
    acknowledgment_note: null,
    resolved_at: null,
    auto_resolved: false,
    created_at: "2026-01-20T11:00:00Z",
    updated_at: "2026-01-20T11:00:00Z",
    ...overrides,
  };
}

// ============================================================
// ERROR RATE RULE TESTS
// ============================================================

Deno.test("evaluateErrorRateRule - triggers when threshold exceeded", () => {
  const rule = createErrorRateRule();
  const logs: LogEntry[] = Array.from({ length: 6 }, (_, i) =>
    createLogEntry({ message: `Error ${i}` })
  );

  const result = evaluateErrorRateRule(rule, logs, NOW);

  assertEquals(result.triggered, true);
  assertExists(result.alert);
  assertEquals(result.alert.severity, "critical");
  assertEquals(result.alert.context.error_count, 6);
});

Deno.test("evaluateErrorRateRule - does not trigger below threshold", () => {
  const rule = createErrorRateRule();
  const logs: LogEntry[] = Array.from({ length: 3 }, (_, i) =>
    createLogEntry({ message: `Error ${i}` })
  );

  const result = evaluateErrorRateRule(rule, logs, NOW);

  assertEquals(result.triggered, false);
  assertEquals(result.alert, undefined);
});

Deno.test("evaluateErrorRateRule - ignores logs outside time window", () => {
  const rule = createErrorRateRule({ config: { threshold: 5, window_minutes: 10 } });

  // 6 errors, but 3 are from 20 minutes ago (outside 10 min window)
  const logs: LogEntry[] = [
    ...Array.from({ length: 3 }, () =>
      createLogEntry({ timestamp: new Date(NOW.getTime() - 5 * 60 * 1000).toISOString() })
    ),
    ...Array.from({ length: 3 }, () =>
      createLogEntry({ timestamp: new Date(NOW.getTime() - 20 * 60 * 1000).toISOString() })
    ),
  ];

  const result = evaluateErrorRateRule(rule, logs, NOW);

  assertEquals(result.triggered, false);
});

Deno.test("evaluateErrorRateRule - filters by error_pattern when specified", () => {
  const rule = createErrorRateRule({
    config: { threshold: 3, window_minutes: 15, error_pattern: "database" },
  });

  const logs: LogEntry[] = [
    createLogEntry({ message: "Database connection failed" }),
    createLogEntry({ message: "Database timeout" }),
    createLogEntry({ message: "Database error" }),
    createLogEntry({ message: "Network error" }),
    createLogEntry({ message: "Auth failed" }),
  ];

  const result = evaluateErrorRateRule(rule, logs, NOW);

  assertEquals(result.triggered, true);
  assertEquals(result.alert?.context.error_count, 3);
});

// ============================================================
// ERROR PATTERN RULE TESTS
// ============================================================

Deno.test("evaluateErrorPatternRule - triggers on pattern match", () => {
  const rule = createErrorPatternRule();
  const logs: LogEntry[] = [
    createLogEntry({ message: "Request timed out after 30s" }),
    createLogEntry({ message: "Connection timeout" }),
    createLogEntry({ message: "Success" }),
  ];

  const result = evaluateErrorPatternRule(rule, logs, NOW);

  assertEquals(result.triggered, true);
  assertExists(result.alert);
  assertEquals(result.alert.context.error_count, 2);
  assertEquals(result.alert.context.matched_pattern, "timeout|timed out");
});

Deno.test("evaluateErrorPatternRule - does not trigger without matches", () => {
  const rule = createErrorPatternRule();
  const logs: LogEntry[] = [
    createLogEntry({ message: "Database error" }),
    createLogEntry({ message: "Auth failed" }),
  ];

  const result = evaluateErrorPatternRule(rule, logs, NOW);

  assertEquals(result.triggered, false);
});

Deno.test("evaluateErrorPatternRule - respects case sensitivity", () => {
  const rule = createErrorPatternRule({
    config: { pattern: "TIMEOUT", case_sensitive: true },
  });
  const logs: LogEntry[] = [
    createLogEntry({ message: "Request timeout" }), // lowercase
  ];

  const result = evaluateErrorPatternRule(rule, logs, NOW);

  assertEquals(result.triggered, false);
});

// ============================================================
// FUNCTION HEALTH RULE TESTS
// ============================================================

Deno.test("evaluateFunctionHealthRule - triggers on consecutive failures", () => {
  const rule = createFunctionHealthRule();

  // 4 consecutive errors (most recent first by timestamp)
  const logs: LogEntry[] = [
    createLogEntry({ timestamp: "2026-01-20T11:59:00Z", level: "error", function_name: "my-func" }),
    createLogEntry({ timestamp: "2026-01-20T11:58:00Z", level: "error", function_name: "my-func" }),
    createLogEntry({ timestamp: "2026-01-20T11:57:00Z", level: "error", function_name: "my-func" }),
    createLogEntry({ timestamp: "2026-01-20T11:56:00Z", level: "error", function_name: "my-func" }),
    createLogEntry({ timestamp: "2026-01-20T11:55:00Z", level: "info", function_name: "my-func" }), // Success before errors
  ];

  const result = evaluateFunctionHealthRule(rule, logs, NOW);

  assertEquals(result.triggered, true);
  assertExists(result.alert);
  assertEquals(result.alert.context.consecutive_failures, 4);
  assertEquals(result.alert.context.function_names, ["my-func"]);
});

Deno.test("evaluateFunctionHealthRule - does not trigger with intermittent success", () => {
  const rule = createFunctionHealthRule();

  // Errors are not consecutive - success in the middle
  const logs: LogEntry[] = [
    createLogEntry({ timestamp: "2026-01-20T11:59:00Z", level: "error", function_name: "my-func" }),
    createLogEntry({ timestamp: "2026-01-20T11:58:00Z", level: "error", function_name: "my-func" }),
    createLogEntry({ timestamp: "2026-01-20T11:57:00Z", level: "info", function_name: "my-func" }), // Success breaks chain
    createLogEntry({ timestamp: "2026-01-20T11:56:00Z", level: "error", function_name: "my-func" }),
  ];

  const result = evaluateFunctionHealthRule(rule, logs, NOW);

  assertEquals(result.triggered, false);
});

// ============================================================
// COOLDOWN TESTS
// ============================================================

Deno.test("isInCooldown - returns true within cooldown window", () => {
  const rule = createErrorRateRule({ cooldown_minutes: 30 });
  const existingAlerts: Alert[] = [
    createAlert({
      rule_id: rule.id,
      created_at: new Date(NOW.getTime() - 15 * 60 * 1000).toISOString(), // 15 min ago
    }),
  ];

  assertEquals(isInCooldown(rule, existingAlerts, NOW), true);
});

Deno.test("isInCooldown - returns false after cooldown expires", () => {
  const rule = createErrorRateRule({ cooldown_minutes: 30 });
  const existingAlerts: Alert[] = [
    createAlert({
      rule_id: rule.id,
      created_at: new Date(NOW.getTime() - 45 * 60 * 1000).toISOString(), // 45 min ago
    }),
  ];

  assertEquals(isInCooldown(rule, existingAlerts, NOW), false);
});

Deno.test("isInCooldown - returns false with no existing alerts", () => {
  const rule = createErrorRateRule();
  assertEquals(isInCooldown(rule, [], NOW), false);
});

// ============================================================
// FULL RULE EVALUATION TESTS
// ============================================================

Deno.test("evaluateRule - skips alert creation during cooldown", () => {
  const rule = createErrorRateRule({ cooldown_minutes: 30 });
  const logs: LogEntry[] = Array.from({ length: 10 }, () => createLogEntry());
  const existingAlerts: Alert[] = [
    createAlert({
      rule_id: rule.id,
      created_at: new Date(NOW.getTime() - 10 * 60 * 1000).toISOString(), // 10 min ago
    }),
  ];

  const result = evaluateRule(rule, logs, existingAlerts, NOW);

  assertEquals(result.triggered, true);
  assertEquals(result.shouldCreateAlert, false);
  assertEquals(result.reason, "Skipped due to cooldown");
});

Deno.test("evaluateRule - filters logs by target_functions", () => {
  const rule = createErrorRateRule({
    target_functions: ["target-func"],
    config: { threshold: 3, window_minutes: 15 },
  });

  const logs: LogEntry[] = [
    createLogEntry({ function_name: "target-func", message: "Error 1" }),
    createLogEntry({ function_name: "target-func", message: "Error 2" }),
    createLogEntry({ function_name: "target-func", message: "Error 3" }),
    createLogEntry({ function_name: "other-func", message: "Error 4" }),
    createLogEntry({ function_name: "other-func", message: "Error 5" }),
  ];

  const result = evaluateRule(rule, logs, [], NOW);

  assertEquals(result.triggered, true);
  assertEquals(result.alert?.context.error_count, 3);
});

// ============================================================
// AUTO-RESOLUTION TESTS
// ============================================================

Deno.test("findAlertsToAutoResolve - identifies cleared alerts", () => {
  const rule = createErrorRateRule({ config: { threshold: 5, window_minutes: 15 } });
  const pendingAlerts: Alert[] = [
    createAlert({ id: "alert-to-resolve", rule_id: rule.id }),
  ];

  // Only 2 errors now - below threshold
  const logs: LogEntry[] = [
    createLogEntry({ message: "Error 1" }),
    createLogEntry({ message: "Error 2" }),
  ];

  const toResolve = findAlertsToAutoResolve(pendingAlerts, [rule], logs, NOW);

  assertEquals(toResolve, ["alert-to-resolve"]);
});

Deno.test("findAlertsToAutoResolve - keeps alerts with ongoing condition", () => {
  const rule = createErrorRateRule({ config: { threshold: 5, window_minutes: 15 } });
  const pendingAlerts: Alert[] = [
    createAlert({ id: "alert-ongoing", rule_id: rule.id }),
  ];

  // Still 6 errors - above threshold
  const logs: LogEntry[] = Array.from({ length: 6 }, () => createLogEntry());

  const toResolve = findAlertsToAutoResolve(pendingAlerts, [rule], logs, NOW);

  assertEquals(toResolve, []);
});

// ============================================================
// BATCH EVALUATION TESTS
// ============================================================

Deno.test("evaluateAllRules - evaluates multiple rules", () => {
  const rules: AlertRule[] = [
    createErrorRateRule({ config: { threshold: 3, window_minutes: 15 } }),
    createErrorPatternRule(),
  ];

  const logs: LogEntry[] = [
    createLogEntry({ message: "Database error" }),
    createLogEntry({ message: "Request timeout" }),
    createLogEntry({ message: "Connection timed out" }),
    createLogEntry({ message: "Auth error" }),
  ];

  const alerts = evaluateAllRules(rules, logs, [], NOW);

  assertEquals(alerts.length, 2); // Both rules should trigger
});

Deno.test("evaluateAllRules - skips disabled rules", () => {
  const rules: AlertRule[] = [
    createErrorRateRule({ is_enabled: false, config: { threshold: 1, window_minutes: 15 } }),
  ];

  const logs: LogEntry[] = [createLogEntry()];

  const alerts = evaluateAllRules(rules, logs, [], NOW);

  assertEquals(alerts.length, 0);
});

// ============================================================
// LOG PARSING TESTS
// ============================================================

Deno.test("parseLogLine - parses JSON log format", () => {
  const line = JSON.stringify({
    timestamp: "2026-01-20T12:00:00Z",
    level: "error",
    msg: "Database connection failed",
    function_name: "calculate-readiness",
  });

  const result = parseLogLine(line);

  assertExists(result);
  assertEquals(result.level, "error");
  assertEquals(result.message, "Database connection failed");
  assertEquals(result.function_name, "calculate-readiness");
});

Deno.test("parseLogLine - parses bracketed format", () => {
  const line = "[2026-01-20T12:00:00Z] [error] [my-function] Something went wrong";

  const result = parseLogLine(line);

  assertExists(result);
  assertEquals(result.level, "error");
  assertEquals(result.message, "Something went wrong");
  assertEquals(result.function_name, "my-function");
});

Deno.test("parseLogLine - handles lines with error keyword", () => {
  const line = "Critical error in processing";

  const result = parseLogLine(line);

  assertExists(result);
  assertEquals(result.level, "error");
  assertEquals(result.message, "Critical error in processing");
});

Deno.test("parseLogs - filters invalid lines", () => {
  const lines = [
    JSON.stringify({ timestamp: "2026-01-20T12:00:00Z", level: "error", msg: "Error 1", function_name: "fn1" }),
    "not a valid log line gibberish xyz",  // No keywords, should be filtered
    JSON.stringify({ timestamp: "2026-01-20T12:00:00Z", level: "info", msg: "Info 1", function_name: "fn2" }),
  ];

  const result = parseLogs(lines);

  assertEquals(result.length, 2);
});

// ============================================================
// SAFE REGEX UTILITIES TESTS
// ============================================================

Deno.test("isPatternSafe - accepts valid simple patterns", () => {
  assertEquals(isPatternSafe("error"), true);
  assertEquals(isPatternSafe("timeout|failed"), true);
  assertEquals(isPatternSafe("database.*connection"), true);
  assertEquals(isPatternSafe("[0-9]+"), true);
  assertEquals(isPatternSafe("^Error:"), true);
});

Deno.test("isPatternSafe - rejects empty or null patterns", () => {
  assertEquals(isPatternSafe(""), false);
});

Deno.test("isPatternSafe - rejects patterns exceeding max length", () => {
  const longPattern = "a".repeat(201);
  assertEquals(isPatternSafe(longPattern), false);

  // 200 chars should be OK
  const maxPattern = "a".repeat(200);
  assertEquals(isPatternSafe(maxPattern), true);
});

Deno.test("isPatternSafe - rejects nested quantifiers (ReDoS pattern)", () => {
  // (a+)+ - classic ReDoS
  assertEquals(isPatternSafe("(a+)+"), false);

  // (.*)*
  assertEquals(isPatternSafe("(.*)*"), false);

  // ([a-z]+)*
  assertEquals(isPatternSafe("([a-z]+)*"), false);
});

Deno.test("isPatternSafe - rejects overlapping alternations", () => {
  // (a|a)+ - overlapping alternation
  assertEquals(isPatternSafe("(a|a)+"), false);

  // (foo|foo)*
  assertEquals(isPatternSafe("(foo|foo)*"), false);
});

Deno.test("isPatternSafe - rejects repeated wildcards", () => {
  // (.*)+ - repeated wildcard
  assertEquals(isPatternSafe("(.*)+"), false);

  // (.+)*
  assertEquals(isPatternSafe("(.+)*"), false);
});

Deno.test("isPatternSafe - rejects direct nested quantifiers", () => {
  // a++ style
  assertEquals(isPatternSafe("a++"), false);
  assertEquals(isPatternSafe("a**"), false);
  assertEquals(isPatternSafe("a+*"), false);
});

Deno.test("safeCreateRegex - returns regex for valid patterns", () => {
  const regex = safeCreateRegex("error|warning", "i");

  assertExists(regex);
  assertEquals(regex.test("Error occurred"), true);
  assertEquals(regex.test("Warning: low memory"), true);
  assertEquals(regex.test("Info message"), false);
});

Deno.test("safeCreateRegex - returns null for unsafe patterns", () => {
  assertEquals(safeCreateRegex("(a+)+"), null);
  assertEquals(safeCreateRegex("(.*)*"), null);
  assertEquals(safeCreateRegex("a".repeat(201)), null);
});

Deno.test("safeCreateRegex - returns null for invalid regex syntax", () => {
  assertEquals(safeCreateRegex("[unclosed"), null);
  assertEquals(safeCreateRegex("(unbalanced"), null);
  assertEquals(safeCreateRegex("*invalid"), null);
});

Deno.test("safeRegexTest - executes regex test correctly", () => {
  const regex = new RegExp("error", "i");

  assertEquals(safeRegexTest(regex, "Error occurred"), true);
  assertEquals(safeRegexTest(regex, "Success"), false);
});

Deno.test("evaluateErrorPatternRule - handles unsafe pattern gracefully", () => {
  const rule = createErrorPatternRule({
    config: { pattern: "(a+)+", case_sensitive: false }, // Unsafe ReDoS pattern
  });

  const logs: LogEntry[] = [
    createLogEntry({ message: "aaaaaaaaaaaaaaaaaa" }),
  ];

  const result = evaluateErrorPatternRule(rule, logs, NOW);

  // Should not trigger - pattern is rejected as unsafe
  assertEquals(result.triggered, false);
  assertEquals(result.reason, "Invalid or unsafe regex pattern");
});

Deno.test("evaluateErrorRateRule - handles unsafe error_pattern gracefully", () => {
  const rule = createErrorRateRule({
    config: {
      threshold: 1,
      window_minutes: 15,
      error_pattern: "(a+)+" // Unsafe pattern
    },
  });

  const logs: LogEntry[] = [
    createLogEntry({ message: "aaaaaaaaaaaaa" }),
    createLogEntry({ message: "bbbbbbbbbbbbb" }),
    createLogEntry({ message: "Error with aaaaa" }),
  ];

  const result = evaluateErrorRateRule(rule, logs, NOW);

  // Should still work - unsafe pattern is skipped, all errors count
  // All 3 logs are errors, threshold is 1, so it should trigger
  assertEquals(result.triggered, true);
  assertEquals(result.alert?.context.error_count, 3);
});
