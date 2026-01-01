import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  corsHeaders,
  DISCOURSE_URL,
  PAGINATION_DELAY_MS,
  MAX_PAGINATION_PAGES,
  QUESTION_ID_PATTERN,
  CATEGORY_MAP,
  getCategorySlug,
  isServiceRoleToken,
} from "../_shared/constants.ts";

/**
 * Verify Discourse Sync Edge Function
 *
 * Compares the state of Discourse topics with the questions database
 * to identify sync discrepancies and optionally repair them.
 *
 * Actions:
 * - verify: Report discrepancies without making changes (dry-run)
 * - repair: Fix null forum_urls by matching Discourse topics to questions
 *
 * Security: Requires admin role or service_role token.
 */

// =============================================================================
// TYPES
// =============================================================================

interface Question {
  id: string; // UUID
  display_name: string; // Human-readable ID (T1A01, etc.)
  forum_url: string | null;
  discourse_sync_status: string | null;
  explanation: string | null;
}

interface DiscourseTopic {
  id: number;
  title: string;
  slug: string;
  external_id?: string;  // Question UUID if set
}

interface DiscrepancyOrphaned {
  questionDisplayName: string;
  topicId: number;
  topicUrl: string;
  action?: "repaired" | "skipped";
}

interface DiscrepancyBroken {
  questionId: string;
  questionDisplayName: string;
  forumUrl: string;
  error: string;
}

interface DiscrepancyMissingStatus {
  questionId: string;
  questionDisplayName: string;
  forumUrl: string;
}

