import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchService } from './searchService';

const mockRpc = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('SearchService', () => {
  describe('searchContent', () => {
    it('calls search_content RPC with correct parameters', async () => {
      const mockResponse = {
        questions: [{ id: 'q1', display_name: 'T1A01', question: 'What?', explanation: '', rank: 1 }],
        glossary: [],
        topics: [],
        tools: [],
      };
      mockRpc.mockResolvedValue({ data: mockResponse, error: null });

      const result = await searchService.searchContent({
        searchQuery: 'antenna',
        licensePrefix: 'T',
        questionsLimit: 5,
        glossaryLimit: 5,
        topicsLimit: 3,
        toolsLimit: 3,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.questions).toHaveLength(1);
        expect(result.data.questions[0].display_name).toBe('T1A01');
      }
      expect(mockRpc).toHaveBeenCalledWith('search_content', {
        search_query: 'antenna',
        license_prefix: 'T',
        questions_limit: 5,
        glossary_limit: 5,
        topics_limit: 3,
        tools_limit: 3,
      });
    });

    it('uses default limits when not provided', async () => {
      mockRpc.mockResolvedValue({
        data: { questions: [], glossary: [], topics: [], tools: [] },
        error: null,
      });

      await searchService.searchContent({
        searchQuery: 'test',
        licensePrefix: 'G',
      });

      expect(mockRpc).toHaveBeenCalledWith('search_content', {
        search_query: 'test',
        license_prefix: 'G',
        questions_limit: 5,
        glossary_limit: 5,
        topics_limit: 3,
        tools_limit: 3,
      });
    });

    it('returns failure on RPC error', async () => {
      mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'function not found', code: 'PGRST204', details: '', hint: '' },
      });

      const result = await searchService.searchContent({
        searchQuery: 'test',
        licensePrefix: 'T',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
        expect(result.error.message).toContain('Search failed');
      }
    });

    it('handles thrown errors gracefully', async () => {
      mockRpc.mockRejectedValue(new Error('Network error'));

      const result = await searchService.searchContent({
        searchQuery: 'test',
        licensePrefix: 'T',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Search failed');
      }
    });
  });
});
