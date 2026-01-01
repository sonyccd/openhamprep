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
