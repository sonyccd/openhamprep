// ============================================================
// UNIT TESTS FOR TRACK-USER-SIGNUP LOGIC
// ============================================================

import { assertEquals, assertExists } from "jsr:@std/assert@1";
import {
  validateWebhookPayload,
  buildPendoPayload,
  successResponse,
  skippedResponse,
  errorResponse,
  PENDO_TRACK_URL,
  type WebhookPayload,
} from "./logic.ts";

// ============================================================
// validateWebhookPayload Tests
// ============================================================

Deno.test("validateWebhookPayload - returns valid for complete payload", () => {
  const payload: WebhookPayload = {
    type: "INSERT",
    table: "users",
    record: {
      id: "user-123",
      email: "test@example.com",
    },
  };

  const result = validateWebhookPayload(payload);

  assertEquals(result.valid, true);
  if (result.valid) {
    assertEquals(result.userId, "user-123");
    assertEquals(result.email, "test@example.com");
  }
});

Deno.test("validateWebhookPayload - returns invalid for null payload", () => {
  const result = validateWebhookPayload(null);

  assertEquals(result.valid, false);
  if (!result.valid) {
    assertEquals(result.reason, "missing_payload");
  }
});

Deno.test("validateWebhookPayload - returns invalid for undefined payload", () => {
  const result = validateWebhookPayload(undefined);

  assertEquals(result.valid, false);
  if (!result.valid) {
    assertEquals(result.reason, "missing_payload");
  }
});

Deno.test("validateWebhookPayload - returns invalid for missing record", () => {
  const payload = {
    type: "INSERT",
    table: "users",
  } as WebhookPayload;

  const result = validateWebhookPayload(payload);

  assertEquals(result.valid, false);
  if (!result.valid) {
    assertEquals(result.reason, "missing_record");
  }
});

Deno.test("validateWebhookPayload - returns invalid for missing user id", () => {
  const payload: WebhookPayload = {
    type: "INSERT",
    table: "users",
    record: {
      email: "test@example.com",
    },
  };

  const result = validateWebhookPayload(payload);

  assertEquals(result.valid, false);
  if (!result.valid) {
    assertEquals(result.reason, "missing_user_id");
  }
});

Deno.test("validateWebhookPayload - returns invalid for missing email", () => {
  const payload: WebhookPayload = {
    type: "INSERT",
    table: "users",
    record: {
      id: "user-123",
    },
  };

  const result = validateWebhookPayload(payload);

  assertEquals(result.valid, false);
  if (!result.valid) {
    assertEquals(result.reason, "missing_email");
  }
});

// ============================================================
// buildPendoPayload Tests
// ============================================================

Deno.test("buildPendoPayload - creates correct payload structure", () => {
  const timestamp = "2024-01-15T10:30:00.000Z";
  const payload = buildPendoPayload("user-123", "test@example.com", timestamp);

  assertEquals(payload.type, "track");
  assertEquals(payload.event, "user_signed_up");
  assertEquals(payload.visitorId, "user-123");
  assertEquals(payload.accountId, "user-123"); // Same as visitorId
  assertEquals(payload.timestamp, timestamp);
  assertEquals(payload.properties.email, "test@example.com");
  assertEquals(payload.properties.source, "server_side");
});

Deno.test("buildPendoPayload - uses current timestamp when not provided", () => {
  const before = new Date().toISOString();
  const payload = buildPendoPayload("user-123", "test@example.com");
  const after = new Date().toISOString();

  // Timestamp should be between before and after
  assertExists(payload.timestamp);
  assertEquals(payload.timestamp >= before, true);
  assertEquals(payload.timestamp <= after, true);
});

Deno.test("buildPendoPayload - uses visitor ID as account ID", () => {
  const payload = buildPendoPayload("unique-user-id", "user@example.com");

  assertEquals(payload.visitorId, "unique-user-id");
  assertEquals(payload.accountId, "unique-user-id");
});

// ============================================================
// successResponse Tests
// ============================================================

Deno.test("successResponse - creates correct structure", () => {
  const response = successResponse("user-456");

  assertEquals(response.success, true);
  assertEquals(response.userId, "user-456");
});

// ============================================================
// skippedResponse Tests
// ============================================================

Deno.test("skippedResponse - creates correct structure", () => {
  const response = skippedResponse("missing_user_data");

  assertEquals(response.success, true);
  assertEquals(response.skipped, true);
  assertEquals(response.reason, "missing_user_data");
});

Deno.test("skippedResponse - handles pendo key not configured", () => {
  const response = skippedResponse("pendo_key_not_configured");

  assertEquals(response.success, true);
  assertEquals(response.skipped, true);
  assertEquals(response.reason, "pendo_key_not_configured");
});

// ============================================================
// errorResponse Tests
// ============================================================

Deno.test("errorResponse - creates basic error response", () => {
  const response = errorResponse("internal_error", "Something went wrong");

  assertEquals(response.success, false);
  assertEquals(response.error, "internal_error");
  assertEquals(response.message, "Something went wrong");
  assertEquals(response.status, undefined);
});

Deno.test("errorResponse - includes status when provided", () => {
  const response = errorResponse("pendo_api_error", "API failed", 502);

  assertEquals(response.success, false);
  assertEquals(response.error, "pendo_api_error");
  assertEquals(response.message, "API failed");
  assertEquals(response.status, 502);
});

// ============================================================
// Constants Tests
// ============================================================

Deno.test("PENDO_TRACK_URL - is correct endpoint", () => {
  assertEquals(PENDO_TRACK_URL, "https://app.pendo.io/data/track");
});
