import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  corsHeaders,
  DISCOURSE_URL,
  MAX_PAGINATION_PAGES,
  MAX_TITLE_LENGTH,
  CATEGORY_MAP,
  getCategorySlug,
  isServiceRoleToken,
  fetchWithBackoff,
} from "../_shared/constants.ts";
import {
  formatTopicBody,
  formatTopicTitle,
  type Question as LogicQuestion,
} from "./logic.ts";

// Sync-specific configuration
const DEFAULT_BATCH_SIZE = 50;
const MAX_BATCH_SIZE = 100;
const MAX_QUESTION_IDS_IN_RESPONSE = 100;

interface Question {
  id: string;  // UUID
  display_name: string;  // Human-readable ID (T1A01, etc.)
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string | null;
}

interface DiscourseCategory {
  id: number;
  name: string;
  slug: string;
}

interface SyncResult {
  questionId: string;
  status: 'created' | 'skipped' | 'error' | 'partial';
  topicId?: number;
  topicUrl?: string;
  reason?: string;
}

function getDiscourseConfig(): { apiKey: string; username: string } {
  const apiKey = Deno.env.get('DISCOURSE_API_KEY');
  if (!apiKey) {
    throw new Error('DISCOURSE_API_KEY environment variable is required');
  }

  const username = Deno.env.get('DISCOURSE_USERNAME');
  if (!username) {
    throw new Error('DISCOURSE_USERNAME environment variable is required');
  }

  return { apiKey, username };
}

/**
 * Search Discourse for an existing topic by exact title match.
 * Used when topic creation fails with "Title has already been used".
 */
async function searchDiscourseByTitle(
  apiKey: string,
  username: string,
  title: string,
  requestId: string
): Promise<{ found: boolean; topicId?: number; topicUrl?: string; slug?: string }> {
  try {
    // Use Discourse search API to find topics with this title
    const searchUrl = `${DISCOURSE_URL}/search.json?q=${encodeURIComponent(title)}`;
    const response = await fetchWithBackoff(
      searchUrl,
      {
        headers: {
          'Api-Key': apiKey,
          'Api-Username': username,
        },
      },
      requestId
    );

    if (!response.ok) {
      return { found: false };
    }

    const data = await response.json();

    // Search results have topics array - find exact title match
    const matchingTopic = data.topics?.find((t: { title: string }) => t.title === title);

    if (matchingTopic) {
      return {
        found: true,
        topicId: matchingTopic.id,
        topicUrl: `${DISCOURSE_URL}/t/${matchingTopic.slug}/${matchingTopic.id}`,
        slug: matchingTopic.slug,
      };
    }

    return { found: false };
  } catch {
    return { found: false };
  }
}

