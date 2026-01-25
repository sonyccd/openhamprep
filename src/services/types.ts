/**
 * Service Layer Types
 *
 * These types provide a consistent interface for all service layer operations.
 * Services return ServiceResult<T> instead of throwing errors, making error
 * handling explicit and predictable throughout the application.
 */

/**
 * Error codes for categorizing service failures.
 * Helps hooks and components decide how to handle errors (retry, redirect, show message, etc.)
 */
export type ServiceErrorCode =
  | 'AUTH_REQUIRED'        // User must be logged in
  | 'FORBIDDEN'            // User lacks permission
  | 'NOT_FOUND'            // Resource doesn't exist
  | 'VALIDATION_ERROR'     // Invalid input data
  | 'CONFLICT'             // Resource already exists or version mismatch
  | 'RATE_LIMITED'         // Too many requests
  | 'NETWORK_ERROR'        // Connection failed
  | 'DATABASE_ERROR'       // Supabase/PostgreSQL error
  | 'EDGE_FUNCTION_ERROR'  // Edge function failed
  | 'UNKNOWN_ERROR';       // Catch-all for unexpected errors

/**
 * Structured error returned by all services
 */
export interface ServiceError {
  /** Machine-readable error code for programmatic handling */
  code: ServiceErrorCode;
  /** Human-readable message suitable for display */
  message: string;
  /** Original error for debugging (not displayed to users) */
  cause?: unknown;
  /** Additional context for debugging */
  details?: Record<string, unknown>;
}

/**
 * Result type for all service operations.
 * Use discriminated union pattern for type-safe error handling.
 *
 * @example
 * ```typescript
 * const result = await questionService.getById(id);
 * if (!result.success) {
 *   // TypeScript knows result.error exists here
 *   console.error(result.error.message);
 *   return;
 * }
 * // TypeScript knows result.data exists here
 * const question = result.data;
 * ```
 */
export type ServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: ServiceError };

/**
 * Helper to create a successful result
 */
export function success<T>(data: T): ServiceResult<T> {
  return { success: true, data };
}

/**
 * Helper to create an error result
 */
export function failure(
  code: ServiceErrorCode,
  message: string,
  cause?: unknown,
  details?: Record<string, unknown>
): ServiceResult<never> {
  return {
    success: false,
    error: { code, message, cause, details },
  };
}

/**
 * Type guard to check if a result is successful
 */
export function isSuccess<T>(result: ServiceResult<T>): result is { success: true; data: T } {
  return result.success;
}

/**
 * Type guard to check if a result is a failure
 */
export function isFailure<T>(result: ServiceResult<T>): result is { success: false; error: ServiceError } {
  return !result.success;
}

/**
 * Unwrap a successful result or throw the error.
 * Use in TanStack Query queryFn where throwing is expected.
 *
 * @example
 * ```typescript
 * const { data } = useQuery({
 *   queryKey: queryKeys.questions.all(testType),
 *   queryFn: async () => unwrapOrThrow(await questionService.getAll(testType)),
 * });
 * ```
 */
export function unwrapOrThrow<T>(result: ServiceResult<T>): T {
  if (result.success) {
    return result.data;
  }
  throw new ServiceLayerError(result.error);
}

/**
 * Custom error class for service layer failures.
 * Preserves structured error info when thrown.
 */
export class ServiceLayerError extends Error {
  readonly code: ServiceErrorCode;
  readonly cause?: unknown;
  readonly details?: Record<string, unknown>;

  constructor(error: ServiceError) {
    super(error.message);
    this.name = 'ServiceLayerError';
    this.code = error.code;
    this.cause = error.cause;
    this.details = error.details;
  }
}
