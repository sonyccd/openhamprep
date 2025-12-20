import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Discourse Webhook Handler for Explanation Sync
 *
 * Receives webhook events from Discourse when posts are edited.
 * If the first post of a question topic is edited and the explanation
 * section changed, updates the explanation in the questions table.
 *
 * Security: Uses HMAC-SHA256 signature verification with shared secret.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-discourse-event-type, x-discourse-event, x-discourse-event-signature, x-discourse-instance",
};

// Configuration
const DISCOURSE_URL = "https://forum.openhamprep.com";

// Question ID pattern: T1A01, G2B03, E3C12, etc.
const QUESTION_ID_PATTERN = /^([TGE]\d[A-Z]\d{2})\s*-/;

// =============================================================================
// SIGNATURE VERIFICATION
// =============================================================================

/**
 * Verify the Discourse webhook signature using HMAC-SHA256.
 * Discourse sends the signature as "sha256=HEXDIGEST" in the header.
 */
async function verifyDiscourseSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    // Discourse sends signature as "sha256=HEXDIGEST"
    if (!signature.startsWith("sha256=")) {
      console.error("Invalid signature format: missing sha256= prefix");
      return false;
    }

    const providedDigest = signature.slice(7); // Remove "sha256=" prefix

    // Create HMAC-SHA256 of the payload
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(payload)
    );

    // Convert to hex string
    const computedDigest = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Constant-time comparison to prevent timing attacks
    if (providedDigest.length !== computedDigest.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < providedDigest.length; i++) {
      result |= providedDigest.charCodeAt(i) ^ computedDigest.charCodeAt(i);
    }

    return result === 0;
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}

// =============================================================================
// EXPLANATION PARSING
// =============================================================================

/**
 * Extract the explanation text from the Discourse post markdown.
 *
 * Expected format (created by sync-discourse-topics):
 * ## Question
 * {question text}
 *
 * ## Answer Options
 * ...
 *
 * ## Explanation
 * {explanation text}
 *
 * ---
 * _This topic was automatically created..._
 *
 * @returns The explanation text, or null if not found/parseable
 */
function parseExplanationFromPost(rawContent: string): string | null {
  // Handle null/undefined input
  if (!rawContent) {
    return null;
  }

  // Find the "## Explanation" section - capture until --- or next ## or end
  const explanationMatch = rawContent.match(
    /##\s*Explanation\s*\n([\s\S]*?)(?:\n---|\n##|$)/i
  );

  if (!explanationMatch) {
    return null;
  }

  let explanation = explanationMatch[1].trim();

  // Handle the placeholder text that means "no explanation"
  if (
    explanation === "_No explanation yet. Help improve this by contributing below!_"
  ) {
    return null;
  }

  // Clean up any trailing whitespace or empty lines
  explanation = explanation.replace(/\s+$/, "");

  // Return null for empty or whitespace-only content, or if it's just "---"
  if (!explanation || explanation === "---") {
    return null;
  }

  return explanation;
}

/**
 * Extract question ID from topic title.
 * Format: "T1A01 - Question text..."
 */
function extractQuestionIdFromTitle(title: string): string | null {
  // Handle null/undefined input
  if (!title) {
    return null;
  }

  const match = title.match(QUESTION_ID_PATTERN);
  return match ? match[1] : null;
}

// =============================================================================
// TYPES
// =============================================================================

interface DiscoursePost {
  id: number;
  topic_id: number;
  post_number: number;
  raw: string;
  cooked: string;
  username: string;
  created_at: string;
  updated_at: string;
}

interface DiscourseWebhookPayload {
  post: DiscoursePost;
}

interface DiscourseTopic {
  id: number;
  title: string;
  slug: string;
}

