/// <reference lib="deno.ns" />

// ============================================================
// PURE LOGIC FOR DISCOURSE-WEBHOOK
// Extracted for testability
// ============================================================

import { QUESTION_ID_PATTERN } from "../_shared/constants.ts";

/**
 * Extract the explanation text from the Discourse post markdown.
 *
 * Expected format (created by sync-discourse-topics):
 * ## Question
 * {question text}
 *
 * ## Answer Options
 * ...
 *
 * ## Explanation
 * {explanation text}
 *
 * ---
 * _This topic was automatically created..._
 *
 * @returns The explanation text, or null if not found/parseable
 */
export function parseExplanationFromPost(
  rawContent: string | null | undefined
): string | null {
  // Handle null/undefined input
  if (!rawContent) {
    return null;
  }

  // Find the "## Explanation" section - capture until --- or next ## or end
  const explanationMatch = rawContent.match(
    /##\s*Explanation\s*\n([\s\S]*?)(?:\n---|\n##|$)/i
  );

  if (!explanationMatch) {
    return null;
  }

  let explanation = explanationMatch[1].trim();

  // Handle the placeholder text that means "no explanation"
  if (
    explanation ===
    "_No explanation yet. Help improve this by contributing below!_"
  ) {
    return null;
  }

  // Clean up any trailing whitespace or empty lines
  explanation = explanation.replace(/\s+$/, "");

  // Return null for empty or whitespace-only content, or if it's just "---"
  if (!explanation || explanation === "---") {
    return null;
  }

  return explanation;
}

/**
 * Extract question ID from topic title.
 * Format: "T1A01 - Question text..."
 */
export function extractQuestionIdFromTitle(
  title: string | null | undefined
): string | null {
  // Handle null/undefined input
  if (!title) {
    return null;
  }

  const match = title.match(QUESTION_ID_PATTERN);
  return match ? match[1] : null;
}

/**
 * Extract topic ID from a Discourse forum URL.
 * Handles URLs like:
 * - https://forum.openhamprep.com/t/topic-slug/123
 * - https://forum.openhamprep.com/t/123
 */
export function extractTopicIdFromUrl(forumUrl: string | null | undefined): number | null {
  if (!forumUrl) {
    return null;
  }

  // Match /t/optional-slug/123 or /t/123
  const match = forumUrl.match(/\/t\/(?:[^/]+\/)?(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Check if signature has the correct format.
 * Discourse sends signature as "sha256=HEXDIGEST".
 */
export function isValidSignatureFormat(signature: string | null): boolean {
  if (!signature) return false;
  return signature.startsWith("sha256=");
}

/**
 * Extract the hex digest from a Discourse signature.
 * Returns null if format is invalid.
 */
export function extractSignatureDigest(signature: string): string | null {
  if (!isValidSignatureFormat(signature)) {
    return null;
  }
  return signature.slice(7); // Remove "sha256=" prefix
}

/**
 * Constant-time string comparison to prevent timing attacks.
 * Returns true if strings are equal.
 */
export function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Convert a Uint8Array to a hex string.
 */
export function toHexString(buffer: Uint8Array): string {
  return Array.from(buffer)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
