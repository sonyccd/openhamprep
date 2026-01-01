import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  corsHeaders,
  DISCOURSE_URL,
  isServiceRoleToken,
} from "../_shared/constants.ts";

/**
 * Migrate Discourse External IDs Edge Function
 *
 * One-time migration script to update existing Discourse topics with their
 * external_id set to the corresponding question UUID. This enables reliable
 * topic-to-question association without relying on title parsing.
 *
 * Actions:
 * - dry-run: Preview what would be updated without making changes
 * - migrate: Actually update topics in Discourse with external_id
 *
 * Security: Requires admin role or service_role token.
 */

// Rate Limiting Configuration
// Discourse has a default rate limit of 60 requests per minute for admin API keys.
// We use conservative delays to avoid hitting limits and to be a good API citizen.
// See: https://meta.discourse.org/t/global-rate-limits-and-டreams/78612
const RATE_LIMIT_DELAY_MS = 1000;  // 1 second between write operations (updates)
const CHECK_DELAY_MS = 200;  // 200ms between read operations (GET requests are less limited)

// Batch Configuration
const DEFAULT_BATCH_SIZE = 50;
const MAX_BATCH_SIZE = 100;

interface Question {
  id: string;  // UUID
  display_name: string;
  forum_url: string;
}

interface MigrationResult {
  questionId: string;
  displayName: string;
  topicId: number;
  status: "updated" | "skipped" | "error";
  reason?: string;
}

/**
 * Extract topic ID from a Discourse forum URL.
 */
