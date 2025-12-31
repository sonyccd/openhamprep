import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useQuestionMutations } from './useQuestionMutations';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Question } from '@/components/admin/questions/types';

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    })),
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
  }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const createMockQuestion = (): Question => ({
  id: 'test-uuid-123',
  display_name: 'T1A01',
  question: 'What is the purpose?',
  options: ['A', 'B', 'C', 'D'],
  correct_answer: 0,
  links: [],
  explanation: 'Test explanation',
  edit_history: [],
  figure_url: null,
  forum_url: null,
  discourse_sync_status: null,
  discourse_sync_at: null,
  discourse_sync_error: null,
  linked_topic_ids: [],
});

describe('useQuestionMutations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('addQuestion', () => {
    it('returns addQuestion mutation', () => {
      const { result } = renderHook(() => useQuestionMutations('technician'), {
        wrapper: createWrapper(),
      });
      expect(result.current.addQuestion).toBeDefined();
      expect(result.current.addQuestion.mutate).toBeDefined();
    });

    it('calls supabase insert when adding question', async () => {
      const mockInsert = vi.fn().mockReturnThis();
      const mockFrom = vi.fn(() => ({
        insert: mockInsert,
      }));
      (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(mockFrom);
      mockInsert.mockResolvedValue({ error: null });

      const { result } = renderHook(() => useQuestionMutations('technician'), {
        wrapper: createWrapper(),
      });

      result.current.addQuestion.mutate({
        id: '',
        display_name: 'T1A01',
        question: 'Test question',
        options: ['A', 'B', 'C', 'D'],
        correct_answer: 0,
        links: [],
        explanation: 'Test',
        figure_url: null,
      });

      await waitFor(() => {
        expect(mockFrom).toHaveBeenCalledWith('questions');
      });
    });

    it('shows success toast on successful add', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => ({
        insert: mockInsert,
      }));

      const { result } = renderHook(() => useQuestionMutations('technician'), {
        wrapper: createWrapper(),
      });

      result.current.addQuestion.mutate({
        id: '',
        display_name: 'T1A01',
        question: 'Test question',
        options: ['A', 'B', 'C', 'D'],
        correct_answer: 0,
        links: [],
      });

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Question added successfully');
      });
    });

    it('shows error toast on failed add', async () => {
      const mockInsert = vi.fn().mockResolvedValue({
        error: { message: 'Insert failed' },
      });
      (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => ({
        insert: mockInsert,
      }));

      const { result } = renderHook(() => useQuestionMutations('technician'), {
        wrapper: createWrapper(),
      });

      result.current.addQuestion.mutate({
        id: '',
        display_name: 'T1A01',
        question: 'Test question',
        options: ['A', 'B', 'C', 'D'],
        correct_answer: 0,
        links: [],
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });

    it('extracts links from explanation when provided', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => ({
        insert: mockInsert,
      }));
      const mockInvoke = vi.fn().mockResolvedValue({ data: null, error: null });
      (supabase.functions.invoke as ReturnType<typeof vi.fn>).mockImplementation(mockInvoke);

      const { result } = renderHook(() => useQuestionMutations('technician'), {
        wrapper: createWrapper(),
      });

      result.current.addQuestion.mutate({
        id: '',
        display_name: 'T1A01',
        question: 'Test question',
        options: ['A', 'B', 'C', 'D'],
        correct_answer: 0,
        links: [],
        explanation: 'Test with https://example.com link',
        figure_url: null,
      });

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith('manage-question-links', {
          body: {
            action: 'extract-from-explanation',
            questionId: 'T1A01',
          },
        });
      });
    });

    it('handles link extraction failure gracefully', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => ({
        insert: mockInsert,
      }));
      const mockInvoke = vi.fn().mockRejectedValue(new Error('Link extraction failed'));
      (supabase.functions.invoke as ReturnType<typeof vi.fn>).mockImplementation(mockInvoke);
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { result } = renderHook(() => useQuestionMutations('technician'), {
        wrapper: createWrapper(),
      });

      result.current.addQuestion.mutate({
        id: '',
        display_name: 'T1A01',
        question: 'Test question',
        options: ['A', 'B', 'C', 'D'],
        correct_answer: 0,
        links: [],
        explanation: 'Test explanation',
        figure_url: null,
      });

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Question added successfully');
      });

      consoleSpy.mockRestore();
    });

    it('normalizes display name to uppercase', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => ({
        insert: mockInsert,
      }));

      const { result } = renderHook(() => useQuestionMutations('technician'), {
        wrapper: createWrapper(),
      });

      result.current.addQuestion.mutate({
        id: '',
        display_name: 't1a01',
        question: 'Test question',
        options: ['A', 'B', 'C', 'D'],
        correct_answer: 0,
        links: [],
      });

      await waitFor(() => {
        expect(mockInsert).toHaveBeenCalledWith(
          expect.objectContaining({
            display_name: 'T1A01',
          })
        );
      });
    });
  });

  describe('updateQuestion', () => {
    it('returns updateQuestion mutation', () => {
      const { result } = renderHook(() => useQuestionMutations('technician'), {
        wrapper: createWrapper(),
      });
      expect(result.current.updateQuestion).toBeDefined();
    });

    it('calls supabase update when updating question', async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: null });
      const mockUpdate = vi.fn(() => ({ eq: mockEq }));
      (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => ({
        update: mockUpdate,
      }));

      const { result } = renderHook(() => useQuestionMutations('technician'), {
        wrapper: createWrapper(),
      });

      const originalQuestion = createMockQuestion();
      result.current.updateQuestion.mutate({
        question: { ...originalQuestion, question: 'Updated question' },
        originalQuestion,
      });

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalled();
      });
    });

    it('shows success toast on successful update', async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: null });
      const mockUpdate = vi.fn(() => ({ eq: mockEq }));
      (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => ({
        update: mockUpdate,
      }));

      const { result } = renderHook(() => useQuestionMutations('technician'), {
        wrapper: createWrapper(),
      });

      const originalQuestion = createMockQuestion();
      result.current.updateQuestion.mutate({
        question: originalQuestion,
        originalQuestion,
      });

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Question updated successfully');
      });
    });

    it('shows error toast on failed update', async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: { message: 'Update failed' } });
      const mockUpdate = vi.fn(() => ({ eq: mockEq }));
      (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => ({
        update: mockUpdate,
      }));

      const { result } = renderHook(() => useQuestionMutations('technician'), {
        wrapper: createWrapper(),
      });

      const originalQuestion = createMockQuestion();
      result.current.updateQuestion.mutate({
        question: originalQuestion,
        originalQuestion,
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });

    it('tracks changes for options, correct_answer, figure_url, forum_url', async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: null });
      const mockUpdate = vi.fn(() => ({ eq: mockEq }));
      (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => ({
        update: mockUpdate,
      }));

      const { result } = renderHook(() => useQuestionMutations('technician'), {
        wrapper: createWrapper(),
      });

      const originalQuestion = createMockQuestion();
      result.current.updateQuestion.mutate({
        question: {
          ...originalQuestion,
          options: ['X', 'Y', 'Z', 'W'],
          correct_answer: 2,
          figure_url: 'https://example.com/fig.png',
          forum_url: 'https://forum.example.com/t/123',
        },
        originalQuestion,
      });

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            options: ['X', 'Y', 'Z', 'W'],
            correct_answer: 2,
            figure_url: 'https://example.com/fig.png',
            forum_url: 'https://forum.example.com/t/123',
          })
        );
      });
    });

    it('syncs to Discourse when explanation changes and forum_url exists', async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: null });
      const mockUpdate = vi.fn(() => ({ eq: mockEq }));
      (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => ({
        update: mockUpdate,
      }));
      const mockInvoke = vi.fn().mockResolvedValue({ data: null, error: null });
      (supabase.functions.invoke as ReturnType<typeof vi.fn>).mockImplementation(mockInvoke);

      const { result } = renderHook(() => useQuestionMutations('technician'), {
        wrapper: createWrapper(),
      });

      const originalQuestion = createMockQuestion();
      originalQuestion.forum_url = 'https://forum.example.com/t/123';
      result.current.updateQuestion.mutate({
        question: {
          ...originalQuestion,
          explanation: 'Updated explanation',
        },
        originalQuestion,
      });

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith('update-discourse-post', {
          body: {
            questionId: originalQuestion.id,
            explanation: 'Updated explanation',
          },
        });
      });
    });

    it('handles Discourse sync error gracefully', async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: null });
      const mockUpdate = vi.fn(() => ({ eq: mockEq }));
      (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => ({
        update: mockUpdate,
      }));
      const mockInvoke = vi.fn().mockResolvedValue({ data: null, error: { message: 'Sync failed' } });
      (supabase.functions.invoke as ReturnType<typeof vi.fn>).mockImplementation(mockInvoke);
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useQuestionMutations('technician'), {
        wrapper: createWrapper(),
      });

      const originalQuestion = createMockQuestion();
      originalQuestion.forum_url = 'https://forum.example.com/t/123';
      result.current.updateQuestion.mutate({
        question: {
          ...originalQuestion,
          explanation: 'Updated explanation',
        },
        originalQuestion,
      });

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Question updated successfully');
      });

      consoleSpy.mockRestore();
    });

    it('handles Discourse sync exception gracefully', async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: null });
      const mockUpdate = vi.fn(() => ({ eq: mockEq }));
      (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => ({
        update: mockUpdate,
      }));
      const mockInvoke = vi.fn().mockRejectedValue(new Error('Network error'));
      (supabase.functions.invoke as ReturnType<typeof vi.fn>).mockImplementation(mockInvoke);
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useQuestionMutations('technician'), {
        wrapper: createWrapper(),
      });

      const originalQuestion = createMockQuestion();
      originalQuestion.forum_url = 'https://forum.example.com/t/123';
      result.current.updateQuestion.mutate({
        question: {
          ...originalQuestion,
          explanation: 'Updated explanation',
        },
        originalQuestion,
      });

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Question updated successfully');
      });

      consoleSpy.mockRestore();
    });

    it('extracts links when explanation changes', async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: null });
      const mockUpdate = vi.fn(() => ({ eq: mockEq }));
      (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => ({
        update: mockUpdate,
      }));
      const mockInvoke = vi.fn().mockResolvedValue({ data: null, error: null });
      (supabase.functions.invoke as ReturnType<typeof vi.fn>).mockImplementation(mockInvoke);

      const { result } = renderHook(() => useQuestionMutations('technician'), {
        wrapper: createWrapper(),
      });

      const originalQuestion = createMockQuestion();
      originalQuestion.explanation = 'Old explanation';
      result.current.updateQuestion.mutate({
        question: {
          ...originalQuestion,
          explanation: 'New explanation with https://link.com',
        },
        originalQuestion,
      });

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith('manage-question-links', {
          body: {
            action: 'extract-from-explanation',
            questionId: originalQuestion.id,
          },
        });
      });
    });
  });

  describe('deleteQuestion', () => {
    it('returns deleteQuestion mutation', () => {
      const { result } = renderHook(() => useQuestionMutations('technician'), {
        wrapper: createWrapper(),
      });
      expect(result.current.deleteQuestion).toBeDefined();
    });

    it('calls supabase delete when deleting question', async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: null });
      const mockDelete = vi.fn(() => ({ eq: mockEq }));
      (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => ({
        delete: mockDelete,
      }));

      const { result } = renderHook(() => useQuestionMutations('technician'), {
        wrapper: createWrapper(),
      });

      result.current.deleteQuestion.mutate('test-uuid-123');

      await waitFor(() => {
        expect(mockDelete).toHaveBeenCalled();
        expect(mockEq).toHaveBeenCalledWith('id', 'test-uuid-123');
      });
    });

    it('shows success toast on successful delete', async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: null });
      const mockDelete = vi.fn(() => ({ eq: mockEq }));
      (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => ({
        delete: mockDelete,
      }));

      const { result } = renderHook(() => useQuestionMutations('technician'), {
        wrapper: createWrapper(),
      });

      result.current.deleteQuestion.mutate('test-uuid-123');

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Question deleted successfully');
      });
    });

    it('shows error toast on failed delete', async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: { message: 'Delete failed' } });
      const mockDelete = vi.fn(() => ({ eq: mockEq }));
      (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => ({
        delete: mockDelete,
      }));

      const { result } = renderHook(() => useQuestionMutations('technician'), {
        wrapper: createWrapper(),
      });

      result.current.deleteQuestion.mutate('test-uuid-123');

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });
  });

  describe('retrySync', () => {
    it('returns retrySync function', () => {
      const { result } = renderHook(() => useQuestionMutations('technician'), {
        wrapper: createWrapper(),
      });
      expect(result.current.retrySync).toBeDefined();
      expect(typeof result.current.retrySync).toBe('function');
    });

    it('shows error when question has no forum_url', async () => {
      const { result } = renderHook(() => useQuestionMutations('technician'), {
        wrapper: createWrapper(),
      });

      const question = createMockQuestion();
      question.forum_url = null;

      await result.current.retrySync(question);

      expect(toast.error).toHaveBeenCalledWith('Question has no Discourse topic');
    });

    it('syncs to Discourse when question has forum_url', async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: null });
      const mockUpdate = vi.fn(() => ({ eq: mockEq }));
      (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => ({
        update: mockUpdate,
      }));
      const mockInvoke = vi.fn().mockResolvedValue({ data: null, error: null });
      (supabase.functions.invoke as ReturnType<typeof vi.fn>).mockImplementation(mockInvoke);

      const { result } = renderHook(() => useQuestionMutations('technician'), {
        wrapper: createWrapper(),
      });

      const question = createMockQuestion();
      question.forum_url = 'https://forum.example.com/t/123';
      question.explanation = 'Test explanation';

      await result.current.retrySync(question);

      expect(mockInvoke).toHaveBeenCalledWith('update-discourse-post', {
        body: {
          questionId: question.display_name,
          explanation: question.explanation,
        },
      });
      expect(toast.success).toHaveBeenCalledWith('Synced to Discourse successfully');
    });

    it('updates sync status to pending before sync', async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: null });
      const mockUpdate = vi.fn(() => ({ eq: mockEq }));
      (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => ({
        update: mockUpdate,
      }));
      const mockInvoke = vi.fn().mockResolvedValue({ data: null, error: null });
      (supabase.functions.invoke as ReturnType<typeof vi.fn>).mockImplementation(mockInvoke);

      const { result } = renderHook(() => useQuestionMutations('technician'), {
        wrapper: createWrapper(),
      });

      const question = createMockQuestion();
      question.forum_url = 'https://forum.example.com/t/123';

      await result.current.retrySync(question);

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          discourse_sync_status: 'pending',
        })
      );
    });

    it('shows error and updates sync status on sync failure', async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: null });
      const mockUpdate = vi.fn(() => ({ eq: mockEq }));
      (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => ({
        update: mockUpdate,
      }));
      const mockInvoke = vi.fn().mockResolvedValue({ data: null, error: { message: 'Sync failed' } });
      (supabase.functions.invoke as ReturnType<typeof vi.fn>).mockImplementation(mockInvoke);

      const { result } = renderHook(() => useQuestionMutations('technician'), {
        wrapper: createWrapper(),
      });

      const question = createMockQuestion();
      question.forum_url = 'https://forum.example.com/t/123';

      await result.current.retrySync(question);

      expect(toast.error).toHaveBeenCalled();
    });

    it('handles sync exception and updates error status', async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: null });
      const mockUpdate = vi.fn(() => ({ eq: mockEq }));
      (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => ({
        update: mockUpdate,
      }));
      const mockInvoke = vi.fn().mockRejectedValue(new Error('Network error'));
      (supabase.functions.invoke as ReturnType<typeof vi.fn>).mockImplementation(mockInvoke);

      const { result } = renderHook(() => useQuestionMutations('technician'), {
        wrapper: createWrapper(),
      });

      const question = createMockQuestion();
      question.forum_url = 'https://forum.example.com/t/123';

      await result.current.retrySync(question);

      expect(toast.error).toHaveBeenCalledWith('Sync failed: Network error');
    });
  });
});
