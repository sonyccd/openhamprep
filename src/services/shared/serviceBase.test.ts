import { describe, it, expect } from 'vitest';
import { PostgrestError } from '@supabase/supabase-js';
import { ServiceBase } from './serviceBase';
import type { ServiceResult } from '../types';

/**
 * Concrete subclass to expose protected methods for testing.
 */
class TestService extends ServiceBase {
  // Expose protected methods for testing
  public testNormalizePostgrestError(error: PostgrestError, context?: string) {
    return this.normalizePostgrestError(error, context);
  }

  public testNormalizeError(error: unknown, context?: string) {
    return this.normalizeError(error, context);
  }

  public testHandleQuery<T>(
    queryFn: () => Promise<{ data: T | null; error: PostgrestError | null }>,
    errorContext?: string
  ): Promise<ServiceResult<T>> {
    return this.handleQuery(queryFn, errorContext);
  }

  public testHandleQueryAllowEmpty<T>(
    queryFn: () => Promise<{ data: T | null; error: PostgrestError | null }>,
    defaultValue: T,
    errorContext?: string
  ): Promise<ServiceResult<T>> {
    return this.handleQueryAllowEmpty(queryFn, defaultValue, errorContext);
  }

  public testHandleVoidMutation(
    mutationFn: () => Promise<{ error: PostgrestError | null }>,
    errorContext?: string
  ): Promise<ServiceResult<void>> {
    return this.handleVoidMutation(mutationFn, errorContext);
  }

  public testHandleEdgeFunction<T>(
    functionFn: () => Promise<{ data: T | null; error: Error | null }>,
    errorContext?: string
  ): Promise<ServiceResult<T>> {
    return this.handleEdgeFunction(functionFn, errorContext);
  }

  public testRequireUserId(userId: string | undefined | null) {
    return this.requireUserId(userId);
  }
}

function makePostgrestError(overrides: Partial<PostgrestError> = {}): PostgrestError {
  return {
    message: 'database error',
    details: '',
    hint: '',
    code: '42000',
    ...overrides,
  };
}

