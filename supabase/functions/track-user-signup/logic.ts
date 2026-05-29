/// <reference lib="deno.ns" />

// ============================================================
// PURE LOGIC FOR TRACK-USER-SIGNUP EDGE FUNCTION
// ============================================================
// This module contains pure, testable functions extracted from index.ts

/**
 * Webhook payload from the database trigger.
 * Sent when a new user is inserted into auth.users.
 */
export interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: {
    id?: string;
    email?: string;
  };
}

/**
 * Pendo Track Events API payload structure.
 */
export interface PendoTrackPayload {
  type: "track";
  event: string;
  visitorId: string;
  accountId: string;
  timestamp: string;
  properties: {
    email: string;
    source: string;
  };
}

/**
 * Result of validating webhook payload.
 */
export type PayloadValidationResult =
  | { valid: true; userId: string; email: string }
  | { valid: false; reason: string };

/**
 * Result of verifying the webhook caller's authorization.
 */
export type AuthVerificationResult =
  | { authorized: true }
  | { authorized: false; reason: string };

/**
 * Constant-time string comparison to avoid leaking match length/position via
 * timing. Returns true only if both strings are identical.
 */
export function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Verifies the webhook caller presented the service role key as a Bearer token.
 *
 * The database trigger (`track_user_signup_trigger`) calls this function with
 * `Authorization: Bearer <service_role_key>`. Validating that header confirms
 * the request genuinely originated from our backend rather than an arbitrary
 * client POSTing fake signup events.
 *
 * The env-absent skip-and-warn case is handled by the caller (see index.ts),
 * mirroring the optional `PENDO_INTEGRATION_KEY` graceful-degradation pattern.
 *
 * @param authHeader - Raw `Authorization` request header (or null)
 * @param expectedKey - The service role key to compare against
 * @returns Whether the caller is authorized, with a reason on failure
 */
export function verifyServiceRoleAuth(
  authHeader: string | null,
  expectedKey: string
): AuthVerificationResult {
  if (!authHeader) {
    return { authorized: false, reason: "missing_authorization" };
  }

  const prefix = "Bearer ";
  if (!authHeader.startsWith(prefix)) {
    return { authorized: false, reason: "invalid_authorization_format" };
  }

  const token = authHeader.slice(prefix.length);
  if (!constantTimeEquals(token, expectedKey)) {
    return { authorized: false, reason: "invalid_token" };
  }

  return { authorized: true };
}

/**
 * Validates the webhook payload has required user data.
 *
 * @param payload - Raw webhook payload from database trigger
 * @returns Validation result with user data or error reason
 */
export function validateWebhookPayload(
  payload: WebhookPayload | null | undefined
): PayloadValidationResult {
  if (!payload) {
    return { valid: false, reason: "missing_payload" };
  }

  if (!payload.record) {
    return { valid: false, reason: "missing_record" };
  }

  if (!payload.record.id) {
    return { valid: false, reason: "missing_user_id" };
  }

  if (!payload.record.email) {
    return { valid: false, reason: "missing_email" };
  }

  return {
    valid: true,
    userId: payload.record.id,
    email: payload.record.email,
  };
}

/**
 * Builds the Pendo Track Events API payload.
 *
 * @param userId - User's unique identifier
 * @param email - User's email address
 * @param timestamp - ISO timestamp for the event (defaults to now)
 * @returns Pendo Track payload object
 */
export function buildPendoPayload(
  userId: string,
  email: string,
  timestamp?: string
): PendoTrackPayload {
  return {
    type: "track",
    event: "user_signed_up",
    visitorId: userId,
    accountId: userId, // Using visitor ID as account ID for single-user accounts
    timestamp: timestamp || new Date().toISOString(),
    properties: {
      email,
      source: "server_side",
    },
  };
}

/**
 * Creates a success response object.
 *
 * @param userId - User ID that was tracked
 * @returns Success response payload
 */
export function successResponse(userId: string): { success: true; userId: string } {
  return { success: true, userId };
}

/**
 * Creates a skipped response object.
 *
 * @param reason - Reason the event was skipped
 * @returns Skipped response payload
 */
export function skippedResponse(
  reason: string
): { success: true; skipped: true; reason: string } {
  return { success: true, skipped: true, reason };
}

/**
 * Creates an error response object.
 *
 * @param error - Error type identifier
 * @param message - Human-readable error message
 * @param status - Optional HTTP status code
 * @returns Error response payload
 */
export function errorResponse(
  error: string,
  message: string,
  status?: number
): { success: false; error: string; message: string; status?: number } {
  const response: { success: false; error: string; message: string; status?: number } = {
    success: false,
    error,
    message,
  };

  if (status !== undefined) {
    response.status = status;
  }

  return response;
}

/**
 * Pendo Track Events API endpoint.
 */
export const PENDO_TRACK_URL = "https://app.pendo.io/data/track";
