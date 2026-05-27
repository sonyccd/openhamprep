-- M4: Remove decorative service_role RLS policies from alerting tables.
-- The service_role key bypasses RLS unconditionally, so these policies have
-- no functional effect. Their presence suggests an intent to use service_role
-- in a context where RLS applies, which would be a misconfiguration.
-- Removing them clarifies that access is via RLS bypass, not policy grant.

DROP POLICY IF EXISTS "Service role can view all alert rules" ON public.alert_rules;
DROP POLICY IF EXISTS "Service role can view all alerts" ON public.alerts;
DROP POLICY IF EXISTS "Service role can insert alerts" ON public.alerts;
DROP POLICY IF EXISTS "Service role can update alerts" ON public.alerts;
