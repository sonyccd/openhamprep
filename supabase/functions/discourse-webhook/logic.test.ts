// ============================================================
// UNIT TESTS FOR DISCOURSE-WEBHOOK LOGIC
// ============================================================

import { assertEquals } from "jsr:@std/assert@1";
import {
  parseExplanationFromPost,
  extractQuestionIdFromTitle,
  extractTopicIdFromUrl,
  isValidSignatureFormat,
  extractSignatureDigest,
  constantTimeEquals,
  toHexString,
} from "./logic.ts";

// ============================================================
// parseExplanationFromPost Tests
// ============================================================

Deno.test("parseExplanationFromPost - extracts explanation from properly formatted post", () => {
  const post = `## Question
What is the meaning of life?

## Answer Options
**A.** 42
**B.** 43
**C.** 44
**D.** 45

## Explanation
The answer is 42 according to Douglas Adams.

---
_This topic was automatically created._`;

  assertEquals(
    parseExplanationFromPost(post),
    "The answer is 42 according to Douglas Adams."
  );
});

Deno.test("parseExplanationFromPost - returns null for missing ## Explanation section", () => {
  const post = `## Question
What is the meaning of life?

## Answer Options
**A.** 42`;

  assertEquals(parseExplanationFromPost(post), null);
});

Deno.test("parseExplanationFromPost - returns null for placeholder text", () => {
  const post = `## Explanation
_No explanation yet. Help improve this by contributing below!_

---`;

  assertEquals(parseExplanationFromPost(post), null);
});

Deno.test("parseExplanationFromPost - returns null for null input", () => {
  assertEquals(parseExplanationFromPost(null), null);
});

Deno.test("parseExplanationFromPost - returns null for undefined input", () => {
  assertEquals(parseExplanationFromPost(undefined), null);
});

Deno.test("parseExplanationFromPost - returns null for empty string", () => {
  assertEquals(parseExplanationFromPost(""), null);
});

Deno.test("parseExplanationFromPost - handles trailing whitespace", () => {
  const post = `## Explanation
This is the explanation.


---`;

  assertEquals(parseExplanationFromPost(post), "This is the explanation.");
});

Deno.test("parseExplanationFromPost - handles explanation followed by next section", () => {
  const post = `## Explanation
This is the explanation.

## Another Section
More content`;

  assertEquals(parseExplanationFromPost(post), "This is the explanation.");
});

Deno.test("parseExplanationFromPost - returns null for only --- content", () => {
  const post = `## Explanation
---`;

  assertEquals(parseExplanationFromPost(post), null);
});

Deno.test("parseExplanationFromPost - handles multiline explanation", () => {
  const post = `## Explanation
This is line 1.
This is line 2.
This is line 3.

---`;

  assertEquals(
    parseExplanationFromPost(post),
    "This is line 1.\nThis is line 2.\nThis is line 3."
  );
});

Deno.test("parseExplanationFromPost - is case insensitive for header", () => {
  const post = `## EXPLANATION
This is the explanation.

---`;

  assertEquals(parseExplanationFromPost(post), "This is the explanation.");
});

Deno.test("parseExplanationFromPost - handles explanation at end of document", () => {
  const post = `## Explanation
This is the final explanation.`;

  assertEquals(parseExplanationFromPost(post), "This is the final explanation.");
});

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

Deno.test("extractQuestionIdFromTitle - returns null for empty string", () => {
  assertEquals(extractQuestionIdFromTitle(""), null);
});

Deno.test("extractQuestionIdFromTitle - handles extra spaces", () => {
  assertEquals(
    extractQuestionIdFromTitle("T1A01  -  Question with extra spaces"),
    "T1A01"
  );
});

// ============================================================
// extractTopicIdFromUrl Tests
// ============================================================

Deno.test("extractTopicIdFromUrl - extracts ID from URL with slug", () => {
  assertEquals(
    extractTopicIdFromUrl("https://forum.openhamprep.com/t/topic-slug/123"),
    123
  );
});

Deno.test("extractTopicIdFromUrl - extracts ID from URL without slug", () => {
  assertEquals(
    extractTopicIdFromUrl("https://forum.openhamprep.com/t/123"),
    123
  );
});

