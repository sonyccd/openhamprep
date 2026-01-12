/// <reference lib="deno.ns" />
/// <reference lib="dom" />

// ============================================================
// PURE LOGIC FOR MIGRATE-DISCOURSE-EXTERNAL-IDS
// Extracted for testability
// ============================================================

import { DISCOURSE_URL } from "../_shared/constants.ts";

/**
 * Validate that a forum_url is a trusted Discourse URL.
 * Prevents SSRF attacks where malicious forum_url could point to internal servers.
 */
export function isValidDiscourseUrl(forumUrl: string | null | undefined): boolean {
  if (!forumUrl) return false;
  return forumUrl.startsWith(DISCOURSE_URL);
}

/**
 * Extract topic ID from a Discourse forum URL.
 * Returns null if URL is not from our Discourse instance (security check).
 */
export function extractTopicId(forumUrl: string | null | undefined): number | null {
  if (!forumUrl) return null;
  // Security: Only process URLs from our Discourse instance
  if (!isValidDiscourseUrl(forumUrl)) {
    return null;
  }
  const match = forumUrl.match(/\/t\/(?:[^/]+\/)?(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Clamp batch size to valid range.
 */
export function clampBatchSize(
  batchSize: number,
  max: number = 100
): number {
  return Math.min(Math.max(1, batchSize), max);
}

/**
 * Parse rate limit wait time from a 429 response.
 * Returns wait time in seconds, or default if can't parse.
 */
export function parseRateLimitWaitTime(
  errorData: { extras?: { wait_seconds?: number } } | null,
  defaultSeconds: number = 30
): number {
  if (errorData?.extras?.wait_seconds && typeof errorData.extras.wait_seconds === "number") {
    return errorData.extras.wait_seconds;
  }
  return defaultSeconds;
}

/**
 * Calculate exponential backoff delay.
 * Returns delay in milliseconds.
 */
export function calculateBackoffDelay(
  attempt: number,
  baseDelayMs: number = 1000,
  maxDelayMs: number = 30000
): number {
  const delay = baseDelayMs * Math.pow(2, attempt - 1);
  return Math.min(delay, maxDelayMs);
}

/**
 * Aggregate migration errors by reason.
 * Returns a map of reason -> count.
 */
export function aggregateErrors(
  results: Array<{ status: string; reason?: string }>
): Map<string, number> {
  const errorCounts = new Map<string, number>();

  for (const result of results) {
    if (result.status === "error" && result.reason) {
      const count = errorCounts.get(result.reason) || 0;
      errorCounts.set(result.reason, count + 1);
    }
  }

  return errorCounts;
}

/**
 * Build migration progress summary.
 */
export interface MigrationProgress {
  processed: number;
  successful: number;
  failed: number;
  remaining: number;
  percentComplete: number;
}

export function buildProgress(
  processed: number,
  successful: number,
  failed: number,
  total: number
): MigrationProgress {
  const remaining = total - processed;
  const percentComplete = total > 0 ? Math.round((processed / total) * 100) : 100;

  return {
    processed,
    successful,
    failed,
    remaining,
    percentComplete,
  };
}
