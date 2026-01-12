// ============================================================
// PURE LOGIC FOR MANAGE-QUESTION-LINKS
// Extracted for testability
// ============================================================

// Video hosting domains - check hostname ends with these (handles subdomains)
export const VIDEO_DOMAINS = [
  "youtube.com",
  "youtu.be",
  "vimeo.com",
  "dailymotion.com",
  "twitch.tv",
];

/**
 * Extract meta content from HTML by property name.
 * Searches for OpenGraph, Twitter Card, and standard meta tags.
 */
export function extractMetaContent(html: string, property: string): string {
  // Try og: property (property before content)
  const ogMatch1 = html.match(
    new RegExp(
      `<meta[^>]*property=["']og:${property}["'][^>]*content=["']([^"']+)["']`,
      "i"
    )
  );
  if (ogMatch1) return ogMatch1[1];

  // Try og: property (content before property)
  const ogMatch2 = html.match(
    new RegExp(
      `<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:${property}["']`,
      "i"
    )
  );
  if (ogMatch2) return ogMatch2[1];

  // Try twitter: name (name before content)
  const twitterMatch1 = html.match(
    new RegExp(
      `<meta[^>]*name=["']twitter:${property}["'][^>]*content=["']([^"']+)["']`,
      "i"
    )
  );
  if (twitterMatch1) return twitterMatch1[1];

  // Try twitter: name (content before name)
  const twitterMatch2 = html.match(
    new RegExp(
      `<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:${property}["']`,
      "i"
    )
  );
  if (twitterMatch2) return twitterMatch2[1];

  // Try standard meta name (name before content)
  const metaMatch1 = html.match(
    new RegExp(
      `<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']+)["']`,
      "i"
    )
  );
  if (metaMatch1) return metaMatch1[1];

  // Try standard meta name (content before name)
  const metaMatch2 = html.match(
    new RegExp(
      `<meta[^>]*content=["']([^"']+)["'][^>]*name=["']${property}["']`,
      "i"
    )
  );
  if (metaMatch2) return metaMatch2[1];

  return "";
}

/**
 * Extract title from HTML.
 * Prefers og:title, falls back to <title> tag.
 */
export function extractTitle(html: string): string {
  const ogTitle = extractMetaContent(html, "title");
  if (ogTitle) return ogTitle;

  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return titleMatch ? titleMatch[1].trim() : "";
}

/**
 * Checks if a hostname matches an allowed domain.
 * Handles subdomains correctly (e.g., www.youtube.com matches youtube.com).
 */
export function isHostnameMatch(hostname: string, allowedDomain: string): boolean {
  const normalizedHost = hostname.toLowerCase();
  const normalizedDomain = allowedDomain.toLowerCase();
  return (
    normalizedHost === normalizedDomain ||
    normalizedHost.endsWith("." + normalizedDomain)
  );
}

/**
 * Detect content type from URL and HTML.
 * Returns 'video', 'article', or 'website'.
 */
export function detectType(
  url: string,
  html: string
): "video" | "article" | "website" {
  // Parse URL and check hostname against known video platforms
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname;

    if (VIDEO_DOMAINS.some((domain) => isHostnameMatch(hostname, domain))) {
      return "video";
    }
  } catch {
    // Invalid URL, fall through to other detection methods
  }

  const ogType = extractMetaContent(html, "type");
  if (ogType.includes("video")) return "video";
  if (ogType.includes("article")) return "article";

  // Check for article indicators in HTML or URL path
  try {
    const parsedUrl = new URL(url);
    const pathLower = parsedUrl.pathname.toLowerCase();
    if (
      html.includes("<article") ||
      pathLower.includes("/blog/") ||
      pathLower.includes("/article/") ||
      pathLower.includes("/post/")
    ) {
      return "article";
    }
  } catch {
    // Invalid URL, skip path-based detection
  }

  return "website";
}

/**
 * Extract site name from URL and HTML.
 * Prefers og:site_name, falls back to hostname.
 */
export function extractSiteName(url: string, html: string): string {
  const ogSiteName = extractMetaContent(html, "site_name");
  if (ogSiteName) return ogSiteName;

  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return "";
  }
}

/**
 * Extracts all URLs from explanation text.
 * Handles both markdown links [text](url) and bare URLs (https://...).
 * Deduplicates URLs and cleans trailing punctuation.
 */
export function extractUrlsFromText(text: string | null | undefined): string[] {
  if (!text) return [];

  const urls: string[] = [];
  const seen = new Set<string>();

  // Extract URLs from markdown links [text](url)
  const markdownLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/gi;
  let match;
  while ((match = markdownLinkRegex.exec(text)) !== null) {
    const url = match[2];
    if (!seen.has(url)) {
      seen.add(url);
      urls.push(url);
    }
  }

  // Extract bare URLs (not inside markdown links)
  const textWithoutMarkdownLinks = text.replace(markdownLinkRegex, "");
  const bareUrlRegex = /https?:\/\/[^\s<>[\]()]+/gi;
  while ((match = bareUrlRegex.exec(textWithoutMarkdownLinks)) !== null) {
    const url = match[0].replace(/[.,;:!?'"]+$/, ""); // Clean trailing punctuation
    if (!seen.has(url)) {
      seen.add(url);
      urls.push(url);
    }
  }

  return urls;
}

/**
 * Helper to detect if a string is a UUID format.
 * Note: This is a loose check (any UUID version), not strict v4.
 */
export function isUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    str
  );
}

/**
 * Clean trailing punctuation from a URL.
 */
export function cleanTrailingPunctuation(url: string): string {
  return url.replace(/[.,;:!?'"]+$/, "");
}
