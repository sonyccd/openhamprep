# Runbook: `database "postgres" has a collation version mismatch`

**Symptom.** The Supabase Postgres log fills with, once per connection:

```
database "postgres" has a collation version mismatch
database "template1" has a collation version mismatch
```

**Cause.** Postgres records the OS collation library version in
`pg_database.datcollversion` when a database is created. When Supabase upgrades
the platform image, glibc moves (e.g. `153.120` → `153.121`) and the recorded
version no longer matches. Postgres warns on every connection because a
collation change can alter string sort order, which silently corrupts B-tree
indexes on text columns. It will not fix this for you.

**Do not** just refresh the version stamp. That hides the warning and leaves any
index corruption in place.

## 1. Confirm (read-only)

```bash
npx supabase db query --linked "
SELECT datname, datcollversion AS recorded,
       pg_database_collation_actual_version(oid) AS actual,
       datcollversion IS DISTINCT FROM pg_database_collation_actual_version(oid) AS mismatch
FROM pg_database WHERE datname IN ('postgres','template1') ORDER BY datname;"
```

Note the function is `pg_database_collation_actual_version` — the similarly
named `pg_collation_actual_version` takes a *collation* OID and errors here.

Optional: size the rebuild. On 2026-09-17 this was 94 collation-dependent
indexes totalling 6.4 MB in a 140 MB database — seconds of work. If it has
grown to something where a brief `ACCESS EXCLUSIVE` per index matters, prefer
`REINDEX INDEX CONCURRENTLY` per index instead of step 2 as written.

## 2. Rebuild, then refresh — in that order

```bash
npx supabase db query --linked "REINDEX DATABASE postgres;"
npx supabase db query --linked "ALTER DATABASE postgres REFRESH COLLATION VERSION;"
```

Re-run the step 1 query: `postgres` should show `mismatch: false`.

## 3. `template1` — needs Supabase support

`template1` is owned by `supabase_admin`. The `postgres` role the CLI and SQL
editor use is not a member, so this is refused:

```
ERROR: 42501: must be owner of database template1
```

It holds no user data, so the warning is cosmetic. Open a support ticket
asking them to run `ALTER DATABASE template1 REFRESH COLLATION VERSION;`.

## History

- 2026-09-17: `153.120` → `153.121`. `postgres` fixed (REINDEX 5.3s);
  `template1` left for support.
