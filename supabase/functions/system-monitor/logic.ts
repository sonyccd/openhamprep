/// <reference lib="deno.ns" />

/**
 * Pure logic for system monitoring rule evaluation.
 * Extracted for testability - no I/O operations in this file.
 */

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export type RuleType = 'error_rate' | 'error_pattern' | 'function_health';
export type Severity = 'info' | 'warning' | 'critical';
export type AlertStatus = 'pending' | 'acknowledged' | 'resolved';

export interface AlertRule {
  id: string;
  name: string;
  description: string | null;
  rule_type: RuleType;
  target_functions: string[] | null;
  config: ErrorRateConfig | ErrorPatternConfig | FunctionHealthConfig;
  severity: Severity;
  cooldown_minutes: number;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface ErrorRateConfig {
  threshold: number;
  window_minutes: number;
  error_pattern?: string; // Optional regex pattern to filter which errors count
}

export interface ErrorPatternConfig {
  pattern: string;
  case_sensitive: boolean;
}

export interface FunctionHealthConfig {
  consecutive_failures: number;
}

export interface LogEntry {
  timestamp: string;
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  function_name: string;
  request_id?: string;
  metadata?: Record<string, unknown>;
}

export interface Alert {
  id: string;
  rule_id: string | null;
  title: string;
  message: string;
  severity: Severity;
  context: AlertContext;
  status: AlertStatus;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  acknowledgment_note: string | null;
  resolved_at: string | null;
  auto_resolved: boolean;
  created_at: string;
  updated_at: string;
}

export interface AlertContext {
  function_names?: string[];
  error_count?: number;
  sample_errors?: string[];
  time_window_start?: string;
  time_window_end?: string;
  matched_pattern?: string;
  consecutive_failures?: number;
}

export interface NewAlert {
  rule_id: string;
  title: string;
  message: string;
  severity: Severity;
  context: AlertContext;
}

export interface RuleEvaluationResult {
  rule: AlertRule;
  triggered: boolean;
  shouldCreateAlert: boolean;
  alert?: NewAlert;
  reason?: string;
}

// ============================================================
// RULE EVALUATION FUNCTIONS
// ============================================================

/**
 * Evaluate a single rule against a set of log entries.
 * Returns whether the rule triggered and what alert should be created.
 */
export function evaluateRule(
  rule: AlertRule,
  logs: LogEntry[],
  existingAlerts: Alert[],
  now: Date = new Date()
): RuleEvaluationResult {
  // Filter logs to target functions if specified
  const relevantLogs = rule.target_functions
    ? logs.filter(log => rule.target_functions!.includes(log.function_name))
    : logs;

  let triggered = false;
  let alert: NewAlert | undefined;
  let reason: string | undefined;

  switch (rule.rule_type) {
    case 'error_rate':
      ({ triggered, alert, reason } = evaluateErrorRateRule(rule, relevantLogs, now));
      break;
    case 'error_pattern':
      ({ triggered, alert, reason } = evaluateErrorPatternRule(rule, relevantLogs, now));
      break;
    case 'function_health':
      ({ triggered, alert, reason } = evaluateFunctionHealthRule(rule, relevantLogs, now));
      break;
  }

  // Check cooldown - don't create alert if we're within the cooldown period
  const shouldCreateAlert = triggered && !isInCooldown(rule, existingAlerts, now);

  return {
    rule,
    triggered,
    shouldCreateAlert,
    alert: shouldCreateAlert ? alert : undefined,
    reason: shouldCreateAlert ? reason : (triggered ? 'Skipped due to cooldown' : reason),
  };
}

/**
 * Evaluate error_rate rule: Alert when error count exceeds threshold in time window.
 */
export function evaluateErrorRateRule(
  rule: AlertRule,
  logs: LogEntry[],
  now: Date
): { triggered: boolean; alert?: NewAlert; reason?: string } {
  const config = rule.config as ErrorRateConfig;
  const windowStart = new Date(now.getTime() - config.window_minutes * 60 * 1000);

  // Filter to error logs within the time window
  let errorLogs = logs.filter(log => {
    const logTime = new Date(log.timestamp);
    return log.level === 'error' && logTime >= windowStart && logTime <= now;
  });

  // Apply optional pattern filter
  if (config.error_pattern) {
    const regex = new RegExp(config.error_pattern, 'i');
    errorLogs = errorLogs.filter(log => regex.test(log.message));
  }

  const errorCount = errorLogs.length;
  const triggered = errorCount >= config.threshold;

  if (!triggered) {
    return { triggered: false, reason: `Error count ${errorCount} below threshold ${config.threshold}` };
  }

  // Collect unique function names and sample errors
  const functionNames = [...new Set(errorLogs.map(log => log.function_name))];
  const sampleErrors = errorLogs.slice(0, 5).map(log => log.message);

  return {
    triggered: true,
    alert: {
      rule_id: rule.id,
      title: `${rule.name}: ${errorCount} errors in ${config.window_minutes} minutes`,
      message: `Detected ${errorCount} errors (threshold: ${config.threshold}) in the last ${config.window_minutes} minutes. Affected functions: ${functionNames.join(', ')}.`,
      severity: rule.severity,
      context: {
        function_names: functionNames,
        error_count: errorCount,
        sample_errors: sampleErrors,
        time_window_start: windowStart.toISOString(),
        time_window_end: now.toISOString(),
      },
    },
    reason: `${errorCount} errors exceed threshold of ${config.threshold}`,
  };
}

/**
 * Evaluate error_pattern rule: Alert when specific error patterns are detected.
 */
export function evaluateErrorPatternRule(
  rule: AlertRule,
  logs: LogEntry[],
  now: Date
): { triggered: boolean; alert?: NewAlert; reason?: string } {
  const config = rule.config as ErrorPatternConfig;
  const flags = config.case_sensitive ? '' : 'i';
  const regex = new RegExp(config.pattern, flags);

  // Look for error logs matching the pattern
  const matchingLogs = logs.filter(log =>
    log.level === 'error' && regex.test(log.message)
  );

  const triggered = matchingLogs.length > 0;

  if (!triggered) {
    return { triggered: false, reason: `No logs matching pattern "${config.pattern}"` };
  }

  const functionNames = [...new Set(matchingLogs.map(log => log.function_name))];
  const sampleErrors = matchingLogs.slice(0, 5).map(log => log.message);

  return {
    triggered: true,
    alert: {
      rule_id: rule.id,
      title: `${rule.name}: Pattern detected in ${matchingLogs.length} error(s)`,
      message: `Detected ${matchingLogs.length} error(s) matching pattern "${config.pattern}". Affected functions: ${functionNames.join(', ')}.`,
      severity: rule.severity,
      context: {
        function_names: functionNames,
        error_count: matchingLogs.length,
        sample_errors: sampleErrors,
        matched_pattern: config.pattern,
        time_window_end: now.toISOString(),
      },
    },
    reason: `Found ${matchingLogs.length} errors matching pattern`,
  };
}

/**
 * Evaluate function_health rule: Alert when a function fails consecutively.
 */
export function evaluateFunctionHealthRule(
  rule: AlertRule,
  logs: LogEntry[],
  now: Date
): { triggered: boolean; alert?: NewAlert; reason?: string } {
  const config = rule.config as FunctionHealthConfig;

  // Group logs by function and check for consecutive failures
  const functionLogs = new Map<string, LogEntry[]>();

  for (const log of logs) {
    const existing = functionLogs.get(log.function_name) || [];
    existing.push(log);
    functionLogs.set(log.function_name, existing);
  }

  // Check each function for consecutive failures
  const failingFunctions: Array<{ name: string; failures: number; errors: string[] }> = [];

  for (const [functionName, funcLogs] of functionLogs) {
    // Sort by timestamp descending (most recent first)
    const sortedLogs = [...funcLogs].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Count consecutive errors from most recent
    let consecutiveErrors = 0;
    const recentErrors: string[] = [];

    for (const log of sortedLogs) {
      if (log.level === 'error') {
        consecutiveErrors++;
        if (recentErrors.length < 5) {
          recentErrors.push(log.message);
        }
      } else {
        break; // Stop at first non-error
      }
    }

    if (consecutiveErrors >= config.consecutive_failures) {
      failingFunctions.push({
        name: functionName,
        failures: consecutiveErrors,
        errors: recentErrors,
      });
    }
  }

  const triggered = failingFunctions.length > 0;

  if (!triggered) {
    return { triggered: false, reason: `No functions with ${config.consecutive_failures}+ consecutive failures` };
  }

  const functionNames = failingFunctions.map(f => f.name);
  const maxFailures = Math.max(...failingFunctions.map(f => f.failures));
  const sampleErrors = failingFunctions.flatMap(f => f.errors).slice(0, 5);

  return {
    triggered: true,
    alert: {
      rule_id: rule.id,
      title: `${rule.name}: ${functionNames.length} function(s) failing consecutively`,
      message: `Detected ${functionNames.length} function(s) with ${config.consecutive_failures}+ consecutive failures. Functions: ${functionNames.join(', ')}. Max consecutive: ${maxFailures}.`,
      severity: rule.severity,
      context: {
        function_names: functionNames,
        consecutive_failures: maxFailures,
        sample_errors: sampleErrors,
        time_window_end: now.toISOString(),
      },
    },
    reason: `${failingFunctions.length} functions with consecutive failures`,
  };
}

// ============================================================
// COOLDOWN CHECKING
// ============================================================

/**
 * Check if a rule is currently in its cooldown period.
 * Returns true if an alert for this rule was created within the cooldown window.
 */
export function isInCooldown(
  rule: AlertRule,
  existingAlerts: Alert[],
  now: Date = new Date()
): boolean {
  const cooldownStart = new Date(now.getTime() - rule.cooldown_minutes * 60 * 1000);

  // Find most recent alert for this rule
  const recentAlerts = existingAlerts
    .filter(alert => alert.rule_id === rule.id)
    .filter(alert => new Date(alert.created_at) >= cooldownStart);

  return recentAlerts.length > 0;
}

// ============================================================
// AUTO-RESOLUTION
// ============================================================

/**
 * Determine which pending alerts should be auto-resolved.
 * An alert is auto-resolved if its triggering condition is no longer present.
 */
export function findAlertsToAutoResolve(
  pendingAlerts: Alert[],
  rules: AlertRule[],
  logs: LogEntry[],
  now: Date = new Date()
): string[] {
  const alertsToResolve: string[] = [];

  for (const alert of pendingAlerts) {
    if (!alert.rule_id) continue;

    const rule = rules.find(r => r.id === alert.rule_id);
    if (!rule) continue;

    // Re-evaluate the rule to see if condition has cleared
    const result = evaluateRule(rule, logs, [], now);

    // If the rule no longer triggers, mark for auto-resolution
    if (!result.triggered) {
      alertsToResolve.push(alert.id);
    }
  }

  return alertsToResolve;
}

// ============================================================
// BATCH EVALUATION
// ============================================================

/**
 * Evaluate all enabled rules and return alerts to create.
 */
export function evaluateAllRules(
  rules: AlertRule[],
  logs: LogEntry[],
  existingAlerts: Alert[],
  now: Date = new Date()
): NewAlert[] {
  const enabledRules = rules.filter(r => r.is_enabled);
  const newAlerts: NewAlert[] = [];

  for (const rule of enabledRules) {
    const result = evaluateRule(rule, logs, existingAlerts, now);
    if (result.shouldCreateAlert && result.alert) {
      newAlerts.push(result.alert);
    }
  }

  return newAlerts;
}

// ============================================================
// LOG PARSING UTILITIES
// ============================================================

/**
 * Parse raw log lines from Supabase Management API into structured LogEntry objects.
 * Supabase logs format: ISO timestamp | level | function_name | message
 */
export function parseLogLine(line: string): LogEntry | null {
  // Try to parse structured JSON log (Deno.serve format)
  try {
    const parsed = JSON.parse(line);
    if (parsed.timestamp && parsed.msg) {
      return {
        timestamp: parsed.timestamp,
        level: mapLogLevel(parsed.level || 'info'),
        message: parsed.msg,
        function_name: parsed.function_name || 'unknown',
        request_id: parsed.request_id,
        metadata: parsed,
      };
    }
  } catch {
    // Not JSON, try plain text parsing
  }

  // Fallback: Parse plain text log lines
  // Format: [timestamp] [level] [function_name] message
  const match = line.match(/^\[([^\]]+)\]\s*\[([^\]]+)\]\s*\[([^\]]+)\]\s*(.+)$/);
  if (match) {
    return {
      timestamp: match[1],
      level: mapLogLevel(match[2]),
      message: match[4],
      function_name: match[3],
    };
  }

  // Try simpler format: timestamp level message
  const simpleMatch = line.match(/^(\d{4}-\d{2}-\d{2}T[^\s]+)\s+(error|warn|info|debug)\s+(.+)$/i);
  if (simpleMatch) {
    return {
      timestamp: simpleMatch[1],
      level: mapLogLevel(simpleMatch[2]),
      message: simpleMatch[3],
      function_name: 'unknown',
    };
  }

  // If the line contains 'error' (case insensitive), treat as error log
  if (/error/i.test(line)) {
    return {
      timestamp: new Date().toISOString(),
      level: 'error',
      message: line,
      function_name: 'unknown',
    };
  }

  return null;
}

function mapLogLevel(level: string): LogEntry['level'] {
  const normalized = level.toLowerCase();
  if (normalized.includes('error') || normalized.includes('err')) return 'error';
  if (normalized.includes('warn')) return 'warn';
  if (normalized.includes('debug')) return 'debug';
  return 'info';
}

/**
 * Parse multiple log lines and filter to valid entries.
 */
export function parseLogs(rawLogs: string[]): LogEntry[] {
  return rawLogs
    .map(parseLogLine)
    .filter((entry): entry is LogEntry => entry !== null);
}
