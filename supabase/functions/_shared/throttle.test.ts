// ============================================================
// UNIT TESTS FOR SHARED THROTTLE LOGIC
// ============================================================

import { assertEquals } from "jsr:@std/assert@1";
import { evaluateThrottle } from "./throttle.ts";

const NOW = Date.parse("2026-05-29T12:00:00.000Z");

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
