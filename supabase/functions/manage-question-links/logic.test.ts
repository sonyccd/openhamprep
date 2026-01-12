// ============================================================
// UNIT TESTS FOR MANAGE-QUESTION-LINKS LOGIC
// ============================================================

import { assertEquals } from "jsr:@std/assert@1";
import {
  extractMetaContent,
  extractTitle,
  isHostnameMatch,
  detectType,
  extractSiteName,
  extractUrlsFromText,
  isUUID,
  cleanTrailingPunctuation,
  VIDEO_DOMAINS,
} from "./logic.ts";

// ============================================================
// extractMetaContent Tests
// ============================================================

Deno.test("extractMetaContent - extracts og:title (property before content)", () => {
  const html = `<meta property="og:title" content="My Page Title">`;
  assertEquals(extractMetaContent(html, "title"), "My Page Title");
});

Deno.test("extractMetaContent - extracts og:title (content before property)", () => {
  const html = `<meta content="My Page Title" property="og:title">`;
  assertEquals(extractMetaContent(html, "title"), "My Page Title");
});

Deno.test("extractMetaContent - extracts og:description", () => {
  const html = `<meta property="og:description" content="This is a description">`;
  assertEquals(extractMetaContent(html, "description"), "This is a description");
});

Deno.test("extractMetaContent - extracts og:image", () => {
  const html = `<meta property="og:image" content="https://example.com/image.jpg">`;
  assertEquals(extractMetaContent(html, "image"), "https://example.com/image.jpg");
});

Deno.test("extractMetaContent - falls back to twitter:title", () => {
  const html = `<meta name="twitter:title" content="Twitter Title">`;
  assertEquals(extractMetaContent(html, "title"), "Twitter Title");
});

Deno.test("extractMetaContent - falls back to twitter:title (content before name)", () => {
  const html = `<meta content="Twitter Title" name="twitter:title">`;
  assertEquals(extractMetaContent(html, "title"), "Twitter Title");
});

Deno.test("extractMetaContent - falls back to generic meta name", () => {
  const html = `<meta name="description" content="Generic description">`;
  assertEquals(extractMetaContent(html, "description"), "Generic description");
});

Deno.test("extractMetaContent - returns empty string when not found", () => {
  const html = `<html><head></head><body></body></html>`;
  assertEquals(extractMetaContent(html, "title"), "");
});

Deno.test("extractMetaContent - handles single quotes", () => {
  const html = `<meta property='og:title' content='Single Quote Title'>`;
  assertEquals(extractMetaContent(html, "title"), "Single Quote Title");
});

Deno.test("extractMetaContent - prefers og: over twitter:", () => {
  const html = `
    <meta property="og:title" content="OG Title">
    <meta name="twitter:title" content="Twitter Title">
  `;
  assertEquals(extractMetaContent(html, "title"), "OG Title");
});

// ============================================================
// extractTitle Tests
// ============================================================

Deno.test("extractTitle - extracts og:title when present", () => {
  const html = `
    <meta property="og:title" content="OG Title">
    <title>HTML Title</title>
  `;
  assertEquals(extractTitle(html), "OG Title");
});

Deno.test("extractTitle - falls back to title tag", () => {
  const html = `<html><head><title>HTML Title</title></head></html>`;
  assertEquals(extractTitle(html), "HTML Title");
});

Deno.test("extractTitle - trims whitespace from title tag", () => {
  const html = `<title>  Whitespace Title  </title>`;
  assertEquals(extractTitle(html), "Whitespace Title");
});

Deno.test("extractTitle - returns empty string when no title found", () => {
  const html = `<html><head></head></html>`;
  assertEquals(extractTitle(html), "");
});

Deno.test("extractTitle - handles title with attributes", () => {
  const html = `<title lang="en">Title with attrs</title>`;
  assertEquals(extractTitle(html), "Title with attrs");
});

// ============================================================
// isHostnameMatch Tests
// ============================================================

Deno.test("isHostnameMatch - exact match returns true", () => {
  assertEquals(isHostnameMatch("youtube.com", "youtube.com"), true);
});

Deno.test("isHostnameMatch - subdomain match returns true", () => {
  assertEquals(isHostnameMatch("www.youtube.com", "youtube.com"), true);
  assertEquals(isHostnameMatch("m.youtube.com", "youtube.com"), true);
});