interface VerifyResult {
  success: boolean;
  action: "verify" | "repair";
  summary: {
    totalQuestionsInDb: number;
    totalTopicsInDiscourse: number;
    questionsWithForumUrl: number;
    questionsWithoutForumUrl: number;
    syncedCorrectly: number;
  };
  discrepancies: {
    orphanedInDiscourse: DiscrepancyOrphaned[];
    brokenForumUrl: DiscrepancyBroken[];
    missingStatus: DiscrepancyMissingStatus[];
  };
  repaired?: number;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Extract question ID from topic title.
 * Format: "T1A01 - Question text..."
 */
function extractQuestionIdFromTitle(title: string): string | null {
  if (!title) return null;
  const match = title.match(QUESTION_ID_PATTERN);
  return match ? match[1] : null;
}

/**
 * Extract topic ID from a forum URL.
 * Handles formats like:
 * - https://forum.openhamprep.com/t/topic-slug/123
 * - https://forum.openhamprep.com/t/123
 */
function extractTopicId(forumUrl: string): number | null {
  const match = forumUrl.match(/\/t\/(?:[^/]+\/)?(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

// =============================================================================
// DISCOURSE API FUNCTIONS
// =============================================================================

async function fetchDiscourseCategories(
  apiKey: string,
  username: string
): Promise<Map<string, number>> {
  const response = await fetch(`${DISCOURSE_URL}/categories.json`, {
    headers: {
      "Api-Key": apiKey,
      "Api-Username": username,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch categories: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  const categoryMap = new Map<string, number>();

  // Validate response structure before accessing
  if (!data?.category_list?.categories || !Array.isArray(data.category_list.categories)) {
    throw new Error('Invalid Discourse API response: missing category_list.categories');
  }

  for (const category of data.category_list.categories) {
    if (category?.name && typeof category.id === 'number') {
      categoryMap.set(category.name, category.id);
    }
  }

  return categoryMap;
}

interface FetchTopicsResult {
  byDisplayName: Map<string, DiscourseTopic>;  // Keyed by display_name (T1A01)
  byExternalId: Map<string, DiscourseTopic>;   // Keyed by external_id (UUID)
}

async function fetchAllTopicsInCategory(
  apiKey: string,
  username: string,
  categoryId: number,
  categorySlug: string,
  requestId: string
): Promise<FetchTopicsResult> {
  const byDisplayName = new Map<string, DiscourseTopic>();
  const byExternalId = new Map<string, DiscourseTopic>();
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(
      `${DISCOURSE_URL}/c/${categorySlug}/${categoryId}.json?page=${page}`,
      {
        headers: {
          "Api-Key": apiKey,
          "Api-Username": username,
        },
      }
    );

    if (!response.ok) {
      console.error(
        `[${requestId}] Failed to fetch topics for category ${categoryId}: ${response.status}`
      );
      break;
    }

    const data = await response.json();
    const topics = data.topic_list?.topics || [];

    if (topics.length === 0) {
      hasMore = false;
      break;
    }

    for (const topic of topics) {
      const discourseTopic: DiscourseTopic = {
        id: topic.id,
        title: topic.title,
        slug: topic.slug,
        external_id: topic.external_id,
      };

      // Index by external_id if available (primary key)
      if (topic.external_id) {
        byExternalId.set(topic.external_id, discourseTopic);
      }

      // Also index by display_name from title (for backwards compatibility)
      const displayName = extractQuestionIdFromTitle(topic.title);
      if (displayName) {
        byDisplayName.set(displayName, discourseTopic);
      }
    }

    page++;
    if (page > MAX_PAGINATION_PAGES) {
      console.warn(`[${requestId}] Reached page limit when fetching topics`);
      break;
    }

    await new Promise((resolve) => setTimeout(resolve, PAGINATION_DELAY_MS));
  }

  return { byDisplayName, byExternalId };
}

async function verifyTopicExists(
  apiKey: string,
  username: string,
  topicId: number
): Promise<boolean> {
  try {
    const response = await fetch(`${DISCOURSE_URL}/t/${topicId}.json`, {
      headers: {
        "Api-Key": apiKey,
        "Api-Username": username,
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}

// =============================================================================
// MAIN HANDLER
// =============================================================================

serve(async (req) => {
  const requestId = crypto.randomUUID().slice(0, 8);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log(`[${requestId}] verify-discourse-sync: Request received`);

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
    const action = typeof body.action === "string" ? body.action : "verify";
    const license = typeof body.license === "string" ? body.license : undefined;

    if (action !== "verify" && action !== "repair") {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Use "verify" or "repair"' }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(
      `[${requestId}] Action: ${action}, License filter: ${license || "all"}`
    );

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
    // 4. FETCH DATA FROM DATABASE
    // =========================================================================

    console.log(`[${requestId}] Fetching questions from database...`);

    let query = supabase
      .from("questions")
      .select("id, display_name, forum_url, discourse_sync_status, explanation");

    if (license) {
      const licenseMap: Record<string, string> = {
        technician: "T",
        general: "G",
        extra: "E",
      };
      const prefix = licenseMap[license.toLowerCase()];
      if (prefix) {
        query = query.ilike("display_name", `${prefix}%`);
      }
    }

    const { data: questions, error: dbError } = await query;

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`);
    }

    const questionsList = (questions || []) as Question[];
    console.log(`[${requestId}] Found ${questionsList.length} questions in DB`);

    // =========================================================================
    // 5. FETCH TOPICS FROM DISCOURSE
    // =========================================================================

    console.log(`[${requestId}] Fetching Discourse categories...`);
    const categoryIds = await fetchDiscourseCategories(
      discourseApiKey,
      discourseUsername
    );

    // Determine which categories to scan
    let prefixesToScan = ["T", "G", "E"];
    if (license) {
      const licenseMap: Record<string, string> = {
        technician: "T",
        general: "G",
        extra: "E",
      };
      const prefix = licenseMap[license.toLowerCase()];
      if (prefix) {
        prefixesToScan = [prefix];
      }
    }

    console.log(`[${requestId}] Fetching topics from Discourse...`);
    const allTopicsByDisplayName = new Map<string, DiscourseTopic>();
    const allTopicsByExternalId = new Map<string, DiscourseTopic>();

    for (const prefix of prefixesToScan) {
      const categoryName = CATEGORY_MAP[prefix];
      const categoryId = categoryIds.get(categoryName);

      if (!categoryId) {
        console.warn(
          `[${requestId}] Category not found in Discourse: ${categoryName}`
        );
        continue;
      }

      const categorySlug = getCategorySlug(categoryName);
      const { byDisplayName, byExternalId } = await fetchAllTopicsInCategory(
        discourseApiKey,
        discourseUsername,
        categoryId,
        categorySlug,
        requestId
      );

      for (const [displayName, topic] of byDisplayName) {
        allTopicsByDisplayName.set(displayName, topic);
      }
      for (const [externalId, topic] of byExternalId) {
        allTopicsByExternalId.set(externalId, topic);
      }
    }

    console.log(
      `[${requestId}] Found ${allTopicsByDisplayName.size} topics by display_name, ${allTopicsByExternalId.size} with external_id`
    );

    // =========================================================================
    // 6. BUILD MAPPINGS AND FIND DISCREPANCIES
    // =========================================================================

    const discrepancies: VerifyResult["discrepancies"] = {
      orphanedInDiscourse: [],
      brokenForumUrl: [],
      missingStatus: [],
    };

    // Build maps of questions for quick lookup
    const questionsWithForumUrl = new Set<string>();  // display_names with forum_url
    const questionIdSet = new Set<string>();  // UUIDs of all questions
    const questionsByDisplayName = new Map<string, Question>();
    const questionsById = new Map<string, Question>();

    for (const q of questionsList) {
      questionsByDisplayName.set(q.display_name, q);
      questionsById.set(q.id, q);
      questionIdSet.add(q.id);
      if (q.forum_url) {
        questionsWithForumUrl.add(q.display_name);
      }
    }

    // Find orphaned topics (in Discourse but no forum_url in DB)
    // Check by external_id first (primary), then by display_name (fallback)
    const processedTopicIds = new Set<number>();

    // Process topics with external_id first
    for (const [externalId, topic] of allTopicsByExternalId) {
      processedTopicIds.add(topic.id);
      const question = questionsById.get(externalId);
      if (question && !question.forum_url) {
        // Question exists but has no forum_url - orphaned
        discrepancies.orphanedInDiscourse.push({
          questionDisplayName: question.display_name,
          topicId: topic.id,
          topicUrl: `${DISCOURSE_URL}/t/${topic.slug}/${topic.id}`,
        });
      }
    }

    // Process topics without external_id (match by display_name)
    for (const [displayName, topic] of allTopicsByDisplayName) {
      if (processedTopicIds.has(topic.id)) continue;  // Already processed via external_id
      if (!questionsWithForumUrl.has(displayName)) {
        const question = questionsByDisplayName.get(displayName);
        if (question) {
          // Question exists but has no forum_url
          discrepancies.orphanedInDiscourse.push({
            questionDisplayName: displayName,
            topicId: topic.id,
            topicUrl: `${DISCOURSE_URL}/t/${topic.slug}/${topic.id}`,
          });
        }
      }
    }

    // Find broken forum_urls and missing status
    for (const q of questionsList) {
      if (q.forum_url) {
        // Check if topic exists: first by external_id, then by display_name
        const existsByExternalId = allTopicsByExternalId.has(q.id);
        const existsByDisplayName = allTopicsByDisplayName.has(q.display_name);
        const existsInDiscourse = existsByExternalId || existsByDisplayName;

        if (!existsInDiscourse) {
          // Topic might exist but with different title/external_id, verify directly
          const topicId = extractTopicId(q.forum_url);
          if (topicId) {
            const exists = await verifyTopicExists(
              discourseApiKey,
              discourseUsername,
              topicId
            );
            if (!exists) {
              discrepancies.brokenForumUrl.push({
                questionId: q.id,
                questionDisplayName: q.display_name,
                forumUrl: q.forum_url,
                error: "Topic not found in Discourse",
              });
            }
          }
        }

        // Check for missing sync status
        if (!q.discourse_sync_status) {
          discrepancies.missingStatus.push({
            questionId: q.id,
            questionDisplayName: q.display_name,
            forumUrl: q.forum_url,
          });
        }
      }
    }

    console.log(
      `[${requestId}] Found discrepancies: ` +
        `${discrepancies.orphanedInDiscourse.length} orphaned, ` +
        `${discrepancies.brokenForumUrl.length} broken, ` +
        `${discrepancies.missingStatus.length} missing status`
    );

    // =========================================================================
    // 7. REPAIR IF REQUESTED
    // =========================================================================

    let repairedCount = 0;

    if (action === "repair") {
      console.log(`[${requestId}] Repairing orphaned topics...`);

      for (const orphan of discrepancies.orphanedInDiscourse) {
        const question = questionsByDisplayName.get(orphan.questionDisplayName);
        if (!question) {
          orphan.action = "skipped";
          continue;
        }

        const { error: updateError } = await supabase
          .from("questions")
          .update({
            forum_url: orphan.topicUrl,
            discourse_sync_status: "synced",
            discourse_sync_at: new Date().toISOString(),
            discourse_sync_error: null,
          })
          .eq("id", question.id);

        if (updateError) {
          console.error(
            `[${requestId}] Failed to repair ${orphan.questionDisplayName}: ${updateError.message}`
          );
          orphan.action = "skipped";
        } else {
          orphan.action = "repaired";
          repairedCount++;
          console.log(`[${requestId}] Repaired ${orphan.questionDisplayName}`);
        }
      }

      // Also update missing status to 'synced'
      console.log(`[${requestId}] Updating missing sync statuses...`);

      for (const missing of discrepancies.missingStatus) {
        const { error: updateError } = await supabase
          .from("questions")
          .update({
            discourse_sync_status: "synced",
            discourse_sync_at: new Date().toISOString(),
            discourse_sync_error: null,
          })
          .eq("id", missing.questionId);

        if (updateError) {
          console.error(
            `[${requestId}] Failed to update status for ${missing.questionDisplayName}: ${updateError.message}`
          );
        } else {
          repairedCount++;
        }
      }

      console.log(`[${requestId}] Repaired ${repairedCount} items`);
    }

    // =========================================================================
    // 8. BUILD RESPONSE
    // =========================================================================

    const questionsWithUrl = questionsList.filter((q) => q.forum_url).length;
    const syncedCorrectly = questionsList.filter(
      (q) => q.forum_url && q.discourse_sync_status === "synced"
    ).length;

    const result: VerifyResult = {
      success: true,
      action,
      summary: {
        totalQuestionsInDb: questionsList.length,
        totalTopicsInDiscourse: allTopicsByDisplayName.size,
        questionsWithForumUrl: questionsWithUrl,
        questionsWithoutForumUrl: questionsList.length - questionsWithUrl,
        syncedCorrectly,
      },
      discrepancies,
    };

    if (action === "repair") {
      result.repaired = repairedCount;
    }

    console.log(`[${requestId}] Verification complete`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
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
