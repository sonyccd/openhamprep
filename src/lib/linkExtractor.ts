/**
 * Extracts all URLs from explanation text.
 * Handles both markdown links [text](url) and bare URLs (https://...).
 * Deduplicates URLs and returns unique list.
 */
export function extractLinksFromText(text: string): string[] {
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
  // First, remove markdown links to avoid double-counting
  const textWithoutMarkdownLinks = text.replace(markdownLinkRegex, '');
  const bareUrlRegex = /https?:\/\/[^\s<>\[\]()]+/gi;
  while ((match = bareUrlRegex.exec(textWithoutMarkdownLinks)) !== null) {
    const url = match[0];
    // Clean trailing punctuation that might be part of sentence
    const cleanUrl = url.replace(/[.,;:!?'"]+$/, '');
    if (!seen.has(cleanUrl)) {
      seen.add(cleanUrl);
      urls.push(cleanUrl);
    }
  }

  return urls;
}
