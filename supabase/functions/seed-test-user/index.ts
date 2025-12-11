import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * Seed Test User Edge Function
 *
 * Creates a test user for preview branch testing.
 * Call this once after preview deployment to create the test account.
 *
 * Test credentials:
 *   Email: test@example.com
 *   Password: testuser123
 *
 * Usage: POST /functions/v1/seed-test-user
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TEST_USER = {
  email: 'test@example.com',
  password: 'testuser123',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Create admin client with service role key
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Check if user already exists
    const { data: existingUsers } = await adminClient.auth.admin.listUsers()
    const userExists = existingUsers?.users?.some(u => u.email === TEST_USER.email)

    if (userExists) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Test user already exists',
          credentials: TEST_USER
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create test user
    const { data, error } = await adminClient.auth.admin.createUser({
      email: TEST_USER.email,
      password: TEST_USER.password,
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

    console.log('Test user created:', data.user?.email)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Test user created successfully',
        credentials: TEST_USER,
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
