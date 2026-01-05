import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BookmarkedQuestions } from './BookmarkedQuestions';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Import the supabase mock
import '@/test/mocks/supabase';

const mockQuestions = [
  {
    id: 'uuid-t1a01',
    displayName: 'T1A01',
    question: 'What is the purpose of the Amateur Radio Service?',
    options: { A: 'Emergency', B: 'Money', C: 'Music', D: 'Phones' },
    correctAnswer: 'A',
    subelement: 'T1',
    group: 'T1A',
    explanation: 'Test explanation',
    links: [],
  },
  {
    id: 'uuid-t1a02',
    displayName: 'T1A02',
    question: 'Second question?',
    options: { A: 'Answer 1', B: 'Answer 2', C: 'Answer 3', D: 'Answer 4' },
    correctAnswer: 'B',
    subelement: 'T1',
    group: 'T1A',
    explanation: null,
    links: [],
  },
  {
    id: 'uuid-t1a03',
    displayName: 'T1A03',
    question: 'Third question for navigation testing?',
    options: { A: 'Option A', B: 'Option B', C: 'Option C', D: 'Option D' },
    correctAnswer: 'C',
    subelement: 'T1',
    group: 'T1A',
    explanation: 'Third explanation',
    links: [],
  },
];

const mockSingleBookmark = [
  { id: 'bookmark-1', question_id: 'uuid-t1a01', note: 'Remember this one!', created_at: '2024-01-01', display_name: 'T1A01' },
];

const mockMultipleBookmarks = [
  { id: 'bookmark-1', question_id: 'uuid-t1a01', note: 'Remember this one!', created_at: '2024-01-01', display_name: 'T1A01' },
  { id: 'bookmark-2', question_id: 'uuid-t1a02', note: null, created_at: '2024-01-02', display_name: 'T1A02' },
  { id: 'bookmark-3', question_id: 'uuid-t1a03', note: 'Third note', created_at: '2024-01-03', display_name: 'T1A03' },
];

// Default to single bookmark for backward compatibility
let mockBookmarks = mockSingleBookmark;

// Mock useQuestionsByIds to return only the questions matching the bookmark IDs
vi.mock('@/hooks/useQuestions', () => ({
  useQuestionsByIds: (questionIds: string[]) => ({
    data: mockQuestions.filter(q => questionIds.includes(q.id)),
    isLoading: false,
    error: null,
  }),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'test-user' } }),
}));

vi.mock('@/hooks/useAppNavigation', () => ({
  useAppNavigation: () => ({
    navigateToQuestion: vi.fn(),
    selectedLicense: 'technician',
  }),
}));

const mockRemoveBookmark = { mutate: vi.fn() };

const mockBookmarksHook = vi.fn(() => ({
  bookmarks: mockBookmarks,
  isLoading: false,
  isBookmarked: vi.fn((id: string) => mockBookmarks.some(b => b.question_id === id)),
  addBookmark: { mutate: vi.fn() },
  removeBookmark: mockRemoveBookmark,
  getBookmarkNote: vi.fn((id: string) => mockBookmarks.find(b => b.question_id === id)?.note || null),
  updateNote: { mutate: vi.fn() },
}));

vi.mock('@/hooks/useBookmarks', () => ({
  useBookmarks: () => mockBookmarksHook(),
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
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) => <div {...props}>{children}</div>,
    p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement> & { children?: React.ReactNode }) => <p {...props}>{children}</p>,
  },
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
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
  const onStartPractice = vi.fn();

  const result = render(
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BookmarkedQuestions onBack={onBack} onStartPractice={onStartPractice} testType="technician" {...props} />
      </TooltipProvider>
    </QueryClientProvider>
  );

  return { ...result, onBack, onStartPractice };
};

// Helper to set up multiple bookmarks for navigation tests
const setMultipleBookmarks = () => {
  mockBookmarks = mockMultipleBookmarks;
  mockBookmarksHook.mockReturnValue({
    bookmarks: mockMultipleBookmarks,
    isLoading: false,
    isBookmarked: vi.fn((id: string) => mockMultipleBookmarks.some(b => b.question_id === id)),
    addBookmark: { mutate: vi.fn() },
    removeBookmark: mockRemoveBookmark,
    getBookmarkNote: vi.fn((id: string) => mockMultipleBookmarks.find(b => b.question_id === id)?.note || null),
    updateNote: { mutate: vi.fn() },
  });
};

// Helper to reset to single bookmark
const resetToSingleBookmark = () => {
  mockBookmarks = mockSingleBookmark;
  mockBookmarksHook.mockReturnValue({
    bookmarks: mockSingleBookmark,
    isLoading: false,
    isBookmarked: vi.fn((id: string) => mockSingleBookmark.some(b => b.question_id === id)),
    addBookmark: { mutate: vi.fn() },
    removeBookmark: mockRemoveBookmark,
    getBookmarkNote: vi.fn((id: string) => mockSingleBookmark.find(b => b.question_id === id)?.note || null),
    updateNote: { mutate: vi.fn() },
  });
};

