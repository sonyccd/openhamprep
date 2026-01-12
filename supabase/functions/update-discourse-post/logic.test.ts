// ============================================================
// UNIT TESTS FOR UPDATE-DISCOURSE-POST LOGIC
// ============================================================

import { assertEquals, assertStringIncludes } from "jsr:@std/assert@1";
import {
  extractTopicId,
  isUUID,
  formatTopicBody,
  buildExternalIdUrl,
  isValidDiscourseUrl,
} from "./logic.ts";

// ============================================================
// extractTopicId Tests
// ============================================================

Deno.test("extractTopicId - extracts ID from URL with slug", () => {
  assertEquals(
    extractTopicId("https://forum.openhamprep.com/t/topic-slug/123"),
    123
  );
});

Deno.test("extractTopicId - extracts ID from URL without slug", () => {
  assertEquals(extractTopicId("https://forum.openhamprep.com/t/456"), 456);
});

Deno.test("extractTopicId - returns null for null input", () => {
  assertEquals(extractTopicId(null), null);
});

Deno.test("extractTopicId - returns null for undefined input", () => {
  assertEquals(extractTopicId(undefined), null);
});

Deno.test("extractTopicId - returns null for invalid URL", () => {
  assertEquals(extractTopicId("not-a-url"), null);
});

// ============================================================
// isUUID Tests
// ============================================================

Deno.test("isUUID - returns true for valid UUID", () => {
  assertEquals(isUUID("550e8400-e29b-41d4-a716-446655440000"), true);
});

Deno.test("isUUID - returns true for uppercase UUID", () => {
  assertEquals(isUUID("550E8400-E29B-41D4-A716-446655440000"), true);
});

Deno.test("isUUID - returns false for display name", () => {
  assertEquals(isUUID("T1A01"), false);
});

Deno.test("isUUID - returns false for invalid format", () => {
  assertEquals(isUUID("not-a-uuid"), false);
});

// ============================================================
// formatTopicBody Tests
// ============================================================

Deno.test("formatTopicBody - formats with explanation", () => {
  const body = formatTopicBody(
    "What is the meaning of life?",
    ["42", "43", "44", "45"],
    0,
    "The answer is 42."
  );

  assertStringIncludes(body, "## Question");
  assertStringIncludes(body, "What is the meaning of life?");
  assertStringIncludes(body, "**A)** 42");
  assertStringIncludes(body, "**Correct Answer: A**");
  assertStringIncludes(body, "The answer is 42.");
});

Deno.test("formatTopicBody - formats without explanation", () => {
  const body = formatTopicBody("Question?", ["A", "B", "C", "D"], 1, null);

  assertStringIncludes(
    body,
    "_No explanation yet. Help improve this by contributing below!_"
  );
  assertStringIncludes(body, "**Correct Answer: B**");
});

Deno.test("formatTopicBody - correct answer letter mapping", () => {
  assertStringIncludes(
    formatTopicBody("Q", ["A", "B", "C", "D"], 0, null),
    "**Correct Answer: A**"
  );
  assertStringIncludes(
    formatTopicBody("Q", ["A", "B", "C", "D"], 1, null),
    "**Correct Answer: B**"
  );
  assertStringIncludes(
    formatTopicBody("Q", ["A", "B", "C", "D"], 2, null),
    "**Correct Answer: C**"
  );
  assertStringIncludes(
    formatTopicBody("Q", ["A", "B", "C", "D"], 3, null),
    "**Correct Answer: D**"
  );
});

// ============================================================
// buildExternalIdUrl Tests
// ============================================================

Deno.test("buildExternalIdUrl - builds correct URL", () => {
  assertEquals(
    buildExternalIdUrl(
      "https://forum.openhamprep.com",
      "550e8400-e29b-41d4-a716-446655440000"
    ),
    "https://forum.openhamprep.com/t/external_id/550e8400-e29b-41d4-a716-446655440000.json"
  );
});

// ============================================================
// isValidDiscourseUrl Tests
// ============================================================

Deno.test("isValidDiscourseUrl - returns true for valid URL", () => {
  assertEquals(
    isValidDiscourseUrl("https://forum.openhamprep.com/t/topic/123"),
    true
  );
});

Deno.test("isValidDiscourseUrl - returns false for different domain", () => {
  assertEquals(isValidDiscourseUrl("https://evil.com/t/topic/123"), false);
});

Deno.test("isValidDiscourseUrl - returns false for empty string", () => {
  assertEquals(isValidDiscourseUrl(""), false);
});
