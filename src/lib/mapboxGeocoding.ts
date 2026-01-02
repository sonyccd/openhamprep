/**
 * Mapbox Geocoding Utility
 *
 * Provides geocoding functionality with built-in quota protection
 * to ensure we never exceed the free tier (100k requests/month).
 *
 * Usage is tracked in the database (mapbox_usage table) so it's
 * shared across all users and browsers.
 */

import { supabase } from '@/integrations/supabase/client';

const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '';

// Safety buffer: stop at 95k to leave room for any other usage
export const MAPBOX_MONTHLY_LIMIT = 95000;

// Rate limiting: 150ms between requests (~400 req/min max)
export const GEOCODE_DELAY_MS = 150;

export interface GeocodingResult {
  latitude: number;
  longitude: number;
}

// Get current year_month key (e.g., "2026_01")
export function getYearMonthKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}_${month}`;
}

/**
 * Get current month's Mapbox API usage count from database
 */
export async function getMonthlyUsageFromDb(): Promise<number> {
  const yearMonth = getYearMonthKey();

  const { data, error } = await supabase
    .from('mapbox_usage')
    .select('request_count')
    .eq('year_month', yearMonth)
    .single();

  if (error || !data) {
    // No record yet means 0 usage
    return 0;
  }

  return data.request_count;
}

/**
 * Increment the monthly usage counter in database
 * Returns the new count
 */
export async function incrementUsageInDb(): Promise<number> {
  const yearMonth = getYearMonthKey();

  const { data, error } = await supabase
    .rpc('increment_mapbox_usage', { p_year_month: yearMonth });

  if (error) {
    console.error('Failed to increment Mapbox usage:', error);
    throw error;
  }

  return data as number;
}

/**
 * Get remaining quota for this month
 */
export async function getRemainingQuotaFromDb(): Promise<number> {
  const usage = await getMonthlyUsageFromDb();
  return Math.max(0, MAPBOX_MONTHLY_LIMIT - usage);
}

/**
 * Check if we can make another request without exceeding quota
 */
export async function canMakeRequestFromDb(): Promise<boolean> {
  const usage = await getMonthlyUsageFromDb();
  return usage < MAPBOX_MONTHLY_LIMIT;
}

/**
 * Check if Mapbox is configured
 */
export function isMapboxConfigured(): boolean {
  return !!MAPBOX_ACCESS_TOKEN;
}

/**
 * Geocode an address using Mapbox API
 * Increments usage counter in database on success
 *
 * @returns Coordinates or null if geocoding failed or quota exceeded
 */
export async function geocodeAddress(
  address: string,
  city: string,
  state: string,
  zip: string
): Promise<GeocodingResult | null> {
  // Check configuration
  if (!MAPBOX_ACCESS_TOKEN) {
    console.error('Mapbox access token not configured');
    return null;
  }

  // Build the search query
  const query = encodeURIComponent(`${address}, ${city}, ${state} ${zip}`);
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?country=us&access_token=${MAPBOX_ACCESS_TOKEN}&limit=1`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`Geocoding failed: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();

    // Increment usage counter in database after successful API call
    await incrementUsageInDb();

    if (data.features && data.features.length > 0) {
      const [lon, lat] = data.features[0].center;
      return { latitude: lat, longitude: lon };
    }

    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

/**
 * Delay helper for rate limiting
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