function extractTopicId(forumUrl: string): number | null {
  const match = forumUrl.match(/\/t\/(?:[^/]+\/)?(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Check if a topic already has an external_id set.
 */
async function getTopicExternalId(
  apiKey: string,
  username: string,
  topicId: number
): Promise<{ exists: boolean; external_id: string | null; error?: string }> {
  try {
    const response = await fetch(`${DISCOURSE_URL}/t/${topicId}.json`, {
      headers: {
        "Api-Key": apiKey,
        "Api-Username": username,
      },
    });

    if (!response.ok) {
      return { exists: false, external_id: null, error: `HTTP ${response.status}` };
    }

    const data = await response.json();
    return { exists: true, external_id: data.external_id || null };
  } catch (error) {
    return {
      exists: false,
      external_id: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Update a topic's external_id in Discourse.
 */
async function updateTopicExternalId(
  apiKey: string,
  username: string,
  topicId: number,
  externalId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${DISCOURSE_URL}/t/${topicId}.json`, {
      method: "PUT",
      headers: {
        "Api-Key": apiKey,
        "Api-Username": username,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        external_id: externalId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

serve(async (req) => {
  const requestId = crypto.randomUUID().slice(0, 8);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log(`[${requestId}] migrate-discourse-external-ids: Request received`);

    // =========================================================================
    // 1. AUTHENTICATE REQUEST
    // =========================================================================

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

    const isServiceRole = isServiceRoleToken(token);

    if (!isServiceRole) {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser(token);

      if (authError || !user) {
        console.error(`[${requestId}] Auth failed:`, authError?.message);
        return new Response(JSON.stringify({ error: "Invalid token" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (roleError) {
        console.error(`[${requestId}] Role check error:`, roleError);
        return new Response(
          JSON.stringify({
            error: "Failed to check admin role: " + roleError.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
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

    // =========================================================================
    // 2. PARSE REQUEST
    // =========================================================================

    const body = await req.json().catch(() => ({}));
    const action = typeof body.action === "string" ? body.action : "dry-run";
    const rawBatchSize = typeof body.batchSize === "number" ? body.batchSize : DEFAULT_BATCH_SIZE;
    const batchSize = Math.min(Math.max(1, rawBatchSize), MAX_BATCH_SIZE);

    if (action !== "dry-run" && action !== "migrate") {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Use "dry-run" or "migrate"' }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`[${requestId}] Action: ${action}, Batch size: ${batchSize}`);

    // =========================================================================
    // 3. GET DISCOURSE CONFIGURATION
    // =========================================================================

    const discourseApiKey = Deno.env.get("DISCOURSE_API_KEY");
    const discourseUsername = Deno.env.get("DISCOURSE_USERNAME");

    if (!discourseApiKey || !discourseUsername) {
      return new Response(
        JSON.stringify({ error: "Discourse API credentials not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // =========================================================================
    // 4. FETCH QUESTIONS WITH FORUM_URL
    // =========================================================================

    console.log(`[${requestId}] Fetching questions with forum_url...`);

    const { data: questions, error: dbError } = await supabase
      .from("questions")
      .select("id, display_name, forum_url")
      .not("forum_url", "is", null)
      .order("display_name");

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`);
    }

    const questionsList = (questions || []) as Question[];
    console.log(`[${requestId}] Found ${questionsList.length} questions with forum_url`);

    if (questionsList.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No questions with forum_url found",
          summary: { total: 0, needsMigration: 0, alreadyMigrated: 0 },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // =========================================================================
    // 5. CHECK WHICH TOPICS NEED MIGRATION
    // =========================================================================

    console.log(`[${requestId}] Checking topics for existing external_id...`);

    const needsMigration: Question[] = [];
    const alreadyMigrated: Question[] = [];
    const errors: Array<{ question: Question; error: string }> = [];

    // Process in batches with rate limiting
    for (let i = 0; i < questionsList.length; i++) {
      const question = questionsList[i];
      const topicId = extractTopicId(question.forum_url);

      if (!topicId) {
        errors.push({ question, error: "Could not extract topic ID from forum_url" });
        continue;
      }

      const result = await getTopicExternalId(discourseApiKey, discourseUsername, topicId);

      if (!result.exists) {
        errors.push({ question, error: result.error || "Topic not found" });
      } else if (result.external_id === question.id) {
        alreadyMigrated.push(question);
      } else if (result.external_id) {
        // Has a different external_id - skip to avoid conflicts
        errors.push({
          question,
          error: `Topic already has different external_id: ${result.external_id}`,
        });
      } else {
        needsMigration.push(question);
      }

      // Rate limiting for read operations
      if (i < questionsList.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, CHECK_DELAY_MS));
      }
    }

    console.log(
      `[${requestId}] Migration status: ` +
        `${needsMigration.length} need migration, ` +
        `${alreadyMigrated.length} already migrated, ` +
        `${errors.length} errors`
    );

    // =========================================================================
    // 6. DRY-RUN: RETURN PREVIEW
    // =========================================================================

    if (action === "dry-run") {
      return new Response(
        JSON.stringify({
          success: true,
          dryRun: true,
          summary: {
            total: questionsList.length,
            needsMigration: needsMigration.length,
            alreadyMigrated: alreadyMigrated.length,
            errors: errors.length,
          },
          needsMigration: needsMigration.slice(0, 50).map((q) => ({
            displayName: q.display_name,
            questionId: q.id,
          })),
          alreadyMigrated: alreadyMigrated.slice(0, 20).map((q) => q.display_name),
          errors: errors.slice(0, 20).map((e) => ({
            displayName: e.question.display_name,
            error: e.error,
          })),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // =========================================================================
    // 7. MIGRATE: UPDATE TOPICS
    // =========================================================================

    console.log(`[${requestId}] Starting migration...`);

    const results: MigrationResult[] = [];
    let updated = 0;
    let migrationErrors = 0;

    // Process only up to batchSize
    const batch = needsMigration.slice(0, batchSize);
    const remaining = needsMigration.length - batch.length;

    for (const question of batch) {
      const topicId = extractTopicId(question.forum_url)!;

      // Re-check external_id before updating to handle race conditions
      // (e.g., if another process set external_id between check and update)
      const currentState = await getTopicExternalId(
        discourseApiKey,
        discourseUsername,
        topicId
      );

      if (currentState.external_id && currentState.external_id !== question.id) {
        // Topic's external_id was set by another process to a different value
        results.push({
          questionId: question.id,
          displayName: question.display_name,
          topicId,
          status: "error",
          reason: `Topic external_id changed during migration (now: ${currentState.external_id})`,
        });
        migrationErrors++;
        console.warn(
          `[${requestId}] Skipping ${question.display_name}: external_id changed to ${currentState.external_id}`
        );
        await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY_MS));
        continue;
      }

      if (currentState.external_id === question.id) {
        // Already migrated (possibly by concurrent process) - skip but count as success
        results.push({
          questionId: question.id,
          displayName: question.display_name,
          topicId,
          status: "skipped",
          reason: "Already has correct external_id",
        });
        console.log(`[${requestId}] ${question.display_name} already migrated, skipping`);
        await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY_MS));
        continue;
      }

      console.log(`[${requestId}] Updating topic ${topicId} with external_id ${question.id}...`);

      const updateResult = await updateTopicExternalId(
        discourseApiKey,
        discourseUsername,
        topicId,
        question.id
      );

      if (updateResult.success) {
        results.push({
          questionId: question.id,
          displayName: question.display_name,
          topicId,
          status: "updated",
        });
        updated++;
        console.log(`[${requestId}] Updated ${question.display_name}`);
      } else {
        results.push({
          questionId: question.id,
          displayName: question.display_name,
          topicId,
          status: "error",
          reason: updateResult.error,
        });
        migrationErrors++;
        console.error(`[${requestId}] Failed to update ${question.display_name}: ${updateResult.error}`);
      }

      // Rate limiting
      await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY_MS));
    }

    console.log(
      `[${requestId}] Migration batch complete. Updated: ${updated}, Errors: ${migrationErrors}, Remaining: ${remaining}`
    );

    return new Response(
      JSON.stringify({
        success: true,
        complete: remaining === 0,
        summary: {
          total: questionsList.length,
          needsMigration: needsMigration.length,
          alreadyMigrated: alreadyMigrated.length,
          checkErrors: errors.length,
        },
        batch: {
          processed: batch.length,
          updated,
          errors: migrationErrors,
          remaining,
        },
        results,
        nextAction: remaining > 0
          ? `Call again to process next batch of ${Math.min(remaining, batchSize)} topics`
          : null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error(`[${requestId}] Error:`, error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
