/// <reference lib="deno.ns" />
/// <reference lib="dom" />

/**
 * Shared constants for Supabase Edge Functions
 */

// Discourse API configuration
export const DISCOURSE_URL = 'https://forum.openhamprep.com';
export const MAX_PAGINATION_PAGES = 100;
export const MAX_TITLE_LENGTH = 250;

// Exponential backoff configuration for rate limiting
export const BACKOFF_INITIAL_DELAY_MS = 100;  // Start with 100ms
export const BACKOFF_MAX_DELAY_MS = 30000;    // Max 30 seconds
export const BACKOFF_MAX_RETRIES = 5;
export const BACKOFF_MULTIPLIER = 2;

/**
 * Fetch with exponential backoff for rate-limited APIs.
 * Retries on 429 (rate limit) and 5xx errors with increasing delays.
 * Returns response on success, throws on non-retryable errors or max retries exceeded.
 */
export async function fetchWithBackoff(
  url: string,
  options: RequestInit,
  context?: string
): Promise<Response> {
  let delay = BACKOFF_INITIAL_DELAY_MS;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= BACKOFF_MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, options);

      // Success - return immediately
      if (response.ok) {
        return response;
      }

      // Rate limited (429) or server error (5xx) - retry with backoff
      if (response.status === 429 || response.status >= 500) {
        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter
          ? parseInt(retryAfter, 10) * 1000
          : delay;

        if (attempt < BACKOFF_MAX_RETRIES) {
          const logContext = context ? `[${context}] ` : '';
          console.log(
            `${logContext}Rate limited (${response.status}), retrying in ${waitTime}ms (attempt ${attempt + 1}/${BACKOFF_MAX_RETRIES})`
          );
          await new Promise(resolve => setTimeout(resolve, waitTime));
          delay = Math.min(delay * BACKOFF_MULTIPLIER, BACKOFF_MAX_DELAY_MS);
          continue;
        }
      }

      // Non-retryable error - return the response for caller to handle
      return response;
    } catch (error) {
      // Network error - retry with backoff
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < BACKOFF_MAX_RETRIES) {
        const logContext = context ? `[${context}] ` : '';
        console.log(
          `${logContext}Network error, retrying in ${delay}ms (attempt ${attempt + 1}/${BACKOFF_MAX_RETRIES}): ${lastError.message}`
        );
        await new Promise(resolve => setTimeout(resolve, delay));
        delay = Math.min(delay * BACKOFF_MULTIPLIER, BACKOFF_MAX_DELAY_MS);
        continue;
      }
    }
  }

  throw lastError || new Error('Max retries exceeded');
}

// Category mappings for question prefixes
export const CATEGORY_MAP: Record<string, string> = {
  'T': 'Technician Questions',
  'G': 'General Questions',
  'E': 'Extra Questions',
};

// Question ID pattern: T1A01, G2B03, E3C12, etc.
export const QUESTION_ID_PATTERN = /^([TGE]\d[A-Z]\d{2})\s*-/;

/**
 * UUID v4 pattern for validating question UUIDs.
 * Supabase generates v4 UUIDs by default (gen_random_uuid()).
 * Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx where y is 8, 9, a, or b.
 */
export const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validate that a string is a valid UUID v4.
 * Use this to validate external_id values from Discourse to ensure they match
 * our question UUIDs before using them for database lookups.
 */
export function isValidUuid(value: string): boolean {
  return UUID_V4_PATTERN.test(value);
}

/**
 * Get the category slug from category name
 */
export function getCategorySlug(categoryName: string): string {
  return categoryName.toLowerCase().replace(/\s+/g, '-');
}

/**
 * Get CORS headers for edge functions.
 * Uses APP_DOMAIN env var if available, otherwise allows all origins.
 * Set APP_DOMAIN in production (e.g., 'https://app.openhamprep.com') for improved security.
 */
export function getCorsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': Deno.env.get('APP_DOMAIN') || '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

// For backward compatibility, also export static headers
// TODO: Migrate all usages to getCorsHeaders() and set APP_DOMAIN env var
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Decode a JWT and extract the payload without verifying the signature.
 * The signature is already verified by Supabase's API gateway.
 */
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = parts[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
    const decoded = atob(padded);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

/**
 * Check if a JWT token has the service_role claim.
 */
export function isServiceRoleToken(token: string): boolean {
  const payload = decodeJwtPayload(token);
  return payload?.role === 'service_role';
}

// ============================================================
// System Monitoring Constants
// ============================================================

/** Time window for loading existing alerts (24 hours in ms) */
export const ALERT_LOOKBACK_MS = 24 * 60 * 60 * 1000;

/** Time window for log analysis (30 minutes in ms) */
export const LOG_ANALYSIS_WINDOW_MS = 30 * 60 * 1000;

/** Maximum number of log entries to fetch from Analytics API */
export const MAX_LOG_ENTRIES = 500;

/** Timeout for Analytics API requests (10 seconds) */
export const ANALYTICS_API_TIMEOUT_MS = 10_000;

/** Delay before refetching after triggering monitor (5 seconds) */
export const TRIGGER_REFETCH_DELAY_MS = 5_000;
