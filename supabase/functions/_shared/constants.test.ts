// ============================================================
// UNIT TESTS FOR SHARED CONSTANTS
// ============================================================

/// <reference lib="deno.ns" />
/// <reference lib="dom" />

import { assertEquals } from "jsr:@std/assert@1";
import {
  isValidUuid,
  getCategorySlug,
  decodeJwtPayload,
  isServiceRoleToken,
  isAllowedOrigin,
  getCorsHeaders,
  CATEGORY_MAP,
  QUESTION_ID_PATTERN,
  UUID_V4_PATTERN,
} from "./constants.ts";

// ============================================================
// isValidUuid Tests
// ============================================================

Deno.test("isValidUuid - returns true for valid UUID v4", () => {
  assertEquals(isValidUuid("550e8400-e29b-41d4-a716-446655440000"), true);
  assertEquals(isValidUuid("6ba7b810-9dad-41d1-80b4-00c04fd430c8"), true);
  assertEquals(isValidUuid("f47ac10b-58cc-4372-a567-0e02b2c3d479"), true);
});

Deno.test("isValidUuid - returns true for uppercase UUID", () => {
  assertEquals(isValidUuid("550E8400-E29B-41D4-A716-446655440000"), true);
});

Deno.test("isValidUuid - returns true for mixed case UUID", () => {
  assertEquals(isValidUuid("550e8400-E29B-41d4-A716-446655440000"), true);
});

Deno.test("isValidUuid - returns false for UUID v1 (wrong version digit)", () => {
  // v1 UUIDs have a 1 in the version position
  assertEquals(isValidUuid("550e8400-e29b-11d4-a716-446655440000"), false);
});

Deno.test("isValidUuid - returns false for invalid variant digit", () => {
  // The variant position (first char after third hyphen) must be 8, 9, a, or b
  assertEquals(isValidUuid("550e8400-e29b-41d4-0716-446655440000"), false);
  assertEquals(isValidUuid("550e8400-e29b-41d4-7716-446655440000"), false);
});

Deno.test("isValidUuid - returns false for wrong length", () => {
  assertEquals(isValidUuid("550e8400-e29b-41d4-a716-44665544000"), false);
  assertEquals(isValidUuid("550e8400-e29b-41d4-a716-4466554400000"), false);
});

Deno.test("isValidUuid - returns false for missing hyphens", () => {
  assertEquals(isValidUuid("550e8400e29b41d4a716446655440000"), false);
});

Deno.test("isValidUuid - returns false for invalid characters", () => {
  assertEquals(isValidUuid("550e8400-e29b-41d4-a716-44665544000g"), false);
  assertEquals(isValidUuid("550e8400-e29b-41d4-a716-44665544000z"), false);
});

Deno.test("isValidUuid - returns false for empty string", () => {
  assertEquals(isValidUuid(""), false);
});

// ============================================================
// getCategorySlug Tests
// ============================================================

Deno.test("getCategorySlug - converts to lowercase", () => {
  assertEquals(getCategorySlug("Technician Questions"), "technician-questions");
  assertEquals(getCategorySlug("GENERAL QUESTIONS"), "general-questions");
});

Deno.test("getCategorySlug - replaces spaces with hyphens", () => {
  assertEquals(getCategorySlug("Extra Questions"), "extra-questions");
});

Deno.test("getCategorySlug - handles multiple spaces", () => {
  assertEquals(getCategorySlug("Extra   Questions"), "extra-questions");
});

Deno.test("getCategorySlug - handles leading/trailing spaces", () => {
  assertEquals(getCategorySlug("  Extra Questions  "), "-extra-questions-");
});

Deno.test("getCategorySlug - handles single word", () => {
  assertEquals(getCategorySlug("Technician"), "technician");
});

// ============================================================
// decodeJwtPayload Tests
// ============================================================

Deno.test("decodeJwtPayload - decodes valid JWT payload", () => {
  // Create a valid JWT with known payload
  // Payload: {"sub":"user-123","role":"authenticated","exp":9999999999}
  const payload = { sub: "user-123", role: "authenticated", exp: 9999999999 };
  const encodedPayload = btoa(JSON.stringify(payload))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
  const token = `header.${encodedPayload}.signature`;

  const result = decodeJwtPayload(token);
  assertEquals(result?.sub, "user-123");
  assertEquals(result?.role, "authenticated");
  assertEquals(result?.exp, 9999999999);
});

