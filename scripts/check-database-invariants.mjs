#!/usr/bin/env node
/**
 * Asserts the database invariants that RLS actually depends on.
 *
 * These are the two failure modes this repo has hit or come close to:
 *   1. A table ships without RLS, so its policies are decoration.
 *   2. Table privileges go missing, which fails *before* RLS is consulted and
 *      takes every signed-in request down with a 403 (see #277).
 *
 * Runs against local Supabase. Start it first: npm run supabase:start
 */

import { execFileSync } from "node:child_process";

// Tables guest mode is meant to read without signing in. Anything else with an
// unconditional SELECT policy is a leak, so adding to this list should be a
// deliberate review decision rather than a quick green-the-build fix.
const PUBLICLY_READABLE = new Set([
  "arrl_chapters",
  "exam_sessions",
  "glossary_terms",
  "ham_radio_tool_categories",
  "question_pools",
  "questions",
  "readiness_config",
  "syllabus",
]);

// Storage is a separate grant surface with its own schema, so the public-schema
// checks below say nothing about it. Figure uploads and question images break in
// exactly the same invisible way if these go missing.
//
// Caveat on how well this one is tested: storage.objects is owned by
// supabase_storage_admin, and postgres can neither revoke its grants (the
// statement reports REVOKE and changes nothing) nor SET ROLE to it. So unlike
// the public-schema checks, a real storage grant loss could not be simulated
// locally to confirm this catches it. The detection logic itself was verified by
// temporarily requiring a privilege known to be absent, which failed as
// expected. Treat this as a guard that should work rather than one proven
// against the real failure.
const REQUIRED_STORAGE_GRANTS = {
  anon: { objects: ["SELECT"], buckets: ["SELECT"] },
  authenticated: { objects: ["SELECT", "INSERT", "UPDATE", "DELETE"], buckets: ["SELECT"] },
  service_role: { objects: ["SELECT", "INSERT", "UPDATE", "DELETE"], buckets: ["SELECT"] },
};

const REQUIRED_GRANTS = {
  anon: ["SELECT"],
  authenticated: ["SELECT", "INSERT", "UPDATE", "DELETE"],
  service_role: ["SELECT", "INSERT", "UPDATE", "DELETE"],
};

const findContainer = () => {
  const names = execFileSync("docker", [
    "ps",
    "--filter",
    "name=supabase_db_",
    "--format",
    "{{.Names}}",
  ])
    .toString()
    .trim()
    .split("\n")
    .filter(Boolean);

  if (names.length === 0) {
    throw new Error(
      "No running local Supabase database found.\n" +
        "Start it with: npm run supabase:start",
    );
  }
  return names[0];
};

const query = (container, sql) =>
  execFileSync("docker", ["exec", container, "psql", "-U", "postgres", "-At", "-F", "\t", "-c", sql])
    .toString()
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => line.split("\t"));

const failures = [];
const container = findContainer();

// 1. Every public table has RLS enabled.
const noRls = query(
  container,
  `select c.relname from pg_class c
     join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity
    order by 1;`,
).map(([name]) => name);

for (const table of noRls) {
  failures.push(`RLS is not enabled on public.${table} — its policies would not be enforced.`);
}

// 2. No unconditional SELECT policy outside the guest-readable allowlist.
const openReads = query(
  container,
  `select distinct tablename from pg_policies
    where schemaname = 'public' and cmd = 'SELECT' and qual = 'true'
      and ('public' = any(roles) or 'anon' = any(roles))
    order by 1;`,
).map(([name]) => name);

for (const table of openReads) {
  if (!PUBLICLY_READABLE.has(table)) {
    failures.push(
      `public.${table} has a SELECT policy of USING (true) readable without signing in. ` +
        `If that is intended, add it to PUBLICLY_READABLE in this script and say why in review.`,
    );
  }
}

// 3. The roles the app connects as can still reach the tables. A missing grant
//    is a hard 403 that RLS never gets a say in.
const grants = query(
  container,
  `select grantee, table_name, privilege_type from information_schema.role_table_grants
    where table_schema = 'public'
      and grantee in ('anon','authenticated','service_role')
      and privilege_type in ('SELECT','INSERT','UPDATE','DELETE');`,
);

const held = new Map();
for (const [grantee, table, privilege] of grants) {
  const key = `${grantee}|${table}`;
  if (!held.has(key)) held.set(key, new Set());
  held.get(key).add(privilege);
}

const tables = query(
  container,
  `select c.relname from pg_class c
     join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' order by 1;`,
).map(([name]) => name);

for (const [role, required] of Object.entries(REQUIRED_GRANTS)) {
  const missing = [];
  for (const table of tables) {
    const have = held.get(`${role}|${table}`) ?? new Set();
    if (required.some((p) => !have.has(p))) missing.push(table);
  }
  if (missing.length > 0) {
    failures.push(
      `${role} is missing ${required.join("/")} on ${missing.length} table(s), ` +
        `e.g. ${missing.slice(0, 3).join(", ")}. ` +
        `Signed-in requests will fail with 42501 permission denied. See #277.`,
    );
  }
}

// 4. Storage grants. Same failure mode as (3), different schema: question
//    figures and topic content would 403 while every storage policy still reads
//    correctly.
const storageGrants = query(
  container,
  `select grantee, table_name, privilege_type from information_schema.role_table_grants
    where table_schema = 'storage'
      and table_name in ('objects','buckets')
      and grantee in ('anon','authenticated','service_role');`,
);

const storageHeld = new Map();
for (const [grantee, table, privilege] of storageGrants) {
  const key = `${grantee}|${table}`;
  if (!storageHeld.has(key)) storageHeld.set(key, new Set());
  storageHeld.get(key).add(privilege);
}

for (const [role, perTable] of Object.entries(REQUIRED_STORAGE_GRANTS)) {
  for (const [table, required] of Object.entries(perTable)) {
    const have = storageHeld.get(`${role}|${table}`) ?? new Set();
    const missing = required.filter((p) => !have.has(p));
    if (missing.length > 0) {
      failures.push(
        `${role} is missing ${missing.join("/")} on storage.${table}. ` +
          `Figure uploads and question images will fail with permission denied.`,
      );
    }
  }
}

if (failures.length > 0) {
  console.error(`\nDatabase invariant check failed (${failures.length}):\n`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  console.error("");
  process.exit(1);
}

console.log(
  `Database invariants OK — ${tables.length} tables, all with RLS, ` +
    `${PUBLICLY_READABLE.size} intentionally public, public and storage grants intact.`,
);