Deno.test("extractTopicIdFromUrl - extracts ID from URL with long slug", () => {
  assertEquals(
    extractTopicIdFromUrl(
      "https://forum.openhamprep.com/t/t1a01-what-is-the-primary-purpose/456"
    ),
    456
  );
});

Deno.test("extractTopicIdFromUrl - returns null for invalid URL", () => {
  assertEquals(extractTopicIdFromUrl("not-a-url"), null);
});

Deno.test("extractTopicIdFromUrl - returns null for null input", () => {
  assertEquals(extractTopicIdFromUrl(null), null);
});

Deno.test("extractTopicIdFromUrl - returns null for undefined input", () => {
  assertEquals(extractTopicIdFromUrl(undefined), null);
});

Deno.test("extractTopicIdFromUrl - returns null for URL without topic ID", () => {
  assertEquals(
    extractTopicIdFromUrl("https://forum.openhamprep.com/categories"),
    null
  );
});

// ============================================================
// isValidSignatureFormat Tests
// ============================================================

Deno.test("isValidSignatureFormat - returns true for valid format", () => {
  assertEquals(isValidSignatureFormat("sha256=abc123def456"), true);
});

Deno.test("isValidSignatureFormat - returns false for missing prefix", () => {
  assertEquals(isValidSignatureFormat("abc123def456"), false);
});

Deno.test("isValidSignatureFormat - returns false for null", () => {
  assertEquals(isValidSignatureFormat(null), false);
});

Deno.test("isValidSignatureFormat - returns false for wrong prefix", () => {
  assertEquals(isValidSignatureFormat("sha512=abc123"), false);
  assertEquals(isValidSignatureFormat("md5=abc123"), false);
});

// ============================================================
// extractSignatureDigest Tests
// ============================================================

Deno.test("extractSignatureDigest - extracts digest from valid signature", () => {
  assertEquals(extractSignatureDigest("sha256=abc123def456"), "abc123def456");
});

Deno.test("extractSignatureDigest - returns null for invalid format", () => {
  assertEquals(extractSignatureDigest("abc123def456"), null);
});

Deno.test("extractSignatureDigest - handles empty digest", () => {
  assertEquals(extractSignatureDigest("sha256="), "");
});

// ============================================================
// constantTimeEquals Tests
// ============================================================

Deno.test("constantTimeEquals - returns true for equal strings", () => {
  assertEquals(constantTimeEquals("abc123", "abc123"), true);
});

Deno.test("constantTimeEquals - returns false for different strings", () => {
  assertEquals(constantTimeEquals("abc123", "abc124"), false);
});

Deno.test("constantTimeEquals - returns false for different lengths", () => {
  assertEquals(constantTimeEquals("abc", "abcd"), false);
});

Deno.test("constantTimeEquals - handles empty strings", () => {
  assertEquals(constantTimeEquals("", ""), true);
  assertEquals(constantTimeEquals("", "a"), false);
});

Deno.test("constantTimeEquals - handles long strings", () => {
  const long1 = "a".repeat(1000);
  const long2 = "a".repeat(1000);
  const long3 = "a".repeat(999) + "b";
  assertEquals(constantTimeEquals(long1, long2), true);
  assertEquals(constantTimeEquals(long1, long3), false);
});

// ============================================================
// toHexString Tests
// ============================================================

Deno.test("toHexString - converts bytes to hex", () => {
  assertEquals(toHexString(new Uint8Array([0, 1, 15, 16, 255])), "00010f10ff");
});

Deno.test("toHexString - handles empty array", () => {
  assertEquals(toHexString(new Uint8Array([])), "");
});

Deno.test("toHexString - pads single digit hex values", () => {
  assertEquals(toHexString(new Uint8Array([0, 1, 2, 3])), "00010203");
});

Deno.test("toHexString - handles all zeros", () => {
  assertEquals(toHexString(new Uint8Array([0, 0, 0, 0])), "00000000");
});

Deno.test("toHexString - handles all max values", () => {
  assertEquals(toHexString(new Uint8Array([255, 255, 255])), "ffffff");
});
