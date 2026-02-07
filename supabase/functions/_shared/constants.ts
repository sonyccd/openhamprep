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
 * Check whether an origin is allowed for CORS.
 * Allowed patterns (when APP_DOMAIN is set):
 * - Exact match against APP_DOMAIN (e.g., https://app.openhamprep.com)
 * - Vercel preview deployments: https://*.vercel.app
 * - Local development: http://localhost or http://localhost:PORT
 */
export function isAllowedOrigin(origin: string, appDomain?: string): boolean {
  if (!appDomain) return true;

  // Exact match with configured production domain
  if (origin === appDomain) return true;

  // Vercel preview deployments (https only, must have subdomain)
  if (/^https:\/\/[a-z0-9][\w.-]+\.vercel\.app$/i.test(origin)) return true;

  // Local development (http://localhost with optional port)
  if (/^http:\/\/localhost(:\d+)?$/.test(origin)) return true;

  return false;
}

/**
 * Get CORS headers for edge functions.
 *
 * When a Request is provided, reads the Origin header and validates it against
 * allowed patterns. Echoes back the origin if allowed (required by CORS spec
 * for multi-origin support). Includes Vary: Origin for correct CDN caching.
 *
 * Without a Request (legacy), returns APP_DOMAIN or '*' directly.
 */
export function getCorsHeaders(req?: Request): Record<string, string> {
  const appDomain = Deno.env.get('APP_DOMAIN');

  const baseHeaders: Record<string, string> = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Legacy path: no request object (backward compatible)
  if (!req) {
    return {
      ...baseHeaders,
      'Access-Control-Allow-Origin': appDomain || '*',
    };
  }

  // No APP_DOMAIN configured: allow all origins
  if (!appDomain) {
    return {
      ...baseHeaders,
      'Access-Control-Allow-Origin': '*',
    };
  }

  // Dynamic origin validation
  const origin = req.headers.get('Origin');

  if (origin && isAllowedOrigin(origin, appDomain)) {
    return {
      ...baseHeaders,
      'Access-Control-Allow-Origin': origin,
      'Vary': 'Origin',
    };
  }

  // Origin not allowed or missing: omit Access-Control-Allow-Origin
  // The browser will block the request (CORS failure)
  return {
    ...baseHeaders,
    'Vary': 'Origin',
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
