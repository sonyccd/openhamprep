// ============================================================
// UNIT TESTS FOR SHARED THROTTLE LOGIC
// ============================================================

import { assertEquals } from "jsr:@std/assert@1";
import { checkThrottle, evaluateThrottle, recordRun, throttledResponse } from "./throttle.ts";

const NOW = Date.parse("2026-05-29T12:00:00.000Z");

// Minimal stub mimicking the supabase-js chain used by checkThrottle/recordRun:
//   from(t).select(c).eq(k,v).maybeSingle() -> { data, error }
//   from(t).upsert(row)                     -> { error }
interface ThrottleRow {
  function_name?: string;
  last_run_at?: string;
}
interface DbError {
  message: string;
}
interface SelectResult {
  data: ThrottleRow | null;
  error: DbError | null;
}

function fakeSupabase(opts: {
  selectResult?: SelectResult;
  upsertResult?: { error: DbError | null };
  onUpsert?: (row: ThrottleRow) => void;
}) {
  return {
    from(_table: string) {
      return {
        select(_cols: string) {
          return {
            eq(_k: string, _v: string) {
              return {
                maybeSingle() {
                  return Promise.resolve(opts.selectResult ?? { data: null, error: null });
                },
              };
            },
          };
        },
        upsert(row: ThrottleRow) {
          opts.onUpsert?.(row);
          return Promise.resolve(opts.upsertResult ?? { error: null });
        },
      };
    },
  };
}

Deno.test("evaluateThrottle - allows when no previous run", () => {
  assertEquals(evaluateThrottle(null, 300, NOW), { allowed: true, retryAfterSeconds: 0 });
  assertEquals(evaluateThrottle(undefined, 300, NOW), { allowed: true, retryAfterSeconds: 0 });
});

Deno.test("evaluateThrottle - allows when interval has fully elapsed", () => {
  const lastRun = new Date(NOW - 301_000).toISOString(); // 301s ago
  assertEquals(evaluateThrottle(lastRun, 300, NOW), { allowed: true, retryAfterSeconds: 0 });
});

Deno.test("evaluateThrottle - allows at exactly the interval boundary", () => {
  const lastRun = new Date(NOW - 300_000).toISOString(); // exactly 300s ago
  assertEquals(evaluateThrottle(lastRun, 300, NOW), { allowed: true, retryAfterSeconds: 0 });
});

Deno.test("evaluateThrottle - blocks when run too recently and reports retry", () => {
  const lastRun = new Date(NOW - 60_000).toISOString(); // 60s ago
  assertEquals(evaluateThrottle(lastRun, 300, NOW), { allowed: false, retryAfterSeconds: 240 });
});

Deno.test("evaluateThrottle - rounds retryAfter up to whole seconds", () => {
  const lastRun = new Date(NOW - 59_500).toISOString(); // 59.5s ago
  const decision = evaluateThrottle(lastRun, 300, NOW);
  assertEquals(decision.allowed, false);
  assertEquals(decision.retryAfterSeconds, 241); // ceil(240.5)
});

Deno.test("evaluateThrottle - allows when timestamp is unparseable (fail open)", () => {
  assertEquals(evaluateThrottle("not-a-date", 300, NOW), { allowed: true, retryAfterSeconds: 0 });
});

// ============================================================
// checkThrottle (read-only) Tests
// ============================================================

Deno.test("checkThrottle - allows when no row exists", async () => {
  const supabase = fakeSupabase({ selectResult: { data: null, error: null } });
  const decision = await checkThrottle(supabase, "fn", 300);
  assertEquals(decision, { allowed: true, retryAfterSeconds: 0 });
});

Deno.test("checkThrottle - blocks when last run is too recent", async () => {
  const recent = new Date(Date.now() - 60_000).toISOString(); // 60s ago
  const supabase = fakeSupabase({ selectResult: { data: { last_run_at: recent }, error: null } });
  const decision = await checkThrottle(supabase, "fn", 300);
  assertEquals(decision.allowed, false);
});

Deno.test("checkThrottle - fails open on read error", async () => {
  const supabase = fakeSupabase({ selectResult: { data: null, error: { message: "boom" } } });
  const decision = await checkThrottle(supabase, "fn", 300);
  assertEquals(decision, { allowed: true, retryAfterSeconds: 0 });
});

Deno.test("checkThrottle - fails open when the query REJECTS (network error)", async () => {
  // supabase-js rejects (not {error}) on network-level failures.
  const supabase = {
    from() {
      return {
        select() {
          return {
            eq() {
              return { maybeSingle: () => Promise.reject(new Error("network down")) };
            },
          };
        },
      };
    },
  };
  const decision = await checkThrottle(supabase, "fn", 300);
  assertEquals(decision, { allowed: true, retryAfterSeconds: 0 });
});

Deno.test("checkThrottle - is read-only (never upserts)", async () => {
  let upserted = false;
  const supabase = fakeSupabase({
    selectResult: { data: null, error: null },
    onUpsert: () => { upserted = true; },
  });
  await checkThrottle(supabase, "fn", 300);
  assertEquals(upserted, false);
});

// ============================================================
// recordRun Tests
// ============================================================

Deno.test("recordRun - upserts the function name with a fresh timestamp", async () => {
  let captured: { function_name?: string; last_run_at?: string } = {};
  const supabase = fakeSupabase({ onUpsert: (row) => { captured = row; } });
  await recordRun(supabase, "my-fn");
  assertEquals(captured.function_name, "my-fn");
  // last_run_at must be a parseable ISO timestamp
  assertEquals(Number.isNaN(Date.parse(captured.last_run_at ?? "")), false);
});

Deno.test("recordRun - swallows write errors (best-effort)", async () => {
  const supabase = fakeSupabase({ upsertResult: { error: { message: "write failed" } } });
  // Should not throw
  await recordRun(supabase, "my-fn");
});

Deno.test("recordRun - swallows a REJECTED upsert (network error)", async () => {
  const supabase = {
    from() {
      return { upsert: () => Promise.reject(new Error("network down")) };
    },
  };
  // Must not throw — a rejection here must not turn a successful run into a 500.
  await recordRun(supabase, "my-fn");
});

// ============================================================
// throttledResponse Tests
// ============================================================

Deno.test("throttledResponse - returns 429 with Retry-After and JSON body", async () => {
  const res = throttledResponse(
    "sync-discourse-topics",
    { allowed: false, retryAfterSeconds: 42 },
    { "Access-Control-Allow-Origin": "*" },
  );

  assertEquals(res.status, 429);
  assertEquals(res.headers.get("Retry-After"), "42");
  assertEquals(res.headers.get("Content-Type"), "application/json");
  // CORS headers are merged through
  assertEquals(res.headers.get("Access-Control-Allow-Origin"), "*");

  const body = await res.json();
  assertEquals(body.error, "Rate limited");
  assertEquals(body.retryAfterSeconds, 42);
  assertEquals(typeof body.message, "string");
});
