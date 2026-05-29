/// <reference lib="deno.ns" />
/// <reference lib="dom" />

/**
 * Global rate limiting for expensive, admin-gated edge functions (M2 / #222).
 *
 * Backed by the `edge_function_throttle` table (one row per function). Edge
 * functions call `enforceThrottle()` after authenticating; if the operation
 * ran too recently, the caller returns `throttledResponse()` (HTTP 429).
 *
 * This is a coarse, single-region, global throttle — appropriate for the
 * admin-only maintenance endpoints it guards. It is not per-IP rate limiting.
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
 * Read the last-run timestamp for `functionName`, decide whether it may run
 * now, and record the new run time when allowed.
 *
 * Fails open: if the throttle table cannot be read or written, the operation
 * is allowed. These endpoints are already admin-gated, so availability is
 * preferred over hard-failing on a bookkeeping error.
 *
 * @param supabase - A service_role Supabase client (bypasses RLS)
 * @param functionName - Stable identifier for the throttled operation
 * @param minIntervalSeconds - Minimum seconds required between runs
 */
export async function enforceThrottle(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  functionName: string,
  minIntervalSeconds: number,
): Promise<ThrottleDecision> {
  const { data, error } = await supabase
    .from("edge_function_throttle")
    .select("last_run_at")
    .eq("function_name", functionName)
    .maybeSingle();

  if (error) {
    console.error(`[throttle] read error for ${functionName}:`, error);
    return { allowed: true, retryAfterSeconds: 0 };
  }

  const decision = evaluateThrottle(data?.last_run_at, minIntervalSeconds);
  if (!decision.allowed) {
    return decision;
  }

  const { error: upsertError } = await supabase
    .from("edge_function_throttle")
    .upsert({ function_name: functionName, last_run_at: new Date().toISOString() });

  if (upsertError) {
    console.error(`[throttle] write error for ${functionName}:`, upsertError);
  }

  return decision;
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
