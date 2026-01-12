import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  truncateText,
  isCrawler,
  escapeHtml,
  isValidDisplayName,
  isUUID,
  isValidQuestionId,
  getLicenseName,
} from "./logic.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SITE_URL = 'https://app.openhamprep.com';
const SITE_NAME = 'Open Ham Prep';
const DEFAULT_IMAGE = `${SITE_URL}/icons/icon-512.png`;
const MAX_DESCRIPTION_LENGTH = 200;

serve(async (req) => {
  const requestId = crypto.randomUUID().slice(0, 8);
  const userAgent = req.headers.get('user-agent');

  console.log(`[${requestId}] question-opengraph: Request received, User-Agent: ${userAgent?.slice(0, 50) || 'none'}`);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const questionId = url.searchParams.get('id');

    console.log(`[${requestId}] Question ID: ${questionId || 'missing'}`);
    const isCrawlerRequest = isCrawler(userAgent);

    // Validate question ID is present
    if (!questionId) {
      console.warn(`[${requestId}] Missing question ID parameter`);
      return new Response('Missing question ID parameter', {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Validate question ID format
    if (!isValidQuestionId(questionId)) {
      console.warn(`[${requestId}] Invalid question ID format: ${questionId}`);
      return new Response('Invalid question ID format. Expected format: T1A01, G2B03, E3C12, or UUID', {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Build canonical URL for the question (use questionId as-is for now, will be updated after DB lookup)
    // For display_name format, lowercase it; for UUID, keep as-is
    const questionIdForUrl = isValidDisplayName(questionId) ? questionId.toLowerCase() : questionId;
    let canonicalUrl = `${SITE_URL}/questions/${questionIdForUrl}`;

    // For regular browsers, redirect to /app/questions/:id which bypasses the rewrite
    // The SPA will handle the route and then use history.replaceState to fix the URL
    if (!isCrawlerRequest) {
      // Redirect to a path that doesn't match the rewrite pattern
      // We use /q/:id as a short alias that the SPA can handle
      const bypassUrl = `${SITE_URL}/q/${questionId.toLowerCase()}`;
      console.log(`[${requestId}] Browser request, redirecting to ${bypassUrl}`);
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': bypassUrl,
          'Cache-Control': 'public, max-age=86400, immutable',
        },
      });
    }

    console.log(`[${requestId}] Crawler detected, fetching question data from database`);

    // For crawlers, fetch the question and return OG HTML
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Support both UUID and display_name lookups
    const lookupColumn = isUUID(questionId) ? 'id' : 'display_name';
    const { data: question, error } = await supabase
      .from('questions')
      .select('id, display_name, question')
      .ilike(lookupColumn, questionId)
      .single();

    if (error || !question) {
      console.warn(`[${requestId}] Question not found: ${questionId}, error: ${error?.message || 'no data'}`);
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
    console.log(`[${requestId}] Found question ${question.display_name} (${question.id}), generating OG HTML`);
    // Use UUID in canonical URL for stability
    canonicalUrl = `${SITE_URL}/questions/${question.id}`;
    const title = `Question ${question.display_name.toUpperCase()} | ${SITE_NAME}`;
    const licenseName = getLicenseName(question.display_name);
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
    console.error(`[${requestId}] Error generating OpenGraph HTML:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(`Internal server error: ${errorMessage}`, {
      status: 500,
      headers: corsHeaders,
    });
  }
});
