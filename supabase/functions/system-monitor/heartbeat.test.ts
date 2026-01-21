/// <reference lib="deno.ns" />

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  assertSpyCalls,
  spy,
  stub,
} from "https://deno.land/std@0.224.0/testing/mock.ts";

// ============================================================
// HEARTBEAT FUNCTION (extracted for testing)
// ============================================================

/**
 * Send a heartbeat ping to the configured URL (if any).
 * This is the same logic as in index.ts, extracted for unit testing.
 */
async function sendHeartbeat(
  requestId: string,
  getEnv: (key: string) => string | undefined = Deno.env.get.bind(Deno.env),
  fetchFn: typeof fetch = fetch
): Promise<boolean> {
  try {
    const heartbeatUrl = getEnv("HEARTBEAT_URL");

    if (!heartbeatUrl) {
      console.log(`[${requestId}] No HEARTBEAT_URL configured, skipping`);
      return false;
    }

    // Validate URL format
    try {
      new URL(heartbeatUrl);
    } catch {
      console.warn(`[${requestId}] Invalid HEARTBEAT_URL: ${heartbeatUrl}`);
      return false;
    }

    // Send heartbeat ping with 5-second timeout
    console.log(`[${requestId}] Sending heartbeat to ${heartbeatUrl}`);
    const response = await fetchFn(heartbeatUrl, {
      method: "GET",
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      console.log(`[${requestId}] Heartbeat sent successfully (${response.status})`);
      return true;
    } else {
      console.warn(`[${requestId}] Heartbeat failed with status ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error(`[${requestId}] Heartbeat error:`, error);
    return false;
  }
}

// ============================================================
// TESTS
// ============================================================

Deno.test("sendHeartbeat - returns false when HEARTBEAT_URL not configured", async () => {
  const getEnv = (_key: string) => undefined;

  const result = await sendHeartbeat("test-1", getEnv);

  assertEquals(result, false);
});

Deno.test("sendHeartbeat - returns false for invalid URL format", async () => {
  const getEnv = (key: string) => key === "HEARTBEAT_URL" ? "not-a-valid-url" : undefined;

  const result = await sendHeartbeat("test-2", getEnv);

  assertEquals(result, false);
});

Deno.test("sendHeartbeat - returns false for URL without protocol", async () => {
  const getEnv = (key: string) => key === "HEARTBEAT_URL" ? "example.com/heartbeat" : undefined;

  const result = await sendHeartbeat("test-3", getEnv);

  assertEquals(result, false);
});

Deno.test("sendHeartbeat - returns true on successful ping", async () => {
  const getEnv = (key: string) => key === "HEARTBEAT_URL" ? "https://example.com/heartbeat/123" : undefined;

  const mockFetch = () => Promise.resolve(new Response("OK", { status: 200 }));

  const result = await sendHeartbeat("test-4", getEnv, mockFetch);

  assertEquals(result, true);
});

Deno.test("sendHeartbeat - returns false on 4xx response", async () => {
  const getEnv = (key: string) => key === "HEARTBEAT_URL" ? "https://example.com/heartbeat/123" : undefined;

  const mockFetch = () => Promise.resolve(new Response("Not Found", { status: 404 }));

  const result = await sendHeartbeat("test-5", getEnv, mockFetch);

  assertEquals(result, false);
});

Deno.test("sendHeartbeat - returns false on 5xx response", async () => {
  const getEnv = (key: string) => key === "HEARTBEAT_URL" ? "https://example.com/heartbeat/123" : undefined;

  const mockFetch = () => Promise.resolve(new Response("Server Error", { status: 500 }));

  const result = await sendHeartbeat("test-6", getEnv, mockFetch);

  assertEquals(result, false);
});

Deno.test("sendHeartbeat - returns false on network error", async () => {
  const getEnv = (key: string) => key === "HEARTBEAT_URL" ? "https://example.com/heartbeat/123" : undefined;

  const mockFetch = () => Promise.reject(new Error("Network error"));

  const result = await sendHeartbeat("test-7", getEnv, mockFetch);

  assertEquals(result, false);
});

Deno.test("sendHeartbeat - returns false on timeout", async () => {
  const getEnv = (key: string) => key === "HEARTBEAT_URL" ? "https://example.com/heartbeat/123" : undefined;

  const mockFetch = () => Promise.reject(new DOMException("Aborted", "AbortError"));

  const result = await sendHeartbeat("test-8", getEnv, mockFetch);

  assertEquals(result, false);
});

Deno.test("sendHeartbeat - uses GET method", async () => {
  const getEnv = (key: string) => key === "HEARTBEAT_URL" ? "https://example.com/heartbeat/123" : undefined;

  let capturedOptions: RequestInit | undefined;
  const mockFetch = (_url: string | URL | Request, options?: RequestInit) => {
    capturedOptions = options;
    return Promise.resolve(new Response("OK", { status: 200 }));
  };

  await sendHeartbeat("test-9", getEnv, mockFetch);

  assertEquals(capturedOptions?.method, "GET");
});

Deno.test("sendHeartbeat - calls correct URL", async () => {
  const expectedUrl = "https://betteruptime.com/api/v1/heartbeat/abc123";
  const getEnv = (key: string) => key === "HEARTBEAT_URL" ? expectedUrl : undefined;

  let capturedUrl: string | URL | Request | undefined;
  const mockFetch = (url: string | URL | Request, _options?: RequestInit) => {
    capturedUrl = url;
    return Promise.resolve(new Response("OK", { status: 200 }));
  };

  await sendHeartbeat("test-10", getEnv, mockFetch);

  assertEquals(capturedUrl, expectedUrl);
});

Deno.test("sendHeartbeat - accepts various valid URL formats", async () => {
  const validUrls = [
    "https://example.com/heartbeat",
    "http://localhost:3000/health",
    "https://api.betteruptime.com/v1/heartbeat/xyz",
    "https://hc-ping.com/abc-123-def",
  ];

  for (const url of validUrls) {
    const getEnv = (key: string) => key === "HEARTBEAT_URL" ? url : undefined;
    const mockFetch = () => Promise.resolve(new Response("OK", { status: 200 }));

    const result = await sendHeartbeat(`test-url-${url}`, getEnv, mockFetch);
    assertEquals(result, true, `Should accept valid URL: ${url}`);
  }
});
