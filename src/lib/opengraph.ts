/**
 * Shared utilities for OpenGraph/crawler detection logic.
 * These functions are used by both the Supabase Edge Function and can be unit tested.
 */

// Known crawler/bot User-Agent patterns
export const CRAWLER_PATTERNS = [
  'Discoursebot',
  'facebookexternalhit',
  'Facebot',
  'Twitterbot',
  'LinkedInBot',
  'Slackbot',
  'TelegramBot',
  'WhatsApp',
  'Googlebot',
  'bingbot',
  'Baiduspider',
  'YandexBot',
  'DuckDuckBot',
  'Applebot',
  'PinterestBot',
  'redditbot',
  'Embedly',
  'Quora Link Preview',
  'Rogerbot',
  'Showyoubot',
  'outbrain',
  'vkShare',
  'W3C_Validator',
];

/**
 * Check if the User-Agent indicates a crawler/bot
 */
export function isCrawler(userAgent: string | null): boolean {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return CRAWLER_PATTERNS.some(pattern => ua.includes(pattern.toLowerCase()));
}

/**
 * Escape HTML special characters to prevent XSS in meta tags
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Validate question ID format (T1A01, G2B03, E3C12, etc.)
 */
export function isValidQuestionId(id: string): boolean {
  return /^[TGE]\d[A-Z]\d{2}$/i.test(id);
}

/**
 * Get human-readable license name from question ID prefix
 */
export function getLicenseName(questionId: string): string {
  const prefix = questionId[0].toUpperCase();
  switch (prefix) {
    case 'T': return 'Technician';
    case 'G': return 'General';
    case 'E': return 'Extra';
    default: return 'Amateur Radio';
  }
}

/**
 * Build the canonical URL for a question
 */
export function buildQuestionUrl(questionId: string, siteUrl: string): string {
  return `${siteUrl}/questions/${questionId.toLowerCase()}`;
}

/**
 * Build OpenGraph meta tags HTML for a question
 */
export function buildOpenGraphHtml(params: {
  questionId: string;
  questionText: string;
  siteUrl: string;
  siteName: string;
  imageUrl: string;
}): string {
  const { questionId, questionText, siteUrl, siteName, imageUrl } = params;

  const canonicalUrl = buildQuestionUrl(questionId, siteUrl);
  const title = `Question ${questionId.toUpperCase()} | ${siteName}`;
  const licenseName = getLicenseName(questionId);
  const description = questionText;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">

  <!-- OpenGraph Meta Tags for rich previews -->
  <meta property="og:type" content="article">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:site_name" content="${siteName}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="article:section" content="${licenseName} License Exam">

  <!-- Twitter Card Meta Tags -->
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${imageUrl}">

  <link rel="canonical" href="${canonicalUrl}">
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p>${escapeHtml(description)}</p>
  <p><a href="${canonicalUrl}">View this question on ${siteName}</a></p>
</body>
</html>`;
}