Deno.test("decodeJwtPayload - handles service_role token", () => {
  const payload = { role: "service_role", iss: "supabase" };
  const encodedPayload = btoa(JSON.stringify(payload))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
  const token = `header.${encodedPayload}.signature`;

  const result = decodeJwtPayload(token);
  assertEquals(result?.role, "service_role");
});

Deno.test("decodeJwtPayload - returns null for invalid token format", () => {
  assertEquals(decodeJwtPayload("not-a-jwt"), null);
  assertEquals(decodeJwtPayload("only.two"), null);
  assertEquals(decodeJwtPayload("too.many.parts.here"), null);
});

Deno.test("decodeJwtPayload - returns null for invalid base64", () => {
  assertEquals(decodeJwtPayload("header.!!!invalid!!.signature"), null);
});

Deno.test("decodeJwtPayload - handles base64url with different padding requirements", () => {
  // Test payloads that result in different padding lengths (0, 1, 2 '=' chars)
  // Single char payload requires 2 padding chars
  const shortPayload = { a: 1 };
  const encoded1 = btoa(JSON.stringify(shortPayload))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
  const result1 = decodeJwtPayload(`header.${encoded1}.signature`);
  assertEquals(result1?.a, 1);

  // Longer payload with different padding requirement
  const mediumPayload = { role: "authenticated", sub: "user-123" };
  const encoded2 = btoa(JSON.stringify(mediumPayload))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
  const result2 = decodeJwtPayload(`header.${encoded2}.signature`);
  assertEquals(result2?.role, "authenticated");
  assertEquals(result2?.sub, "user-123");
});

Deno.test("decodeJwtPayload - returns null for non-JSON payload", () => {
  const nonJson = btoa("not json");
  assertEquals(decodeJwtPayload(`header.${nonJson}.signature`), null);
});

// ============================================================
// isServiceRoleToken Tests
// ============================================================

Deno.test("isServiceRoleToken - returns true for service_role token", () => {
  const payload = { role: "service_role" };
  const encodedPayload = btoa(JSON.stringify(payload))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
  const token = `header.${encodedPayload}.signature`;

  assertEquals(isServiceRoleToken(token), true);
});

Deno.test("isServiceRoleToken - returns false for authenticated token", () => {
  const payload = { role: "authenticated" };
  const encodedPayload = btoa(JSON.stringify(payload))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
  const token = `header.${encodedPayload}.signature`;

  assertEquals(isServiceRoleToken(token), false);
});

Deno.test("isServiceRoleToken - returns false for anon token", () => {
  const payload = { role: "anon" };
  const encodedPayload = btoa(JSON.stringify(payload))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
  const token = `header.${encodedPayload}.signature`;

  assertEquals(isServiceRoleToken(token), false);
});

Deno.test("isServiceRoleToken - returns false for invalid token", () => {
  assertEquals(isServiceRoleToken("invalid"), false);
});

// ============================================================
// CATEGORY_MAP Tests
// ============================================================

Deno.test("CATEGORY_MAP - contains all three license types", () => {
  assertEquals(CATEGORY_MAP["T"], "Technician Questions");
  assertEquals(CATEGORY_MAP["G"], "General Questions");
  assertEquals(CATEGORY_MAP["E"], "Extra Questions");
});

// ============================================================
// QUESTION_ID_PATTERN Tests
// ============================================================

Deno.test("QUESTION_ID_PATTERN - matches Technician question IDs", () => {
  const match = "T1A01 - What is the...".match(QUESTION_ID_PATTERN);
  assertEquals(match?.[1], "T1A01");
});

Deno.test("QUESTION_ID_PATTERN - matches General question IDs", () => {
  const match = "G2B03 - General question...".match(QUESTION_ID_PATTERN);
  assertEquals(match?.[1], "G2B03");
});

