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
  });
});
