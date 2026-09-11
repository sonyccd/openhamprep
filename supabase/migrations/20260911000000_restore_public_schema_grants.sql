-- Make table-level privileges explicit instead of inheriting them from the
-- platform.
--
-- Why: a preview branch came up with anon, authenticated and service_role
-- holding only TRUNCATE, REFERENCES and TRIGGER on public tables — the four DML
-- privileges were absent. Every signed-in request failed with
-- "42501 permission denied for table ...", including the user_roles lookup that
-- gates admin, so the app was unusable on that branch. Nothing in this repo
-- revokes table privileges; these grants had been arriving implicitly from
-- Supabase's project bootstrap, and that stopped being reliable.
--
-- Postgres checks grants *before* it evaluates RLS, so a missing grant is a hard
-- 403 rather than an empty result. Row access is still governed entirely by the
-- policies defined in earlier migrations: all 39 public tables have RLS enabled,
-- and nothing here weakens that.
--
-- anon is granted SELECT only rather than the GRANT ALL Supabase hands out by
-- default. No policy in this schema grants anon a write — guest mode reads
-- questions and glossary terms and persists nothing — so write privileges for it
-- would be privilege it never uses.
--
-- Note what the ALTER DEFAULT PRIVILEGES block at the bottom does and does not
-- do. Default privileges accumulate: these are added to whatever the platform
-- already records, they do not replace it. Verified by creating a table after
-- applying this on a database whose bootstrap defaults were intact — the new
-- table still came back with all seven privileges for anon. So the SELECT-only
-- posture above is guaranteed for the tables that exist today; on a database
-- that still has Supabase's defaults, new tables will also pick up the broader
-- grant. Narrowing that is a separate decision from fixing the outage, and RLS
-- blocks anon writes either way.
--
-- GRANT is idempotent, so this is safe to re-run.

grant usage on schema public to anon, authenticated, service_role;

-- Existing tables and sequences.
grant select on all tables in schema public to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant all on all tables in schema public to service_role;

grant usage, select on all sequences in schema public to anon, authenticated, service_role;

-- Tables added by future migrations. These run as the migration role, so the
-- defaults are recorded for it and new tables inherit the same privileges
-- without another grant statement.
alter default privileges in schema public
  grant select on tables to anon;

alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;

alter default privileges in schema public
  grant all on tables to service_role;

alter default privileges in schema public
  grant usage, select on sequences to anon, authenticated, service_role;