Deno.test("QUESTION_ID_PATTERN - matches Extra question IDs", () => {
  const match = "E3C12 - Extra question...".match(QUESTION_ID_PATTERN);
  assertEquals(match?.[1], "E3C12");
});

Deno.test("QUESTION_ID_PATTERN - matches with optional space before hyphen", () => {
  const match1 = "T1A01- No space".match(QUESTION_ID_PATTERN);
  const match2 = "T1A01  -  Extra spaces".match(QUESTION_ID_PATTERN);
  assertEquals(match1?.[1], "T1A01");
  assertEquals(match2?.[1], "T1A01");
});

Deno.test("QUESTION_ID_PATTERN - does not match invalid prefixes", () => {
  assertEquals("X1A01 - Invalid".match(QUESTION_ID_PATTERN), null);
  assertEquals("A1A01 - Invalid".match(QUESTION_ID_PATTERN), null);
});

// ============================================================
// UUID_V4_PATTERN Tests
// ============================================================

Deno.test("UUID_V4_PATTERN - matches valid v4 UUIDs", () => {
  assertEquals(UUID_V4_PATTERN.test("550e8400-e29b-41d4-a716-446655440000"), true);
  assertEquals(UUID_V4_PATTERN.test("f47ac10b-58cc-4372-a567-0e02b2c3d479"), true);
});

Deno.test("UUID_V4_PATTERN - requires version 4 digit", () => {
  // Must have '4' in the version position
  assertEquals(UUID_V4_PATTERN.test("550e8400-e29b-41d4-a716-446655440000"), true);
  assertEquals(UUID_V4_PATTERN.test("550e8400-e29b-11d4-a716-446655440000"), false);
  assertEquals(UUID_V4_PATTERN.test("550e8400-e29b-51d4-a716-446655440000"), false);
});

// ============================================================
// isAllowedOrigin Tests
// ============================================================

Deno.test("isAllowedOrigin - allows any origin when no appDomain", () => {
  assertEquals(isAllowedOrigin("https://anything.example.com"), true);
  assertEquals(isAllowedOrigin("https://evil.com"), true);
});

Deno.test("isAllowedOrigin - allows exact match with appDomain", () => {
  assertEquals(isAllowedOrigin("https://app.openhamprep.com", "https://app.openhamprep.com"), true);
});

Deno.test("isAllowedOrigin - rejects non-matching origin", () => {
  assertEquals(isAllowedOrigin("https://evil.com", "https://app.openhamprep.com"), false);
});

Deno.test("isAllowedOrigin - allows Vercel preview deployments (https)", () => {
  assertEquals(
    isAllowedOrigin("https://openhamprep-8w4txybzj-brad-bazemores-projects.vercel.app", "https://app.openhamprep.com"),
    true,
  );
  assertEquals(
    isAllowedOrigin("https://my-project-abc123.vercel.app", "https://app.openhamprep.com"),
    true,
  );
});

Deno.test("isAllowedOrigin - rejects http vercel.app (must be https)", () => {
  assertEquals(
    isAllowedOrigin("http://my-project.vercel.app", "https://app.openhamprep.com"),
    false,
  );
});

Deno.test("isAllowedOrigin - rejects bare vercel.app (no subdomain)", () => {
  assertEquals(
    isAllowedOrigin("https://vercel.app", "https://app.openhamprep.com"),
    false,
  );
});

Deno.test("isAllowedOrigin - allows localhost without port", () => {
  assertEquals(isAllowedOrigin("http://localhost", "https://app.openhamprep.com"), true);
});

Deno.test("isAllowedOrigin - allows localhost with port", () => {
  assertEquals(isAllowedOrigin("http://localhost:8080", "https://app.openhamprep.com"), true);
  assertEquals(isAllowedOrigin("http://localhost:3000", "https://app.openhamprep.com"), true);
  assertEquals(isAllowedOrigin("http://localhost:54321", "https://app.openhamprep.com"), true);
});

Deno.test("isAllowedOrigin - rejects https localhost", () => {
  // Local dev servers use http, not https
  assertEquals(isAllowedOrigin("https://localhost:8080", "https://app.openhamprep.com"), false);
});

// ============================================================
// getCorsHeaders Tests
// ============================================================

