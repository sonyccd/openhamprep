import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GeocodingResult {
  id: string;
  latitude: number | null;
  longitude: number | null;
}

// Rate limit delay for Nominatim (1 request per second)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function geocodeAddress(address: string, city: string, state: string, zip: string): Promise<{ lat: number; lon: number } | null> {
  try {
    // Build the search query
    const query = encodeURIComponent(`${address}, ${city}, ${state} ${zip}, USA`);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=us`,
      {
        headers: {
          'User-Agent': 'OpenHamPrep/1.0 (exam session locator)',
        },
      }
    );

    if (!response.ok) {
      console.error(`Geocoding failed for ${address}: ${response.status}`);
      return null;
    }

    const results = await response.json();
    if (results && results.length > 0) {
      return {
        lat: parseFloat(results[0].lat),
        lon: parseFloat(results[0].lon),
      };
    }
    return null;
  } catch (error) {
    console.error(`Geocoding error for ${address}:`, error);
    return null;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get sessions without coordinates
    const { data: sessions, error: fetchError } = await supabase
      .from('exam_sessions')
      .select('id, address, city, state, zip')
      .is('latitude', null)
      .limit(50); // Process 50 at a time to stay within timeout

    if (fetchError) {
      throw new Error(`Failed to fetch sessions: ${fetchError.message}`);
    }

    if (!sessions || sessions.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No sessions need geocoding', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results: GeocodingResult[] = [];
    let successCount = 0;

    for (const session of sessions) {
      // Skip sessions without addresses
      if (!session.address || !session.city || !session.state) {
        continue;
      }

      // Geocode the address
      const coords = await geocodeAddress(
        session.address,
        session.city,
        session.state,
        session.zip
      );

      if (coords) {
        results.push({
          id: session.id,
          latitude: coords.lat,
          longitude: coords.lon,
        });
        successCount++;
      }

      // Rate limit: 1 request per second for Nominatim
      await delay(1100);
    }

    // Update sessions with coordinates
    for (const result of results) {
      const { error: updateError } = await supabase
        .from('exam_sessions')
        .update({ latitude: result.latitude, longitude: result.longitude })
        .eq('id', result.id);

      if (updateError) {
        console.error(`Failed to update session ${result.id}:`, updateError);
      }
    }

    // Check how many remain
    const { count } = await supabase
      .from('exam_sessions')
      .select('*', { count: 'exact', head: true })
      .is('latitude', null);

    return new Response(
      JSON.stringify({
        message: `Geocoded ${successCount} of ${sessions.length} sessions`,
        processed: successCount,
        remaining: count || 0,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Geocoding error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