// =============================================================================
// MAIN HANDLER
// =============================================================================

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Only accept POST requests
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // =========================================================================
    // 1. CHECK EVENT TYPE
    // =========================================================================

    const eventType = req.headers.get("X-Discourse-Event-Type");
    const eventName = req.headers.get("X-Discourse-Event");
    const signature = req.headers.get("X-Discourse-Event-Signature");
    const discourseInstance = req.headers.get("X-Discourse-Instance");

    console.log(
      `Received webhook: type=${eventType}, event=${eventName}, instance=${discourseInstance}`
    );

    // Only process post events
    if (eventType !== "post") {
      console.log(`Ignoring non-post event: ${eventType}`);
      return new Response(
        JSON.stringify({ status: "ignored", reason: "Not a post event" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Only process post_edited events
    if (eventName !== "post_edited") {
      console.log(`Ignoring event: ${eventName}`);
      return new Response(
        JSON.stringify({ status: "ignored", reason: "Not a post_edited event" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // =========================================================================
    // 2. VERIFY SIGNATURE
    // =========================================================================

    const webhookSecret = Deno.env.get("DISCOURSE_WEBHOOK_SECRET");
    if (!webhookSecret) {
      console.error("DISCOURSE_WEBHOOK_SECRET not configured");
      return new Response(
        JSON.stringify({ error: "Webhook secret not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!signature) {
      console.error("Missing signature header");
      return new Response(JSON.stringify({ error: "Missing signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Read the raw body for signature verification
    const rawBody = await req.text();

    const isValid = await verifyDiscourseSignature(
      rawBody,
      signature,
      webhookSecret
    );
    if (!isValid) {
      console.error("Invalid webhook signature");
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Signature verified successfully");

    // =========================================================================
    // 3. PARSE WEBHOOK PAYLOAD
    // =========================================================================

    const payload: DiscourseWebhookPayload = JSON.parse(rawBody);
    const { post } = payload;

    // Only process edits to the first post (OP) of a topic
    if (post.post_number !== 1) {
      console.log(`Ignoring edit to post #${post.post_number} (not the OP)`);
      return new Response(
        JSON.stringify({ status: "ignored", reason: "Not the first post" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(
      `Processing edit to topic ${post.topic_id}, post ${post.id} by ${post.username}`
    );

    // =========================================================================
    // 4. GET QUESTION ID
    // =========================================================================

    // Initialize Supabase client early - we need it for both lookup methods
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let questionId: string | null = null;

    // Method 1: Look up question by forum_url in database (works locally without Discourse API)
    const expectedForumUrl = `${DISCOURSE_URL}/t/%/${post.topic_id}`;
    const { data: questionByUrl } = await supabase
      .from("questions")
      .select("id")
      .like("forum_url", `%/${post.topic_id}`)
      .single();

    if (questionByUrl) {
      questionId = questionByUrl.id;
      console.log(`Found question ${questionId} by forum_url lookup`);
    } else {
      // Method 2: Fetch topic title from Discourse API (production fallback)
      const discourseApiKey = Deno.env.get("DISCOURSE_API_KEY");
      const discourseUsername = Deno.env.get("DISCOURSE_USERNAME");

      if (!discourseApiKey || !discourseUsername) {
        console.error("Discourse API credentials not configured and question not found by forum_url");
        return new Response(
          JSON.stringify({ error: "Cannot determine question ID" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const topicResponse = await fetch(
        `${DISCOURSE_URL}/t/${post.topic_id}.json`,
        {
          headers: {
            "Api-Key": discourseApiKey,
            "Api-Username": discourseUsername,
          },
        }
      );

      if (!topicResponse.ok) {
        console.error(`Failed to fetch topic: ${topicResponse.status}`);
        return new Response(
          JSON.stringify({ error: "Failed to fetch topic from Discourse" }),
          {
            status: 502,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const topicData: DiscourseTopic = await topicResponse.json();
      questionId = extractQuestionIdFromTitle(topicData.title);

      if (!questionId) {
        console.log(
          `Topic title does not match question format: "${topicData.title}"`
        );
        return new Response(
          JSON.stringify({
            status: "ignored",
            reason: "Topic is not a question topic",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Matched topic to question: ${questionId} via Discourse API`);
    }

    // =========================================================================
    // 5. PARSE EXPLANATION FROM POST
    // =========================================================================

    const newExplanation = parseExplanationFromPost(post.raw);

    if (newExplanation === null) {
      // Can't parse explanation - keep existing, log warning, return success
      console.warn(
        `Could not parse explanation section for question ${questionId}. ` +
          `Keeping existing explanation. Post content may have been modified ` +
          `to remove or change the expected format.`
      );
      return new Response(
        JSON.stringify({
          status: "skipped",
          reason: "Could not parse explanation section",
          questionId,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Parsed explanation (${newExplanation.length} chars)`);

    // =========================================================================
    // 6. CHECK IF EXPLANATION CHANGED
    // =========================================================================

    // Get current explanation to compare
    const { data: question, error: fetchError } = await supabase
      .from("questions")
      .select("explanation")
      .eq("id", questionId)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        // Question not found
        console.error(`Question not found in database: ${questionId}`);
        return new Response(
          JSON.stringify({ error: "Question not found", questionId }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      throw fetchError;
    }

    const previousExplanation = question.explanation;

    // Skip if explanation hasn't changed
    if (previousExplanation === newExplanation) {
      console.log("Explanation unchanged, marking as synced");
      // Still update sync status to show we verified it's in sync
      await supabase
        .from("questions")
        .update({
          discourse_sync_status: "synced",
          discourse_sync_at: new Date().toISOString(),
          discourse_sync_error: null,
        })
        .eq("id", questionId);
      return new Response(
        JSON.stringify({ status: "unchanged", questionId }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(
      `Explanation changed for ${questionId}: ` +
        `${previousExplanation?.length || 0} -> ${newExplanation.length} chars`
    );

    // =========================================================================
    // 7. UPDATE THE QUESTION
    // =========================================================================

    const { error: updateError } = await supabase
      .from("questions")
      .update({
        explanation: newExplanation,
        discourse_sync_status: "synced",
        discourse_sync_at: new Date().toISOString(),
        discourse_sync_error: null,
      })
      .eq("id", questionId);

    if (updateError) {
      console.error("Failed to update question:", updateError);
      // Try to record the error in sync status
      await supabase
        .from("questions")
        .update({
          discourse_sync_status: "error",
          discourse_sync_at: new Date().toISOString(),
          discourse_sync_error: updateError.message,
        })
        .eq("id", questionId);
      throw updateError;
    }

    console.log(`Successfully updated explanation for ${questionId}`);

    // =========================================================================
    // 7b. EXTRACT LINKS FROM NEW EXPLANATION
    // =========================================================================

    // Extract and unfurl links from the updated explanation
    try {
      const linkResponse = await fetch(
        `${supabaseUrl}/functions/v1/manage-question-links`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            action: "extract-from-explanation",
            questionId,
          }),
        }
      );

      if (linkResponse.ok) {
        const linkResult = await linkResponse.json();
        console.log(
          `Extracted ${linkResult.links?.length || 0} links from explanation ` +
            `(${linkResult.newCount} new, ${linkResult.keptCount} kept)`
        );
      } else {
        console.warn(
          `Failed to extract links: ${linkResponse.status} ${linkResponse.statusText}`
        );
      }
    } catch (linkError) {
      // Non-fatal - log warning but don't fail the webhook
      console.warn("Failed to extract links from explanation:", linkError);
    }

    // =========================================================================
    // 8. RETURN SUCCESS
    // =========================================================================

    return new Response(
      JSON.stringify({
        status: "updated",
        questionId,
        topicId: post.topic_id,
        explanationLength: newExplanation.length,
        previousLength: previousExplanation?.length || 0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Webhook handler error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
