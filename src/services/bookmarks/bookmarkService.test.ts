import { describe, it, expect, vi, beforeEach } from 'vitest';
import { bookmarkService } from './bookmarkService';

// Chainable Supabase mock. Every method returns the same `chain` object,
// which acts as both a builder and a thenable (Promise-like).
// Tests set `mockResult` before calling the service method.

let mockResult: { data?: unknown; error: unknown };

const chain: Record<string, ReturnType<typeof vi.fn>> & {
  then?: (resolve: (v: unknown) => void) => void;
} = {} as never;

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => chain,
  },
}));

function buildChain() {
  const methods = [
    'select', 'insert', 'delete', 'update',
    'eq', 'order', 'single', 'maybeSingle', 'in', 'like', 'ilike',
  ];

  for (const m of methods) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }

  // Make chain itself thenable — when awaited, resolves to mockResult
  chain.then = (resolve: (v: unknown) => void) => resolve(mockResult);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockResult = { data: null, error: null };
  buildChain();
});

const userId = 'user-123';

describe('BookmarkService', () => {
  describe('getAll', () => {
    it('returns bookmarks with flattened display_name', async () => {
      const mockBookmarks = [
        {
          id: 'b1',
          user_id: userId,
          question_id: 'q1',
          note: null,
          created_at: '2024-01-01',
          questions: { display_name: 'T1A01' },
        },
      ];

      mockResult = { data: mockBookmarks, error: null };

      const result = await bookmarkService.getAll(userId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0].display_name).toBe('T1A01');
      }
    });

    it('returns empty array when no bookmarks exist', async () => {
      mockResult = { data: null, error: null };

      const result = await bookmarkService.getAll(userId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });

    it('returns AUTH_REQUIRED when userId is empty', async () => {
      const result = await bookmarkService.getAll('');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('AUTH_REQUIRED');
      }
    });

    it('returns failure on database error', async () => {
      mockResult = {
        data: null,
        error: { message: 'permission denied', code: '42501', details: '', hint: '' },
      };

      const result = await bookmarkService.getAll(userId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('FORBIDDEN');
      }
    });
  });

  describe('add', () => {
    it('inserts a bookmark and returns it', async () => {
      const mockBookmark = {
        id: 'b1',
        user_id: userId,
        question_id: 'q1',
        note: 'Important',
        created_at: '2024-01-01',
      };

      mockResult = { data: mockBookmark, error: null };

      const result = await bookmarkService.add(userId, 'q1', 'Important');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockBookmark);
      }
      expect(chain.insert).toHaveBeenCalledWith({
        user_id: userId,
        question_id: 'q1',
        note: 'Important',
      });
    });

    it('returns CONFLICT on duplicate bookmark', async () => {
      mockResult = {
        data: null,
        error: {
          message: 'duplicate key value violates unique constraint',
          code: '23505',
          details: '',
          hint: '',
        },
      };

      const result = await bookmarkService.add(userId, 'q1');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('CONFLICT');
      }
    });

    it('returns AUTH_REQUIRED when userId is empty', async () => {
      const result = await bookmarkService.add('', 'q1');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('AUTH_REQUIRED');
      }
    });
  });

  describe('remove', () => {
    it('deletes a bookmark successfully', async () => {
      mockResult = { error: null };

      const result = await bookmarkService.remove(userId, 'q1');

      expect(result.success).toBe(true);
      expect(chain.delete).toHaveBeenCalled();
    });

    it('returns failure on database error', async () => {
      mockResult = {
        error: { message: 'permission denied', code: '42501', details: '', hint: '' },
      };

      const result = await bookmarkService.remove(userId, 'q1');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('FORBIDDEN');
      }
    });
  });

  describe('updateNote', () => {
    it('updates a bookmark note successfully', async () => {
      mockResult = { error: null };

      const result = await bookmarkService.updateNote(userId, 'q1', 'Updated note');

      expect(result.success).toBe(true);
      expect(chain.update).toHaveBeenCalledWith({ note: 'Updated note' });
    });

    it('returns failure on database error', async () => {
      mockResult = {
        error: { message: 'not found', code: 'PGRST116', details: '', hint: '' },
      };

      const result = await bookmarkService.updateNote(userId, 'q1', 'note');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });
  });
});
