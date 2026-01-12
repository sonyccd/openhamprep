// ============================================================
// PURE LOGIC FOR UPDATE-DISCOURSE-POST
// Extracted for testability
// ============================================================

import { DISCOURSE_URL } from "../_shared/constants.ts";

/**
 * Extract topic ID from a forum URL.
 * Handles formats like:
 * - https://forum.openhamprep.com/t/topic-slug/123
 * - https://forum.openhamprep.com/t/123
 */
export function extractTopicId(
  forumUrl: string | null | undefined
): number | null {
  if (!forumUrl) return null;
  const match = forumUrl.match(/\/t\/(?:[^/]+\/)?(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Check if a string is a valid UUID format.
 */
export function isUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    id
  );
}

/**
 * Format the topic body for a question in Discourse.
 * Same format as sync-discourse-topics for consistency.
 */
export function formatTopicBody(
  question: string,
  options: string[],
  correctAnswer: number,
  explanation: string | null
): string {
  const letters = ["A", "B", "C", "D"];
  const correctLetter = letters[correctAnswer];

  const optionsText = options
    .map((opt, i) => `- **${letters[i]})** ${opt}`)
    .join("\n");

  const explanationText = explanation
    ? explanation
    : "_No explanation yet. Help improve this by contributing below!_";

  return `## Question
${question}

## Answer Options
${optionsText}

**Correct Answer: ${correctLetter}**

---

## Explanation
${explanationText}

---
_This topic was automatically created to facilitate community discussion about this exam question. Feel free to share study tips, memory tricks, or additional explanations!_`;
}

/**
 * Build the Discourse topic URL for external_id lookup.
 */
export function buildExternalIdUrl(baseUrl: string, uuid: string): string {
  return `${baseUrl}/t/external_id/${uuid}.json`;
}

/**
 * Validate that a forum URL is from our Discourse instance.
 */
export function isValidDiscourseUrl(forumUrl: string): boolean {
  if (!forumUrl) return false;
  return forumUrl.startsWith(DISCOURSE_URL);
}