describe('ServiceBase', () => {
  const service = new TestService();

  // ===========================================================================
  // PostgreSQL Error Code Mapping
  // ===========================================================================
  describe('mapPostgrestCode (via normalizePostgrestError)', () => {
    const cases: Array<{ code: string; expected: string; label: string }> = [
      { code: '42501', expected: 'FORBIDDEN', label: 'insufficient_privilege' },
      { code: 'PGRST301', expected: 'FORBIDDEN', label: 'JWT expired' },
      { code: 'PGRST116', expected: 'NOT_FOUND', label: 'no rows returned' },
      { code: '23505', expected: 'CONFLICT', label: 'unique_violation' },
      { code: '23503', expected: 'CONFLICT', label: 'foreign_key_violation' },
      { code: '23502', expected: 'VALIDATION_ERROR', label: 'not_null_violation' },
      { code: '23514', expected: 'VALIDATION_ERROR', label: 'check_violation' },
      { code: '22P02', expected: 'VALIDATION_ERROR', label: 'invalid_text_representation' },
      { code: 'PGRST429', expected: 'RATE_LIMITED', label: 'rate limited' },
      { code: '99999', expected: 'DATABASE_ERROR', label: 'unknown PG code' },
    ];

    it.each(cases)('maps $label ($code) to $expected', ({ code, expected }) => {
      const pgError = makePostgrestError({ code });
      const result = service.testNormalizePostgrestError(pgError);
      expect(result.code).toBe(expected);
    });

    it('includes context in message when provided', () => {
      const pgError = makePostgrestError({ message: 'row not found' });
      const result = service.testNormalizePostgrestError(pgError, 'Loading question');
      expect(result.message).toBe('Loading question: row not found');
    });

    it('uses raw message when no context provided', () => {
      const pgError = makePostgrestError({ message: 'constraint failed' });
      const result = service.testNormalizePostgrestError(pgError);
      expect(result.message).toBe('constraint failed');
    });

    it('preserves original error and details', () => {
      const pgError = makePostgrestError({
        code: '23505',
        hint: 'Try another value',
        details: 'Key (email)=(x) already exists',
      });
      const result = service.testNormalizePostgrestError(pgError);
      expect(result.cause).toBe(pgError);
      expect(result.details).toEqual({
        postgrestCode: '23505',
        hint: 'Try another value',
        details: 'Key (email)=(x) already exists',
      });
    });
  });

  // ===========================================================================
  // normalizeError (generic error normalization)
  // ===========================================================================
  describe('normalizeError', () => {
    it('delegates to normalizePostgrestError for PostgrestError-shaped objects', () => {
      const pgError = makePostgrestError({ code: '23505' });
      const result = service.testNormalizeError(pgError);
      expect(result.code).toBe('CONFLICT');
    });

    it('detects network errors by message content (NetworkError)', () => {
      const error = new Error('NetworkError when attempting to fetch resource');
      const result = service.testNormalizeError(error);
      expect(result.code).toBe('NETWORK_ERROR');
    });

    it('detects network errors by message content (fetch)', () => {
      const error = new Error('Failed to fetch');
      const result = service.testNormalizeError(error, 'Saving bookmark');
      expect(result.code).toBe('NETWORK_ERROR');
      expect(result.message).toBe('Saving bookmark: Network error');
    });

    it('maps generic Error to UNKNOWN_ERROR', () => {
      const error = new Error('Something broke');
      const result = service.testNormalizeError(error);
      expect(result.code).toBe('UNKNOWN_ERROR');
      expect(result.message).toBe('Something broke');
    });

    it('handles non-Error values gracefully', () => {
      const result = service.testNormalizeError('string error');
      expect(result.code).toBe('UNKNOWN_ERROR');
      expect(result.message).toBe('Unknown error');
      expect(result.cause).toBe('string error');
    });

    it('handles null/undefined gracefully', () => {
      expect(service.testNormalizeError(null).code).toBe('UNKNOWN_ERROR');
      expect(service.testNormalizeError(undefined).code).toBe('UNKNOWN_ERROR');
    });
  });

  // ===========================================================================
  // handleQuery
  // ===========================================================================
  describe('handleQuery', () => {
    it('returns success with data on successful query', async () => {
      const result = await service.testHandleQuery(
        async () => ({ data: { id: '1' }, error: null })
      );
      expect(result).toEqual({ success: true, data: { id: '1' } });
    });

    it('returns NOT_FOUND when data is null', async () => {
      const result = await service.testHandleQuery(
        async () => ({ data: null, error: null }),
        'Fetch question'
      );
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NOT_FOUND');
        expect(result.error.message).toBe('Fetch question');
      }
    });

    it('returns failure on PostgrestError', async () => {
      const pgError = makePostgrestError({ code: '42501', message: 'denied' });
      const result = await service.testHandleQuery(
        async () => ({ data: null, error: pgError })
      );
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('FORBIDDEN');
      }
    });

    it('catches thrown exceptions', async () => {
      const result = await service.testHandleQuery(async () => {
        throw new Error('Connection timeout');
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('UNKNOWN_ERROR');
        expect(result.error.message).toContain('Connection timeout');
      }
    });
  });

  // ===========================================================================
  // handleQueryAllowEmpty
  // ===========================================================================
  describe('handleQueryAllowEmpty', () => {
    it('returns default value when data is null', async () => {
      const result = await service.testHandleQueryAllowEmpty(
        async () => ({ data: null, error: null }),
        []
      );
      expect(result).toEqual({ success: true, data: [] });
    });

    it('returns actual data when present', async () => {
      const result = await service.testHandleQueryAllowEmpty(
        async () => ({ data: [1, 2], error: null }),
        []
      );
      expect(result).toEqual({ success: true, data: [1, 2] });
    });

    it('still returns failure on error', async () => {
      const pgError = makePostgrestError({ code: '23505' });
      const result = await service.testHandleQueryAllowEmpty(
        async () => ({ data: null, error: pgError }),
        []
      );
      expect(result.success).toBe(false);
    });
  });

  // ===========================================================================
  // handleVoidMutation
  // ===========================================================================
  describe('handleVoidMutation', () => {
    it('returns success(undefined) when mutation succeeds', async () => {
      const result = await service.testHandleVoidMutation(
        async () => ({ error: null })
      );
      expect(result).toEqual({ success: true, data: undefined });
    });

    it('returns failure on PostgrestError', async () => {
      const pgError = makePostgrestError({ code: '23503', message: 'FK violation' });
      const result = await service.testHandleVoidMutation(
        async () => ({ error: pgError }),
        'Deleting bookmark'
      );
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('CONFLICT');
        expect(result.error.message).toContain('Deleting bookmark');
      }
    });

    it('catches thrown exceptions', async () => {
      const result = await service.testHandleVoidMutation(async () => {
        throw new Error('NetworkError');
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NETWORK_ERROR');
      }
    });
  });

  // ===========================================================================
  // handleEdgeFunction
  // ===========================================================================
  describe('handleEdgeFunction', () => {
    it('returns success with data', async () => {
      const result = await service.testHandleEdgeFunction(
        async () => ({ data: { score: 85 }, error: null })
      );
      expect(result).toEqual({ success: true, data: { score: 85 } });
    });

    it('returns EDGE_FUNCTION_ERROR on error', async () => {
      const error = new Error('Function timed out');
      const result = await service.testHandleEdgeFunction(
        async () => ({ data: null, error }),
        'Calculating readiness'
      );
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('EDGE_FUNCTION_ERROR');
        expect(result.error.message).toContain('Calculating readiness');
        expect(result.error.cause).toBe(error);
      }
    });

    it('returns NOT_FOUND when data is null without error', async () => {
      const result = await service.testHandleEdgeFunction(
        async () => ({ data: null, error: null })
      );
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });

    it('catches thrown exceptions', async () => {
      const result = await service.testHandleEdgeFunction(async () => {
        throw new Error('Failed to fetch');
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NETWORK_ERROR');
      }
    });
  });

  // ===========================================================================
  // requireUserId
  // ===========================================================================
  describe('requireUserId', () => {
    it('returns success with userId when provided', () => {
      const result = service.testRequireUserId('user-123');
      expect(result).toEqual({ success: true, data: 'user-123' });
    });

    it('returns AUTH_REQUIRED for undefined', () => {
      const result = service.testRequireUserId(undefined);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('AUTH_REQUIRED');
      }
    });

    it('returns AUTH_REQUIRED for null', () => {
      const result = service.testRequireUserId(null);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('AUTH_REQUIRED');
      }
    });

    it('returns AUTH_REQUIRED for empty string', () => {
      const result = service.testRequireUserId('');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('AUTH_REQUIRED');
      }
    });
  });
});
