import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Configuration constants
const DISCOURSE_URL = 'https://forum.openhamprep.com';
const DEFAULT_BATCH_SIZE = 50;
const MAX_BATCH_SIZE = 100;
const RATE_LIMIT_DELAY_MS = 1000;
const PAGINATION_DELAY_MS = 200;
const MAX_PAGINATION_PAGES = 50;
const MAX_TITLE_LENGTH = 250;
const MAX_QUESTION_IDS_IN_RESPONSE = 100;

const CATEGORY_MAP: Record<string, string> = {
  'T': 'Technician Questions',
  'G': 'General Questions',
  'E': 'Extra Questions',
};

interface Question {
  id: string;
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

async function fetchDiscourseCategories(apiKey: string, username: string): Promise<Map<string, number>> {
  const response = await fetch(`${DISCOURSE_URL}/categories.json`, {
    headers: {
      'Api-Key': apiKey,
      'Api-Username': username,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch categories: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const categoryMap = new Map<string, number>();

  for (const category of data.category_list.categories) {
    categoryMap.set(category.name, category.id);
  }

  return categoryMap;
}

async function fetchExistingTopicsInCategory(
  apiKey: string,
  username: string,
  categoryId: number,
  categorySlug: string
): Promise<Set<string>> {
  const existingQuestionIds = new Set<string>();
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(
      `${DISCOURSE_URL}/c/${categorySlug}/${categoryId}.json?page=${page}`,
      {
        headers: {
          'Api-Key': apiKey,
          'Api-Username': username,
        },
      }
    );

    if (!response.ok) {
      console.error(`Failed to fetch topics for category ${categoryId}: ${response.status}`);
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
      console.warn('Reached page limit when fetching existing topics');
      break;
    }

    // Small delay to respect rate limits
    await new Promise(resolve => setTimeout(resolve, PAGINATION_DELAY_MS));
  }

  return existingQuestionIds;
}

function formatTopicBody(question: Question): string {
  const letters = ['A', 'B', 'C', 'D'];
  const correctLetter = letters[question.correct_answer];

  const optionsText = question.options
    .map((opt, i) => `- **${letters[i]})** ${opt}`)
    .join('\n');

  const explanationText = question.explanation
    ? question.explanation
    : '_No explanation yet. Help improve this by contributing below!_';

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

async function createDiscourseTopic(
  apiKey: string,
  username: string,
  categoryId: number,
  question: Question
): Promise<{ success: boolean; topicId?: number; topicUrl?: string; error?: string }> {
  // Truncate title if needed (Discourse has a 255 char limit)
  let title = `${question.id} - ${question.question}`;
  if (title.length > MAX_TITLE_LENGTH) {
    title = title.substring(0, MAX_TITLE_LENGTH - 3) + '...';
  }

  const body = formatTopicBody(question);

  try {
    const response = await fetch(`${DISCOURSE_URL}/posts.json`, {
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
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
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

function getCategorySlug(categoryName: string): string {
  return categoryName.toLowerCase().replace(/\s+/g, '-');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get Discourse configuration from environment
    const { apiKey, username } = getDiscourseConfig();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Require authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
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

    console.log(`Starting Discourse sync with action: ${action}, license: ${license || 'all'}, batchSize: ${effectiveBatchSize}`);

    // Fetch category IDs from Discourse
    console.log('Fetching Discourse categories...');
    const categoryIds = await fetchDiscourseCategories(apiKey, username);

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
    console.log('Fetching existing topics from Discourse...');
    const existingTopics = new Set<string>();

    for (const prefix of licenseFilter) {
      const categoryName = CATEGORY_MAP[prefix];
      const categoryId = categoryIds.get(categoryName)!;
      const categorySlug = getCategorySlug(categoryName);

      const topicsInCategory = await fetchExistingTopicsInCategory(apiKey, username, categoryId, categorySlug);
      for (const id of topicsInCategory) {
        existingTopics.add(id);
      }
    }

    console.log(`Found ${existingTopics.size} existing topics`);

    // Fetch questions from Supabase
    console.log('Fetching questions from database...');
    let query = supabase
      .from('questions')
      .select('id, question, options, correct_answer, explanation');

    // Filter by license if specified
    if (licenseFilter.length === 1) {
      query = query.ilike('id', `${licenseFilter[0]}%`);
    }

    const { data: questions, error: dbError } = await query;

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`);
    }

    if (!questions || questions.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No questions found to sync', created: 0, skipped: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${questions.length} questions in database`);

    // Filter to only questions that need to be created
    const questionsToCreate = questions.filter(q => !existingTopics.has(q.id));
    const skippedQuestions = questions.filter(q => existingTopics.has(q.id));

    console.log(`${questionsToCreate.length} topics to create, ${skippedQuestions.length} already exist`);

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
        const prefix = question.id[0];
        const countForPrefix = exampleTopics.filter(e => e.questionId[0] === prefix).length;
        if (countForPrefix < 3) {
          let title = `${question.id} - ${question.question}`;
          if (title.length > MAX_TITLE_LENGTH) {
            title = title.substring(0, MAX_TITLE_LENGTH - 3) + '...';
          }
          const body = formatTopicBody(question);
          exampleTopics.push({
            questionId: question.id,
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
          toCreate: questionsToCreate.filter((q: Question) => q.id[0] === prefix).length,
          toSkip: skippedQuestions.filter((q: Question) => q.id[0] === prefix).length,
        };
      }

      // Estimate time (1 second per topic)
      const estimatedTimeSeconds = questionsToCreate.length;
      const estimatedTimeMinutes = Math.ceil(estimatedTimeSeconds / 60);

      // Limit question IDs in response to prevent large payloads
      const questionsToCreateIds = questionsToCreate.map((q: Question) => q.id);
      const questionsToSkipIds = skippedQuestions.map((q: Question) => q.id);

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

    console.log(`Processing batch of ${batchToProcess.length} topics (${remaining} remaining after this batch)`);

    for (const question of batchToProcess) {
      const prefix = question.id[0];
      const categoryName = CATEGORY_MAP[prefix];
      const categoryId = categoryIds.get(categoryName)!;

      console.log(`Creating topic for ${question.id}...`);
      const result = await createDiscourseTopic(apiKey, username, categoryId, question as Question);

      if (result.success) {
        // Save the forum URL to the database
        let dbUpdateSuccess = true;
        if (result.topicUrl) {
          const { error: updateError } = await supabase
            .from('questions')
            .update({ forum_url: result.topicUrl })
            .eq('id', question.id);

          if (updateError) {
            console.error(`Failed to save forum_url for ${question.id}: ${updateError.message}`);
            dbUpdateSuccess = false;
          } else {
            console.log(`Saved forum_url for ${question.id}: ${result.topicUrl}`);
          }
        }

        if (dbUpdateSuccess) {
          results.push({ questionId: question.id, status: 'created', topicId: result.topicId, topicUrl: result.topicUrl });
          created++;
        } else {
          // Topic was created but DB update failed - report as partial success
          results.push({
            questionId: question.id,
            status: 'partial',
            topicId: result.topicId,
            topicUrl: result.topicUrl,
            reason: 'Topic created in Discourse but failed to save forum_url to database'
          });
          errors++;
        }
      } else {
        results.push({ questionId: question.id, status: 'error', reason: result.error });
        errors++;
        console.error(`Failed to create topic for ${question.id}: ${result.error}`);
      }

      // Rate limiting: wait between requests
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY_MS));
    }

    const isComplete = remaining === 0;

    console.log(`Batch complete. Created: ${created}, Errors: ${errors}, Remaining: ${remaining}`);

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
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
