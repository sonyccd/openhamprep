-- Enable pg_net extension for HTTP requests from triggers
-- This extension allows PostgreSQL to make HTTP requests asynchronously
create extension if not exists pg_net with schema extensions;

-- Create the webhook trigger function that calls the edge function
-- when a new user signs up. This ensures we capture signup events
-- even when adblockers prevent the frontend Pendo SDK from running.
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
begin
  -- Get Supabase URL and service role key from environment
  -- These are set via Supabase Vault or database settings
  supabase_url := current_setting('app.settings.supabase_url', true);
  service_role_key := current_setting('app.settings.service_role_key', true);

  -- Skip if settings are not configured (e.g., local development without secrets)
  if supabase_url is null or service_role_key is null then
    raise warning 'Supabase URL or service role key not configured, skipping user signup tracking';
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
