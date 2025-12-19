import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SITE_URL = 'https://app.openhamprep.com';
const SITE_NAME = 'Open Ham Prep';
const DEFAULT_IMAGE = `${SITE_URL}/icons/icon-512.png`;
const MAX_DESCRIPTION_LENGTH = 200;

/**
 * Truncate text to a maximum length, adding ellipsis if needed.
 * Tries to break at word boundaries.
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;

  // Find the last space before maxLength
  const truncated = text.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > maxLength * 0.7) {
    return truncated.slice(0, lastSpace) + '...';
  }

  return truncated.slice(0, maxLength - 3) + '...';
}

// Known crawler/bot User-Agent patterns
const CRAWLER_PATTERNS = [
  'Discoursebot',
  'facebookexternalhit',
  'Facebot',
  'Twitterbot',
  'LinkedInBot',
  'Slackbot',
  'TelegramBot',
  'WhatsApp',
  'Googlebot',
  'bingbot',
  'Baiduspider',
  'YandexBot',
  'DuckDuckBot',
  'Applebot',
  'PinterestBot',
  'redditbot',
  'Embedly',
  'Quora Link Preview',
  'Rogerbot',
  'Showyoubot',
  'outbrain',
  'vkShare',
  'W3C_Validator',
];

/**
 * Check if the User-Agent indicates a crawler/bot
 */
function isCrawler(userAgent: string | null): boolean {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return CRAWLER_PATTERNS.some(pattern => ua.includes(pattern.toLowerCase()));
}

/**
 * Escape HTML special characters to prevent XSS in meta tags
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Validate question ID format (T1A01, G2B03, E3C12, etc.)
 */
function isValidQuestionId(id: string): boolean {
  return /^[TGE]\d[A-Z]\d{2}$/i.test(id);
}

/**
 * Get human-readable license name from question ID prefix
 */
function getLicenseName(questionId: string): string {
  const prefix = questionId[0].toUpperCase();
  switch (prefix) {
    case 'T': return 'Technician';
    case 'G': return 'General';
    case 'E': return 'Extra';
    default: return 'Amateur Radio';
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const questionId = url.searchParams.get('id');
    const userAgent = req.headers.get('user-agent');

    // Validate question ID is present
    if (!questionId) {
      return new Response('Missing question ID parameter', {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Validate question ID format
    if (!isValidQuestionId(questionId)) {
      return new Response('Invalid question ID format. Expected format: T1A01, G2B03, E3C12', {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Build canonical URL for the question
    const canonicalUrl = `${SITE_URL}/questions/${questionId.toLowerCase()}`;

    // For regular browsers, fetch and serve the SPA index.html
    // This allows the React app to handle the route client-side
    // We can't redirect because Vercel's rewrite would intercept it again (infinite loop)
    if (!isCrawler(userAgent)) {
      try {
        const spaResponse = await fetch(`${SITE_URL}/index.html`);
        const spaHtml = await spaResponse.text();
        return new Response(spaHtml, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/html; charset=utf-8',
            // Cache for 5 minutes - allows SPA updates to propagate
            'Cache-Control': 'public, max-age=300',
          },
        });
      } catch {
        // Fallback: return a simple page that redirects via JavaScript
        const fallbackHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0;url=${canonicalUrl}">
  <script>window.location.href = "${canonicalUrl}";</script>
</head>
<body>
  <p>Redirecting to <a href="${canonicalUrl}">${canonicalUrl}</a>...</p>
</body>
</html>`;
        return new Response(fallbackHtml, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/html; charset=utf-8',
          },
        });
      }
    }

    // For crawlers, fetch the question and return OG HTML
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: question, error } = await supabase
      .from('questions')
      .select('id, question')
      .ilike('id', questionId)
      .single();

    if (error || !question) {
      // For crawlers, return a 404 with generic OG tags
      // This prevents crawlers from indexing a redirect that leads nowhere useful
      const notFoundHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Question Not Found | ${SITE_NAME}</title>
  <meta name="description" content="This question could not be found. Practice for your Amateur Radio license exam at ${SITE_NAME}.">
  <meta property="og:type" content="website">
  <meta property="og:title" content="Question Not Found | ${SITE_NAME}">
  <meta property="og:description" content="Practice for your Amateur Radio license exam with free questions and study tools.">
  <meta property="og:url" content="${SITE_URL}">
  <meta property="og:site_name" content="${SITE_NAME}">
  <meta property="og:image" content="${DEFAULT_IMAGE}">
  <meta name="twitter:card" content="summary">
  <link rel="canonical" href="${SITE_URL}">
</head>
<body>
  <h1>Question Not Found</h1>
  <p>The requested question could not be found.</p>
  <p><a href="${SITE_URL}">Visit ${SITE_NAME}</a></p>
</body>
</html>`;

      return new Response(notFoundHtml, {
        status: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=60',
        },
      });
    }

    // Build metadata for crawlers
    const title = `Question ${question.id.toUpperCase()} | ${SITE_NAME}`;
    const licenseName = getLicenseName(question.id);
    // Truncate description to optimal OG length (150-200 chars)
    const description = truncateText(question.question, MAX_DESCRIPTION_LENGTH);

    // Generate HTML with OpenGraph meta tags for crawlers
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">

  <!-- OpenGraph Meta Tags for rich previews -->
  <meta property="og:type" content="article">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:site_name" content="${SITE_NAME}">
  <meta property="og:image" content="${DEFAULT_IMAGE}">
  <meta property="article:section" content="${licenseName} License Exam">

  <!-- Twitter Card Meta Tags -->
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${DEFAULT_IMAGE}">

  <link rel="canonical" href="${canonicalUrl}">
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p>${escapeHtml(description)}</p>
  <p><a href="${canonicalUrl}">View this question on ${SITE_NAME}</a></p>
</body>
</html>`;

    return new Response(html, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
        // Cache for 1 hour - questions don't change often
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });

  } catch (error) {
    console.error('Error generating OpenGraph HTML:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(`Internal server error: ${errorMessage}`, {
      status: 500,
      headers: corsHeaders,
    });
  }
});
