import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
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

// Create a wrapper with QueryClientProvider for testing
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

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

      const { result } = renderHook(() => useProgress(), { wrapper: createWrapper() });

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

      const { result } = renderHook(() => useProgress(), { wrapper: createWrapper() });

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

      const { result } = renderHook(() => useProgress(), { wrapper: createWrapper() });

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

      const { result } = renderHook(() => useProgress(), { wrapper: createWrapper() });

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

      const { result } = renderHook(() => useProgress(), { wrapper: createWrapper() });
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

      const { result } = renderHook(() => useProgress(), { wrapper: createWrapper() });

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

      const { result } = renderHook(() => useProgress(), { wrapper: createWrapper() });

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

      const { result } = renderHook(() => useProgress(), { wrapper: createWrapper() });

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

      const { result } = renderHook(() => useProgress(), { wrapper: createWrapper() });

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

      const { result } = renderHook(() => useProgress(), { wrapper: createWrapper() });

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

      const { result } = renderHook(() => useProgress(), { wrapper: createWrapper() });

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

      const { result } = renderHook(() => useProgress(), { wrapper: createWrapper() });

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

      const { result } = renderHook(() => useProgress(), { wrapper: createWrapper() });

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

      const { result } = renderHook(() => useProgress(), { wrapper: createWrapper() });

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

      const { result } = renderHook(() => useProgress(), { wrapper: createWrapper() });

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

  describe('dynamic pass threshold by test type', () => {
    beforeEach(async () => {
      const { useAuth } = await import('./useAuth');
      vi.mocked(useAuth).mockReturnValue({ user: { id: 'test-user-id' } } as ReturnType<typeof useAuth>);
    });

    it('uses 26 as passing score for technician (35 questions)', async () => {
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

      const { result } = renderHook(() => useProgress(), { wrapper: createWrapper() });

      // 25 correct = fail, 26 correct = pass for technician
      const questions = Array.from({ length: 35 }, (_, i) => ({
        ...mockQuestion,
        id: `T${i}`,
      }));

      // Test 25 correct (should fail)
      const answersFor25 = questions.reduce((acc, q, i) => {
        acc[q.id] = i < 25 ? 'A' : 'B';
        return acc;
      }, {} as Record<string, 'A' | 'B' | 'C' | 'D'>);

      await result.current.saveTestResult(questions, answersFor25, 'technician');

      expect(mockInsert).toHaveBeenLastCalledWith(
        expect.objectContaining({
          score: 25,
          passed: false,
        })
      );

      // Test 26 correct (should pass)
      const answersFor26 = questions.reduce((acc, q, i) => {
        acc[q.id] = i < 26 ? 'A' : 'B';
        return acc;
      }, {} as Record<string, 'A' | 'B' | 'C' | 'D'>);

      await result.current.saveTestResult(questions, answersFor26, 'technician');

      expect(mockInsert).toHaveBeenLastCalledWith(
        expect.objectContaining({
          score: 26,
          passed: true,
        })
      );
    });

    it('uses 26 as passing score for general (35 questions)', async () => {
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

      const { result } = renderHook(() => useProgress(), { wrapper: createWrapper() });

      const questions = Array.from({ length: 35 }, (_, i) => ({
        ...mockQuestion,
        id: `G${i}`,
      }));

      // Test 26 correct (should pass for general)
      const answers = questions.reduce((acc, q, i) => {
        acc[q.id] = i < 26 ? 'A' : 'B';
        return acc;
      }, {} as Record<string, 'A' | 'B' | 'C' | 'D'>);

      await result.current.saveTestResult(questions, answers, 'general');

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          score: 26,
          passed: true,
          test_type: 'general',
        })
      );
    });

    it('uses 37 as passing score for extra (50 questions)', async () => {
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

      const { result } = renderHook(() => useProgress(), { wrapper: createWrapper() });

      // Create 50 questions for extra exam
      const questions = Array.from({ length: 50 }, (_, i) => ({
        ...mockQuestion,
        id: `E${i}`,
      }));

      // Test 36 correct (should fail for extra - needs 37)
      const answersFor36 = questions.reduce((acc, q, i) => {
        acc[q.id] = i < 36 ? 'A' : 'B';
        return acc;
      }, {} as Record<string, 'A' | 'B' | 'C' | 'D'>);

      await result.current.saveTestResult(questions, answersFor36, 'extra');

      expect(mockInsert).toHaveBeenLastCalledWith(
        expect.objectContaining({
          score: 36,
          passed: false,
          test_type: 'extra',
        })
      );

      // Test 37 correct (should pass for extra)
      const answersFor37 = questions.reduce((acc, q, i) => {
        acc[q.id] = i < 37 ? 'A' : 'B';
        return acc;
      }, {} as Record<string, 'A' | 'B' | 'C' | 'D'>);

      await result.current.saveTestResult(questions, answersFor37, 'extra');

      expect(mockInsert).toHaveBeenLastCalledWith(
        expect.objectContaining({
          score: 37,
          passed: true,
          test_type: 'extra',
        })
      );
    });

    it('extra exam requires higher score to pass than technician/general', async () => {
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

      const { result } = renderHook(() => useProgress(), { wrapper: createWrapper() });

      // 26 correct passes technician
      const techQuestions = Array.from({ length: 35 }, (_, i) => ({
        ...mockQuestion,
        id: `T${i}`,
      }));
      const techAnswers = techQuestions.reduce((acc, q, i) => {
        acc[q.id] = i < 26 ? 'A' : 'B';
        return acc;
      }, {} as Record<string, 'A' | 'B' | 'C' | 'D'>);

      await result.current.saveTestResult(techQuestions, techAnswers, 'technician');
      expect(mockInsert).toHaveBeenLastCalledWith(
        expect.objectContaining({ passed: true })
      );

      // 26 correct does NOT pass extra (needs 37)
      const extraQuestions = Array.from({ length: 50 }, (_, i) => ({
        ...mockQuestion,
        id: `E${i}`,
      }));
      const extraAnswers = extraQuestions.reduce((acc, q, i) => {
        acc[q.id] = i < 26 ? 'A' : 'B';
        return acc;
      }, {} as Record<string, 'A' | 'B' | 'C' | 'D'>);

      await result.current.saveTestResult(extraQuestions, extraAnswers, 'extra');
      expect(mockInsert).toHaveBeenLastCalledWith(
        expect.objectContaining({ passed: false })
      );
    });
  });

  describe('cache invalidation', () => {
    // These tests ensure the dashboard updates immediately after saving progress
    // by verifying that React Query caches are invalidated

    beforeEach(async () => {
      const { useAuth } = await import('./useAuth');
      vi.mocked(useAuth).mockReturnValue({ user: { id: 'test-user-id' } } as ReturnType<typeof useAuth>);
    });

    it('invalidates test-results query after saveTestResult', async () => {
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

      const queryClient = new QueryClient();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      const { result } = renderHook(() => useProgress(), { wrapper });

      await result.current.saveTestResult([mockQuestion], { 'T1A01': 'A' });

      // Verify all progress-related queries are invalidated
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['test-results', 'test-user-id'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['question-attempts', 'test-user-id'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['profile-stats', 'test-user-id'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['weekly-goals', 'test-user-id'] });
    });

    it('invalidates question-attempts query after saveRandomAttempt', async () => {
      const { supabase } = await import('@/integrations/supabase/client');

      const mockInsert = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as ReturnType<typeof supabase.from>);

      const queryClient = new QueryClient();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      const { result } = renderHook(() => useProgress(), { wrapper });

      await result.current.saveRandomAttempt(mockQuestion, 'A');

      // Verify all progress-related queries are invalidated
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['test-results', 'test-user-id'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['question-attempts', 'test-user-id'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['profile-stats', 'test-user-id'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['weekly-goals', 'test-user-id'] });
    });

    it('does not invalidate queries when saveTestResult fails', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      vi.spyOn(console, 'error').mockImplementation(() => {});

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      });

      vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as ReturnType<typeof supabase.from>);

      const queryClient = new QueryClient();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      const { result } = renderHook(() => useProgress(), { wrapper });

      await result.current.saveTestResult([mockQuestion], { 'T1A01': 'A' });

      // Should NOT invalidate queries when there's an error
      expect(invalidateSpy).not.toHaveBeenCalled();
    });

    it('does not invalidate queries when no user is logged in', async () => {
      const { useAuth } = await import('./useAuth');
      vi.mocked(useAuth).mockReturnValue({ user: null } as ReturnType<typeof useAuth>);

      const queryClient = new QueryClient();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      const { result } = renderHook(() => useProgress(), { wrapper });

      await result.current.saveTestResult([mockQuestion], { 'T1A01': 'A' });
      await result.current.saveRandomAttempt(mockQuestion, 'A');

      // Should NOT invalidate queries when no user
      expect(invalidateSpy).not.toHaveBeenCalled();
    });

    it('exposes invalidateProgressQueries function for manual cache invalidation', async () => {
      const queryClient = new QueryClient();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      const { result } = renderHook(() => useProgress(), { wrapper });

      // The hook should expose the invalidateProgressQueries function
      expect(result.current.invalidateProgressQueries).toBeDefined();
      expect(typeof result.current.invalidateProgressQueries).toBe('function');

      // Calling it should invalidate all progress queries
      result.current.invalidateProgressQueries();

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['test-results', 'test-user-id'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['question-attempts', 'test-user-id'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['profile-stats', 'test-user-id'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['weekly-goals', 'test-user-id'] });
    });
  });
});
