-- Global rate-limit bookkeeping for expensive, admin-gated edge functions.
-- Addresses security finding M2 (#222): functions like sync-discourse-topics
-- and manage-question-links/refresh perform heavy DB writes and/or outbound
-- traffic with no per-caller throttling beyond Supabase's gateway.
--
-- One row per function records the last time it ran. Edge functions consult
-- this table (via the service_role client, which bypasses RLS) to enforce a
-- minimum interval between runs globally.
CREATE TABLE IF NOT EXISTS public.edge_function_throttle (
  function_name text PRIMARY KEY,
  last_run_at timestamptz NOT NULL DEFAULT now()
);

-- RLS enabled with NO policies => no anon/authenticated client can read or
-- write this table. Only service_role (which bypasses RLS) may access it.
-- The table holds no user data and must never be reachable from the browser.
ALTER TABLE public.edge_function_throttle ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.edge_function_throttle IS
  'Per-function last-run timestamps used by edge functions to globally rate-limit expensive operations (M2/#222). Accessed only via service_role.';
