import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getCorsHeaders } from "../_shared/constants.ts";

/**
 * Edge function triggered by database webhook when a new user signs up.
 * Sends user signup event to Pendo Track Events API to capture signups
 * even when adblockers prevent the frontend Pendo SDK from running.
 */
Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders() });
  }

  const requestId = crypto.randomUUID().slice(0, 8);

  try {
    const payload = await req.json();
    const { record } = payload; // Database webhook sends { type, table, record, ... }

    if (!record?.id || !record?.email) {
      console.log(`[${requestId}] Missing user data, skipping`);
      return new Response(JSON.stringify({ success: true, skipped: true }), {
        headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
      });
    }

    const PENDO_INTEGRATION_KEY = Deno.env.get("PENDO_INTEGRATION_KEY");
    if (!PENDO_INTEGRATION_KEY) {
      console.warn(`[${requestId}] PENDO_INTEGRATION_KEY not configured`);
      return new Response(JSON.stringify({ success: true, skipped: true }), {
        headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
      });
    }

    // Send to Pendo Track Events API
    // See: https://support.pendo.io/hc/en-us/articles/360032294291-Track-Events-API
    const pendoPayload = {
      type: "track",
      event: "user_signed_up",
      visitorId: record.id,
      accountId: record.id, // Using visitor ID as account ID for single-user accounts
      timestamp: new Date().toISOString(),
      properties: {
        email: record.email,
        source: "server_side",
      },
    };

    const response = await fetch("https://app.pendo.io/data/track", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-pendo-integration-key": PENDO_INTEGRATION_KEY,
      },
      body: JSON.stringify(pendoPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[${requestId}] Pendo API error: ${response.status} - ${errorText}`);
    } else {
      console.log(`[${requestId}] User signup tracked: ${record.id}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(`[${requestId}] Error:`, error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
    });
  }
});
