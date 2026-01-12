import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  buildUserLookupUrl,
  buildUserDeleteUrl,
  type DiscourseConfig,
} from "./logic.ts";

/**
 * Edge function to delete a user from Discourse forum.
 *
 * This function is called before deleting a user from the local database.
 * It looks up the user in Discourse by their external_id (Supabase user ID)
 * and deletes them if found.
 *
 * The user can only delete their own Discourse account - the function
 * uses the authenticated user's ID from the JWT.
 *
 * Environment variables:
 * - DISCOURSE_URL: Base URL of the Discourse forum (default: https://forum.openhamprep.com)
 * - DISCOURSE_API_KEY: API key from Discourse admin panel (required)
 * - DISCOURSE_USERNAME: Admin username for API calls (required)
 * - SUPABASE_URL: Supabase project URL (auto-set by Supabase)
 * - SUPABASE_SERVICE_ROLE_KEY: Service role key (auto-set by Supabase)
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DEFAULT_DISCOURSE_URL = 'https://forum.openhamprep.com';

interface DiscourseConfig {
  url: string;
  apiKey: string;
  username: string;
}

function getDiscourseConfig(): DiscourseConfig {
  const apiKey = Deno.env.get('DISCOURSE_API_KEY');
  if (!apiKey) {
    throw new Error('DISCOURSE_API_KEY environment variable is required');
  }

  const username = Deno.env.get('DISCOURSE_USERNAME');
  if (!username) {
    throw new Error('DISCOURSE_USERNAME environment variable is required');
  }

  const url = Deno.env.get('DISCOURSE_URL') || DEFAULT_DISCOURSE_URL;

  return { url, apiKey, username };
}

function getSupabaseConfig(): { url: string; serviceRoleKey: string } {
  const url = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!url || !serviceRoleKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required');
  }

  return { url, serviceRoleKey };
}

interface DiscourseUser {
  id: number;
  username: string;
  email: string;
}

interface ApiResponse {
  success: boolean;
  error?: string;
  discourseAccountFound?: boolean;
  discourseUsername?: string;
  message?: string;
}

function errorResponse(error: string, status: number): Response {
  const body: ApiResponse = { success: false, error };
  return new Response(
    JSON.stringify(body),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

function successResponse(data: Omit<ApiResponse, 'success'>): Response {
  const body: ApiResponse = { success: true, ...data };
  return new Response(
    JSON.stringify(body),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

/**
 * Find a Discourse user by their external_id (our Supabase user ID).
 * This is set when users authenticate via OIDC SSO.
 */
async function findDiscourseUserByExternalId(
  config: DiscourseConfig,
  externalId: string
): Promise<DiscourseUser | null> {
  try {
    // Use buildUserLookupUrl from logic.ts
    const response = await fetch(buildUserLookupUrl(config.url, externalId), {
      headers: {
        'Api-Key': config.apiKey,
        'Api-Username': config.username,
      },
    });

    if (response.status === 404) {
      // User not found in Discourse - they may have never logged in to forum
      return null;
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to find Discourse user: ${response.status} ${errorText}`);
      return null;
    }

    const data = await response.json();
    return {
      id: data.user.id,
      username: data.user.username,
      email: data.user.email,
    };
  } catch (error) {
    console.error('Error finding Discourse user:', error);
    return null;
  }
}

/**
 * Delete a Discourse user by their Discourse user ID.
 *
 * Options:
 * - delete_posts: Whether to delete all posts by this user (default: false)
 * - block_email: Whether to block the email from re-registering (default: false)
 *
 * Note: Discourse API may rate limit requests. For high-volume scenarios,
 * consider implementing retry logic with exponential backoff.
 */
async function deleteDiscourseUser(
  config: DiscourseConfig,
  discourseUserId: number,
  options: {
    deletePosts?: boolean;
    blockEmail?: boolean;
  } = {}
): Promise<{ success: boolean; error?: string }> {
  try {
    // Use buildUserDeleteUrl from logic.ts
    const url = buildUserDeleteUrl(
      config.url,
      discourseUserId,
      options.deletePosts ?? false,
      options.blockEmail ?? false
    );

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Api-Key': config.apiKey,
        'Api-Username': config.username,
      },
    });

    if (response.status === 429) {
      return { success: false, error: 'Discourse API rate limit exceeded. Please try again later.' };
    }

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `Discourse API error: ${response.status} ${errorText}` };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error deleting Discourse user',
    };
  }
}

serve(async (req) => {
  const requestId = crypto.randomUUID().slice(0, 8);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log(`[${requestId}] delete-discourse-user: Request received`);

    // Only allow POST requests
    if (req.method !== 'POST') {
      console.warn(`[${requestId}] Method not allowed: ${req.method}`);
      return errorResponse('Method not allowed', 405);
    }

    // Get configuration (validates required env vars)
    const discourseConfig = getDiscourseConfig();
    const supabaseConfig = getSupabaseConfig();

    // Initialize Supabase client
    const supabase = createClient(supabaseConfig.url, supabaseConfig.serviceRoleKey);

    // Require authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.warn(`[${requestId}] Missing authorization header`);
      return errorResponse('Unauthorized: Authentication required', 401);
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify the user's JWT and get their ID
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.warn(`[${requestId}] Invalid token:`, authError?.message || 'no user');
      return errorResponse('Unauthorized: Invalid token', 401);
    }

    console.log(`[${requestId}] User ${user.id} requested Discourse account deletion`);

    // Look up the user in Discourse by their Supabase user ID (external_id)
    const discourseUser = await findDiscourseUserByExternalId(discourseConfig, user.id);

    if (!discourseUser) {
      // User doesn't have a Discourse account - this is fine, return success
      console.log(`[${requestId}] User ${user.id} has no Discourse account - nothing to delete`);
      return successResponse({
        discourseAccountFound: false,
        message: 'No Discourse account found for this user',
      });
    }

    console.log(`[${requestId}] Found Discourse user: ${discourseUser.username} (ID: ${discourseUser.id})`);

    // Parse request body for options
    const body = await req.json().catch(() => ({}));
    const deletePosts = body.deletePosts === true;

    console.log(`[${requestId}] Deleting Discourse user ${discourseUser.id} (deletePosts: ${deletePosts})`);

    // Delete the user from Discourse
    const deleteResult = await deleteDiscourseUser(discourseConfig, discourseUser.id, {
      deletePosts,
      blockEmail: false, // Don't block - user might want to re-register
    });

    if (!deleteResult.success) {
      console.error(`[${requestId}] Failed to delete Discourse user ${discourseUser.id}: ${deleteResult.error}`);
      return new Response(
        JSON.stringify({
          success: false,
          error: deleteResult.error,
          discourseAccountFound: true,
          discourseUsername: discourseUser.username,
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[${requestId}] Successfully deleted Discourse user ${discourseUser.username} (ID: ${discourseUser.id})`);

    return successResponse({
      discourseAccountFound: true,
      discourseUsername: discourseUser.username,
      message: 'Discourse account deleted successfully',
    });

  } catch (error) {
    console.error(`[${requestId}] Error:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(errorMessage, 500);
  }
});
