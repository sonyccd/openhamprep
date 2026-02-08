import { describe, it, expect, vi, beforeEach } from 'vitest';
import { glossaryService } from './glossaryService';

// Mock supabase
const mockSelect = vi.fn();
const mockOrder = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockFrom.mockReturnValue({ select: mockSelect });
  mockSelect.mockReturnValue({ order: mockOrder });
});

describe('GlossaryService', () => {
  describe('getAll', () => {
    it('returns glossary terms on success', async () => {
      const mockTerms = [
        { id: '1', term: 'Antenna', definition: 'A device for transmitting or receiving radio waves' },
        { id: '2', term: 'Bandwidth', definition: 'The range of frequencies within a band' },
      ];

      mockOrder.mockResolvedValue({ data: mockTerms, error: null });

      const result = await glossaryService.getAll();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockTerms);
      }
      expect(mockFrom).toHaveBeenCalledWith('glossary_terms');
      expect(mockSelect).toHaveBeenCalledWith('id, term, definition');
      expect(mockOrder).toHaveBeenCalledWith('term', { ascending: true });
    });

    it('returns empty array when no terms exist', async () => {
      mockOrder.mockResolvedValue({ data: null, error: null });

      const result = await glossaryService.getAll();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });

    it('returns failure on database error', async () => {
      const dbError = {
        message: 'relation "glossary_terms" does not exist',
        code: '42P01',
        details: '',
        hint: '',
      };
      mockOrder.mockResolvedValue({ data: null, error: dbError });

      const result = await glossaryService.getAll();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
        expect(result.error.message).toContain('Failed to fetch glossary terms');
      }
    });

    it('returns failure on network error', async () => {
      mockOrder.mockRejectedValue(new Error('NetworkError: Failed to fetch'));

      const result = await glossaryService.getAll();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NETWORK_ERROR');
      }
    });
  });
});
