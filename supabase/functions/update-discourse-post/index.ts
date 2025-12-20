import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Update Discourse Post Edge Function
 *
 * Updates the explanation section of a Discourse topic when an admin
 * edits a question's explanation in the app. This enables bidirectional
 * sync between the app database and Discourse forum.
 *
 * Security: Requires admin role or service_role token.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const DISCOURSE_URL = "https://forum.openhamprep.com";

interface Question {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string | null;
  forum_url: string | null;
}

interface RequestBody {
  questionId: string;
  explanation: string;
}

/**
 * Decode a JWT and extract the payload without verifying the signature.
 * The signature is already verified by Supabase's API gateway.
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payload = parts[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const decoded = atob(padded);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

/**
 * Check if a JWT token has the service_role claim.
 */
function isServiceRoleToken(token: string): boolean {
  const payload = decodeJwtPayload(token);
  return payload?.role === "service_role";
}

/**
 * Extract topic ID from a Discourse forum URL.
 * Handles formats like:
 * - https://forum.openhamprep.com/t/topic-slug/123
 * - https://forum.openhamprep.com/t/123
 */
function extractTopicId(forumUrl: string): number | null {
  // Match /t/anything/123 or /t/123
  const match = forumUrl.match(/\/t\/(?:[^/]+\/)?(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Format the topic body to match sync-discourse-topics format.
 * This ensures the webhook can correctly parse explanations back.
 */
function formatTopicBody(question: Question, newExplanation: string): string {
  const letters = ["A", "B", "C", "D"];
  const correctLetter = letters[question.correct_answer];

  const optionsText = question.options
    .map((opt, i) => `- **${letters[i]})** ${opt}`)
    .join("\n");

  const explanationText = newExplanation
    ? newExplanation
    : "_No explanation yet. Help improve this by contributing below!_";

  return `## Question
${question.question}

## Answer Options
${optionsText}

**Correct Answer: ${correctLetter}**

---

## Explanation
${explanationText}

---
_This topic was automatically created to facilitate community discussion about this exam question. Feel free to share study tips, memory tricks, or additional explanations!_`;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ==========================================================================
    // 1. AUTHENTICATE REQUEST
    // ==========================================================================

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check for service role token first
    const isServiceRole = isServiceRoleToken(token);

    if (!isServiceRole) {
      // Verify user is admin
      const payload = decodeJwtPayload(token);
      const userId = payload?.sub as string;

      console.log("Decoded JWT payload:", JSON.stringify(payload));
      console.log("User ID from token:", userId);

      if (!userId) {
        console.error("No user ID in token");
        return new Response(JSON.stringify({ error: "Invalid token" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: hasRole, error: roleError } = await supabase.rpc("has_role", {
        _user_id: userId,
        _role: "admin",
      });

      console.log("has_role result:", hasRole, "error:", roleError);

      if (roleError) {
        console.error("has_role RPC error:", roleError);
        return new Response(JSON.stringify({ error: "Failed to check admin role: " + roleError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!hasRole) {
        console.error("User is not admin:", userId);
        return new Response(JSON.stringify({ error: "Admin role required" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ==========================================================================
    // 2. PARSE REQUEST
    // ==========================================================================

    const body: RequestBody = await req.json();
    const { questionId, explanation } = body;

    if (!questionId) {
      return new Response(
        JSON.stringify({ error: "questionId is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Updating Discourse post for question ${questionId}`);

    // ==========================================================================
    // 3. FETCH QUESTION FROM DATABASE
    // ==========================================================================

    const { data: question, error: fetchError } = await supabase
      .from("questions")
      .select("id, question, options, correct_answer, explanation, forum_url")
      .eq("id", questionId)
      .single();

    if (fetchError) {
      console.error("Failed to fetch question:", fetchError);
      return new Response(
        JSON.stringify({ error: "Question not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!question.forum_url) {
      return new Response(
        JSON.stringify({ error: "Question has no Discourse topic" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ==========================================================================
    // 4. EXTRACT TOPIC ID AND GET FIRST POST ID
    // ==========================================================================

    const topicId = extractTopicId(question.forum_url);
    if (!topicId) {
      const errorMsg = `Could not extract topic ID from forum_url: ${question.forum_url}`;
      console.error(errorMsg);

      await supabase.from("questions").update({
        discourse_sync_status: "error",
        discourse_sync_at: new Date().toISOString(),
        discourse_sync_error: errorMsg,
      }).eq("id", questionId);

      return new Response(
        JSON.stringify({ error: errorMsg }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const discourseApiKey = Deno.env.get("DISCOURSE_API_KEY");
    const discourseUsername = Deno.env.get("DISCOURSE_USERNAME");

    if (!discourseApiKey || !discourseUsername) {
      const errorMsg = "Discourse API credentials not configured";
      console.error(errorMsg);

      await supabase.from("questions").update({
        discourse_sync_status: "error",
        discourse_sync_at: new Date().toISOString(),
        discourse_sync_error: errorMsg,
      }).eq("id", questionId);

      return new Response(
        JSON.stringify({ error: errorMsg }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Fetch topic to get first post ID
    const topicResponse = await fetch(`${DISCOURSE_URL}/t/${topicId}.json`, {
      headers: {
        "Api-Key": discourseApiKey,
        "Api-Username": discourseUsername,
      },
    });

    if (!topicResponse.ok) {
      const errorMsg = `Failed to fetch topic ${topicId}: ${topicResponse.status}`;
      console.error(errorMsg);

      await supabase.from("questions").update({
        discourse_sync_status: "error",
        discourse_sync_at: new Date().toISOString(),
        discourse_sync_error: errorMsg,
      }).eq("id", questionId);

      return new Response(
        JSON.stringify({ error: errorMsg }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const topicData = await topicResponse.json();

    // The first post is the OP
    const firstPost = topicData.post_stream?.posts?.find(
      (p: { post_number: number }) => p.post_number === 1
    );

    if (!firstPost) {
      const errorMsg = `Could not find first post in topic ${topicId}`;
      console.error(errorMsg);

      await supabase.from("questions").update({
        discourse_sync_status: "error",
        discourse_sync_at: new Date().toISOString(),
        discourse_sync_error: errorMsg,
      }).eq("id", questionId);

      return new Response(
        JSON.stringify({ error: errorMsg }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const postId = firstPost.id;
    console.log(`Found first post ID: ${postId} for topic ${topicId}`);

    // ==========================================================================
    // 5. UPDATE THE POST IN DISCOURSE
    // ==========================================================================

    const newBody = formatTopicBody(question as Question, explanation);

    const updateResponse = await fetch(`${DISCOURSE_URL}/posts/${postId}.json`, {
      method: "PUT",
      headers: {
        "Api-Key": discourseApiKey,
        "Api-Username": discourseUsername,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        post: {
          raw: newBody,
        },
      }),
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      const errorMsg = `Discourse API error: ${updateResponse.status} - ${errorText}`;
      console.error(errorMsg);

      await supabase.from("questions").update({
        discourse_sync_status: "error",
        discourse_sync_at: new Date().toISOString(),
        discourse_sync_error: errorMsg,
      }).eq("id", questionId);

      return new Response(
        JSON.stringify({ error: errorMsg }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Successfully updated Discourse post ${postId} for question ${questionId}`);

    // ==========================================================================
    // 6. UPDATE SYNC STATUS IN DATABASE
    // ==========================================================================

    const { error: statusError } = await supabase.from("questions").update({
      discourse_sync_status: "synced",
      discourse_sync_at: new Date().toISOString(),
      discourse_sync_error: null,
    }).eq("id", questionId);

    if (statusError) {
      console.error("Failed to update sync status:", statusError);
      // Don't fail the request - the Discourse update succeeded
    }

    // ==========================================================================
    // 7. RETURN SUCCESS
    // ==========================================================================

    return new Response(
      JSON.stringify({
        success: true,
        questionId,
        topicId,
        postId,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Update Discourse post error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    // Try to update the sync status to error
    // We need to extract questionId from the request if possible
    try {
      const bodyText = await req.clone().text();
      const body = JSON.parse(bodyText);
      if (body.questionId) {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        await supabase.from("questions").update({
          discourse_sync_status: "error",
          discourse_sync_at: new Date().toISOString(),
          discourse_sync_error: errorMessage,
        }).eq("id", body.questionId);
      }
    } catch {
      // Ignore errors updating status - just log the main error
      console.error("Failed to update sync status after error");
    }

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
