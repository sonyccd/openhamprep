import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getCorsHeaders } from "../_shared/constants.ts";
import {
  validateWebhookPayload,
  verifyServiceRoleAuth,
  buildPendoPayload,
  successResponse,
  skippedResponse,
  errorResponse,
  PENDO_TRACK_URL,
  type WebhookPayload,
} from "./logic.ts";

/**
 * Edge function triggered by database webhook when a new user signs up.
 * Sends user signup event to Pendo Track Events API to capture signups
 * even when adblockers prevent the frontend Pendo SDK from running.
 */
Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  const requestId = crypto.randomUUID().slice(0, 8);

  try {
    // Verify the caller is our database trigger, which sends the service role
    // key as a Bearer token. This prevents arbitrary clients from POSTing fake
    // signup events to Pendo. Skip-and-warn if the key is not configured (e.g.
    // local dev), mirroring the optional PENDO_INTEGRATION_KEY pattern below.
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SERVICE_ROLE_KEY) {
      console.warn(
        `[${requestId}] SUPABASE_SERVICE_ROLE_KEY not configured; skipping webhook auth verification`
      );
    } else {
      const authResult = verifyServiceRoleAuth(
        req.headers.get("Authorization"),
        SERVICE_ROLE_KEY
      );
      if (!authResult.authorized) {
        console.warn(`[${requestId}] Unauthorized webhook call: ${authResult.reason}`);
        return new Response(
          JSON.stringify(errorResponse("unauthorized", "Invalid or missing authorization")),
          {
            status: 401,
            headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
          }
        );
      }
    }

    const payload = (await req.json()) as WebhookPayload;

    // Validate webhook payload
    const validation = validateWebhookPayload(payload);
    if (!validation.valid) {
      console.log(`[${requestId}] Missing user data, skipping: ${validation.reason}`);
      return new Response(
        JSON.stringify(skippedResponse(validation.reason)),
        {
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        }
      );
    }

    const { userId, email } = validation;

    // Check for Pendo integration key
    const PENDO_INTEGRATION_KEY = Deno.env.get("PENDO_INTEGRATION_KEY");
    if (!PENDO_INTEGRATION_KEY) {
      console.warn(`[${requestId}] PENDO_INTEGRATION_KEY not configured`);
      return new Response(
        JSON.stringify(skippedResponse("pendo_key_not_configured")),
        {
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        }
      );
    }

    // Build and send Pendo payload
    const pendoPayload = buildPendoPayload(userId, email);

    const response = await fetch(PENDO_TRACK_URL, {
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
      return new Response(
        JSON.stringify(errorResponse("pendo_api_error", errorText, response.status)),
        {
          status: 502, // Bad Gateway - upstream service failed
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        }
      );
    }

    console.log(`[${requestId}] User signup tracked: ${userId}`);
    return new Response(JSON.stringify(successResponse(userId)), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(`[${requestId}] Error:`, error);
    return new Response(
      JSON.stringify(
        errorResponse("internal_error", error instanceof Error ? error.message : "Unknown error")
      ),
      {
        status: 500,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      }
    );
  }
});
