/**
 * Shared constants for Supabase Edge Functions
 */

// Discourse API configuration
export const DISCOURSE_URL = 'https://forum.openhamprep.com';
export const PAGINATION_DELAY_MS = 200;
export const MAX_PAGINATION_PAGES = 100;
export const MAX_TITLE_LENGTH = 250;

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
