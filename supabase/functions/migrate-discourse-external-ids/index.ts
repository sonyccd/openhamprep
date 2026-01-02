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
 * Migration script to update existing Discourse topics with their
 * external_id set to the corresponding question UUID.
 *
 * Uses discourse_sync_status to track progress:
 * - NULL: Needs external_id migration (pending)
 * - 'synced': Successfully migrated (external_id set in Discourse)
 * - 'error': Migration failed
 *
 * Actions:
 * - prepare: Set sync status to NULL for all questions with forum_url
 * - dry-run: Count how many questions need migration
 * - migrate: Update topics in Discourse with external_id, mark synced immediately
 *
 * Security: Requires admin role or service_role token.
 *
 * WARNING: Do not run multiple migrate actions concurrently - they will
 * process the same pending questions and waste API calls.
 *
 * Expected runtime: ~1 second per question (sequential processing to respect
 * rate limits). A batch of 100 questions takes ~2 minutes.
 */

// Batch size - how many to fetch per invocation
// Keep MAX at 100 to stay within Edge Function timeout (60s default)
const DEFAULT_BATCH_SIZE = 100;
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
  status: "updated" | "error";
  reason?: string;
}

/**
 * Validate that a forum_url is a trusted Discourse URL.
 * Prevents SSRF attacks where malicious forum_url could point to internal servers.
 */
function isValidDiscourseUrl(forumUrl: string): boolean {
  if (!forumUrl) return false;
  return forumUrl.startsWith(DISCOURSE_URL);
}

/**
 * Extract topic ID from a Discourse forum URL.
 * Returns null if URL is not from our Discourse instance (security check).
 */