Deno.test("isHostnameMatch - deep subdomain match returns true", () => {
  assertEquals(isHostnameMatch("video.cdn.youtube.com", "youtube.com"), true);
});

Deno.test("isHostnameMatch - different domain returns false", () => {
  assertEquals(isHostnameMatch("notyoutube.com", "youtube.com"), false);
});

Deno.test("isHostnameMatch - partial match at end returns false", () => {
  // "fakyoutube.com" should not match "youtube.com"
  assertEquals(isHostnameMatch("fakeyoutube.com", "youtube.com"), false);
});

Deno.test("isHostnameMatch - case insensitive", () => {
  assertEquals(isHostnameMatch("WWW.YOUTUBE.COM", "youtube.com"), true);
  assertEquals(isHostnameMatch("www.youtube.com", "YOUTUBE.COM"), true);
});

// ============================================================
// detectType Tests
// ============================================================

Deno.test("detectType - detects YouTube as video", () => {
  assertEquals(detectType("https://www.youtube.com/watch?v=abc", ""), "video");
  assertEquals(detectType("https://youtube.com/watch?v=abc", ""), "video");
});

Deno.test("detectType - detects youtu.be as video", () => {
  assertEquals(detectType("https://youtu.be/abc123", ""), "video");
});

Deno.test("detectType - detects Vimeo as video", () => {
  assertEquals(detectType("https://vimeo.com/123456", ""), "video");
});

Deno.test("detectType - detects og:type video", () => {
  const html = `<meta property="og:type" content="video.other">`;
  assertEquals(detectType("https://example.com/page", html), "video");
});

Deno.test("detectType - detects og:type article", () => {
  const html = `<meta property="og:type" content="article">`;
  assertEquals(detectType("https://example.com/page", html), "article");
});

Deno.test("detectType - detects article tag in HTML", () => {
  const html = `<html><body><article>Content</article></body></html>`;
  assertEquals(detectType("https://example.com/page", html), "article");
});

Deno.test("detectType - detects /blog/ path as article", () => {
  assertEquals(detectType("https://example.com/blog/my-post", ""), "article");
});

Deno.test("detectType - detects /article/ path as article", () => {
  assertEquals(detectType("https://example.com/article/123", ""), "article");
});

Deno.test("detectType - detects /post/ path as article", () => {
  assertEquals(detectType("https://example.com/post/my-post", ""), "article");
});

Deno.test("detectType - defaults to website", () => {
  assertEquals(detectType("https://example.com/", ""), "website");
});

Deno.test("detectType - handles invalid URL gracefully", () => {
  assertEquals(detectType("not-a-url", ""), "website");
});

// ============================================================
// extractSiteName Tests
// ============================================================

Deno.test("extractSiteName - extracts og:site_name when present", () => {
  const html = `<meta property="og:site_name" content="Example Site">`;
  assertEquals(extractSiteName("https://example.com/page", html), "Example Site");
});

Deno.test("extractSiteName - falls back to hostname", () => {
  assertEquals(extractSiteName("https://example.com/page", ""), "example.com");
});

Deno.test("extractSiteName - removes www. prefix from hostname", () => {
  assertEquals(extractSiteName("https://www.example.com/page", ""), "example.com");
});

Deno.test("extractSiteName - returns empty string for invalid URL", () => {
  assertEquals(extractSiteName("not-a-url", ""), "");
});

// ============================================================
// extractUrlsFromText Tests
// ============================================================

Deno.test("extractUrlsFromText - extracts markdown links", () => {
  const text = "Check out [this link](https://example.com/page)";
  assertEquals(extractUrlsFromText(text), ["https://example.com/page"]);
});

Deno.test("extractUrlsFromText - extracts multiple markdown links", () => {
  const text = "[Link 1](https://example.com/1) and [Link 2](https://example.com/2)";
  assertEquals(extractUrlsFromText(text), [
    "https://example.com/1",
    "https://example.com/2",
  ]);
});

Deno.test("extractUrlsFromText - extracts bare URLs", () => {
  const text = "Visit https://example.com/page for more info";
  assertEquals(extractUrlsFromText(text), ["https://example.com/page"]);
});

Deno.test("extractUrlsFromText - extracts http URLs", () => {
  const text = "Visit http://example.com/page for more info";
  assertEquals(extractUrlsFromText(text), ["http://example.com/page"]);
});