describe('BookmarkedQuestions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetToSingleBookmark();
  });

  describe('List View', () => {
    it('displays bookmarked questions count', () => {
      renderBookmarkedQuestions();

      expect(screen.getByText('1 question')).toBeInTheDocument();
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
    it('shows empty state when no bookmarks exist', () => {
      // Override the mock to return empty bookmarks
      mockBookmarksHook.mockReturnValue({
        bookmarks: [],
        isLoading: false,
        isBookmarked: vi.fn(() => false),
        addBookmark: { mutate: vi.fn() },
        removeBookmark: { mutate: vi.fn() },
        getBookmarkNote: vi.fn(() => null),
        updateNote: { mutate: vi.fn() },
      });

      renderBookmarkedQuestions();

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
        expect(screen.getByText('1 question')).toBeInTheDocument();
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
        expect(mockRemoveBookmark.mutate).toHaveBeenCalledWith('uuid-t1a01');
      }
    });
  });

  describe('Loading State', () => {
    it('shows loading state when bookmarks are loading', () => {
      // Override the mock to return loading state
      mockBookmarksHook.mockReturnValue({
        bookmarks: undefined,
        isLoading: true,
        isBookmarked: vi.fn(() => false),
        addBookmark: { mutate: vi.fn() },
        removeBookmark: { mutate: vi.fn() },
        getBookmarkNote: vi.fn(() => null),
        updateNote: { mutate: vi.fn() },
      });

      renderBookmarkedQuestions();

      expect(screen.getByText(/loading bookmarks/i)).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('shows Previous and Next buttons in question view', async () => {
      setMultipleBookmarks();
      renderBookmarkedQuestions();

      // Click on first bookmark
      fireEvent.click(screen.getByText('What is the purpose of the Amateur Radio Service?'));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
      });
    });

    it('disables Previous button on first question', async () => {
      setMultipleBookmarks();
      renderBookmarkedQuestions();

      // Click on first bookmark
      fireEvent.click(screen.getByText('What is the purpose of the Amateur Radio Service?'));

      await waitFor(() => {
        const prevButton = screen.getByRole('button', { name: /previous/i });
        expect(prevButton).toBeDisabled();
      });
    });

    it('enables Next button when there are more questions', async () => {
      setMultipleBookmarks();
      renderBookmarkedQuestions();

      // Click on first bookmark
      fireEvent.click(screen.getByText('What is the purpose of the Amateur Radio Service?'));

      await waitFor(() => {
        const nextButton = screen.getByRole('button', { name: /next/i });
        expect(nextButton).not.toBeDisabled();
      });
    });

    it('navigates to next question when Next is clicked', async () => {
      setMultipleBookmarks();
      renderBookmarkedQuestions();

      // Click on first bookmark
      fireEvent.click(screen.getByText('What is the purpose of the Amateur Radio Service?'));

      await waitFor(() => {
        expect(screen.getByText('What is the purpose of the Amateur Radio Service?')).toBeInTheDocument();
      });

      // Click Next
      fireEvent.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        // Should show second question
        expect(screen.getByText('Second question?')).toBeInTheDocument();
      });
    });

    it('navigates to previous question when Previous is clicked', async () => {
      setMultipleBookmarks();
      renderBookmarkedQuestions();

      // Click on second bookmark
      fireEvent.click(screen.getByText('Second question?'));

      await waitFor(() => {
        expect(screen.getByText('Second question?')).toBeInTheDocument();
      });

      // Click Previous
      fireEvent.click(screen.getByRole('button', { name: /previous/i }));

      await waitFor(() => {
        // Should show first question
        expect(screen.getByText('What is the purpose of the Amateur Radio Service?')).toBeInTheDocument();
      });
    });

    it('disables Next button on last question', async () => {
      setMultipleBookmarks();
      renderBookmarkedQuestions();

      // Click on last bookmark (third one)
      fireEvent.click(screen.getByText('Third question for navigation testing?'));

      await waitFor(() => {
        const nextButton = screen.getByRole('button', { name: /next/i });
        expect(nextButton).toBeDisabled();
      });
    });

    it('enables Previous button when not on first question', async () => {
      setMultipleBookmarks();
      renderBookmarkedQuestions();

      // Click on second bookmark
      fireEvent.click(screen.getByText('Second question?'));

      await waitFor(() => {
        const prevButton = screen.getByRole('button', { name: /previous/i });
        expect(prevButton).not.toBeDisabled();
      });
    });

    it('shows question counter with multiple bookmarks', async () => {
      setMultipleBookmarks();
      renderBookmarkedQuestions();

      // Click on first bookmark
      fireEvent.click(screen.getByText('What is the purpose of the Amateur Radio Service?'));

      await waitFor(() => {
        expect(screen.getByText('Question 1 of 3')).toBeInTheDocument();
      });
    });

    it('updates question counter when navigating', async () => {
      setMultipleBookmarks();
      renderBookmarkedQuestions();

      // Click on first bookmark
      fireEvent.click(screen.getByText('What is the purpose of the Amateur Radio Service?'));

      await waitFor(() => {
        expect(screen.getByText('Question 1 of 3')).toBeInTheDocument();
      });

      // Click Next
      fireEvent.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        expect(screen.getByText('Question 2 of 3')).toBeInTheDocument();
      });
    });

    it('does not show question counter with single bookmark', async () => {
      // Uses default single bookmark from beforeEach
      renderBookmarkedQuestions();

      // Click on the bookmark
      fireEvent.click(screen.getByText('What is the purpose of the Amateur Radio Service?'));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /back to bookmarks/i })).toBeInTheDocument();
      });

      // Question counter should not be present
      expect(screen.queryByText(/Question \d+ of \d+/)).not.toBeInTheDocument();
    });

    it('resets answer state when navigating to next question', async () => {
      setMultipleBookmarks();
      renderBookmarkedQuestions();

      // Click on first bookmark
      fireEvent.click(screen.getByText('What is the purpose of the Amateur Radio Service?'));

      await waitFor(() => {
        expect(screen.getByText('Emergency')).toBeInTheDocument();
      });

      // Answer the question
      const buttons = screen.getAllByRole('button');
      const optionA = buttons.find(btn => btn.textContent?.includes('Emergency'));
      if (optionA) {
        fireEvent.click(optionA);
      }

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      });

      // Click Next
      fireEvent.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        // Should show second question
        expect(screen.getByText('Second question?')).toBeInTheDocument();
        // Try Again should not be visible (answer state reset)
        expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument();
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('navigates with arrow keys', async () => {
      setMultipleBookmarks();
      renderBookmarkedQuestions();

      // Click on first bookmark to enter question view
      fireEvent.click(screen.getByText('What is the purpose of the Amateur Radio Service?'));

      await waitFor(() => {
        expect(screen.getByText('Question 1 of 3')).toBeInTheDocument();
      });

      // Press right arrow to go to next question
      fireEvent.keyDown(document, { key: 'ArrowRight' });

      await waitFor(() => {
        expect(screen.getByText('Question 2 of 3')).toBeInTheDocument();
      });

      // Press left arrow to go back
      fireEvent.keyDown(document, { key: 'ArrowLeft' });

      await waitFor(() => {
        expect(screen.getByText('Question 1 of 3')).toBeInTheDocument();
      });
    });

    it('returns to list with Escape key', async () => {
      renderBookmarkedQuestions();

      // Click on bookmark to enter question view
      fireEvent.click(screen.getByText('What is the purpose of the Amateur Radio Service?'));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /back to bookmarks/i })).toBeInTheDocument();
      });

      // Press Escape
      fireEvent.keyDown(document, { key: 'Escape' });

      await waitFor(() => {
        // Should be back on list view
        expect(screen.getByText('1 question')).toBeInTheDocument();
      });
    });
  });

  describe('Randomize Button', () => {
    it('shows randomize button in question view', async () => {
      setMultipleBookmarks();
      renderBookmarkedQuestions();

      fireEvent.click(screen.getByText('What is the purpose of the Amateur Radio Service?'));

      await waitFor(() => {
        const randomButton = screen.getByTitle('Random question');
        expect(randomButton).toBeInTheDocument();
      });
    });

    it('disables randomize button when only one bookmark', async () => {
      renderBookmarkedQuestions();

      fireEvent.click(screen.getByText('What is the purpose of the Amateur Radio Service?'));

      await waitFor(() => {
        const randomButton = screen.getByTitle('Random question');
        expect(randomButton).toBeDisabled();
      });
    });

    it('enables randomize button when multiple bookmarks', async () => {
      setMultipleBookmarks();
      renderBookmarkedQuestions();

      fireEvent.click(screen.getByText('What is the purpose of the Amateur Radio Service?'));

      await waitFor(() => {
        const randomButton = screen.getByTitle('Random question');
        expect(randomButton).not.toBeDisabled();
      });
    });

    it('changes to different question when randomize is clicked', async () => {
      // Seed Math.random for predictable test
      const originalRandom = Math.random;
      Math.random = () => 0.5; // Will result in index 1 (second question)

      setMultipleBookmarks();
      renderBookmarkedQuestions();

      fireEvent.click(screen.getByText('What is the purpose of the Amateur Radio Service?'));

      await waitFor(() => {
        expect(screen.getByText('Question 1 of 3')).toBeInTheDocument();
      });

      const randomButton = screen.getByTitle('Random question');
      fireEvent.click(randomButton);

      await waitFor(() => {
        // Should be on a different question now (index 1 = second question)
        expect(screen.getByText('Second question?')).toBeInTheDocument();
      });

      // Restore Math.random
      Math.random = originalRandom;
    });
  });
});
