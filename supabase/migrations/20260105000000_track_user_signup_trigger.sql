-- Enable pg_net extension for HTTP requests from triggers
-- This extension allows PostgreSQL to make HTTP requests asynchronously
create extension if not exists pg_net with schema extensions;

-- Create the webhook trigger function that calls the edge function
-- when a new user signs up. This ensures we capture signup events
-- even when adblockers prevent the frontend Pendo SDK from running.
--
-- SECRETS SETUP REQUIRED:
-- Before this trigger will work, you must set up the following secrets in Supabase Vault:
--   1. Go to Supabase Dashboard > Project Settings > Vault
--   2. Add secret: name='supabase_url', value='https://your-project-ref.supabase.co'
--   3. Add secret: name='service_role_key', value='your-service-role-key'
--
-- Alternatively, use the SQL commands:
--   select vault.create_secret('supabase_url', 'https://your-project-ref.supabase.co');
--   select vault.create_secret('service_role_key', 'your-service-role-key');
--
create or replace function public.handle_new_user_signup()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  supabase_url text;
  service_role_key text;
  edge_function_url text;
  vault_exists boolean;
begin
  -- Check if vault extension is available (it should be on hosted Supabase)
  select exists(
    select 1 from pg_extension where extname = 'supabase_vault'
  ) into vault_exists;

  if vault_exists then
    -- Read secrets from Supabase Vault (recommended approach)
    select decrypted_secret into supabase_url
    from vault.decrypted_secrets
    where name = 'supabase_url'
    limit 1;

    select decrypted_secret into service_role_key
    from vault.decrypted_secrets
    where name = 'service_role_key'
    limit 1;
  else
    -- Fallback to database settings for local development
    supabase_url := current_setting('app.settings.supabase_url', true);
    service_role_key := current_setting('app.settings.service_role_key', true);
  end if;

  -- Skip if settings are not configured (e.g., local development without secrets)
  if supabase_url is null or service_role_key is null then
    raise warning 'Supabase URL or service role key not configured in Vault, skipping user signup tracking. See migration comments for setup instructions.';
    return new;
  end if;

  edge_function_url := supabase_url || '/functions/v1/track-user-signup';

  -- Make async HTTP POST to edge function
  -- Using pg_net for non-blocking HTTP requests
  perform net.http_post(
    url := edge_function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'users',
      'record', jsonb_build_object(
        'id', new.id::text,
        'email', new.email
      )
    )
  );

  return new;
exception
  when others then
    -- Log error but don't fail the signup
    raise warning 'Failed to track user signup: %', sqlerrm;
    return new;
end;
$$;

-- Create the trigger on auth.users
-- Fires after a new user is inserted into the auth.users table
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user_signup();

-- Grant execute permission on the function
grant execute on function public.handle_new_user_signup() to service_role;

comment on function public.handle_new_user_signup() is
  'Triggers on new user signup to send event to Pendo via edge function. Bypasses adblockers that block frontend analytics.';
