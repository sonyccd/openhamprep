/**
 * Service Base Class
 *
 * Provides common error handling and utility methods for all services.
 * Services extend this class to get consistent error normalization.
 */

import { PostgrestError } from '@supabase/supabase-js';
import {
  ServiceResult,
  ServiceError,
  ServiceErrorCode,
  success,
  failure,
} from '../types';

/**
 * Base class for all service classes.
 * Provides error handling utilities and common patterns.
 */
export abstract class ServiceBase {
  /**
   * Normalize a Supabase PostgrestError into a ServiceError
   */
  protected normalizePostgrestError(
    error: PostgrestError,
    context?: string
  ): ServiceError {
    const code = this.mapPostgrestCode(error.code);
    const message = context
      ? `${context}: ${error.message}`
      : error.message;

    return {
      code,
      message,
      cause: error,
      details: {
        postgrestCode: error.code,
        hint: error.hint,
        details: error.details,
      },
    };
  }

  /**
   * Map Supabase/PostgreSQL error codes to our error codes
   */
  private mapPostgrestCode(code: string): ServiceErrorCode {
    // PostgreSQL error codes: https://www.postgresql.org/docs/current/errcodes-appendix.html
    switch (code) {
      // Auth errors
      case '42501': // insufficient_privilege
      case 'PGRST301': // JWT expired
        return 'FORBIDDEN';

      // Not found
      case 'PGRST116': // No rows returned
        return 'NOT_FOUND';

      // Constraint violations
      case '23505': // unique_violation
      case '23503': // foreign_key_violation
        return 'CONFLICT';

      // Validation
      case '23502': // not_null_violation
      case '23514': // check_violation
      case '22P02': // invalid_text_representation
        return 'VALIDATION_ERROR';

      // Rate limiting (custom)
      case 'PGRST429':
        return 'RATE_LIMITED';

      default:
        return 'DATABASE_ERROR';
    }
  }

  /**
   * Normalize any error into a ServiceError
   */
  protected normalizeError(error: unknown, context?: string): ServiceError {
    // Already a PostgrestError
    if (this.isPostgrestError(error)) {
      return this.normalizePostgrestError(error, context);
    }

    // Standard Error
    if (error instanceof Error) {
      // Network errors
      if (error.message.includes('NetworkError') || error.message.includes('fetch')) {
        return {
          code: 'NETWORK_ERROR',
          message: context ? `${context}: Network error` : 'Network error',
          cause: error,
        };
      }

      return {
        code: 'UNKNOWN_ERROR',
        message: context ? `${context}: ${error.message}` : error.message,
        cause: error,
      };
    }

    // Unknown error shape
    return {
      code: 'UNKNOWN_ERROR',
      message: context ? `${context}: Unknown error` : 'Unknown error',
      cause: error,
    };
  }

  /**
   * Type guard for PostgrestError.
   * Checks for the `hint` property which is unique to PostgrestError
   * (standard Error objects don't have it), plus validates that
   * `code` and `message` are strings as PostgrestError requires.
   */
  private isPostgrestError(error: unknown): error is PostgrestError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      'message' in error &&
      'details' in error &&
      'hint' in error &&
      typeof (error as Record<string, unknown>).code === 'string' &&
      typeof (error as Record<string, unknown>).message === 'string'
    );
  }

  /**
   * Wrap a Supabase query with error handling.
   * Returns ServiceResult instead of throwing.
   *
   * @example
   * ```typescript
   * async getById(id: string): Promise<ServiceResult<Question>> {
   *   return this.handleQuery(
   *     () => supabase.from('questions').select('*').eq('id', id).single(),
   *     'Failed to fetch question'
   *   );
   * }
   * ```
   */
  protected async handleQuery<T>(
    queryFn: () => Promise<{ data: T | null; error: PostgrestError | null }>,
    errorContext?: string
  ): Promise<ServiceResult<T>> {
    try {
      const { data, error } = await queryFn();

      if (error) {
        return {
          success: false,
          error: this.normalizePostgrestError(error, errorContext),
        };
      }

      if (data === null) {
        return failure('NOT_FOUND', errorContext || 'No data returned');
      }

      return success(data);
    } catch (error) {
      return {
        success: false,
        error: this.normalizeError(error, errorContext),
      };
    }
  }

  /**
   * Wrap a Supabase query that can return null/empty without it being an error
   */
  protected async handleQueryAllowEmpty<T>(
    queryFn: () => Promise<{ data: T | null; error: PostgrestError | null }>,
    defaultValue: T,
    errorContext?: string
  ): Promise<ServiceResult<T>> {
    try {
      const { data, error } = await queryFn();

      if (error) {
        return {
          success: false,
          error: this.normalizePostgrestError(error, errorContext),
        };
      }

      return success(data ?? defaultValue);
    } catch (error) {
      return {
        success: false,
        error: this.normalizeError(error, errorContext),
      };
    }
  }

  /**
   * Wrap a mutation (insert/update/delete) with error handling
   */
  protected async handleMutation<T>(
    mutationFn: () => Promise<{ data: T | null; error: PostgrestError | null }>,
    errorContext?: string
  ): Promise<ServiceResult<T>> {
    return this.handleQuery(mutationFn, errorContext);
  }

  /**
   * Wrap a mutation that doesn't return data
   */
  protected async handleVoidMutation(
    mutationFn: () => Promise<{ error: PostgrestError | null }>,
    errorContext?: string
  ): Promise<ServiceResult<void>> {
    try {
      const { error } = await mutationFn();

      if (error) {
        return {
          success: false,
          error: this.normalizePostgrestError(error, errorContext),
        };
      }

      return success(undefined);
    } catch (error) {
      return {
        success: false,
        error: this.normalizeError(error, errorContext),
      };
    }
  }

  /**
   * Wrap an edge function call with error handling
   */
  protected async handleEdgeFunction<T>(
    functionFn: () => Promise<{ data: T | null; error: Error | null }>,
    errorContext?: string
  ): Promise<ServiceResult<T>> {
    try {
      const { data, error } = await functionFn();

      if (error) {
        return failure(
          'EDGE_FUNCTION_ERROR',
          errorContext ? `${errorContext}: ${error.message}` : error.message,
          error
        );
      }

      if (data === null) {
        return failure('NOT_FOUND', errorContext || 'Edge function returned no data');
      }

      return success(data);
    } catch (error) {
      return {
        success: false,
        error: this.normalizeError(error, errorContext),
      };
    }
  }

  /**
   * Require a user ID, returning failure if not provided.
   * Use at the start of user-scoped service methods.
   */
  protected requireUserId(userId: string | undefined | null): ServiceResult<string> {
    if (!userId) {
      return failure('AUTH_REQUIRED', 'User must be logged in');
    }
    return success(userId);
  }
}
