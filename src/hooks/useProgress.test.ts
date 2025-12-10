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

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'practice_test_results') {
          return { insert: mockInsert };
        }
        if (table === 'question_attempts') {
          return { insert: mockAttemptsInsert };
        }
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
        test_type: 'practice',
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

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'practice_test_results') {
          return { insert: mockInsert };
        }
        if (table === 'question_attempts') {
          return { insert: vi.fn().mockResolvedValue({ data: null, error: null }) };
        }
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

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'practice_test_results') {
          return { insert: mockInsert };
        }
        if (table === 'question_attempts') {
          return { insert: mockAttemptsInsert };
        }
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
      (useAuth as any).mockReturnValue({ user: null });

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
            error: new Error('Database error'),
          }),
        }),
      });

      (supabase.from as any).mockReturnValue({ insert: mockInsert });

      const { result } = renderHook(() => useProgress());
      const testResult = await result.current.saveTestResult([mockQuestion], { 'T1A01': 'A' });

      expect(testResult).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('saveRandomAttempt', () => {
    it('saves random practice attempt', async () => {
      const { supabase } = await import('@/integrations/supabase/client');

      const mockInsert = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      (supabase.from as any).mockReturnValue({ insert: mockInsert });

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

      (supabase.from as any).mockReturnValue({ insert: mockInsert });

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
      (useAuth as any).mockReturnValue({ user: null });

      const { supabase } = await import('@/integrations/supabase/client');
      const mockInsert = vi.fn();
      (supabase.from as any).mockReturnValue({ insert: mockInsert });

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

      (supabase.from as any).mockReturnValue({ insert: mockInsert });

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
  });
});
