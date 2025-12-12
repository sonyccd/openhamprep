import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useProgress } from './useProgress';
import type { Question } from './useQuestions';

// Mock useAuth
vi.mock('./useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'test-user-id' },
  })),
}));

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

const mockQuestion: Question = {
  id: 'T1A01',
  question: 'Test question',
  options: {
    A: 'Option A',
    B: 'Option B',
    C: 'Option C',
    D: 'Option D',
  },
  correctAnswer: 'A',
  subelement: 'T1',
  group: 'T1A',
  links: [],
  explanation: 'Test explanation',
};

describe('useProgress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('saveTestResult', () => {
    it('saves test result with correct score', async () => {
      const { supabase } = await import('@/integrations/supabase/client');

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'test-result-id' },
            error: null,
          }),
        }),
      });

      const mockAttemptsInsert = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'practice_test_results') {
          return { insert: mockInsert } as ReturnType<typeof supabase.from>;
        }
        if (table === 'question_attempts') {
          return { insert: mockAttemptsInsert } as ReturnType<typeof supabase.from>;
        }
        return {} as ReturnType<typeof supabase.from>;
      });

      const { result } = renderHook(() => useProgress());

      const questions = [mockQuestion];
      const answers = { 'T1A01': 'A' as const };

      await result.current.saveTestResult(questions, answers);

      expect(mockInsert).toHaveBeenCalledWith({
        user_id: 'test-user-id',
        score: 1,
        total_questions: 1,
        percentage: 100,
        passed: false, // Need 26 to pass
        test_type: 'technician', // Default test type
      });

      expect(mockAttemptsInsert).toHaveBeenCalledWith([
        {
          user_id: 'test-user-id',
          question_id: 'T1A01',
          selected_answer: 0,
          is_correct: true,
          test_result_id: 'test-result-id',
          attempt_type: 'practice_test',
        },
      ]);
    });

    it('calculates passing score correctly', async () => {
      const { supabase } = await import('@/integrations/supabase/client');

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'test-result-id' },
            error: null,
          }),
        }),
      });

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'practice_test_results') {
          return { insert: mockInsert } as ReturnType<typeof supabase.from>;
        }
        if (table === 'question_attempts') {
          return { insert: vi.fn().mockResolvedValue({ data: null, error: null }) } as ReturnType<typeof supabase.from>;
        }
        return {} as ReturnType<typeof supabase.from>;
      });

      const { result } = renderHook(() => useProgress());

      // Create 35 questions (full test)
      const questions = Array.from({ length: 35 }, (_, i) => ({
        ...mockQuestion,
        id: `T${i}`,
      }));

      // Answer 26 correctly (minimum passing)
      const answers = questions.reduce((acc, q, i) => {
        acc[q.id] = i < 26 ? 'A' : 'B'; // First 26 correct, rest incorrect
        return acc;
      }, {} as Record<string, 'A' | 'B' | 'C' | 'D'>);

      await result.current.saveTestResult(questions, answers);

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          score: 26,
          total_questions: 35,
          percentage: 74, // Math.round((26/35) * 100)
          passed: true,
        })
      );
    });

    it('handles incorrect answers', async () => {
      const { supabase } = await import('@/integrations/supabase/client');

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'test-result-id' },
            error: null,
          }),
        }),
      });

      const mockAttemptsInsert = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'practice_test_results') {
          return { insert: mockInsert } as ReturnType<typeof supabase.from>;
        }
        if (table === 'question_attempts') {
          return { insert: mockAttemptsInsert } as ReturnType<typeof supabase.from>;
        }
        return {} as ReturnType<typeof supabase.from>;
      });

      const { result } = renderHook(() => useProgress());

      const questions = [mockQuestion];
      const answers = { 'T1A01': 'B' as const }; // Wrong answer

      await result.current.saveTestResult(questions, answers);

      expect(mockAttemptsInsert).toHaveBeenCalledWith([
        expect.objectContaining({
          selected_answer: 1, // B = 1
          is_correct: false,
        }),
      ]);
    });

    it('returns null when no user', async () => {
      const { useAuth } = await import('./useAuth');
      vi.mocked(useAuth).mockReturnValue({ user: null } as ReturnType<typeof useAuth>);

      const { result } = renderHook(() => useProgress());

      const testResult = await result.current.saveTestResult([], {});
      expect(testResult).toBeNull();
    });

    it('handles database errors gracefully', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      });

      vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as ReturnType<typeof supabase.from>);

      const { result } = renderHook(() => useProgress());
      const testResult = await result.current.saveTestResult([mockQuestion], { 'T1A01': 'A' });

      // Should return null when there's a database error
      expect(testResult).toBeNull();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('saveRandomAttempt', () => {
    beforeEach(async () => {
      // Reset useAuth mock for these tests
      const { useAuth } = await import('./useAuth');
      vi.mocked(useAuth).mockReturnValue({ user: { id: 'test-user-id' } } as ReturnType<typeof useAuth>);
    });

    it('saves random practice attempt', async () => {
      const { supabase } = await import('@/integrations/supabase/client');

      const mockInsert = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as ReturnType<typeof supabase.from>);

      const { result } = renderHook(() => useProgress());

      await result.current.saveRandomAttempt(mockQuestion, 'A');

      expect(mockInsert).toHaveBeenCalledWith({
        user_id: 'test-user-id',
        question_id: 'T1A01',
        selected_answer: 0,
        is_correct: true,
        attempt_type: 'random_practice',
      });
    });

    it('records incorrect attempts', async () => {
      const { supabase } = await import('@/integrations/supabase/client');

      const mockInsert = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as ReturnType<typeof supabase.from>);

      const { result } = renderHook(() => useProgress());

      await result.current.saveRandomAttempt(mockQuestion, 'D');

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          selected_answer: 3,
          is_correct: false,
        })
      );
    });

    it('does not save when no user', async () => {
      const { useAuth } = await import('./useAuth');
      vi.mocked(useAuth).mockReturnValue({ user: null } as ReturnType<typeof useAuth>);

      const { supabase } = await import('@/integrations/supabase/client');
      const mockInsert = vi.fn();
      vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as ReturnType<typeof supabase.from>);

      const { result } = renderHook(() => useProgress());

      await result.current.saveRandomAttempt(mockQuestion, 'A');

      expect(mockInsert).not.toHaveBeenCalled();
    });

    it('handles all answer options correctly', async () => {
      const { supabase } = await import('@/integrations/supabase/client');

      const mockInsert = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as ReturnType<typeof supabase.from>);

      const { result } = renderHook(() => useProgress());

      await result.current.saveRandomAttempt(mockQuestion, 'A');
      expect(mockInsert).toHaveBeenLastCalledWith(
        expect.objectContaining({ selected_answer: 0 })
      );

      await result.current.saveRandomAttempt(mockQuestion, 'B');
      expect(mockInsert).toHaveBeenLastCalledWith(
        expect.objectContaining({ selected_answer: 1 })
      );

      await result.current.saveRandomAttempt(mockQuestion, 'C');
      expect(mockInsert).toHaveBeenLastCalledWith(
        expect.objectContaining({ selected_answer: 2 })
      );

      await result.current.saveRandomAttempt(mockQuestion, 'D');
      expect(mockInsert).toHaveBeenLastCalledWith(
        expect.objectContaining({ selected_answer: 3 })
      );
    });

    it('uses random_practice as default attempt type', async () => {
      const { supabase } = await import('@/integrations/supabase/client');

      const mockInsert = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as ReturnType<typeof supabase.from>);

      const { result } = renderHook(() => useProgress());

      await result.current.saveRandomAttempt(mockQuestion, 'A');

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({ attempt_type: 'random_practice' })
      );
    });

    it('saves weak_questions attempt type when specified', async () => {
      const { supabase } = await import('@/integrations/supabase/client');

      const mockInsert = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as ReturnType<typeof supabase.from>);

      const { result } = renderHook(() => useProgress());

      await result.current.saveRandomAttempt(mockQuestion, 'A', 'weak_questions');

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({ attempt_type: 'weak_questions' })
      );
    });

    it('saves subelement_practice attempt type when specified', async () => {
      const { supabase } = await import('@/integrations/supabase/client');

      const mockInsert = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as ReturnType<typeof supabase.from>);

      const { result } = renderHook(() => useProgress());

      await result.current.saveRandomAttempt(mockQuestion, 'B', 'subelement_practice');

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          attempt_type: 'subelement_practice',
          is_correct: false, // B is wrong, A is correct
        })
      );
    });
  });

  describe('saveTestResult with testType parameter', () => {
    beforeEach(async () => {
      // Reset useAuth mock for these tests
      const { useAuth } = await import('./useAuth');
      vi.mocked(useAuth).mockReturnValue({ user: { id: 'test-user-id' } } as ReturnType<typeof useAuth>);
    });

    it('saves test result with general test type', async () => {
      const { supabase } = await import('@/integrations/supabase/client');

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'test-result-id' },
            error: null,
          }),
        }),
      });

      const mockAttemptsInsert = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'practice_test_results') {
          return { insert: mockInsert } as ReturnType<typeof supabase.from>;
        }
        if (table === 'question_attempts') {
          return { insert: mockAttemptsInsert } as ReturnType<typeof supabase.from>;
        }
        return {} as ReturnType<typeof supabase.from>;
      });

      const { result } = renderHook(() => useProgress());

      const generalQuestion = {
        ...mockQuestion,
        id: 'G1A01',
      };
      const questions = [generalQuestion];
      const answers = { 'G1A01': 'A' as const };

      await result.current.saveTestResult(questions, answers, 'general');

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          test_type: 'general',
        })
      );
    });

    it('saves test result with extra test type', async () => {
      const { supabase } = await import('@/integrations/supabase/client');

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'test-result-id' },
            error: null,
          }),
        }),
      });

      const mockAttemptsInsert = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'practice_test_results') {
          return { insert: mockInsert } as ReturnType<typeof supabase.from>;
        }
        if (table === 'question_attempts') {
          return { insert: mockAttemptsInsert } as ReturnType<typeof supabase.from>;
        }
        return {} as ReturnType<typeof supabase.from>;
      });

      const { result } = renderHook(() => useProgress());

      const extraQuestion = {
        ...mockQuestion,
        id: 'E1A01',
      };
      const questions = [extraQuestion];
      const answers = { 'E1A01': 'A' as const };

      await result.current.saveTestResult(questions, answers, 'extra');

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          test_type: 'extra',
        })
      );
    });

    it('defaults to technician when testType is not specified', async () => {
      const { supabase } = await import('@/integrations/supabase/client');

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'test-result-id' },
            error: null,
          }),
        }),
      });

      const mockAttemptsInsert = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'practice_test_results') {
          return { insert: mockInsert } as ReturnType<typeof supabase.from>;
        }
        if (table === 'question_attempts') {
          return { insert: mockAttemptsInsert } as ReturnType<typeof supabase.from>;
        }
        return {} as ReturnType<typeof supabase.from>;
      });

      const { result } = renderHook(() => useProgress());

      const questions = [mockQuestion];
      const answers = { 'T1A01': 'A' as const };

      // Call without testType parameter
      await result.current.saveTestResult(questions, answers);

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          test_type: 'technician',
        })
      );
    });
  });
});
