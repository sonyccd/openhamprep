-- Security C4: Remove browser-accessible admin write policies on user_roles.
-- The original intent (20251208164257) was that user_roles is managed via
-- Supabase Studio (service_role) only. The optimize migration (20251218100000)
-- quietly reversed that, allowing any admin browser session to grant/revoke
-- admin to arbitrary users with no audit trail. This restores the original posture.
--
-- user_roles writes will only succeed via:
--   a) Supabase Studio / direct DB access (service_role bypasses RLS)
--   b) A future SECURITY DEFINER RPC that enforces audit logging

DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