function extractTopicId(forumUrl: string): number | null {
  // Security: Only process URLs from our Discourse instance
  if (!isValidDiscourseUrl(forumUrl)) {
    return null;
  }
  const match = forumUrl.match(/\/t\/(?:[^/]+\/)?(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Update a topic's external_id in Discourse with retry on rate limit.
 */
async function updateTopicExternalIdWithRetry(
  apiKey: string,
  username: string,
  topicId: number,
  externalId: string,
  requestId: string,
  displayName: string
): Promise<{ success: boolean; error?: string }> {
  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
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

      if (response.status === 429) {
        // Rate limited - parse wait time and retry
        try {
          const errorData = await response.json();
          const waitSeconds = errorData.extras?.wait_seconds || 30;
          console.log(`[${requestId}] Rate limited on ${displayName}, waiting ${waitSeconds}s (attempt ${attempt}/${maxRetries})`);
          await new Promise((resolve) => setTimeout(resolve, waitSeconds * 1000));
          continue; // Retry
        } catch {
          // Couldn't parse, wait default time
          console.log(`[${requestId}] Rate limited on ${displayName}, waiting 30s (attempt ${attempt}/${maxRetries})`);
          await new Promise((resolve) => setTimeout(resolve, 30000));
          continue;
        }
      }

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      return { success: true };
    } catch (error) {
      if (attempt === maxRetries) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
      // Network error - wait and retry
      console.log(`[${requestId}] Network error on ${displayName}, retrying in 5s (attempt ${attempt}/${maxRetries})`);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }

  return { success: false, error: "Max retries exceeded" };
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

    if (!["dry-run", "prepare", "migrate"].includes(action)) {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Use "dry-run", "prepare", or "migrate"' }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`[${requestId}] Action: ${action}, Batch size: ${batchSize}`);

    // =========================================================================
    // 3. HANDLE PREPARE ACTION
    // =========================================================================

    if (action === "prepare") {
      // Set sync status to NULL for all questions with forum_url (marks as pending)
      console.log(`[${requestId}] Preparing migration - setting sync status to NULL for all questions with forum_url...`);

      // First get count of questions to update (more memory efficient than returning all IDs)
      const { count: countToUpdate } = await supabase
        .from("questions")
        .select("*", { count: "exact", head: true })
        .not("forum_url", "is", null);

      // Then perform the update
      const { error: updateError } = await supabase
        .from("questions")
        .update({
          discourse_sync_status: null,
          discourse_sync_error: null,
        })
        .not("forum_url", "is", null);

      if (updateError) {
        throw new Error(`Failed to prepare migration: ${updateError.message}`);
      }

      const count = countToUpdate || 0;
      console.log(`[${requestId}] Reset ${count} questions to NULL (pending)`);

      return new Response(
        JSON.stringify({
          success: true,
          action: "prepare",
          markedForMigration: count,
          message: `Reset ${count} questions to pending (NULL). Run with action: "migrate" to start migration.`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // =========================================================================
    // 4. GET COUNTS FOR DRY-RUN
    // =========================================================================

    if (action === "dry-run") {
      // Count questions by status
      // Pending = has forum_url but NULL sync status
      const { count: pendingCount } = await supabase
        .from("questions")
        .select("*", { count: "exact", head: true })
        .not("forum_url", "is", null)
        .is("discourse_sync_status", null);

      const { count: syncedCount } = await supabase
        .from("questions")
        .select("*", { count: "exact", head: true })
        .eq("discourse_sync_status", "synced");

      const { count: errorCount } = await supabase
        .from("questions")
        .select("*", { count: "exact", head: true })
        .eq("discourse_sync_status", "error");

      const { count: totalWithForumUrl } = await supabase
        .from("questions")
        .select("*", { count: "exact", head: true })
        .not("forum_url", "is", null);

      return new Response(
        JSON.stringify({
          success: true,
          action: "dry-run",
          counts: {
            totalWithForumUrl: totalWithForumUrl || 0,
            pending: pendingCount || 0,
            synced: syncedCount || 0,
            error: errorCount || 0,
          },
          nextAction: (pendingCount || 0) > 0
            ? 'Run with action: "migrate" to process pending questions'
            : (errorCount || 0) > 0
              ? 'Run with action: "prepare" to reset errors and retry'
              : "All questions are synced!",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // =========================================================================
    // 5. GET DISCOURSE CONFIGURATION
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
    // 6. FETCH PENDING QUESTIONS (forum_url exists, sync status is NULL)
    // =========================================================================

    console.log(`[${requestId}] Fetching pending questions...`);

    const { data: questions, error: dbError } = await supabase
      .from("questions")
      .select("id, display_name, forum_url")
      .not("forum_url", "is", null)
      .is("discourse_sync_status", null)
      .order("display_name")
      .limit(batchSize);

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`);
    }

    const questionsList = (questions || []) as Question[];
    console.log(`[${requestId}] Found ${questionsList.length} pending questions`);

    if (questionsList.length === 0) {
      // Get total counts for summary
      const { count: syncedCount } = await supabase
        .from("questions")
        .select("*", { count: "exact", head: true })
        .eq("discourse_sync_status", "synced");

      const { count: errorCount } = await supabase
        .from("questions")
        .select("*", { count: "exact", head: true })
        .eq("discourse_sync_status", "error");

      return new Response(
        JSON.stringify({
          success: true,
          complete: true,
          message: "No pending questions to migrate",
          summary: {
            synced: syncedCount || 0,
            errors: errorCount || 0,
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // =========================================================================
    // 7. MIGRATE: UPDATE TOPICS ONE BY ONE
    // =========================================================================

    console.log(`[${requestId}] Starting migration of ${questionsList.length} questions...`);

    const results: MigrationResult[] = [];
    let updated = 0;
    let errors = 0;

    for (const question of questionsList) {
      // Security check: Ensure forum_url is from our Discourse instance
      if (!isValidDiscourseUrl(question.forum_url)) {
        const errorMsg = `Invalid forum_url: must start with ${DISCOURSE_URL}`;
        await supabase
          .from("questions")
          .update({
            discourse_sync_status: "error",
            discourse_sync_error: errorMsg,
            discourse_sync_at: new Date().toISOString(),
          })
          .eq("id", question.id);

        results.push({
          questionId: question.id,
          displayName: question.display_name,
          topicId: 0,
          status: "error",
          reason: errorMsg,
        });
        errors++;
        continue;
      }

      const topicId = extractTopicId(question.forum_url);

      if (!topicId) {
        // Valid Discourse URL but couldn't extract topic ID
        await supabase
          .from("questions")
          .update({
            discourse_sync_status: "error",
            discourse_sync_error: "Could not extract topic ID from forum_url pattern",
            discourse_sync_at: new Date().toISOString(),
          })
          .eq("id", question.id);

        results.push({
          questionId: question.id,
          displayName: question.display_name,
          topicId: 0,
          status: "error",
          reason: "Could not extract topic ID",
        });
        errors++;
        continue;
      }

      // Try to update the topic
      console.log(`[${requestId}] Updating ${question.display_name} (topic ${topicId})...`);

      const updateResult = await updateTopicExternalIdWithRetry(
        discourseApiKey,
        discourseUsername,
        topicId,
        question.id,
        requestId,
        question.display_name
      );

      if (updateResult.success) {
        // Mark as synced immediately
        await supabase
          .from("questions")
          .update({
            discourse_sync_status: "synced",
            discourse_sync_at: new Date().toISOString(),
            discourse_sync_error: null,
          })
          .eq("id", question.id);

        results.push({
          questionId: question.id,
          displayName: question.display_name,
          topicId,
          status: "updated",
        });
        updated++;
        console.log(`[${requestId}] ✓ ${question.display_name} synced`);
      } else {
        // Mark as error
        await supabase
          .from("questions")
          .update({
            discourse_sync_status: "error",
            discourse_sync_at: new Date().toISOString(),
            discourse_sync_error: updateResult.error || "Unknown error",
          })
          .eq("id", question.id);

        results.push({
          questionId: question.id,
          displayName: question.display_name,
          topicId,
          status: "error",
          reason: updateResult.error,
        });
        errors++;
        console.error(`[${requestId}] ✗ ${question.display_name}: ${updateResult.error}`);
      }
    }

    // Get remaining count
    const { count: remainingCount } = await supabase
      .from("questions")
      .select("*", { count: "exact", head: true })
      .not("forum_url", "is", null)
      .is("discourse_sync_status", null);

    console.log(
      `[${requestId}] Batch complete. Updated: ${updated}, Errors: ${errors}, Remaining: ${remainingCount || 0}`
    );

    // Aggregate errors by reason for easier debugging
    const errorSummary = results
      .filter((r) => r.status === "error")
      .reduce((acc, r) => {
        const reason = r.reason || "unknown";
        acc[reason] = (acc[reason] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    return new Response(
      JSON.stringify({
        success: true,
        complete: (remainingCount || 0) === 0,
        batch: {
          processed: questionsList.length,
          updated,
          errors,
        },
        remaining: remainingCount || 0,
        errorSummary: Object.keys(errorSummary).length > 0 ? errorSummary : undefined,
        results,
        nextAction: (remainingCount || 0) > 0
          ? `Run again to process remaining ${remainingCount} questions`
          : "Migration complete!",
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
