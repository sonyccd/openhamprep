import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

function extractMetaContent(html: string, property: string): string {
  const ogMatch = html.match(new RegExp(`<meta[^>]*property=["']og:${property}["'][^>]*content=["']([^"']+)["']`, 'i')) ||
                  html.match(new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:${property}["']`, 'i'));
  if (ogMatch) return ogMatch[1];

  const twitterMatch = html.match(new RegExp(`<meta[^>]*name=["']twitter:${property}["'][^>]*content=["']([^"']+)["']`, 'i')) ||
                       html.match(new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:${property}["']`, 'i'));
  if (twitterMatch) return twitterMatch[1];

  const metaMatch = html.match(new RegExp(`<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']+)["']`, 'i')) ||
                    html.match(new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*name=["']${property}["']`, 'i'));
  if (metaMatch) return metaMatch[1];

  return '';
}

function extractTitle(html: string): string {
  const ogTitle = extractMetaContent(html, 'title');
  if (ogTitle) return ogTitle;
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return titleMatch ? titleMatch[1].trim() : '';
}

function detectType(url: string, html: string): 'video' | 'article' | 'website' {
  const urlLower = url.toLowerCase();
  if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be') || 
      urlLower.includes('vimeo.com') || urlLower.includes('dailymotion.com') ||
      urlLower.includes('twitch.tv')) {
    return 'video';
  }
  const ogType = extractMetaContent(html, 'type');
  if (ogType.includes('video')) return 'video';
  if (ogType.includes('article')) return 'article';
  if (html.includes('<article') || urlLower.includes('/blog/') || 
      urlLower.includes('/article/') || urlLower.includes('/post/')) {
    return 'article';
  }
  return 'website';
}

function extractSiteName(url: string, html: string): string {
  const ogSiteName = extractMetaContent(html, 'site_name');
  if (ogSiteName) return ogSiteName;
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return '';
  }
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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, questionId, url } = await req.json();

    if (action === 'add') {
      // Add a new link to a question
      if (!questionId || !url) {
        return new Response(
          JSON.stringify({ error: 'questionId and url are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Adding link to question ${questionId}: ${url}`);

      // Get current links
      const { data: question, error: fetchError } = await supabase
        .from('questions')
        .select('links')
        .eq('id', questionId)
        .single();

      if (fetchError) {
        console.error('Error fetching question:', fetchError);
        return new Response(
          JSON.stringify({ error: 'Question not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if URL already exists
      const existingLinks = (question.links as UnfurledLink[]) || [];
      if (existingLinks.some(link => link.url === url)) {
        return new Response(
          JSON.stringify({ error: 'Link already exists', links: existingLinks }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Unfurl the URL
      const unfurled = await unfurlUrl(url);

      // Add to links array
      const updatedLinks = [...existingLinks, unfurled];

      const { error: updateError } = await supabase
        .from('questions')
        .update({ links: updatedLinks })
        .eq('id', questionId);

      if (updateError) {
        console.error('Error updating question:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update question' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Successfully added link to question ${questionId}`);
      return new Response(
        JSON.stringify({ success: true, link: unfurled, links: updatedLinks }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'remove') {
      // Remove a link from a question
      if (!questionId || !url) {
        return new Response(
          JSON.stringify({ error: 'questionId and url are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: question, error: fetchError } = await supabase
        .from('questions')
        .select('links')
        .eq('id', questionId)
        .single();

      if (fetchError) {
        return new Response(
          JSON.stringify({ error: 'Question not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const existingLinks = (question.links as UnfurledLink[]) || [];
      const updatedLinks = existingLinks.filter(link => link.url !== url);

      const { error: updateError } = await supabase
        .from('questions')
        .update({ links: updatedLinks })
        .eq('id', questionId);

      if (updateError) {
        return new Response(
          JSON.stringify({ error: 'Failed to update question' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, links: updatedLinks }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'refresh') {
      // Refresh all links for a question or all stale links
      const maxAgeHours = 24 * 7; // Refresh links older than 7 days
      const cutoffDate = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000).toISOString();

      let questionsToRefresh;
      if (questionId) {
        // Refresh specific question
        const { data, error } = await supabase
          .from('questions')
          .select('id, links')
          .eq('id', questionId);
        if (error) throw error;
        questionsToRefresh = data;
      } else {
        // Refresh all questions with stale links
        const { data, error } = await supabase
          .from('questions')
          .select('id, links')
          .not('links', 'eq', '[]');
        if (error) throw error;
        questionsToRefresh = data?.filter(q => {
          const links = q.links as UnfurledLink[];
          return links.some(link => !link.unfurledAt || link.unfurledAt < cutoffDate);
        });
      }

      console.log(`Refreshing links for ${questionsToRefresh?.length || 0} questions`);

      let refreshedCount = 0;
      for (const question of questionsToRefresh || []) {
        const links = question.links as UnfurledLink[];
        const refreshedLinks = await Promise.all(
          links.map(async (link) => {
            if (!link.unfurledAt || link.unfurledAt < cutoffDate) {
              return await unfurlUrl(link.url);
            }
            return link;
          })
        );

        await supabase
          .from('questions')
          .update({ links: refreshedLinks })
          .eq('id', question.id);

        refreshedCount++;
      }

      console.log(`Refreshed ${refreshedCount} questions`);
      return new Response(
        JSON.stringify({ success: true, refreshedCount }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use: add, remove, or refresh' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
