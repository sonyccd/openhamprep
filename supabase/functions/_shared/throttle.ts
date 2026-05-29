/// <reference lib="deno.ns" />
/// <reference lib="dom" />

/**
 * Global rate limiting for expensive, admin-gated edge functions (M2 / #222).
 *
 * Backed by the `edge_function_throttle` table (one row per function). The
 * intended usage is a two-phase check-then-record:
 *
 *   1. `checkThrottle()` (read-only) at the start of the handler — if the
 *      operation ran too recently, return `throttledResponse()` (HTTP 429).
 *   2. `recordRun()` only once the work has fully COMPLETED successfully.
 *
 * Recording on completion (rather than at the start) is deliberate:
 *   - A malformed request or a transient failure never arms the cooldown, so
 *     legitimate retries aren't locked out.
 *   - Batched / resumable operations (e.g. sync-discourse-topics, which asks
 *     the caller to "call again for the next batch") must NOT record while
 *     work remains, or the continuation call would be throttled. Callers
 *     record only on the terminal, fully-successful path.
 *
 * This is a coarse, single-region, global throttle for admin-only maintenance
 * endpoints — not per-IP rate limiting. Because the check and the record are
 * separate statements, two concurrent fresh invocations can both pass the
 * check and run (TOCTOU). That is accepted here: these endpoints are
 * admin-gated and have no automated callers, so a concurrent double-run is
 * low-risk and not worth an atomic conditional-upsert (which would also break
 * the batched-completion semantics above).
 */

export interface ThrottleDecision {
  /** Whether the operation is allowed to run now. */
  allowed: boolean;
  /** Seconds the caller should wait before retrying (0 when allowed). */
  retryAfterSeconds: number;
}

/**
 * Pure decision helper: given when an operation last ran, decide whether it may
 * run again now. Treats a missing or unparseable timestamp as "allowed".
 *
 * @param lastRunAtIso - ISO timestamp of the previous run (or null/undefined)
 * @param minIntervalSeconds - Minimum seconds required between runs
 * @param nowMs - Current time in ms (injectable for testing)
 */
export function evaluateThrottle(
  lastRunAtIso: string | null | undefined,
  minIntervalSeconds: number,
  nowMs: number = Date.now(),
): ThrottleDecision {
  if (!lastRunAtIso) {
    return { allowed: true, retryAfterSeconds: 0 };
  }

  const lastMs = new Date(lastRunAtIso).getTime();
  if (Number.isNaN(lastMs)) {
    return { allowed: true, retryAfterSeconds: 0 };
  }

  const elapsedSeconds = (nowMs - lastMs) / 1000;
  if (elapsedSeconds >= minIntervalSeconds) {
    return { allowed: true, retryAfterSeconds: 0 };
  }

  return {
    allowed: false,
    retryAfterSeconds: Math.ceil(minIntervalSeconds - elapsedSeconds),
  };
}

/**
 * Read-only throttle check: look up when `functionName` last completed and
 * decide whether it may run now. Does NOT record anything — call `recordRun()`
 * after the work succeeds.
 *
 * Fails open: if the throttle table cannot be read, the operation is allowed.
 * These endpoints are already admin-gated, so availability is preferred over
 * hard-failing on a bookkeeping error.
 *
 * @param supabase - A service_role Supabase client (bypasses RLS)
 * @param functionName - Stable identifier for the throttled operation
 * @param minIntervalSeconds - Minimum seconds required between runs
 */
export async function checkThrottle(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  functionName: string,
  minIntervalSeconds: number,
): Promise<ThrottleDecision> {
  try {
    const { data, error } = await supabase
      .from("edge_function_throttle")
      .select("last_run_at")
      .eq("function_name", functionName)
      .maybeSingle();

    if (error) {
      console.error(`[throttle] read error for ${functionName}:`, error);
      return { allowed: true, retryAfterSeconds: 0 };
    }

    return evaluateThrottle(data?.last_run_at, minIntervalSeconds);
  } catch (err) {
    // supabase-js returns {error} for PostgREST errors but the underlying
    // fetch REJECTS on network-level failures — fail open here too.
    console.error(`[throttle] read threw for ${functionName}:`, err);
    return { allowed: true, retryAfterSeconds: 0 };
  }
}

/**
 * Record that `functionName` just completed a run, arming its cooldown.
 *
 * Call this ONLY on the terminal, fully-successful path — never while work
 * remains (batched continuations) or after a failure, or you'll lock out
 * legitimate follow-up calls. Errors are logged but not thrown (best-effort).
 *
 * @param supabase - A service_role Supabase client (bypasses RLS)
 * @param functionName - Stable identifier for the throttled operation
 */
export async function recordRun(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  functionName: string,
): Promise<void> {
  try {
    const { error } = await supabase
      .from("edge_function_throttle")
      .upsert({ function_name: functionName, last_run_at: new Date().toISOString() });

    if (error) {
      console.error(`[throttle] write error for ${functionName}:`, error);
    }
  } catch (err) {
    // Best-effort: a network-level rejection must not turn a successful run
    // into a 500. The only cost of a missed write is the cooldown not arming.
    console.error(`[throttle] write threw for ${functionName}:`, err);
  }
}

/**
 * Build a standard HTTP 429 response for a throttled request, including a
 * `Retry-After` header.
 */
export function throttledResponse(
  functionName: string,
  decision: ThrottleDecision,
  corsHeaders: Record<string, string>,
): Response {
  return new Response(
    JSON.stringify({
      error: "Rate limited",
      message: `${functionName} ran too recently; retry in ${decision.retryAfterSeconds}s`,
      retryAfterSeconds: decision.retryAfterSeconds,
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Retry-After": String(decision.retryAfterSeconds),
      },
    },
  );
}
