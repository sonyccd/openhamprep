import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Edge function to delete a user from Discourse forum.
 *
 * This function is called before deleting a user from the local database.
 * It looks up the user in Discourse by their external_id (Supabase user ID)
 * and deletes them if found.
 *
 * The user can only delete their own Discourse account - the function
 * uses the authenticated user's ID from the JWT.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DISCOURSE_URL = 'https://forum.openhamprep.com';

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

interface DiscourseUser {
  id: number;
  username: string;
  email: string;
}

/**
 * Find a Discourse user by their external_id (our Supabase user ID).
 * This is set when users authenticate via OIDC SSO.
 */
async function findDiscourseUserByExternalId(
  apiKey: string,
  adminUsername: string,
  externalId: string
): Promise<DiscourseUser | null> {
  try {
    // Discourse provides an endpoint to look up users by external_id
    const response = await fetch(
      `${DISCOURSE_URL}/u/by-external/${encodeURIComponent(externalId)}.json`,
      {
        headers: {
          'Api-Key': apiKey,
          'Api-Username': adminUsername,
        },
      }
    );

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
 * - block_urls: Whether to block any URLs in posts (default: false)
 * - block_ip: Whether to block the IP address (default: false)
 */
async function deleteDiscourseUser(
  apiKey: string,
  adminUsername: string,
  discourseUserId: number,
  options: {
    deletePosts?: boolean;
    blockEmail?: boolean;
  } = {}
): Promise<{ success: boolean; error?: string }> {
  try {
    // Build query parameters
    const params = new URLSearchParams();
    if (options.deletePosts) {
      params.append('delete_posts', 'true');
    }
    if (options.blockEmail) {
      params.append('block_email', 'true');
    }

    const url = `${DISCOURSE_URL}/admin/users/${discourseUserId}.json${params.toString() ? '?' + params.toString() : ''}`;

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Api-Key': apiKey,
        'Api-Username': adminUsername,
      },
    });

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
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Discourse configuration
    const { apiKey, username: adminUsername } = getDiscourseConfig();

    // Initialize Supabase client
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

    // Verify the user's JWT and get their ID
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`User ${user.id} requested Discourse account deletion`);

    // Look up the user in Discourse by their Supabase user ID (external_id)
    const discourseUser = await findDiscourseUserByExternalId(apiKey, adminUsername, user.id);

    if (!discourseUser) {
      // User doesn't have a Discourse account - this is fine, return success
      console.log(`User ${user.id} has no Discourse account - nothing to delete`);
      return new Response(
        JSON.stringify({
          success: true,
          discourseAccountFound: false,
          message: 'No Discourse account found for this user',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found Discourse user: ${discourseUser.username} (ID: ${discourseUser.id})`);

    // Parse request body for options
    const body = await req.json().catch(() => ({}));
    const deletePosts = body.deletePosts === true;

    // Delete the user from Discourse
    const deleteResult = await deleteDiscourseUser(apiKey, adminUsername, discourseUser.id, {
      deletePosts,
      blockEmail: false, // Don't block - user might want to re-register
    });

    if (!deleteResult.success) {
      console.error(`Failed to delete Discourse user ${discourseUser.id}: ${deleteResult.error}`);
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

    console.log(`Successfully deleted Discourse user ${discourseUser.username} (ID: ${discourseUser.id})`);

    return new Response(
      JSON.stringify({
        success: true,
        discourseAccountFound: true,
        discourseUsername: discourseUser.username,
        message: 'Discourse account deleted successfully',
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
