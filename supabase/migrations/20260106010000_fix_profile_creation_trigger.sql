-- Fix: Restore profile creation trigger that was removed by 20260105000000_track_user_signup_trigger.sql
--
-- The previous migration replaced the on_auth_user_created trigger, which originally
-- called handle_new_user() to create profiles. This migration adds a separate trigger
-- for profile creation to run alongside the signup tracking trigger.

-- Verify the handle_new_user function exists before creating the trigger
do $$
begin
  if not exists (
    select 1 from pg_proc p
    join pg_namespace n on p.pronamespace = n.oid
    where n.nspname = 'public' and p.proname = 'handle_new_user'
  ) then
    raise exception 'Required function public.handle_new_user() does not exist. Run earlier migrations first.';
  end if;
end $$;

-- Create trigger for profile creation (separate from signup tracking)
-- This ensures new users get a profile row created automatically
drop trigger if exists on_auth_user_profile_created on auth.users;
create trigger on_auth_user_profile_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
