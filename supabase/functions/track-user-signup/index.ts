import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getCorsHeaders } from "../_shared/constants.ts";

/**
 * Webhook payload from the database trigger.
 * Sent when a new user is inserted into auth.users.
 */
interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: {
    id?: string;
    email?: string;
  };
}

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
    const payload = (await req.json()) as WebhookPayload;
    const { record } = payload;

    if (!record?.id || !record?.email) {
      console.log(`[${requestId}] Missing user data, skipping`);
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: "missing_user_data" }),
        {
          headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
        }
      );
    }

    const PENDO_INTEGRATION_KEY = Deno.env.get("PENDO_INTEGRATION_KEY");
    if (!PENDO_INTEGRATION_KEY) {
      console.warn(`[${requestId}] PENDO_INTEGRATION_KEY not configured`);
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: "pendo_key_not_configured" }),
        {
          headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
        }
      );
    }

    // Send to Pendo Track Events API
    // See: https://support.pendo.io/hc/en-us/articles/360032294291-Track-Events-API
    const pendoPayload = {
      type: "track",
      event: "user_signed_up",
      visitorId: record.id,
      // Using visitor ID as account ID for single-user accounts.
      // For multi-tenant apps, you would use an organization/team ID instead.
      accountId: record.id,
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
      console.error(
        `[${requestId}] Pendo API error: ${response.status} - ${errorText}`
      );
      // Return failure status so caller knows the event wasn't tracked
      return new Response(
        JSON.stringify({
          success: false,
          error: "pendo_api_error",
          status: response.status,
          message: errorText,
        }),
        {
          status: 502, // Bad Gateway - upstream service failed
          headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
        }
      );
    }

    console.log(`[${requestId}] User signup tracked: ${record.id}`);
    return new Response(JSON.stringify({ success: true, userId: record.id }), {
      headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(`[${requestId}] Error:`, error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "internal_error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
      }
    );
  }
});
