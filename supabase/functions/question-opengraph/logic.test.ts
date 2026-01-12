// ============================================================
// UNIT TESTS FOR QUESTION-OPENGRAPH LOGIC
// ============================================================

import { assertEquals } from "jsr:@std/assert@1";
import {
  truncateText,
  isCrawler,
  escapeHtml,
  isValidDisplayName,
  isUUID,
  isValidQuestionId,
  getLicenseName,
  buildQuestionTitle,
  CRAWLER_PATTERNS,
} from "./logic.ts";

// ============================================================
// truncateText Tests
// ============================================================

Deno.test("truncateText - returns text unchanged if within maxLength", () => {
  assertEquals(truncateText("Short text", 100), "Short text");
});

Deno.test("truncateText - returns text unchanged if exactly maxLength", () => {
  assertEquals(truncateText("12345", 5), "12345");
});

Deno.test("truncateText - truncates at word boundary when possible", () => {
  const text = "This is a longer text that needs to be truncated";
  const result = truncateText(text, 30);
  // Should end with "..." and break at a word
  assertEquals(result.endsWith("..."), true);
  assertEquals(result.includes("  "), false);
});

Deno.test("truncateText - hard truncates when no good word boundary", () => {
  // Single long word that can't break at word boundary
  const text = "Supercalifragilisticexpialidocious is a long word";
  const result = truncateText(text, 20);
  assertEquals(result, "Supercalifragilis...");
  assertEquals(result.length, 20);
});

Deno.test("truncateText - breaks at word boundary past 70% mark", () => {
  // "Hello world example" is 19 chars
  // At maxLength=20, last space is at position 12 (62%)
  // At maxLength=16, last space at 11 would be ~68% - may hard truncate
  const text = "Hello world example text";
  const result = truncateText(text, 22);
  // Should break at word boundary since space is past 70%
  assertEquals(result.endsWith("..."), true);
});

Deno.test("truncateText - handles empty string", () => {
  assertEquals(truncateText("", 100), "");
});

Deno.test("truncateText - handles text with no spaces", () => {
  const text = "NoSpacesAtAllInThisText";
  const result = truncateText(text, 10);
  assertEquals(result, "NoSpace...");
});

// ============================================================
// isCrawler Tests
// ============================================================

Deno.test("isCrawler - returns true for Googlebot", () => {
  assertEquals(
    isCrawler("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"),
    true
  );
});

Deno.test("isCrawler - returns true for facebookexternalhit", () => {
  assertEquals(isCrawler("facebookexternalhit/1.1"), true);
});

Deno.test("isCrawler - returns true for Twitterbot", () => {
  assertEquals(isCrawler("Twitterbot/1.0"), true);
});

Deno.test("isCrawler - returns true for Discourse", () => {
  assertEquals(isCrawler("Discourse Forum Onebox v2.4.0.beta8"), true);
});

Deno.test("isCrawler - returns true for Slackbot", () => {
  assertEquals(isCrawler("Slackbot-LinkExpanding 1.0"), true);
});

Deno.test("isCrawler - returns false for Chrome browser", () => {
  assertEquals(
    isCrawler("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"),
    false
  );
});

Deno.test("isCrawler - returns false for Firefox browser", () => {
  assertEquals(
    isCrawler("Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0"),
    false
  );
});

Deno.test("isCrawler - returns false for null user agent", () => {
  assertEquals(isCrawler(null), false);
});

Deno.test("isCrawler - is case insensitive", () => {
  assertEquals(isCrawler("GOOGLEBOT"), true);
  assertEquals(isCrawler("googlebot"), true);
  assertEquals(isCrawler("GoOgLeBoT"), true);
});

Deno.test("isCrawler - returns true for WhatsApp", () => {
  assertEquals(isCrawler("WhatsApp/2.21.11.17"), true);
});

Deno.test("isCrawler - returns true for LinkedInBot", () => {
  assertEquals(isCrawler("LinkedInBot/1.0"), true);
});

// ============================================================
// escapeHtml Tests
// ============================================================

Deno.test("escapeHtml - escapes ampersand", () => {
  assertEquals(escapeHtml("Tom & Jerry"), "Tom &amp; Jerry");
});

Deno.test("escapeHtml - escapes less than", () => {
  assertEquals(escapeHtml("1 < 2"), "1 &lt; 2");
});

Deno.test("escapeHtml - escapes greater than", () => {
  assertEquals(escapeHtml("2 > 1"), "2 &gt; 1");
});

Deno.test("escapeHtml - escapes double quote", () => {
  assertEquals(escapeHtml('Say "Hello"'), "Say &quot;Hello&quot;");
});

Deno.test("escapeHtml - escapes single quote", () => {
  assertEquals(escapeHtml("It's fine"), "It&#039;s fine");
});

