// ============================================================
// UNIT TESTS FOR DELETE-DISCOURSE-USER LOGIC
// ============================================================

import { assertEquals } from "jsr:@std/assert@1";
import {
  validateDiscourseConfig,
  buildUserLookupUrl,
  buildUserDeleteUrl,
  successResponse,
  errorResponse,
} from "./logic.ts";

// ============================================================
// validateDiscourseConfig Tests
// ============================================================

Deno.test("validateDiscourseConfig - returns valid config when all present", () => {
  const result = validateDiscourseConfig(
    "https://forum.example.com",
    "api-key-123",
    "admin"
  );

  assertEquals(result.valid, true);
  if (result.valid) {
    assertEquals(result.config.url, "https://forum.example.com");
    assertEquals(result.config.apiKey, "api-key-123");
    assertEquals(result.config.username, "admin");
  }
});

Deno.test("validateDiscourseConfig - returns error for missing URL", () => {
  const result = validateDiscourseConfig(undefined, "api-key", "admin");

  assertEquals(result.valid, false);
  if (!result.valid) {
    assertEquals(result.error, "DISCOURSE_URL not configured");
  }
});

Deno.test("validateDiscourseConfig - returns error for missing API key", () => {
  const result = validateDiscourseConfig(
    "https://forum.example.com",
    undefined,
    "admin"
  );

  assertEquals(result.valid, false);
  if (!result.valid) {
    assertEquals(result.error, "DISCOURSE_API_KEY not configured");
  }
});

Deno.test("validateDiscourseConfig - returns error for missing username", () => {
  const result = validateDiscourseConfig(
    "https://forum.example.com",
    "api-key",
    undefined
  );

  assertEquals(result.valid, false);
  if (!result.valid) {
    assertEquals(result.error, "DISCOURSE_USERNAME not configured");
  }
});

// ============================================================
// buildUserLookupUrl Tests
// ============================================================

Deno.test("buildUserLookupUrl - builds correct URL", () => {
  assertEquals(
    buildUserLookupUrl("https://forum.example.com", "user-123"),
    "https://forum.example.com/u/by-external/user-123.json"
  );
});

Deno.test("buildUserLookupUrl - encodes special characters", () => {
  assertEquals(
    buildUserLookupUrl("https://forum.example.com", "user/with/slashes"),
    "https://forum.example.com/u/by-external/user%2Fwith%2Fslashes.json"
  );
});

// ============================================================
// buildUserDeleteUrl Tests
// ============================================================

Deno.test("buildUserDeleteUrl - builds basic URL", () => {
  assertEquals(
    buildUserDeleteUrl("https://forum.example.com", 123),
    "https://forum.example.com/admin/users/123.json"
  );
});

Deno.test("buildUserDeleteUrl - adds delete_posts parameter", () => {
  assertEquals(
    buildUserDeleteUrl("https://forum.example.com", 123, true),
    "https://forum.example.com/admin/users/123.json?delete_posts=true"
  );
});

Deno.test("buildUserDeleteUrl - adds block_email parameter", () => {
  assertEquals(
    buildUserDeleteUrl("https://forum.example.com", 123, false, true),
    "https://forum.example.com/admin/users/123.json?block_email=true"
  );
});

Deno.test("buildUserDeleteUrl - adds both parameters", () => {
  const url = buildUserDeleteUrl("https://forum.example.com", 123, true, true);
  assertEquals(url.includes("delete_posts=true"), true);
  assertEquals(url.includes("block_email=true"), true);
});

// ============================================================
// successResponse Tests
// ============================================================

Deno.test("successResponse - creates basic response", () => {
  const response = successResponse("User deleted");

  assertEquals(response.success, true);
  assertEquals(response.message, "User deleted");
});

Deno.test("successResponse - includes additional data", () => {
  const response = successResponse("User deleted", { userId: 123 });

  assertEquals(response.success, true);
  assertEquals(response.message, "User deleted");
  assertEquals((response as Record<string, unknown>).userId, 123);
});

// ============================================================
// errorResponse Tests
// ============================================================

Deno.test("errorResponse - creates basic error", () => {
  const response = errorResponse("Something went wrong");

  assertEquals(response.error, "Something went wrong");
});

Deno.test("errorResponse - includes additional details", () => {
  const response = errorResponse("Not found", { code: 404 });

  assertEquals(response.error, "Not found");
  assertEquals((response as Record<string, unknown>).code, 404);
});