Deno.test("getCorsHeaders - no APP_DOMAIN returns * regardless of request", () => {
  Deno.env.delete("APP_DOMAIN");
  const req = new Request("https://example.com", {
    headers: { Origin: "https://anything.com" },
  });
  const headers = getCorsHeaders(req);
  assertEquals(headers["Access-Control-Allow-Origin"], "*");
});

Deno.test("getCorsHeaders - no request (legacy) returns APP_DOMAIN directly", () => {
  Deno.env.set("APP_DOMAIN", "https://app.openhamprep.com");
  try {
    const headers = getCorsHeaders();
    assertEquals(headers["Access-Control-Allow-Origin"], "https://app.openhamprep.com");
    // Legacy path doesn't set Vary since there's no dynamic origin selection
    assertEquals(headers["Vary"], undefined);
  } finally {
    Deno.env.delete("APP_DOMAIN");
  }
});

Deno.test("getCorsHeaders - production origin is echoed back with Vary", () => {
  Deno.env.set("APP_DOMAIN", "https://app.openhamprep.com");
  try {
    const req = new Request("https://example.com", {
      headers: { Origin: "https://app.openhamprep.com" },
    });
    const headers = getCorsHeaders(req);
    assertEquals(headers["Access-Control-Allow-Origin"], "https://app.openhamprep.com");
    assertEquals(headers["Vary"], "Origin");
  } finally {
    Deno.env.delete("APP_DOMAIN");
  }
});

Deno.test("getCorsHeaders - Vercel preview origin is echoed back", () => {
  Deno.env.set("APP_DOMAIN", "https://app.openhamprep.com");
  try {
    const previewOrigin = "https://openhamprep-abc123.vercel.app";
    const req = new Request("https://example.com", {
      headers: { Origin: previewOrigin },
    });
    const headers = getCorsHeaders(req);
    assertEquals(headers["Access-Control-Allow-Origin"], previewOrigin);
    assertEquals(headers["Vary"], "Origin");
  } finally {
    Deno.env.delete("APP_DOMAIN");
  }
});

Deno.test("getCorsHeaders - localhost origin is echoed back", () => {
  Deno.env.set("APP_DOMAIN", "https://app.openhamprep.com");
  try {
    const req = new Request("https://example.com", {
      headers: { Origin: "http://localhost:8080" },
    });
    const headers = getCorsHeaders(req);
    assertEquals(headers["Access-Control-Allow-Origin"], "http://localhost:8080");
    assertEquals(headers["Vary"], "Origin");
  } finally {
    Deno.env.delete("APP_DOMAIN");
  }
});

Deno.test("getCorsHeaders - disallowed origin omits Access-Control-Allow-Origin", () => {
  Deno.env.set("APP_DOMAIN", "https://app.openhamprep.com");
  try {
    const req = new Request("https://example.com", {
      headers: { Origin: "https://evil.com" },
    });
    const headers = getCorsHeaders(req);
    assertEquals(headers["Access-Control-Allow-Origin"], undefined);
    assertEquals(headers["Vary"], "Origin");
  } finally {
    Deno.env.delete("APP_DOMAIN");
  }
});

Deno.test("getCorsHeaders - no Origin header omits Access-Control-Allow-Origin", () => {
  Deno.env.set("APP_DOMAIN", "https://app.openhamprep.com");
  try {
    const req = new Request("https://example.com");
    const headers = getCorsHeaders(req);
    assertEquals(headers["Access-Control-Allow-Origin"], undefined);
    assertEquals(headers["Vary"], "Origin");
  } finally {
    Deno.env.delete("APP_DOMAIN");
  }
});

Deno.test("getCorsHeaders - includes Allow-Methods and Allow-Headers", () => {
  Deno.env.delete("APP_DOMAIN");
  const req = new Request("https://example.com", {
    headers: { Origin: "https://anything.com" },
  });
  const headers = getCorsHeaders(req);
  assertEquals(headers["Access-Control-Allow-Methods"], "POST, OPTIONS");
  assertEquals(headers["Access-Control-Allow-Headers"], "authorization, x-client-info, apikey, content-type");
});