Deno.test("escapeHtml - escapes multiple characters in one string", () => {
  const input = `<script>alert("XSS & 'bad'")</script>`;
  const expected = "&lt;script&gt;alert(&quot;XSS &amp; &#039;bad&#039;&quot;)&lt;/script&gt;";
  assertEquals(escapeHtml(input), expected);
});

Deno.test("escapeHtml - returns empty string unchanged", () => {
  assertEquals(escapeHtml(""), "");
});

Deno.test("escapeHtml - handles text without special characters", () => {
  assertEquals(escapeHtml("Normal text"), "Normal text");
});

// ============================================================
// isValidDisplayName Tests
// ============================================================

Deno.test("isValidDisplayName - returns true for valid Technician ID", () => {
  assertEquals(isValidDisplayName("T1A01"), true);
  assertEquals(isValidDisplayName("T9Z99"), true);
});

Deno.test("isValidDisplayName - returns true for valid General ID", () => {
  assertEquals(isValidDisplayName("G1A01"), true);
  assertEquals(isValidDisplayName("G2B03"), true);
});

Deno.test("isValidDisplayName - returns true for valid Extra ID", () => {
  assertEquals(isValidDisplayName("E1A01"), true);
  assertEquals(isValidDisplayName("E3C12"), true);
});

Deno.test("isValidDisplayName - is case insensitive", () => {
  assertEquals(isValidDisplayName("t1a01"), true);
  assertEquals(isValidDisplayName("T1a01"), true);
  assertEquals(isValidDisplayName("t1A01"), true);
});

Deno.test("isValidDisplayName - returns false for invalid prefix", () => {
  assertEquals(isValidDisplayName("X1A01"), false);
  assertEquals(isValidDisplayName("A1A01"), false);
});

Deno.test("isValidDisplayName - returns false for wrong format", () => {
  assertEquals(isValidDisplayName("T1A1"), false);
  assertEquals(isValidDisplayName("T1A001"), false);
  assertEquals(isValidDisplayName("TA101"), false);
  assertEquals(isValidDisplayName("T11A01"), false);
});

Deno.test("isValidDisplayName - returns false for UUID", () => {
  assertEquals(isValidDisplayName("550e8400-e29b-41d4-a716-446655440000"), false);
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
  assertEquals(isUUID("550e8400-e29b-41d4-a716"), false);
});

// ============================================================
// isValidQuestionId Tests
// ============================================================

Deno.test("isValidQuestionId - returns true for display name", () => {
  assertEquals(isValidQuestionId("T1A01"), true);
  assertEquals(isValidQuestionId("G2B03"), true);
  assertEquals(isValidQuestionId("E3C12"), true);
});

Deno.test("isValidQuestionId - returns true for UUID", () => {
  assertEquals(isValidQuestionId("550e8400-e29b-41d4-a716-446655440000"), true);
});

Deno.test("isValidQuestionId - returns false for invalid ID", () => {
  assertEquals(isValidQuestionId("invalid"), false);
  assertEquals(isValidQuestionId("X1A01"), false);
});

// ============================================================
// getLicenseName Tests
// ============================================================

Deno.test("getLicenseName - returns Technician for T prefix", () => {
  assertEquals(getLicenseName("T1A01"), "Technician");
  assertEquals(getLicenseName("t1a01"), "Technician");
});

Deno.test("getLicenseName - returns General for G prefix", () => {
  assertEquals(getLicenseName("G2B03"), "General");
  assertEquals(getLicenseName("g2b03"), "General");
});

Deno.test("getLicenseName - returns Extra for E prefix", () => {
  assertEquals(getLicenseName("E3C12"), "Extra");
  assertEquals(getLicenseName("e3c12"), "Extra");
});

Deno.test("getLicenseName - returns Amateur Radio for unknown prefix", () => {
  assertEquals(getLicenseName("X1A01"), "Amateur Radio");
  assertEquals(getLicenseName("550e8400-e29b-41d4-a716-446655440000"), "Amateur Radio");
});

// ============================================================
// buildQuestionTitle Tests
// ============================================================

Deno.test("buildQuestionTitle - builds correct title format", () => {
  assertEquals(
    buildQuestionTitle("T1A01", "Open Ham Prep"),
    "Question T1A01 | Open Ham Prep"
  );
});

Deno.test("buildQuestionTitle - uppercases display name", () => {
  assertEquals(
    buildQuestionTitle("t1a01", "Open Ham Prep"),
    "Question T1A01 | Open Ham Prep"
  );
});

// ============================================================
// CRAWLER_PATTERNS Tests
// ============================================================

Deno.test("CRAWLER_PATTERNS - contains common crawlers", () => {
  assertEquals(CRAWLER_PATTERNS.includes("Googlebot"), true);
  assertEquals(CRAWLER_PATTERNS.includes("facebookexternalhit"), true);
  assertEquals(CRAWLER_PATTERNS.includes("Twitterbot"), true);
  assertEquals(CRAWLER_PATTERNS.includes("Discourse"), true);
  assertEquals(CRAWLER_PATTERNS.includes("Slackbot"), true);
});
