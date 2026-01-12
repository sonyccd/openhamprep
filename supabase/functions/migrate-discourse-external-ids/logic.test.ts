// ============================================================
// UNIT TESTS FOR MIGRATE-DISCOURSE-EXTERNAL-IDS LOGIC
// ============================================================

import { assertEquals } from "jsr:@std/assert@1";
import {
  isValidDiscourseUrl,
  extractTopicId,
  clampBatchSize,
  parseRateLimitWaitTime,
  calculateBackoffDelay,
  aggregateErrors,
  buildProgress,
} from "./logic.ts";

// ============================================================
// isValidDiscourseUrl Tests (SSRF Prevention)
// ============================================================

Deno.test("isValidDiscourseUrl - returns true for valid Discourse URL", () => {
  assertEquals(
    isValidDiscourseUrl("https://forum.openhamprep.com/t/topic/123"),
    true
  );
});

Deno.test("isValidDiscourseUrl - returns true for URL with path", () => {
  assertEquals(
    isValidDiscourseUrl("https://forum.openhamprep.com/t/topic-slug/456"),
    true
  );
});

Deno.test("isValidDiscourseUrl - returns false for different domain", () => {
  assertEquals(isValidDiscourseUrl("https://evil.com/t/topic/123"), false);
});

Deno.test("isValidDiscourseUrl - returns false for localhost", () => {
  assertEquals(isValidDiscourseUrl("http://localhost:3000/t/topic/123"), false);
});

Deno.test("isValidDiscourseUrl - returns false for internal IP", () => {
  assertEquals(isValidDiscourseUrl("http://192.168.1.1/t/topic/123"), false);
  assertEquals(isValidDiscourseUrl("http://10.0.0.1/t/topic/123"), false);
});

Deno.test("isValidDiscourseUrl - returns false for null/undefined", () => {
  assertEquals(isValidDiscourseUrl(null), false);
  assertEquals(isValidDiscourseUrl(undefined), false);
});

Deno.test("isValidDiscourseUrl - returns false for empty string", () => {
  assertEquals(isValidDiscourseUrl(""), false);
});

// ============================================================
// extractTopicId Tests
// ============================================================

Deno.test("extractTopicId - extracts ID from valid URL", () => {
  assertEquals(
    extractTopicId("https://forum.openhamprep.com/t/topic-slug/123"),
    123
  );
});

Deno.test("extractTopicId - extracts ID from URL without slug", () => {
  assertEquals(extractTopicId("https://forum.openhamprep.com/t/456"), 456);
});

Deno.test("extractTopicId - returns null for different domain (security)", () => {
  assertEquals(extractTopicId("https://evil.com/t/topic/123"), null);
});

Deno.test("extractTopicId - returns null for localhost (security)", () => {
  assertEquals(extractTopicId("http://localhost/t/topic/123"), null);
});

Deno.test("extractTopicId - returns null for null input", () => {
  assertEquals(extractTopicId(null), null);
});

Deno.test("extractTopicId - returns null for undefined input", () => {
  assertEquals(extractTopicId(undefined), null);
});

// ============================================================
// clampBatchSize Tests
// ============================================================

Deno.test("clampBatchSize - clamps to minimum 1", () => {
  assertEquals(clampBatchSize(0), 1);
  assertEquals(clampBatchSize(-5), 1);
});

Deno.test("clampBatchSize - clamps to maximum", () => {
  assertEquals(clampBatchSize(150), 100);
  assertEquals(clampBatchSize(1000), 100);
});

Deno.test("clampBatchSize - preserves valid values", () => {
  assertEquals(clampBatchSize(50), 50);
  assertEquals(clampBatchSize(1), 1);
  assertEquals(clampBatchSize(100), 100);
});

Deno.test("clampBatchSize - respects custom max", () => {
  assertEquals(clampBatchSize(75, 50), 50);
  assertEquals(clampBatchSize(25, 50), 25);
});

// ============================================================
// parseRateLimitWaitTime Tests
// ============================================================

Deno.test("parseRateLimitWaitTime - extracts wait_seconds", () => {
  assertEquals(parseRateLimitWaitTime({ extras: { wait_seconds: 45 } }), 45);
});

Deno.test("parseRateLimitWaitTime - returns default for missing extras", () => {
  assertEquals(parseRateLimitWaitTime({}), 30);
});

Deno.test("parseRateLimitWaitTime - returns default for null", () => {
  assertEquals(parseRateLimitWaitTime(null), 30);
});

Deno.test("parseRateLimitWaitTime - respects custom default", () => {
  assertEquals(parseRateLimitWaitTime(null, 60), 60);
});

Deno.test("parseRateLimitWaitTime - returns default for non-number wait_seconds", () => {
  assertEquals(parseRateLimitWaitTime({ extras: { wait_seconds: "45" as unknown as number } }), 30);
});

// ============================================================
// calculateBackoffDelay Tests
// ============================================================

Deno.test("calculateBackoffDelay - first attempt uses base delay", () => {
  assertEquals(calculateBackoffDelay(1, 1000), 1000);
});

Deno.test("calculateBackoffDelay - doubles each attempt", () => {
  assertEquals(calculateBackoffDelay(2, 1000), 2000);
  assertEquals(calculateBackoffDelay(3, 1000), 4000);
  assertEquals(calculateBackoffDelay(4, 1000), 8000);
});

Deno.test("calculateBackoffDelay - respects max delay", () => {
  assertEquals(calculateBackoffDelay(10, 1000, 30000), 30000);
});

Deno.test("calculateBackoffDelay - uses defaults", () => {
  assertEquals(calculateBackoffDelay(1), 1000);
  assertEquals(calculateBackoffDelay(2), 2000);
});

// ============================================================
// aggregateErrors Tests
// ============================================================

Deno.test("aggregateErrors - counts errors by reason", () => {
  const results = [
    { status: "error", reason: "Rate limited" },
    { status: "error", reason: "Rate limited" },
    { status: "error", reason: "Not found" },
    { status: "updated" },
  ];

  const errors = aggregateErrors(results);

  assertEquals(errors.get("Rate limited"), 2);
  assertEquals(errors.get("Not found"), 1);
  assertEquals(errors.size, 2);
});

Deno.test("aggregateErrors - handles empty array", () => {
  const errors = aggregateErrors([]);
  assertEquals(errors.size, 0);
});

Deno.test("aggregateErrors - ignores successful results", () => {
  const results = [
    { status: "updated" },
    { status: "updated" },
  ];

  const errors = aggregateErrors(results);
  assertEquals(errors.size, 0);
});

// ============================================================
// buildProgress Tests
// ============================================================

Deno.test("buildProgress - calculates correct values", () => {
  const progress = buildProgress(25, 20, 5, 100);

  assertEquals(progress.processed, 25);
  assertEquals(progress.successful, 20);
  assertEquals(progress.failed, 5);
  assertEquals(progress.remaining, 75);
  assertEquals(progress.percentComplete, 25);
});

Deno.test("buildProgress - handles zero total", () => {
  const progress = buildProgress(0, 0, 0, 0);

  assertEquals(progress.percentComplete, 100);
  assertEquals(progress.remaining, 0);
});

Deno.test("buildProgress - handles complete migration", () => {
  const progress = buildProgress(100, 95, 5, 100);

  assertEquals(progress.percentComplete, 100);
  assertEquals(progress.remaining, 0);
});

Deno.test("buildProgress - rounds percentage", () => {
  const progress = buildProgress(33, 30, 3, 100);
  assertEquals(progress.percentComplete, 33);
});
