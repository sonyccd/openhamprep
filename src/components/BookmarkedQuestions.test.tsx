import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BookmarkedQuestions } from './BookmarkedQuestions';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Import the supabase mock
import '@/test/mocks/supabase';

const mockQuestions = [
  {
    id: 'T1A01',
    question: 'What is the purpose of the Amateur Radio Service?',
    options: { A: 'Emergency', B: 'Money', C: 'Music', D: 'Phones' },
    correctAnswer: 'A',
    subelement: 'T1',
    group: 'T1A',
    explanation: 'Test explanation',
    links: [],
  },
  {
    id: 'T1A02',
    question: 'Second question?',
    options: { A: 'Answer 1', B: 'Answer 2', C: 'Answer 3', D: 'Answer 4' },
    correctAnswer: 'B',
    subelement: 'T1',
    group: 'T1A',
    explanation: null,
    links: [],
  },
];

const mockBookmarks = [
  { id: 'bookmark-1', question_id: 'T1A01', note: 'Remember this one!', created_at: '2024-01-01' },
];

vi.mock('@/hooks/useQuestions', () => ({
  useQuestions: () => ({
    data: mockQuestions,
    isLoading: false,
    error: null,
  }),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'test-user' } }),
}));

const mockRemoveBookmark = { mutate: vi.fn() };

vi.mock('@/hooks/useBookmarks', () => ({
  useBookmarks: () => ({
    bookmarks: mockBookmarks,
    isLoading: false,
    isBookmarked: vi.fn((id: string) => mockBookmarks.some(b => b.question_id === id)),
    addBookmark: { mutate: vi.fn() },
    removeBookmark: mockRemoveBookmark,
    getBookmarkNote: vi.fn((id: string) => mockBookmarks.find(b => b.question_id === id)?.note || null),
    updateNote: { mutate: vi.fn() },
  }),
}));

vi.mock('@/hooks/useExplanationFeedback', () => ({
  useExplanationFeedback: () => ({
    userFeedback: null,
    submitFeedback: { mutate: vi.fn() },
    removeFeedback: { mutate: vi.fn() },
  }),
}));

