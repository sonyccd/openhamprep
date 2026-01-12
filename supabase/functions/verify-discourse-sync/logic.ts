// ============================================================
// PURE LOGIC FOR VERIFY-DISCOURSE-SYNC
// Extracted for testability
// ============================================================

import { QUESTION_ID_PATTERN } from "../_shared/constants.ts";

/**
 * Extract question ID from topic title.
 * Format: "T1A01 - Question text..."
 */
export function extractQuestionIdFromTitle(
  title: string | null | undefined
): string | null {
  if (!title) return null;
  const match = title.match(QUESTION_ID_PATTERN);
  return match ? match[1] : null;
}

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
 * Build a topic URL from its ID and slug.
 */
export function buildTopicUrl(
  baseUrl: string,
  slug: string,
  topicId: number
): string {
  return `${baseUrl}/t/${slug}/${topicId}`;
}

/**
 * Count questions by sync status.
 */
export interface SyncStatusCounts {
  withForumUrl: number;
  withoutForumUrl: number;
  synced: number;
  error: number;
  pending: number;
}

export function countByStatus(
  questions: Array<{
    forum_url: string | null;
    discourse_sync_status: string | null;
  }>
): SyncStatusCounts {
  let withForumUrl = 0;
  let withoutForumUrl = 0;
  let synced = 0;
  let error = 0;
  let pending = 0;

  for (const q of questions) {
    if (q.forum_url) {
      withForumUrl++;
    } else {
      withoutForumUrl++;
    }

    switch (q.discourse_sync_status) {
      case "synced":
        synced++;
        break;
      case "error":
        error++;
        break;
      default:
        pending++;
        break;
    }
  }

  return { withForumUrl, withoutForumUrl, synced, error, pending };
}

/**
 * Check if a question display name matches a topic.
 * Matches if the topic title starts with the display name.
 */
export function questionMatchesTopic(
  displayName: string,
  topicTitle: string
): boolean {
  if (!displayName || !topicTitle) return false;
  return topicTitle
    .toUpperCase()
    .startsWith(displayName.toUpperCase() + " -");
}

/**
 * Validate that a forum URL points to the expected Discourse instance.
 */
export function isValidForumUrl(
  forumUrl: string,
  expectedBaseUrl: string
): boolean {
  if (!forumUrl) return false;
  try {
    const url = new URL(forumUrl);
    const expected = new URL(expectedBaseUrl);
    return url.hostname === expected.hostname;
  } catch {
    return false;
  }
}
