import { describe, it, expect } from 'vitest';
import {
  success,
  failure,
  isSuccess,
  isFailure,
  unwrapOrThrow,
  ServiceLayerError,
} from './types';
import type { ServiceResult, ServiceError } from './types';

describe('ServiceResult helpers', () => {
  describe('success()', () => {
    it('wraps data in a successful result', () => {
      const result = success({ id: '1', name: 'test' });
      expect(result).toEqual({ success: true, data: { id: '1', name: 'test' } });
    });

    it('works with primitive values', () => {
      expect(success(42)).toEqual({ success: true, data: 42 });
      expect(success('hello')).toEqual({ success: true, data: 'hello' });
      expect(success(null)).toEqual({ success: true, data: null });
    });

    it('works with arrays', () => {
      const result = success([1, 2, 3]);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([1, 2, 3]);
      }
    });
  });

  describe('failure()', () => {
    it('creates an error result with code and message', () => {
      const result = failure('NOT_FOUND', 'Question not found');
      expect(result).toEqual({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Question not found',
          cause: undefined,
          details: undefined,
        },
      });
    });

    it('includes cause when provided', () => {
      const cause = new Error('DB error');
      const result = failure('DATABASE_ERROR', 'Query failed', cause);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.cause).toBe(cause);
      }
    });

    it('includes details when provided', () => {
      const result = failure('VALIDATION_ERROR', 'Invalid input', undefined, {
        field: 'email',
        constraint: 'format',
      });
      if (!result.success) {
        expect(result.error.details).toEqual({ field: 'email', constraint: 'format' });
      }
    });

    it('is typed as ServiceResult<never> for any consumer', () => {
      // This verifies the type works - failure() can be assigned to any ServiceResult<T>
      const numResult: ServiceResult<number> = failure('NOT_FOUND', 'nope');
      const strResult: ServiceResult<string> = failure('NOT_FOUND', 'nope');
      expect(numResult.success).toBe(false);
      expect(strResult.success).toBe(false);
    });
  });

  describe('isSuccess()', () => {
    it('returns true for successful results', () => {
      const result = success('data');
      expect(isSuccess(result)).toBe(true);
    });

    it('returns false for failure results', () => {
      const result = failure('NOT_FOUND', 'not found');
      expect(isSuccess(result)).toBe(false);
    });

    it('narrows the type so .data is accessible', () => {
      const result: ServiceResult<string> = success('hello');
      if (isSuccess(result)) {
        // TypeScript should allow this without error
        expect(result.data).toBe('hello');
      }
    });
  });

  describe('isFailure()', () => {
    it('returns true for failure results', () => {
      const result = failure('FORBIDDEN', 'denied');
      expect(isFailure(result)).toBe(true);
    });

    it('returns false for successful results', () => {
      const result = success(123);
      expect(isFailure(result)).toBe(false);
    });

    it('narrows the type so .error is accessible', () => {
      const result: ServiceResult<number> = failure('AUTH_REQUIRED', 'login');
      if (isFailure(result)) {
        expect(result.error.code).toBe('AUTH_REQUIRED');
        expect(result.error.message).toBe('login');
      }
    });
  });

  describe('unwrapOrThrow()', () => {
    it('returns data from a successful result', () => {
      const result = success({ id: 1 });
      expect(unwrapOrThrow(result)).toEqual({ id: 1 });
    });

    it('throws ServiceLayerError on failure', () => {
      const result = failure('NOT_FOUND', 'Question not found');
      expect(() => unwrapOrThrow(result)).toThrow(ServiceLayerError);
    });

    it('thrown error preserves code and message', () => {
      const cause = new Error('pg error');
      const result = failure('DATABASE_ERROR', 'Query failed', cause, { table: 'questions' });

      try {
        unwrapOrThrow(result);
        expect.fail('should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(ServiceLayerError);
        const sle = err as ServiceLayerError;
        expect(sle.code).toBe('DATABASE_ERROR');
        expect(sle.message).toBe('Query failed');
        expect(sle.cause).toBe(cause);
        expect(sle.details).toEqual({ table: 'questions' });
        expect(sle.name).toBe('ServiceLayerError');
      }
    });
  });

  describe('ServiceLayerError', () => {
    it('extends Error', () => {
      const error: ServiceError = {
        code: 'NETWORK_ERROR',
        message: 'Connection failed',
      };
      const sle = new ServiceLayerError(error);
      expect(sle).toBeInstanceOf(Error);
      expect(sle).toBeInstanceOf(ServiceLayerError);
    });

    it('has correct name property', () => {
      const sle = new ServiceLayerError({
        code: 'UNKNOWN_ERROR',
        message: 'oops',
      });
      expect(sle.name).toBe('ServiceLayerError');
    });
  });
});
