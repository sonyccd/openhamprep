/**
 * Validation utilities for user input
 */

// Forum username must be 3-20 characters, alphanumeric with underscores and hyphens
export const FORUM_USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,20}$/;
export const FORUM_USERNAME_ERROR = 'Username must be 3-20 characters and contain only letters, numbers, underscores, or hyphens';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates a forum username
 * @param username - The username to validate
 * @returns ValidationResult with valid boolean and optional error message
 */
export function validateForumUsername(username: string): ValidationResult {
  const trimmed = username.trim();

  if (!trimmed) {
    return { valid: false, error: 'Forum username cannot be empty' };
  }

  if (!FORUM_USERNAME_REGEX.test(trimmed)) {
    return { valid: false, error: FORUM_USERNAME_ERROR };
  }

  return { valid: true };
}
