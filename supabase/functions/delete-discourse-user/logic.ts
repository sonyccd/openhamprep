/// <reference lib="deno.ns" />
/// <reference lib="dom" />

// ============================================================
// PURE LOGIC FOR DELETE-DISCOURSE-USER
// Extracted for testability
// ============================================================

/**
 * Validate that Discourse configuration is present.
 */
export interface DiscourseConfig {
  url: string;
  apiKey: string;
  username: string;
}

export function validateDiscourseConfig(
  url: string | undefined,
  apiKey: string | undefined,
  username: string | undefined
): { valid: true; config: DiscourseConfig } | { valid: false; error: string } {
  if (!url) {
    return { valid: false, error: "DISCOURSE_URL not configured" };
  }
  if (!apiKey) {
    return { valid: false, error: "DISCOURSE_API_KEY not configured" };
  }
  if (!username) {
    return { valid: false, error: "DISCOURSE_USERNAME not configured" };
  }
  return { valid: true, config: { url, apiKey, username } };
}

/**
 * Build the URL for looking up a Discourse user by external ID.
 */
export function buildUserLookupUrl(baseUrl: string, externalId: string): string {
  return `${baseUrl}/u/by-external/${encodeURIComponent(externalId)}.json`;
}

/**
 * Build the URL for deleting a Discourse user.
 */
export function buildUserDeleteUrl(
  baseUrl: string,
  discourseUserId: number,
  deletePosts: boolean = false,
  blockEmail: boolean = false
): string {
  const params = new URLSearchParams();
  if (deletePosts) {
    params.append("delete_posts", "true");
  }
  if (blockEmail) {
    params.append("block_email", "true");
  }
  const queryString = params.toString();
  return `${baseUrl}/admin/users/${discourseUserId}.json${queryString ? "?" + queryString : ""}`;
}

/**
 * Create a success response object.
 */
export function successResponse(
  message: string,
  data: Record<string, unknown> = {}
): { success: true; message: string } & Record<string, unknown> {
  return { success: true, message, ...data };
}

/**
 * Create an error response object.
 */
export function errorResponse(
  error: string,
  details: Record<string, unknown> = {}
): { error: string } & Record<string, unknown> {
  return { error, ...details };
}
