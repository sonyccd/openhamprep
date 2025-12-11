import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * Seed Test User Edge Function
 *
 * Creates a test user for preview branch testing.
 * Call this once after preview deployment to create the test account.
 *
 * SECURITY: This function only works on preview branches, not production.
 *
 * Test credentials:
 *   Email: test@example.com
 *   Password: preview-<branch-name>
 *
 * Example: For branch "feat/preview-branch-setup", password is "preview-feat/preview-branch-setup"
 *
 * Usage: POST /functions/v1/seed-test-user
 * Response includes the credentials with the actual password.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TEST_EMAIL = 'test@example.com'

// Production project ref - function is disabled on this project
const PRODUCTION_PROJECT_REF = 'sahfeuvmbnmqusjctrtw'

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!

    // Block on production - extract project ref from URL
    // URL format: https://<project-ref>.supabase.co
    const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]

    if (projectRef === PRODUCTION_PROJECT_REF) {
      console.log('Blocked: seed-test-user is disabled on production')
      return new Response(
        JSON.stringify({ error: 'This function is disabled on production' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get branch name for password
    // Supabase sets SUPABASE_BRANCH_NAME on preview branches
    // Fall back to project ref if not available
    const branchName = Deno.env.get('SUPABASE_BRANCH_NAME')
      || Deno.env.get('BRANCH_NAME')
      || projectRef
      || 'local'

    // Password format: preview-<branch-name>
    const testPassword = `preview-${branchName}`

    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Create admin client with service role key
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const credentials = { email: TEST_EMAIL, password: testPassword }

    // Check if user already exists
    const { data: existingUsers } = await adminClient.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(u => u.email === TEST_EMAIL)

    if (existingUser) {
      // Update password to match current branch name
      const { error: updateError } = await adminClient.auth.admin.updateUserById(
        existingUser.id,
        { password: testPassword }
      )

      if (updateError) {
        console.error('Failed to update test user password:', updateError.message)
      } else {
        console.log('Test user password updated | Password:', testPassword)
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Test user already exists (password updated)',
          credentials,
          branchName
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create test user
    const { data, error } = await adminClient.auth.admin.createUser({
      email: TEST_EMAIL,
      password: testPassword,
      email_confirm: true, // Skip email confirmation
      user_metadata: { display_name: 'Test User' },
      app_metadata: { seeded: true },
    })

    if (error) {
      console.error('Failed to create test user:', error.message)
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Test user created:', data.user?.email, '| Password:', testPassword)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Test user created successfully',
        credentials,
        branchName,
        userId: data.user?.id
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
