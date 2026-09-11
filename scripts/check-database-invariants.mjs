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
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

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

/**
 * Environment problems rather than invariant violations — docker missing, the
 * database not running, psql failing. Thrown so they can be reported in the same
 * shape as a violation instead of as a Node stack trace, and with a distinct
 * exit code so CI can tell "the check could not run" from "the check failed".
 */
class SetupError extends Error {}

const findContainer = () => {
  let names;
  try {
    names = execFileSync(
      "docker",
      ["ps", "--filter", "name=supabase_db_", "--format", "{{.Names}}"],
      // Capture stderr rather than letting it through: execFileSync forwards the
      // child's stderr to ours by default, which would print docker's raw error
      // alongside the formatted one below.
      { stdio: ["ignore", "pipe", "pipe"] },
    )
      .toString()
      .trim()
      .split("\n")
      .filter(Boolean);
  } catch (cause) {
    throw new SetupError(
      `Could not list Docker containers: ${cause.message.trim()}\n` +
        `  Is Docker Desktop running?`,
    );
  }

  if (names.length === 0) {
    throw new SetupError(
      "No running local Supabase database found.\n  Start it with: npm run supabase:start",
    );
  }

  // Pin to this repo's own project. Taking the first match would silently check
  // whichever project happened to sort first on a machine running more than one
  // local Supabase at a time.
  const projectId = readFileSync(join(REPO_ROOT, "supabase", "config.toml"), "utf8").match(
    /^\s*project_id\s*=\s*"([^"]+)"/m,
  )?.[1];

  if (!projectId) return names[0];

  const expected = `supabase_db_${projectId}`;
  if (names.includes(expected)) return expected;

  throw new SetupError(
    `This repo's Supabase project (${expected}) is not running.\n` +
      `  Other Supabase containers are up: ${names.join(", ")}\n` +
      `  Start this one with: npm run supabase:start`,
  );
};

const query = (container, sql) => {
  try {
    return execFileSync(
      "docker",
      ["exec", container, "psql", "-U", "postgres", "-At", "-F", "\t", "-c", sql],
      { stdio: ["ignore", "pipe", "pipe"] },
    )
      .toString()
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => line.split("\t"));
  } catch (cause) {
    throw new SetupError(
      `Query failed against ${container}: ${cause.stderr?.toString().trim() || cause.message.trim()}`,
    );
  }
};

const check = () => {
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

  // 2. No unconditional read policy outside the guest-readable allowlist.
  //    Both SELECT and ALL are matched: a policy written without a FOR clause is
  //    stored as cmd = 'ALL', and one of those with USING (true) would open reads
  //    *and* writes while slipping past a SELECT-only check.
  const openReads = query(
    container,
    `select distinct tablename, cmd from pg_policies
      where schemaname = 'public' and cmd in ('SELECT','ALL') and qual = 'true'
        and ('public' = any(roles) or 'anon' = any(roles))
      order by 1;`,
  );

  for (const [table, cmd] of openReads) {
    if (!PUBLICLY_READABLE.has(table)) {
      failures.push(
        `public.${table} has a FOR ${cmd} USING (true) policy, usable without signing in` +
          (cmd === "ALL" ? " and covering writes as well as reads" : "") +
          `. If that is intended, add it to PUBLICLY_READABLE in this script and say why in review.`,
      );
    } else if (cmd === "ALL") {
      // Allowlisted for *reading*. FOR ALL on the same table also hands anon
      // writes, which is never what the allowlist was meant to permit.
      failures.push(
        `public.${table} is allowlisted as publicly readable, but its USING (true) policy is ` +
          `FOR ALL, which also permits writes without signing in. Narrow it to FOR SELECT.`,
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

  return { failures, tableCount: tables.length };
};

try {
  const { failures, tableCount } = check();

  if (failures.length > 0) {
    console.error(`\nDatabase invariant check failed (${failures.length}):\n`);
    for (const f of failures) console.error(`  ✗ ${f}`);
    console.error("");
    process.exit(1);
  }

  console.log(
    `Database invariants OK — ${tableCount} tables, all with RLS, ` +
      `${PUBLICLY_READABLE.size} intentionally public, public and storage grants intact.`,
  );
} catch (error) {
  if (!(error instanceof SetupError)) throw error;
  console.error(`\nDatabase invariant check could not run:\n\n  ✗ ${error.message}\n`);
  process.exit(2);
}
