import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useGlobalSearch } from './useGlobalSearch';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn(),
  },
}));

// Import mocked supabase
import { supabase } from '@/integrations/supabase/client';

describe('useGlobalSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('starts with empty query', () => {
      const { result } = renderHook(() => useGlobalSearch('technician'));
      expect(result.current.query).toBe('');
    });

    it('starts with empty results', () => {
      const { result } = renderHook(() => useGlobalSearch('technician'));
      expect(result.current.results).toEqual({
        questions: [],
        glossary: [],
        topics: [],
        tools: [],
      });
    });

    it('starts with isLoading false', () => {
      const { result } = renderHook(() => useGlobalSearch('technician'));
      expect(result.current.isLoading).toBe(false);
    });

    it('starts with no error', () => {
      const { result } = renderHook(() => useGlobalSearch('technician'));
      expect(result.current.error).toBe(null);
    });

    it('starts with hasResults false', () => {
      const { result } = renderHook(() => useGlobalSearch('technician'));
      expect(result.current.hasResults).toBe(false);
    });

    it('starts with totalCount 0', () => {
      const { result } = renderHook(() => useGlobalSearch('technician'));
      expect(result.current.totalCount).toBe(0);
    });
  });

  describe('setQuery', () => {
    it('updates query state', () => {
      const { result } = renderHook(() => useGlobalSearch('technician'));

      act(() => {
        result.current.setQuery('antenna');
      });

      expect(result.current.query).toBe('antenna');
    });

    it('does not trigger search for queries shorter than 3 characters', async () => {
      const mockRpc = vi.mocked(supabase.rpc);
      const { result } = renderHook(() => useGlobalSearch('technician'));

      act(() => {
        result.current.setQuery('ab');
      });

      // Fast forward past debounce
      await act(async () => {
        vi.advanceTimersByTime(400);
      });

      expect(mockRpc).not.toHaveBeenCalled();
      expect(result.current.isLoading).toBe(false);
    });

    it('trims whitespace from query', async () => {
      const mockRpc = vi.mocked(supabase.rpc);
      mockRpc.mockResolvedValue({
        data: { questions: [], glossary: [], topics: [], tools: [] },
        error: null,
      });

      const { result } = renderHook(() => useGlobalSearch('technician'));

      act(() => {
        result.current.setQuery('   ');
      });

      await act(async () => {
        vi.advanceTimersByTime(400);
      });

      // Whitespace-only queries should not trigger search
      expect(mockRpc).not.toHaveBeenCalled();
    });
  });

  describe('debouncing', () => {
    it('debounces search by 300ms', async () => {
      const mockRpc = vi.mocked(supabase.rpc);
      mockRpc.mockResolvedValue({
        data: { questions: [], glossary: [], topics: [], tools: [] },
        error: null,
      });

      const { result } = renderHook(() => useGlobalSearch('technician'));

      act(() => {
        result.current.setQuery('antenna');
      });

      // After 100ms, should not have searched yet
      await act(async () => {
        vi.advanceTimersByTime(100);
      });
      expect(mockRpc).not.toHaveBeenCalled();

      // After 300ms total, should have searched
      await act(async () => {
        vi.advanceTimersByTime(200);
      });
      expect(mockRpc).toHaveBeenCalledTimes(1);
    });

    it('cancels previous debounce when query changes', async () => {
      const mockRpc = vi.mocked(supabase.rpc);
      mockRpc.mockResolvedValue({
        data: { questions: [], glossary: [], topics: [], tools: [] },
        error: null,
      });

      const { result } = renderHook(() => useGlobalSearch('technician'));

      act(() => {
        result.current.setQuery('ant');
      });

      // Wait 200ms then change query
      await act(async () => {
        vi.advanceTimersByTime(200);
      });

      act(() => {
        result.current.setQuery('freq');
      });

      // Wait another 200ms (400ms total from first query)
      await act(async () => {
        vi.advanceTimersByTime(200);
      });

      // Should not have searched yet (only 200ms since "freq")
      expect(mockRpc).not.toHaveBeenCalled();

      // Wait another 100ms (300ms since "freq")
      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      // Now should have searched once with "freq"
      expect(mockRpc).toHaveBeenCalledTimes(1);
      expect(mockRpc).toHaveBeenCalledWith('search_content', expect.objectContaining({
        search_query: 'freq',
      }));
    });
  });

  describe('search execution', () => {
    it('calls supabase RPC with correct parameters', async () => {
      const mockRpc = vi.mocked(supabase.rpc);
      mockRpc.mockResolvedValue({
        data: { questions: [], glossary: [], topics: [], tools: [] },
        error: null,
      });

      const { result } = renderHook(() => useGlobalSearch('technician'));

      act(() => {
        result.current.setQuery('antenna');
      });

      await act(async () => {
        vi.advanceTimersByTime(400);
      });

      expect(mockRpc).toHaveBeenCalledWith('search_content', {
        search_query: 'antenna',
        license_prefix: 'T',
        questions_limit: 5,
        glossary_limit: 5,
        topics_limit: 3,
        tools_limit: 3,
      });
    });

    it('uses correct license prefix for general', async () => {
      const mockRpc = vi.mocked(supabase.rpc);
      mockRpc.mockResolvedValue({
        data: { questions: [], glossary: [], topics: [], tools: [] },
        error: null,
      });

      const { result } = renderHook(() => useGlobalSearch('general'));

      act(() => {
        result.current.setQuery('antenna');
      });

      await act(async () => {
        vi.advanceTimersByTime(400);
      });

      expect(mockRpc).toHaveBeenCalledWith('search_content', expect.objectContaining({
        license_prefix: 'G',
      }));
    });

    it('uses correct license prefix for extra', async () => {
      const mockRpc = vi.mocked(supabase.rpc);
      mockRpc.mockResolvedValue({
        data: { questions: [], glossary: [], topics: [], tools: [] },
        error: null,
      });

      const { result } = renderHook(() => useGlobalSearch('extra'));

      act(() => {
        result.current.setQuery('antenna');
      });

      await act(async () => {
        vi.advanceTimersByTime(400);
      });

      expect(mockRpc).toHaveBeenCalledWith('search_content', expect.objectContaining({
        license_prefix: 'E',
      }));
    });

    it('sets isLoading true while searching', async () => {
      const mockRpc = vi.mocked(supabase.rpc);
      let resolvePromise: (value: { data: unknown; error: null }) => void;
      mockRpc.mockReturnValue(new Promise((resolve) => {
        resolvePromise = resolve;
      }) as ReturnType<typeof supabase.rpc>);

      const { result } = renderHook(() => useGlobalSearch('technician'));

      act(() => {
        result.current.setQuery('antenna');
      });

      await act(async () => {
        vi.advanceTimersByTime(400);
      });

      // Should be loading while waiting for response
      expect(result.current.isLoading).toBe(true);

      // Resolve the promise
      await act(async () => {
        resolvePromise!({
          data: { questions: [], glossary: [], topics: [], tools: [] },
          error: null,
        });
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('result transformation', () => {
    it('transforms question results correctly', async () => {
      const mockRpc = vi.mocked(supabase.rpc);
      mockRpc.mockResolvedValue({
        data: {
          questions: [{
            id: 'q1',
            display_name: 'T5A01',
            question: 'What is current measured in?',
            explanation: 'Current is measured in Amperes.',
            rank: 0.9,
          }],
          glossary: [],
          topics: [],
          tools: [],
        },
        error: null,
      });

      const { result } = renderHook(() => useGlobalSearch('technician'));

      act(() => {
        result.current.setQuery('current');
      });

      await act(async () => {
        vi.advanceTimersByTime(400);
      });

      expect(result.current.results.questions).toHaveLength(1);
      expect(result.current.results.questions[0]).toEqual({
        type: 'question',
        id: 'q1',
        title: 'T5A01',
        subtitle: 'What is current measured in?',
        displayName: 'T5A01',
      });
    });

    it('transforms glossary results correctly', async () => {
      const mockRpc = vi.mocked(supabase.rpc);
      mockRpc.mockResolvedValue({
        data: {
          questions: [],
          glossary: [{
            id: 'g1',
            term: 'Antenna',
            definition: 'A device for transmitting or receiving radio waves.',
            rank: 0.8,
          }],
          topics: [],
          tools: [],
        },
        error: null,
      });

      const { result } = renderHook(() => useGlobalSearch('technician'));

      act(() => {
        result.current.setQuery('antenna');
      });

      await act(async () => {
        vi.advanceTimersByTime(400);
      });

      expect(result.current.results.glossary).toHaveLength(1);
      expect(result.current.results.glossary[0]).toEqual({
        type: 'glossary',
        id: 'g1',
        title: 'Antenna',
        subtitle: 'A device for transmitting or receiving radio waves.',
      });
    });

    it('transforms topic results correctly', async () => {
      const mockRpc = vi.mocked(supabase.rpc);
      mockRpc.mockResolvedValue({
        data: {
          questions: [],
          glossary: [],
          topics: [{
            id: 't1',
            slug: 'antenna-basics',
            title: 'Antenna Basics',
            description: 'Learn the fundamentals of antenna design.',
            rank: 0.7,
          }],
          tools: [],
        },
        error: null,
      });

      const { result } = renderHook(() => useGlobalSearch('technician'));

      act(() => {
        result.current.setQuery('antenna');
      });

      await act(async () => {
        vi.advanceTimersByTime(400);
      });

      expect(result.current.results.topics).toHaveLength(1);
      expect(result.current.results.topics[0]).toEqual({
        type: 'topic',
        id: 't1',
        title: 'Antenna Basics',
        subtitle: 'Learn the fundamentals of antenna design.',
        slug: 'antenna-basics',
      });
    });

    it('transforms tool results correctly', async () => {
      const mockRpc = vi.mocked(supabase.rpc);
      mockRpc.mockResolvedValue({
        data: {
          questions: [],
          glossary: [],
          topics: [],
          tools: [{
            id: 'tool1',
            title: 'WSJT-X',
            description: 'Weak signal communication software.',
            url: 'https://wsjt.sourceforge.io/',
            rank: 0.9,
          }],
        },
        error: null,
      });

      const { result } = renderHook(() => useGlobalSearch('technician'));

      act(() => {
        result.current.setQuery('wsjt');
      });

      await act(async () => {
        vi.advanceTimersByTime(400);
      });

      expect(result.current.results.tools).toHaveLength(1);
      expect(result.current.results.tools[0]).toEqual({
        type: 'tool',
        id: 'tool1',
        title: 'WSJT-X',
        subtitle: 'Weak signal communication software.',
        url: 'https://wsjt.sourceforge.io/',
      });
    });

    it('truncates long subtitles', async () => {
      const mockRpc = vi.mocked(supabase.rpc);
      const longQuestion = 'A'.repeat(200);
      mockRpc.mockResolvedValue({
        data: {
          questions: [{
            id: 'q1',
            display_name: 'T5A01',
            question: longQuestion,
            explanation: 'explanation',
            rank: 0.9,
          }],
          glossary: [],
          topics: [],
          tools: [],
        },
        error: null,
      });

      const { result } = renderHook(() => useGlobalSearch('technician'));

      act(() => {
        result.current.setQuery('test');
      });

      await act(async () => {
        vi.advanceTimersByTime(400);
      });

      // Subtitle should be truncated (default is 80 chars in the hook)
      expect(result.current.results.questions[0].subtitle.length).toBeLessThan(100);
    });
  });

  describe('error handling', () => {
    it('sets error state on RPC error', async () => {
      const mockRpc = vi.mocked(supabase.rpc);
      mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
      });

      const { result } = renderHook(() => useGlobalSearch('technician'));

      act(() => {
        result.current.setQuery('antenna');
      });

      await act(async () => {
        vi.advanceTimersByTime(400);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('Database connection failed');
    });

    it('clears results on error', async () => {
      const mockRpc = vi.mocked(supabase.rpc);

      // First, return successful results
      mockRpc.mockResolvedValueOnce({
        data: {
          questions: [{ id: 'q1', display_name: 'T5A01', question: 'Test', explanation: '', rank: 1 }],
          glossary: [],
          topics: [],
          tools: [],
        },
        error: null,
      });

      const { result } = renderHook(() => useGlobalSearch('technician'));

      act(() => {
        result.current.setQuery('test');
      });

      await act(async () => {
        vi.advanceTimersByTime(400);
      });

      expect(result.current.results.questions).toHaveLength(1);

      // Now return an error
      mockRpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'Error' },
      });

      act(() => {
        result.current.setQuery('error');
      });

      await act(async () => {
        vi.advanceTimersByTime(400);
      });

      expect(result.current.results).toEqual({
        questions: [],
        glossary: [],
        topics: [],
        tools: [],
      });
    });
  });

  describe('totalCount and hasResults', () => {
    it('calculates totalCount correctly', async () => {
      const mockRpc = vi.mocked(supabase.rpc);
      mockRpc.mockResolvedValue({
        data: {
          questions: [
            { id: 'q1', display_name: 'T5A01', question: 'Q1', explanation: '', rank: 1 },
            { id: 'q2', display_name: 'T5A02', question: 'Q2', explanation: '', rank: 0.9 },
          ],
          glossary: [
            { id: 'g1', term: 'Term1', definition: 'Def1', rank: 0.8 },
          ],
          topics: [
            { id: 't1', slug: 'topic-1', title: 'Topic 1', description: 'Desc1', rank: 0.7 },
            { id: 't2', slug: 'topic-2', title: 'Topic 2', description: 'Desc2', rank: 0.6 },
          ],
          tools: [
            { id: 'tool1', title: 'Tool 1', description: 'Desc1', url: 'https://example.com', rank: 0.5 },
          ],
        },
        error: null,
      });

      const { result } = renderHook(() => useGlobalSearch('technician'));

      act(() => {
        result.current.setQuery('test');
      });

      await act(async () => {
        vi.advanceTimersByTime(400);
      });

      expect(result.current.totalCount).toBe(6); // 2 questions + 1 glossary + 2 topics + 1 tool
    });

    it('hasResults is true when there are results', async () => {
      const mockRpc = vi.mocked(supabase.rpc);
      mockRpc.mockResolvedValue({
        data: {
          questions: [{ id: 'q1', display_name: 'T5A01', question: 'Q1', explanation: '', rank: 1 }],
          glossary: [],
          topics: [],
          tools: [],
        },
        error: null,
      });

      const { result } = renderHook(() => useGlobalSearch('technician'));

      act(() => {
        result.current.setQuery('test');
      });

      await act(async () => {
        vi.advanceTimersByTime(400);
      });

      expect(result.current.hasResults).toBe(true);
    });

    it('hasResults is true when only tools have results', async () => {
      const mockRpc = vi.mocked(supabase.rpc);
      mockRpc.mockResolvedValue({
        data: {
          questions: [],
          glossary: [],
          topics: [],
          tools: [{ id: 'tool1', title: 'WSJT-X', description: 'Digital mode software', url: 'https://wsjt.sourceforge.io/', rank: 1 }],
        },
        error: null,
      });

      const { result } = renderHook(() => useGlobalSearch('technician'));

      act(() => {
        result.current.setQuery('wsjt');
      });

      await act(async () => {
        vi.advanceTimersByTime(400);
      });

      expect(result.current.hasResults).toBe(true);
    });

    it('hasResults is false when no results', async () => {
      const mockRpc = vi.mocked(supabase.rpc);
      mockRpc.mockResolvedValue({
        data: {
          questions: [],
          glossary: [],
          topics: [],
          tools: [],
        },
        error: null,
      });

      const { result } = renderHook(() => useGlobalSearch('technician'));

      act(() => {
        result.current.setQuery('xyznonexistent');
      });

      await act(async () => {
        vi.advanceTimersByTime(400);
      });

      expect(result.current.hasResults).toBe(false);
    });
  });

  describe('reset', () => {
    it('clears query', async () => {
      const mockRpc = vi.mocked(supabase.rpc);
      mockRpc.mockResolvedValue({
        data: { questions: [], glossary: [], topics: [], tools: [] },
        error: null,
      });

      const { result } = renderHook(() => useGlobalSearch('technician'));

      act(() => {
        result.current.setQuery('antenna');
      });

      await act(async () => {
        vi.advanceTimersByTime(400);
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.query).toBe('');
    });

    it('clears results', async () => {
      const mockRpc = vi.mocked(supabase.rpc);
      mockRpc.mockResolvedValue({
        data: {
          questions: [{ id: 'q1', display_name: 'T5A01', question: 'Q1', explanation: '', rank: 1 }],
          glossary: [],
          topics: [],
          tools: [],
        },
        error: null,
      });

      const { result } = renderHook(() => useGlobalSearch('technician'));

      act(() => {
        result.current.setQuery('test');
      });

      await act(async () => {
        vi.advanceTimersByTime(400);
      });

      expect(result.current.results.questions).toHaveLength(1);

      act(() => {
        result.current.reset();
      });

      expect(result.current.results).toEqual({
        questions: [],
        glossary: [],
        topics: [],
        tools: [],
      });
    });

    it('clears error', async () => {
      const mockRpc = vi.mocked(supabase.rpc);
      mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'Error' },
      });

      const { result } = renderHook(() => useGlobalSearch('technician'));

      act(() => {
        result.current.setQuery('test');
      });

      await act(async () => {
        vi.advanceTimersByTime(400);
      });

      expect(result.current.error).not.toBe(null);

      act(() => {
        result.current.reset();
      });

      expect(result.current.error).toBe(null);
    });
  });

  describe('testType changes', () => {
    it('re-executes search when testType changes', async () => {
      const mockRpc = vi.mocked(supabase.rpc);
      mockRpc.mockResolvedValue({
        data: { questions: [], glossary: [], topics: [], tools: [] },
        error: null,
      });

      const { result, rerender } = renderHook(
        ({ testType }) => useGlobalSearch(testType),
        { initialProps: { testType: 'technician' as const } }
      );

      act(() => {
        result.current.setQuery('antenna');
      });

      await act(async () => {
        vi.advanceTimersByTime(400);
      });

      expect(mockRpc).toHaveBeenCalledWith('search_content', expect.objectContaining({
        license_prefix: 'T',
      }));

      // Change testType
      rerender({ testType: 'general' });

      await act(async () => {
        vi.advanceTimersByTime(400);
      });

      expect(mockRpc).toHaveBeenLastCalledWith('search_content', expect.objectContaining({
        license_prefix: 'G',
      }));
    });
  });
});