vi.mock('@/hooks/useGlossaryTerms', () => ({
  useGlossaryTerms: () => ({ data: [] }),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

const renderBookmarkedQuestions = (props = {}) => {
  const queryClient = createTestQueryClient();
  const onBack = vi.fn();
  
  const result = render(
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BookmarkedQuestions onBack={onBack} {...props} />
      </TooltipProvider>
    </QueryClientProvider>
  );
  
  return { ...result, onBack };
};

describe('BookmarkedQuestions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('List View', () => {
    it('displays bookmarked questions count', () => {
      renderBookmarkedQuestions();
      
      expect(screen.getByText('1 bookmarked question')).toBeInTheDocument();
    });

    it('shows question ID for bookmarked questions', () => {
      renderBookmarkedQuestions();
      
      expect(screen.getByText('T1A01')).toBeInTheDocument();
    });

    it('shows question text preview', () => {
      renderBookmarkedQuestions();
      
      expect(screen.getByText('What is the purpose of the Amateur Radio Service?')).toBeInTheDocument();
    });

    it('shows "Has note" indicator when bookmark has a note', () => {
      renderBookmarkedQuestions();
      
      expect(screen.getByText('Has note')).toBeInTheDocument();
    });

    it('renders delete button for each bookmark', () => {
      renderBookmarkedQuestions();
      
      const deleteButtons = screen.getAllByRole('button').filter(btn => 
        btn.querySelector('svg')?.classList.contains('lucide-trash-2') ||
        btn.textContent === ''
      );
      expect(deleteButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Empty State', () => {
    it('shows empty state when no bookmarks exist', async () => {
      vi.doMock('@/hooks/useBookmarks', () => ({
        useBookmarks: () => ({
          bookmarks: [],
          isLoading: false,
          isBookmarked: vi.fn(() => false),
          addBookmark: { mutate: vi.fn() },
          removeBookmark: { mutate: vi.fn() },
          getBookmarkNote: vi.fn(() => null),
          updateNote: { mutate: vi.fn() },
        }),
      }));
      
      const { BookmarkedQuestions: EmptyBookmarkedQuestions } = await import('./BookmarkedQuestions');
      
      const queryClient = createTestQueryClient();
      render(
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <EmptyBookmarkedQuestions onBack={vi.fn()} />
          </TooltipProvider>
        </QueryClientProvider>
      );
      
      expect(screen.getByText('No bookmarks yet')).toBeInTheDocument();
      expect(screen.getByText('Bookmark questions during practice to review them later')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /start practicing/i })).toBeInTheDocument();
    });
  });

  describe('Question View', () => {
    it('navigates to question detail when clicking a bookmark', async () => {
      renderBookmarkedQuestions();
      
      // Click on the question
      const questionButton = screen.getByText('What is the purpose of the Amateur Radio Service?');
      fireEvent.click(questionButton);
      
      await waitFor(() => {
        // Should show back button
        expect(screen.getByRole('button', { name: /back to bookmarks/i })).toBeInTheDocument();
        // Should show "Bookmarked" indicator
        expect(screen.getByText('Bookmarked')).toBeInTheDocument();
      });
    });

    it('displays user note in question view', async () => {
      renderBookmarkedQuestions();
      
      const questionButton = screen.getByText('What is the purpose of the Amateur Radio Service?');
      fireEvent.click(questionButton);
      
      await waitFor(() => {
        expect(screen.getByText('Your Note')).toBeInTheDocument();
        expect(screen.getByText('Remember this one!')).toBeInTheDocument();
      });
    });

    it('shows answer options in question view', async () => {
      renderBookmarkedQuestions();
      
      const questionButton = screen.getByText('What is the purpose of the Amateur Radio Service?');
      fireEvent.click(questionButton);
      
      await waitFor(() => {
        expect(screen.getByText('Emergency')).toBeInTheDocument();
        expect(screen.getByText('Money')).toBeInTheDocument();
        expect(screen.getByText('Music')).toBeInTheDocument();
        expect(screen.getByText('Phones')).toBeInTheDocument();
      });
    });

    it('can answer question and see result', async () => {
      renderBookmarkedQuestions();
      
      const questionButton = screen.getByText('What is the purpose of the Amateur Radio Service?');
      fireEvent.click(questionButton);
      
      await waitFor(() => {
        expect(screen.getByText('Emergency')).toBeInTheDocument();
      });
      
      // Click on correct answer
      const buttons = screen.getAllByRole('button');
      const optionA = buttons.find(btn => btn.textContent?.includes('Emergency'));
      if (optionA) {
        fireEvent.click(optionA);
      }
      
      await waitFor(() => {
        // Should show "Try Again" button after answering
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      });
    });

    it('can navigate back to list from question view', async () => {
      renderBookmarkedQuestions();
      
      const questionButton = screen.getByText('What is the purpose of the Amateur Radio Service?');
      fireEvent.click(questionButton);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /back to bookmarks/i })).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByRole('button', { name: /back to bookmarks/i }));
      
      await waitFor(() => {
        // Should be back on list view
        expect(screen.getByText('1 bookmarked question')).toBeInTheDocument();
      });
    });
  });

  describe('Remove Bookmark', () => {
    it('calls removeBookmark when delete button is clicked', async () => {
      renderBookmarkedQuestions();
      
      // Find and click the delete button (the trash icon button)
      const allButtons = screen.getAllByRole('button');
      const deleteButton = allButtons.find(btn => {
        // Look for button with trash icon
        return btn.querySelector('svg.lucide-trash-2') !== null || 
               btn.classList.contains('text-muted-foreground');
      });
      
      if (deleteButton) {
        fireEvent.click(deleteButton);
        expect(mockRemoveBookmark.mutate).toHaveBeenCalledWith('T1A01');
      }
    });
  });

  describe('Loading State', () => {
    it('shows loading state when bookmarks are loading', async () => {
      vi.doMock('@/hooks/useBookmarks', () => ({
        useBookmarks: () => ({
          bookmarks: null,
          isLoading: true,
          isBookmarked: vi.fn(() => false),
          addBookmark: { mutate: vi.fn() },
          removeBookmark: { mutate: vi.fn() },
          getBookmarkNote: vi.fn(() => null),
          updateNote: { mutate: vi.fn() },
        }),
      }));
      
      const { BookmarkedQuestions: LoadingBookmarkedQuestions } = await import('./BookmarkedQuestions');
      
      const queryClient = createTestQueryClient();
      render(
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <LoadingBookmarkedQuestions onBack={vi.fn()} />
          </TooltipProvider>
        </QueryClientProvider>
      );
      
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });
  });
});
