import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  extractMetaContent,
  extractTitle,
  detectType,
  extractSiteName,
  extractUrlsFromText,
  isLooseUUID,
} from "./logic.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UnfurledLink {
  url: string;
  title: string;
  description: string;
  image: string;
  type: 'video' | 'article' | 'website';
  siteName: string;
  unfurledAt: string;
}

async function unfurlUrl(url: string): Promise<UnfurledLink> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LinkPreview/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });

    if (!response.ok) {
      return {
        url,
        title: url,
        description: '',
        image: '',
        type: 'website',
        siteName: new URL(url).hostname,
        unfurledAt: new Date().toISOString(),
      };
    }

    const html = await response.text();
    return {
      url,
      title: extractTitle(html) || url,
      description: extractMetaContent(html, 'description') || '',
      image: extractMetaContent(html, 'image') || '',
      type: detectType(url, html),
      siteName: extractSiteName(url, html),
      unfurledAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Error unfurling ${url}:`, error);
    return {
      url,
      title: url,
      description: '',
      image: '',
      type: 'website',
      siteName: '',
      unfurledAt: new Date().toISOString(),
    };
  }
}

serve(async (req) => {
  const requestId = crypto.randomUUID().slice(0, 8);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, questionId, url } = await req.json();

    // Helper to get question by ID (supports both UUID and display_name)
    const getQuestionById = async (qId: string, selectColumns: string = 'id, links') => {
      const lookupColumn = isLooseUUID(qId) ? 'id' : 'display_name';
      const { data, error } = await supabase
        .from('questions')
        .select(selectColumns)
        .eq(lookupColumn, lookupColumn === 'display_name' ? qId.toUpperCase() : qId)
        .single();
      return { data, error };
    };

    console.log(`[${requestId}] manage-question-links: action=${action}, questionId=${questionId || 'n/a'}, url=${url ? url.slice(0, 50) + '...' : 'n/a'}`);

    if (action === 'unfurl') {
      // Just unfurl a URL and return the metadata without saving
      if (!url) {
        console.warn(`[${requestId}] unfurl action: missing url`);
        return new Response(
          JSON.stringify({ error: 'url is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`[${requestId}] Unfurling URL: ${url}`);
      const unfurled = await unfurlUrl(url);
      console.log(`[${requestId}] Unfurled: title="${unfurled.title?.slice(0, 50) || 'none'}", type=${unfurled.type}`);

      return new Response(
        JSON.stringify(unfurled),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'add') {
      // Add a new link to a question
      if (!questionId || !url) {
        console.warn(`[${requestId}] add action: missing questionId or url`);
        return new Response(
          JSON.stringify({ error: 'questionId and url are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`[${requestId}] Adding link to question ${questionId}: ${url}`);

      // Get current links (supports both UUID and display_name)
      const { data: question, error: fetchError } = await getQuestionById(questionId, 'id, links');

      if (fetchError) {
        console.error(`[${requestId}] Error fetching question ${questionId}:`, fetchError);
        return new Response(
          JSON.stringify({ error: 'Question not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if URL already exists
      const existingLinks = (question.links as UnfurledLink[]) || [];
      if (existingLinks.some(link => link.url === url)) {
        console.log(`[${requestId}] Link already exists for question ${questionId}`);
        return new Response(
          JSON.stringify({ error: 'Link already exists', links: existingLinks }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Unfurl the URL
      console.log(`[${requestId}] Unfurling URL for question ${questionId}`);
      const unfurled = await unfurlUrl(url);

      // Add to links array
      const updatedLinks = [...existingLinks, unfurled];

      // Use question.id (UUID) for update
      const { error: updateError } = await supabase
        .from('questions')
        .update({ links: updatedLinks })
        .eq('id', question.id);

      if (updateError) {
        console.error(`[${requestId}] Error updating question ${question.id}:`, updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update question' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`[${requestId}] Successfully added link to question ${question.id}, total links: ${updatedLinks.length}`);
      return new Response(
        JSON.stringify({ success: true, link: unfurled, links: updatedLinks }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'remove') {
      // Remove a link from a question
      if (!questionId || !url) {
        console.warn(`[${requestId}] remove action: missing questionId or url`);
        return new Response(
          JSON.stringify({ error: 'questionId and url are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`[${requestId}] Removing link from question ${questionId}: ${url}`);

      const { data: question, error: fetchError } = await getQuestionById(questionId, 'id, links');

      if (fetchError) {
        console.error(`[${requestId}] Error fetching question ${questionId}:`, fetchError);
        return new Response(
          JSON.stringify({ error: 'Question not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const existingLinks = (question.links as UnfurledLink[]) || [];
      const updatedLinks = existingLinks.filter(link => link.url !== url);

      // Use question.id (UUID) for update
      const { error: updateError } = await supabase
        .from('questions')
        .update({ links: updatedLinks })
        .eq('id', question.id);

      if (updateError) {
        console.error(`[${requestId}] Error updating question ${question.id}:`, updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update question' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`[${requestId}] Successfully removed link from question ${question.id}, remaining links: ${updatedLinks.length}`);
      return new Response(
        JSON.stringify({ success: true, links: updatedLinks }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'refresh') {
      // Refresh all links for a question or all stale links
      const maxAgeHours = 24 * 7; // Refresh links older than 7 days
      const cutoffDate = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000).toISOString();

      console.log(`[${requestId}] Refresh action: questionId=${questionId || 'all stale'}, cutoff=${cutoffDate}`);

      let questionsToRefresh;
      if (questionId) {
        // Refresh specific question (supports both UUID and display_name)
        console.log(`[${requestId}] Fetching specific question ${questionId}`);
        const { data, error } = await getQuestionById(questionId, 'id, links');
        if (error) {
          console.error(`[${requestId}] Error fetching question ${questionId}:`, error);
          throw error;
        }
        questionsToRefresh = data ? [data] : [];
      } else {
        // Refresh all questions with stale links
        console.log(`[${requestId}] Fetching all questions with links`);
        const { data, error } = await supabase
          .from('questions')
          .select('id, links')
          .not('links', 'eq', '[]');
        if (error) {
          console.error(`[${requestId}] Error fetching questions:`, error);
          throw error;
        }
        questionsToRefresh = data?.filter(q => {
          const links = q.links as UnfurledLink[];
          return links.some(link => !link.unfurledAt || link.unfurledAt < cutoffDate);
        });
      }

      console.log(`[${requestId}] Refreshing links for ${questionsToRefresh?.length || 0} questions`);

      let refreshedCount = 0;
      for (const question of questionsToRefresh || []) {
        const links = question.links as UnfurledLink[];
        console.log(`[${requestId}] Refreshing ${links.length} links for question ${question.id}`);
        const refreshedLinks = await Promise.all(
          links.map(async (link) => {
            if (!link.unfurledAt || link.unfurledAt < cutoffDate) {
              console.log(`[${requestId}] Re-unfurling stale link: ${link.url.slice(0, 50)}`);
              return await unfurlUrl(link.url);
            }
            return link;
          })
        );

        const { error: updateError } = await supabase
          .from('questions')
          .update({ links: refreshedLinks })
          .eq('id', question.id);

        if (updateError) {
          console.error(`[${requestId}] Error updating question ${question.id}:`, updateError);
        } else {
          refreshedCount++;
        }
      }

      console.log(`[${requestId}] Refresh complete: ${refreshedCount} questions updated`);
      return new Response(
        JSON.stringify({ success: true, refreshedCount }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'extract-from-explanation') {
      // Extract URLs from explanation and unfurl them
      if (!questionId) {
        console.warn(`[${requestId}] extract-from-explanation: missing questionId`);
        return new Response(
          JSON.stringify({ error: 'questionId is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`[${requestId}] Extracting links from explanation for question ${questionId}`);

      // Fetch the question's explanation and current links (supports both UUID and display_name)
      const { data: question, error: fetchError } = await getQuestionById(questionId, 'id, explanation, links');

      if (fetchError || !question) {
        console.error(`[${requestId}] Question not found: ${questionId}`, fetchError);
        return new Response(
          JSON.stringify({ error: 'Question not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!question.explanation) {
        console.log(`[${requestId}] Question ${question.id} has no explanation, clearing links`);
        // No explanation, clear links (use UUID)
        await supabase
          .from('questions')
          .update({ links: [] })
          .eq('id', question.id);

        return new Response(
          JSON.stringify({ success: true, links: [], message: 'No explanation, links cleared' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Extract URLs from explanation
      const extractedUrls = extractUrlsFromText(question.explanation);
      console.log(`[${requestId}] Found ${extractedUrls.length} URLs in explanation for question ${question.id}`);

      if (extractedUrls.length === 0) {
        console.log(`[${requestId}] No URLs in explanation for question ${question.id}, clearing links`);
        // No URLs found, clear links (use UUID)
        await supabase
          .from('questions')
          .update({ links: [] })
          .eq('id', question.id);

        return new Response(
          JSON.stringify({ success: true, links: [], message: 'No URLs found in explanation' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check existing links to avoid re-unfurling
      const existingLinks = (question.links as UnfurledLink[]) || [];
      const existingUrlMap = new Map(existingLinks.map(l => [l.url, l]));

      // Keep existing links that are still in explanation, unfurl new ones
      const allLinks: UnfurledLink[] = [];
      for (const url of extractedUrls) {
        if (existingUrlMap.has(url)) {
          // Keep existing unfurled data
          console.log(`[${requestId}] Keeping existing link: ${url.slice(0, 50)}`);
          allLinks.push(existingUrlMap.get(url)!);
        } else {
          // Unfurl new URL
          console.log(`[${requestId}] Unfurling new link: ${url.slice(0, 50)}`);
          const unfurled = await unfurlUrl(url);
          allLinks.push(unfurled);
        }
      }

      // Update question (use UUID)
      const { error: updateError } = await supabase
        .from('questions')
        .update({ links: allLinks })
        .eq('id', question.id);

      if (updateError) {
        console.error(`[${requestId}] Failed to update question ${question.id}:`, updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update question' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const newCount = extractedUrls.filter(url => !existingUrlMap.has(url)).length;
      const keptCount = allLinks.length - newCount;

      console.log(`[${requestId}] Extracted ${allLinks.length} links for question ${question.id} (${newCount} new, ${keptCount} kept)`);
      return new Response(
        JSON.stringify({
          success: true,
          links: allLinks,
          newCount,
          keptCount
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.warn(`[${requestId}] Invalid action: ${action}`);
    return new Response(
      JSON.stringify({ error: 'Invalid action. Use: unfurl, add, remove, refresh, or extract-from-explanation' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