async function fetchDiscourseCategories(apiKey: string, username: string, requestId: string): Promise<Map<string, number>> {
  const response = await fetchWithBackoff(
    `${DISCOURSE_URL}/categories.json`,
    {
      headers: {
        'Api-Key': apiKey,
        'Api-Username': username,
      },
    },
    requestId
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch categories: ${response.status} ${response.statusText}`);
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

async function fetchExistingTopicsInCategory(
  apiKey: string,
  username: string,
  categoryId: number,
  categorySlug: string,
  requestId: string
): Promise<Set<string>> {
  const existingQuestionIds = new Set<string>();
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const response = await fetchWithBackoff(
      `${DISCOURSE_URL}/c/${categorySlug}/${categoryId}.json?page=${page}`,
      {
        headers: {
          'Api-Key': apiKey,
          'Api-Username': username,
        },
      },
      requestId
    );

    if (!response.ok) {
      console.error(`[${requestId}] Failed to fetch topics for category ${categoryId}: ${response.status}`);
      break;
    }

    const data = await response.json();
    const topics = data.topic_list?.topics || [];

    if (topics.length === 0) {
      hasMore = false;
      break;
    }

    for (const topic of topics) {
      // Extract question ID from topic title (e.g., "T1A01 - Question text")
      const match = topic.title.match(/^([TGE]\d[A-Z]\d{2})\s*-/);
      if (match) {
        existingQuestionIds.add(match[1]);
      }
    }

    page++;
    // Safety limit to prevent infinite loops
    if (page > MAX_PAGINATION_PAGES) {
      console.warn(`[${requestId}] Reached page limit when fetching existing topics`);
      break;
    }
    // No fixed delay - fetchWithBackoff handles rate limiting automatically
  }

  return existingQuestionIds;
}

async function createDiscourseTopic(
  apiKey: string,
  username: string,
  categoryId: number,
  question: Question,
  requestId: string
): Promise<{ success: boolean; topicId?: number; topicUrl?: string; error?: string; wasExisting?: boolean }> {
  // Use formatTopicTitle from logic.ts for consistent title truncation
  const title = formatTopicTitle(question.display_name, question.question);
  const body = formatTopicBody(question as LogicQuestion);

  try {
    const response = await fetchWithBackoff(
      `${DISCOURSE_URL}/posts.json`,
      {
        method: 'POST',
        headers: {
          'Api-Key': apiKey,
          'Api-Username': username,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          raw: body,
          category: categoryId,
          external_id: question.id,  // Question UUID for reliable topic-to-question association
        }),
      },
      requestId
    );

    if (!response.ok) {
      const errorText = await response.text();

      // Handle "Title has already been used" error by finding the existing topic
      if (response.status === 422 && errorText.includes('Title has already been used')) {
        const existing = await searchDiscourseByTitle(apiKey, username, title, requestId);
        if (existing.found) {
          return {
            success: true,
            topicId: existing.topicId,
            topicUrl: existing.topicUrl,
            wasExisting: true,  // Flag to indicate this was found, not created
          };
        }
        // If we can't find the existing topic, return the original error
      }

      return { success: false, error: `${response.status}: ${errorText}` };
    }

    const data = await response.json();
    // Construct the topic URL from the response
    // Discourse returns topic_id and topic_slug in the response
    const topicUrl = `${DISCOURSE_URL}/t/${data.topic_slug}/${data.topic_id}`;
    return { success: true, topicId: data.topic_id, topicUrl };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

serve(async (req) => {
  const requestId = crypto.randomUUID().slice(0, 8);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log(`[${requestId}] sync-discourse-topics: Request received`);

    // Get Discourse configuration from environment
    const { apiKey, username } = getDiscourseConfig();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Require authentication - supports both service role key and user JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Check if this is a service role JWT by examining the role claim
    // The JWT signature is already verified by Supabase's API gateway
    // WARNING: Service role bypasses Row Level Security - only use for trusted automation
    const isServiceRole = isServiceRoleToken(token);

    if (!isServiceRole) {
      // Try to authenticate as a user
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);

      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized: Invalid token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify user has admin role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (roleError || roleData?.role !== 'admin') {
        return new Response(
          JSON.stringify({ error: 'Forbidden: Admin access required' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    // Service role key is implicitly trusted as admin

    // Parse and validate request body
    const body = await req.json().catch(() => ({}));
    const action = typeof body.action === 'string' ? body.action : 'sync';
    const license = typeof body.license === 'string' ? body.license : undefined;
    const rawBatchSize = typeof body.batchSize === 'number' ? body.batchSize : DEFAULT_BATCH_SIZE;

    // Validate action
    if (action !== 'sync' && action !== 'dry-run') {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Use "sync" or "dry-run"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate batch size (max 100 to stay well within timeout limits)
    const effectiveBatchSize = Math.min(Math.max(1, rawBatchSize), MAX_BATCH_SIZE);

    // Audit logging for security monitoring
    const authMethod = isServiceRole ? 'service_role' : 'user_jwt';
    console.log(`[${requestId}] Starting Discourse sync - auth: ${authMethod}, action: ${action}, license: ${license || 'all'}, batchSize: ${effectiveBatchSize}`);

    // Fetch category IDs from Discourse
    console.log(`[${requestId}] Fetching Discourse categories...`);
    const categoryIds = await fetchDiscourseCategories(apiKey, username, requestId);

    // Validate required categories exist
    const missingCategories: string[] = [];
    for (const categoryName of Object.values(CATEGORY_MAP)) {
      if (!categoryIds.has(categoryName)) {
        missingCategories.push(categoryName);
      }
    }

    if (missingCategories.length > 0) {
      return new Response(
        JSON.stringify({
          error: 'Missing required categories in Discourse',
          missingCategories,
          availableCategories: Array.from(categoryIds.keys()),
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine which license types to sync
    let licenseFilter: string[] = ['T', 'G', 'E'];
    if (license) {
      const licenseMap: Record<string, string> = {
        'technician': 'T',
        'general': 'G',
        'extra': 'E',
      };
      const prefix = licenseMap[license.toLowerCase()];
      if (!prefix) {
        return new Response(
          JSON.stringify({ error: 'Invalid license type. Use: technician, general, or extra' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      licenseFilter = [prefix];
    }

    // Fetch existing topics for each category to check for duplicates
    console.log(`[${requestId}] Fetching existing topics from Discourse...`);
    const existingTopics = new Set<string>();

    for (const prefix of licenseFilter) {
      const categoryName = CATEGORY_MAP[prefix];
      const categoryId = categoryIds.get(categoryName)!;
      const categorySlug = getCategorySlug(categoryName);

      const topicsInCategory = await fetchExistingTopicsInCategory(apiKey, username, categoryId, categorySlug, requestId);
      for (const id of topicsInCategory) {
        existingTopics.add(id);
      }
    }

    console.log(`[${requestId}] Found ${existingTopics.size} existing topics`);

    // Fetch questions from Supabase
    console.log(`[${requestId}] Fetching questions from database...`);
    let query = supabase
      .from('questions')
      .select('id, display_name, question, options, correct_answer, explanation');

    // Filter by license if specified (use display_name for prefix filtering)
    if (licenseFilter.length === 1) {
      query = query.ilike('display_name', `${licenseFilter[0]}%`);
    }

    // Fetch ALL questions using pagination to bypass PostgREST max_rows limit (default 1000)
    const PAGE_SIZE = 1000;
    const questions: Question[] = [];
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const { data: pageData, error: pageError } = await query
        .order('display_name')
        .range(offset, offset + PAGE_SIZE - 1);

      if (pageError) {
        throw new Error(`Database error: ${pageError.message}`);
      }

      if (pageData && pageData.length > 0) {
        questions.push(...(pageData as Question[]));
        offset += pageData.length;
        hasMore = pageData.length === PAGE_SIZE;
      } else {
        hasMore = false;
      }
    }

    if (questions.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No questions found to sync', created: 0, skipped: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[${requestId}] Found ${questions.length} questions in database`);

    // Filter to only questions that need to be created (check by display_name)
    const questionsToCreate = questions.filter(q => !existingTopics.has(q.display_name));
    const skippedQuestions = questions.filter(q => existingTopics.has(q.display_name));

    console.log(`[${requestId}] ${questionsToCreate.length} topics to create, ${skippedQuestions.length} already exist`);

    // For dry-run, return detailed preview of what would be done
    if (action === 'dry-run') {
      // Generate example topics for preview (up to 3 per license type)
      const exampleTopics: Array<{
        questionId: string;
        category: string;
        title: string;
        bodyPreview: string;
      }> = [];

      for (const q of questionsToCreate.slice(0, 9)) {
        const question = q as Question;
        const prefix = question.display_name[0];
        const countForPrefix = exampleTopics.filter(e => e.questionId[0] === prefix).length;
        if (countForPrefix < 3) {
          // Use formatTopicTitle from logic.ts
          const title = formatTopicTitle(question.display_name, question.question);
          const body = formatTopicBody(question as LogicQuestion);
          exampleTopics.push({
            questionId: question.display_name,
            category: CATEGORY_MAP[prefix],
            title,
            bodyPreview: body.length > 500 ? body.substring(0, 500) + '...' : body,
          });
        }
      }

      // Count by license type
      const countByLicense: Record<string, { toCreate: number; toSkip: number }> = {};
      for (const prefix of ['T', 'G', 'E']) {
        countByLicense[CATEGORY_MAP[prefix]] = {
          toCreate: questionsToCreate.filter((q: Question) => q.display_name[0] === prefix).length,
          toSkip: skippedQuestions.filter((q: Question) => q.display_name[0] === prefix).length,
        };
      }

      // Estimate time (1 second per topic)
      const estimatedTimeSeconds = questionsToCreate.length;
      const estimatedTimeMinutes = Math.ceil(estimatedTimeSeconds / 60);

      // Limit question IDs in response to prevent large payloads (use display_name for readability)
      const questionsToCreateIds = questionsToCreate.map((q: Question) => q.display_name);
      const questionsToSkipIds = skippedQuestions.map((q: Question) => q.display_name);

      return new Response(
        JSON.stringify({
          success: true,
          dryRun: true,
          summary: {
            totalToCreate: questionsToCreate.length,
            totalToSkip: skippedQuestions.length,
            totalInDatabase: questions.length,
            estimatedTime: `~${estimatedTimeMinutes} minute${estimatedTimeMinutes !== 1 ? 's' : ''}`,
          },
          byCategory: countByLicense,
          exampleTopics,
          questionsToCreate: questionsToCreateIds.slice(0, MAX_QUESTION_IDS_IN_RESPONSE),
          questionsToSkip: questionsToSkipIds.slice(0, MAX_QUESTION_IDS_IN_RESPONSE),
          ...(questionsToCreateIds.length > MAX_QUESTION_IDS_IN_RESPONSE && {
            note: `Showing first ${MAX_QUESTION_IDS_IN_RESPONSE} of ${questionsToCreateIds.length} question IDs`,
          }),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create topics - only process up to batchSize to stay within timeout limits
    const results: SyncResult[] = [];
    let created = 0;
    let errors = 0;

    const batchToProcess = questionsToCreate.slice(0, effectiveBatchSize);
    const remaining = questionsToCreate.length - batchToProcess.length;

    console.log(`[${requestId}] Processing batch of ${batchToProcess.length} topics (${remaining} remaining after this batch)`);

    for (const question of batchToProcess) {
      const prefix = question.display_name[0];
      const categoryName = CATEGORY_MAP[prefix];
      const categoryId = categoryIds.get(categoryName)!;

      console.log(`[${requestId}] Creating topic for ${question.display_name}...`);
      const result = await createDiscourseTopic(apiKey, username, categoryId, question as Question, requestId);

      if (result.success) {
        // Log whether this was a new topic or an existing one we linked to
        if (result.wasExisting) {
          console.log(`[${requestId}] Found existing topic for ${question.display_name}: ${result.topicUrl}`);
        }

        // Save the forum URL and sync status to the database with retry logic
        let dbUpdateSuccess = false;
        const maxRetries = 3;

        if (result.topicUrl) {
          for (let attempt = 1; attempt <= maxRetries; attempt++) {
            const { error: updateError } = await supabase
              .from('questions')
              .update({
                forum_url: result.topicUrl,
                discourse_sync_status: 'synced',
                discourse_sync_at: new Date().toISOString(),
                discourse_sync_error: null,
              })
              .eq('id', question.id);

            if (!updateError) {
              dbUpdateSuccess = true;
              console.log(`[${requestId}] Saved forum_url for ${question.display_name}: ${result.topicUrl}`);
              break;
            }

            console.error(`[${requestId}] Attempt ${attempt}/${maxRetries} failed to save forum_url for ${question.display_name}: ${updateError.message}`);

            if (attempt < maxRetries) {
              // Exponential backoff: 1s, 2s, 4s
              await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
            }
          }
        }

        // Use appropriate status - 'linked' for existing topics, 'created' for new ones
        const status = result.wasExisting ? 'linked' : 'created';
        if (dbUpdateSuccess) {
          results.push({ questionId: question.display_name, status, topicId: result.topicId, topicUrl: result.topicUrl });
          // Only increment created counter for actually new topics
          if (!result.wasExisting) {
            created++;
          }
        } else {
          // Topic was created but DB update failed after retries - report as partial success
          results.push({
            questionId: question.display_name,
            status: 'partial',
            topicId: result.topicId,
            topicUrl: result.topicUrl,
            reason: 'Topic created in Discourse but failed to save forum_url to database after 3 retries'
          });
          errors++;
        }
      } else {
        results.push({ questionId: question.display_name, status: 'error', reason: result.error });
        errors++;
        console.error(`[${requestId}] Failed to create topic for ${question.display_name}: ${result.error}`);
      }
      // No fixed delay - fetchWithBackoff handles rate limiting automatically
    }

    const isComplete = remaining === 0;

    console.log(`[${requestId}] Batch complete. Created: ${created}, Errors: ${errors}, Remaining: ${remaining}`);

    return new Response(
      JSON.stringify({
        success: true,
        complete: isComplete,
        batch: {
          processed: batchToProcess.length,
          created,
          errors,
          skippedAsExisting: skippedQuestions.length,
        },
        progress: {
          totalInDatabase: questions.length,
          alreadyInDiscourse: skippedQuestions.length,
          createdThisBatch: created,
          remainingToCreate: remaining,
          estimatedBatchesRemaining: Math.ceil(remaining / effectiveBatchSize),
        },
        details: results,
        nextAction: isComplete
          ? null
          : `Call again with same parameters to process next batch of ${Math.min(remaining, effectiveBatchSize)} topics`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error(`[${requestId}] Error:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
