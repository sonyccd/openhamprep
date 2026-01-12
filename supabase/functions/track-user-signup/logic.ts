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
