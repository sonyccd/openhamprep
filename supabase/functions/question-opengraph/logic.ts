// ============================================================
// PURE LOGIC FOR QUESTION-OPENGRAPH
// Extracted for testability
// ============================================================

// Known crawler/bot User-Agent patterns
export const CRAWLER_PATTERNS = [
  "Discourse",
  "Discoursebot",
  "facebookexternalhit",
  "Facebot",
  "Twitterbot",
  "LinkedInBot",
  "Slackbot",
  "TelegramBot",
  "WhatsApp",
  "Googlebot",
  "bingbot",
  "Baiduspider",
  "YandexBot",
  "DuckDuckBot",
  "Applebot",
  "PinterestBot",
  "redditbot",
  "Embedly",
  "Quora Link Preview",
  "Rogerbot",
  "Showyoubot",
  "outbrain",
  "vkShare",
  "W3C_Validator",
];

/**
 * Truncate text to a maximum length, adding ellipsis if needed.
 * Tries to break at word boundaries.
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;

  // Find the last space before maxLength
  const truncated = text.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");

  // Only break at word boundary if it's reasonably far into the string
  if (lastSpace > maxLength * 0.7) {
    return truncated.slice(0, lastSpace) + "...";
  }

  return truncated.slice(0, maxLength - 3) + "...";
}

/**
 * Check if the User-Agent indicates a crawler/bot
 */
export function isCrawler(userAgent: string | null): boolean {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return CRAWLER_PATTERNS.some((pattern) => ua.includes(pattern.toLowerCase()));
}

/**
 * Escape HTML special characters to prevent XSS in meta tags
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Validate display name format (T1A01, G2B03, E3C12, etc.)
 */
export function isValidDisplayName(id: string): boolean {
  return /^[TGE]\d[A-Z]\d{2}$/i.test(id);
}

/**
 * Check if a string is a valid UUID format
 */
export function isUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    id
  );
}

/**
 * Validate question ID format (accepts both display_name and UUID)
 */
export function isValidQuestionId(id: string): boolean {
  return isValidDisplayName(id) || isUUID(id);
}

/**
 * Get human-readable license name from question ID prefix
 */
export function getLicenseName(questionId: string): string {
  const prefix = questionId[0].toUpperCase();
  switch (prefix) {
    case "T":
      return "Technician";
    case "G":
      return "General";
    case "E":
      return "Extra";
    default:
      return "Amateur Radio";
  }
}

/**
 * Build page title for a question
 */
export function buildQuestionTitle(
  displayName: string,
  siteName: string
): string {
  return `Question ${displayName.toUpperCase()} | ${siteName}`;
}
