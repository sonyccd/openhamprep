// ============================================================
// UNIT TESTS FOR VERIFY-DISCOURSE-SYNC LOGIC
// ============================================================

import { assertEquals } from "jsr:@std/assert@1";
import {
  extractQuestionIdFromTitle,
  extractTopicId,
  buildTopicUrl,
  countByStatus,
  questionMatchesTopic,
  isValidForumUrl,
} from "./logic.ts";

// ============================================================
// extractQuestionIdFromTitle Tests
// ============================================================

Deno.test("extractQuestionIdFromTitle - extracts Technician ID", () => {
  assertEquals(
    extractQuestionIdFromTitle("T1A01 - What is the primary purpose of the..."),
    "T1A01"
  );
});

Deno.test("extractQuestionIdFromTitle - extracts General ID", () => {
  assertEquals(
    extractQuestionIdFromTitle("G2B03 - What is the maximum bandwidth..."),
    "G2B03"
  );
});

Deno.test("extractQuestionIdFromTitle - extracts Extra ID", () => {
  assertEquals(
    extractQuestionIdFromTitle("E3C12 - Why is the ionosphere important..."),
    "E3C12"
  );
});

Deno.test("extractQuestionIdFromTitle - returns null for invalid format", () => {
  assertEquals(extractQuestionIdFromTitle("Invalid title format"), null);
});

Deno.test("extractQuestionIdFromTitle - returns null for null input", () => {
  assertEquals(extractQuestionIdFromTitle(null), null);
});

Deno.test("extractQuestionIdFromTitle - returns null for undefined input", () => {
  assertEquals(extractQuestionIdFromTitle(undefined), null);
});

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
  assertEquals(extractTopicId("https://forum.openhamprep.com/t/123"), 123);
});

Deno.test("extractTopicId - extracts ID from URL with long slug", () => {
  assertEquals(
    extractTopicId(
      "https://forum.openhamprep.com/t/t1a01-what-is-the-primary-purpose/456"
    ),
    456
  );
});

Deno.test("extractTopicId - returns null for invalid URL", () => {
  assertEquals(extractTopicId("not-a-url"), null);
});

Deno.test("extractTopicId - returns null for null input", () => {
  assertEquals(extractTopicId(null), null);
});

Deno.test("extractTopicId - returns null for undefined input", () => {
  assertEquals(extractTopicId(undefined), null);
});

Deno.test("extractTopicId - returns null for URL without topic path", () => {
  assertEquals(extractTopicId("https://forum.openhamprep.com/categories"), null);
});

// ============================================================
// buildTopicUrl Tests
// ============================================================

Deno.test("buildTopicUrl - builds correct URL", () => {
  assertEquals(
    buildTopicUrl("https://forum.openhamprep.com", "topic-slug", 123),
    "https://forum.openhamprep.com/t/topic-slug/123"
  );
});

Deno.test("buildTopicUrl - handles slug with special characters", () => {
  assertEquals(
    buildTopicUrl("https://forum.openhamprep.com", "t1a01-question-text", 456),
    "https://forum.openhamprep.com/t/t1a01-question-text/456"
  );
});

// ============================================================
// countByStatus Tests
// ============================================================

Deno.test("countByStatus - counts questions correctly", () => {
  const questions = [
    { forum_url: "http://example.com/1", discourse_sync_status: "synced" },
    { forum_url: "http://example.com/2", discourse_sync_status: "synced" },
    { forum_url: "http://example.com/3", discourse_sync_status: "error" },
    { forum_url: null, discourse_sync_status: null },
    { forum_url: null, discourse_sync_status: "pending" },
  ];

  const counts = countByStatus(questions);

  assertEquals(counts.withForumUrl, 3);
  assertEquals(counts.withoutForumUrl, 2);
  assertEquals(counts.synced, 2);
  assertEquals(counts.error, 1);
  assertEquals(counts.pending, 2);
});

Deno.test("countByStatus - handles empty array", () => {
  const counts = countByStatus([]);

  assertEquals(counts.withForumUrl, 0);
  assertEquals(counts.withoutForumUrl, 0);
  assertEquals(counts.synced, 0);
  assertEquals(counts.error, 0);
  assertEquals(counts.pending, 0);
});

// ============================================================
// questionMatchesTopic Tests
// ============================================================

Deno.test("questionMatchesTopic - returns true for matching title", () => {
  assertEquals(
    questionMatchesTopic("T1A01", "T1A01 - What is the meaning of life?"),
    true
  );
});

Deno.test("questionMatchesTopic - is case insensitive", () => {
  assertEquals(questionMatchesTopic("t1a01", "T1A01 - Question"), true);
  assertEquals(questionMatchesTopic("T1A01", "t1a01 - Question"), true);
});

Deno.test("questionMatchesTopic - returns false for non-matching title", () => {
  assertEquals(
    questionMatchesTopic("T1A01", "T1A02 - Different question"),
    false
  );
});

Deno.test("questionMatchesTopic - returns false for partial match", () => {
  assertEquals(questionMatchesTopic("T1A01", "T1A01B - Extra chars"), false);
});

Deno.test("questionMatchesTopic - returns false for null/empty inputs", () => {
  assertEquals(questionMatchesTopic("", "T1A01 - Question"), false);
  assertEquals(questionMatchesTopic("T1A01", ""), false);
});

// ============================================================
// isValidForumUrl Tests
// ============================================================

Deno.test("isValidForumUrl - returns true for valid URL", () => {
  assertEquals(
    isValidForumUrl(
      "https://forum.openhamprep.com/t/topic/123",
      "https://forum.openhamprep.com"
    ),
    true
  );
});

Deno.test("isValidForumUrl - returns false for different domain", () => {
  assertEquals(
    isValidForumUrl(
      "https://other.com/t/topic/123",
      "https://forum.openhamprep.com"
    ),
    false
  );
});

Deno.test("isValidForumUrl - returns false for empty URL", () => {
  assertEquals(isValidForumUrl("", "https://forum.openhamprep.com"), false);
});

Deno.test("isValidForumUrl - returns false for invalid URL", () => {
  assertEquals(
    isValidForumUrl("not-a-url", "https://forum.openhamprep.com"),
    false
  );
});

Deno.test("isValidForumUrl - handles subdomain correctly", () => {
  assertEquals(
    isValidForumUrl(
      "https://forum.openhamprep.com/t/topic/123",
      "https://forum.openhamprep.com"
    ),
    true
  );
  // Different subdomain should fail
  assertEquals(
    isValidForumUrl(
      "https://other.openhamprep.com/t/topic/123",
      "https://forum.openhamprep.com"
    ),
    false
  );
});