Deno.test("extractUrlsFromText - removes trailing punctuation from bare URLs", () => {
  const text = "Check this: https://example.com/page.";
  assertEquals(extractUrlsFromText(text), ["https://example.com/page"]);
});

Deno.test("extractUrlsFromText - removes multiple trailing punctuation", () => {
  const text = "See https://example.com/page!!";
  assertEquals(extractUrlsFromText(text), ["https://example.com/page"]);
});

Deno.test("extractUrlsFromText - deduplicates URLs", () => {
  const text = "[Link](https://example.com) and https://example.com again";
  assertEquals(extractUrlsFromText(text), ["https://example.com"]);
});

Deno.test("extractUrlsFromText - returns empty array for null input", () => {
  assertEquals(extractUrlsFromText(null), []);
});

Deno.test("extractUrlsFromText - returns empty array for undefined input", () => {
  assertEquals(extractUrlsFromText(undefined), []);
});

Deno.test("extractUrlsFromText - returns empty array for empty string", () => {
  assertEquals(extractUrlsFromText(""), []);
});

Deno.test("extractUrlsFromText - handles mixed markdown and bare URLs", () => {
  const text = "[Markdown](https://example.com/1) and bare https://example.com/2";
  assertEquals(extractUrlsFromText(text), [
    "https://example.com/1",
    "https://example.com/2",
  ]);
});

Deno.test("extractUrlsFromText - handles URLs with query parameters", () => {
  const text = "https://example.com/page?param=value&other=123";
  assertEquals(extractUrlsFromText(text), [
    "https://example.com/page?param=value&other=123",
  ]);
});

Deno.test("extractUrlsFromText - handles URLs with fragments", () => {
  const text = "https://example.com/page#section";
  assertEquals(extractUrlsFromText(text), ["https://example.com/page#section"]);
});

// ============================================================
// isUUID Tests
// ============================================================

Deno.test("isUUID - returns true for valid UUID", () => {
  assertEquals(isUUID("550e8400-e29b-41d4-a716-446655440000"), true);
  assertEquals(isUUID("6ba7b810-9dad-11d1-80b4-00c04fd430c8"), true);
});

Deno.test("isUUID - returns true for uppercase UUID", () => {
  assertEquals(isUUID("550E8400-E29B-41D4-A716-446655440000"), true);
});

Deno.test("isUUID - returns false for invalid format", () => {
  assertEquals(isUUID("not-a-uuid"), false);
  assertEquals(isUUID("T1A01"), false);
});

Deno.test("isUUID - returns false for wrong length", () => {
  assertEquals(isUUID("550e8400-e29b-41d4-a716-44665544000"), false);
});

// ============================================================
// cleanTrailingPunctuation Tests
// ============================================================

Deno.test("cleanTrailingPunctuation - removes period", () => {
  assertEquals(cleanTrailingPunctuation("https://example.com."), "https://example.com");
});

Deno.test("cleanTrailingPunctuation - removes comma", () => {
  assertEquals(cleanTrailingPunctuation("https://example.com,"), "https://example.com");
});

Deno.test("cleanTrailingPunctuation - removes multiple punctuation", () => {
  assertEquals(cleanTrailingPunctuation("https://example.com!!"), "https://example.com");
  assertEquals(cleanTrailingPunctuation("https://example.com?!"), "https://example.com");
});

Deno.test("cleanTrailingPunctuation - preserves URL without trailing punctuation", () => {
  assertEquals(cleanTrailingPunctuation("https://example.com"), "https://example.com");
});

Deno.test("cleanTrailingPunctuation - preserves punctuation in path", () => {
  assertEquals(
    cleanTrailingPunctuation("https://example.com/page.html"),
    "https://example.com/page.html"
  );
});

// ============================================================
// VIDEO_DOMAINS Tests
// ============================================================

Deno.test("VIDEO_DOMAINS - contains common video platforms", () => {
  assertEquals(VIDEO_DOMAINS.includes("youtube.com"), true);
  assertEquals(VIDEO_DOMAINS.includes("youtu.be"), true);
  assertEquals(VIDEO_DOMAINS.includes("vimeo.com"), true);
  assertEquals(VIDEO_DOMAINS.includes("dailymotion.com"), true);
  assertEquals(VIDEO_DOMAINS.includes("twitch.tv"), true);
});
