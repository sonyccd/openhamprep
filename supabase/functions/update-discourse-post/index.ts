import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  isValidUuid,
  isServiceRoleToken,
  DISCOURSE_URL,
  getCorsHeaders,
} from "../_shared/constants.ts";
import {
  extractTopicId,
  formatTopicBody,
  buildExternalIdUrl,
  isValidDiscourseUrl,
} from "./logic.ts";

/**
 * Update Discourse Post Edge Function
 *
 * Updates the explanation section of a Discourse topic when an admin
 * edits a question's explanation in the app. This enables bidirectional
 * sync between the app database and Discourse forum.
 *
 * Security: Requires admin role or service_role token.
 */

interface Question {
  id: string;  // UUID
  display_name: string;  // Human-readable ID (T1A01, etc.)
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
 * Look up a Discourse topic by its external_id (question UUID).
 * Returns topic ID and first post ID if found.
 */
async function getTopicByExternalId(
  apiKey: string,
  username: string,
  questionId: string
): Promise<{ topicId: number; postId: number } | null> {
  try {
    const response = await fetch(buildExternalIdUrl(DISCOURSE_URL, questionId), {
        headers: {
          "Api-Key": apiKey,
          "Api-Username": username,
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const firstPost = data.post_stream?.posts?.find(
      (p: { post_number: number }) => p.post_number === 1
    );

    if (!firstPost) {
      return null;
    }

    return { topicId: data.id, postId: firstPost.id };
  } catch {
    return null;
  }
}

serve(async (req) => {
  const requestId = crypto.randomUUID().slice(0, 8);
  const corsHeaders = getCorsHeaders();

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log(`[${requestId}] update-discourse-post: Request received`);

    // ==========================================================================
    // 1. AUTHENTICATE REQUEST
    // ==========================================================================

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.warn(`[${requestId}] Missing authorization header`);
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
      // Validate the user token using Supabase Auth
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);

      console.log(`[${requestId}] Auth result - user:`, user?.id, "error:", authError?.message);

      if (authError || !user) {
        console.error(`[${requestId}] Auth failed:`, authError?.message);
        return new Response(JSON.stringify({ error: "Invalid token" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Verify user has admin role by querying the user_roles table
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      console.log(`[${requestId}] Role check - data:`, roleData, "error:", roleError?.message);

      if (roleError) {
        console.error(`[${requestId}] Role check error:`, roleError);
        return new Response(JSON.stringify({ error: "Failed to check admin role: " + roleError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!roleData) {
        console.error(`[${requestId}] User is not admin:`, user.id);
        return new Response(JSON.stringify({ error: "Admin role required" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`[${requestId}] User ${user.id} authenticated as admin`);
    } else {
      console.log(`[${requestId}] Service role token detected`);
    }

    // ==========================================================================
    // 2. PARSE REQUEST
    // ==========================================================================

    const body: RequestBody = await req.json();
    const { questionId, explanation } = body;

    if (!questionId) {
      console.warn(`[${requestId}] Missing questionId`);
      return new Response(
        JSON.stringify({ error: "questionId is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`[${requestId}] Updating Discourse post for question ${questionId}, explanation length: ${explanation?.length || 0}`);

    // ==========================================================================
    // 3. FETCH QUESTION FROM DATABASE
    // ==========================================================================

    // Support both UUID and display_name lookups
    const lookupColumn = isValidUuid(questionId) ? "id" : "display_name";
    const { data: question, error: fetchError } = await supabase
      .from("questions")
      .select("id, display_name, question, options, correct_answer, explanation, forum_url")
      .eq(lookupColumn, lookupColumn === "display_name" ? questionId.toUpperCase() : questionId)
      .single();

    if (fetchError) {
      console.error(`[${requestId}] Failed to fetch question ${questionId}:`, fetchError);
      return new Response(
        JSON.stringify({ error: "Question not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!question.forum_url) {
      console.warn(`[${requestId}] Question ${questionId} has no forum_url`);
      return new Response(
        JSON.stringify({ error: "Question has no Discourse topic" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`[${requestId}] Question ${question.display_name} (${question.id}) forum_url: ${question.forum_url}`);

    // ==========================================================================
    // 4. LOOK UP TOPIC BY EXTERNAL_ID OR FORUM_URL
    // ==========================================================================

    const discourseApiKey = Deno.env.get("DISCOURSE_API_KEY");
    const discourseUsername = Deno.env.get("DISCOURSE_USERNAME");

    if (!discourseApiKey || !discourseUsername) {
      const errorMsg = "Discourse API credentials not configured";
      console.error(`[${requestId}] ${errorMsg}`);

      await supabase.from("questions").update({
        discourse_sync_status: "error",
        discourse_sync_at: new Date().toISOString(),
        discourse_sync_error: errorMsg,
      }).eq("id", question.id);

      return new Response(
        JSON.stringify({ error: errorMsg }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let topicId: number;
    let postId: number;

    // Try to look up topic by external_id first (primary method)
    console.log(`[${requestId}] Looking up topic by external_id: ${question.id}`);
    const externalIdResult = await getTopicByExternalId(
      discourseApiKey,
      discourseUsername,
      question.id
    );

    if (externalIdResult) {
      topicId = externalIdResult.topicId;
      postId = externalIdResult.postId;
      console.log(`[${requestId}] Found topic via external_id: topic=${topicId}, post=${postId}`);
    } else {
      // Fall back to forum_url extraction (for topics created before external_id was added)
      console.log(`[${requestId}] external_id lookup failed, falling back to forum_url`);

      const extractedTopicId = extractTopicId(question.forum_url);
      if (!extractedTopicId) {
        const errorMsg = `Could not find topic by external_id or extract topic ID from forum_url: ${question.forum_url}`;
        console.error(`[${requestId}] ${errorMsg}`);

        await supabase.from("questions").update({
          discourse_sync_status: "error",
          discourse_sync_at: new Date().toISOString(),
          discourse_sync_error: errorMsg,
        }).eq("id", question.id);

        return new Response(
          JSON.stringify({ error: errorMsg }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      console.log(`[${requestId}] Extracted topic ID from forum_url: ${extractedTopicId}`);

      // Fetch topic to get first post ID
      const topicResponse = await fetch(`${DISCOURSE_URL}/t/${extractedTopicId}.json`, {
        headers: {
          "Api-Key": discourseApiKey,
          "Api-Username": discourseUsername,
        },
      });

      if (!topicResponse.ok) {
        const errorMsg = `Failed to fetch topic ${extractedTopicId}: ${topicResponse.status}`;
        console.error(`[${requestId}] ${errorMsg}`);

        await supabase.from("questions").update({
          discourse_sync_status: "error",
          discourse_sync_at: new Date().toISOString(),
          discourse_sync_error: errorMsg,
        }).eq("id", question.id);

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
        const errorMsg = `Could not find first post in topic ${extractedTopicId}`;
        console.error(`[${requestId}] ${errorMsg}`);

        await supabase.from("questions").update({
          discourse_sync_status: "error",
          discourse_sync_at: new Date().toISOString(),
          discourse_sync_error: errorMsg,
        }).eq("id", question.id);

        return new Response(
          JSON.stringify({ error: errorMsg }),
          {
            status: 502,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      topicId = extractedTopicId;
      postId = firstPost.id;
      console.log(`[${requestId}] Found topic via forum_url: topic=${topicId}, post=${postId}`);
    }

    // ==========================================================================
    // 5. UPDATE THE POST IN DISCOURSE
    // ==========================================================================

    // Use formatTopicBody from logic.ts
    const newBody = formatTopicBody(
      question.question,
      question.options,
      question.correct_answer,
      explanation
    );

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
      console.error(`[${requestId}] ${errorMsg}`);

      await supabase.from("questions").update({
        discourse_sync_status: "error",
        discourse_sync_at: new Date().toISOString(),
        discourse_sync_error: errorMsg,
      }).eq("id", question.id);

      return new Response(
        JSON.stringify({ error: errorMsg }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`[${requestId}] Successfully updated Discourse post ${postId} for question ${question.display_name}`);

    // ==========================================================================
    // 6. UPDATE SYNC STATUS IN DATABASE
    // ==========================================================================

    const { error: statusError } = await supabase.from("questions").update({
      discourse_sync_status: "synced",
      discourse_sync_at: new Date().toISOString(),
      discourse_sync_error: null,
    }).eq("id", question.id);

    if (statusError) {
      console.error(`[${requestId}] Failed to update sync status:`, statusError);
      // Don't fail the request - the Discourse update succeeded
    } else {
      console.log(`[${requestId}] Updated sync status for question ${question.display_name}`);
    }

    // ==========================================================================
    // 7. RETURN SUCCESS
    // ==========================================================================

    return new Response(
      JSON.stringify({
        success: true,
        questionId: question.id,
        displayName: question.display_name,
        topicId,
        postId,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error(`[${requestId}] Update Discourse post error:`, error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    // Try to update the sync status to error
    // We need to extract questionId from the request if possible
    try {
      const bodyText = await req.clone().text();
      const body = JSON.parse(bodyText);
      if (body.questionId) {
        console.log(`[${requestId}] Updating sync status to error for question ${body.questionId}`);
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
      console.error(`[${requestId}] Failed to update sync status after error`);
    }

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
