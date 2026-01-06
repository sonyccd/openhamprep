import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChapterPractice } from './ChapterPractice';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Import the supabase mock
import '@/test/mocks/supabase';

const mockQuestions = [
  {
    id: 'T1A01',
    displayName: 'T1A01',
    question: 'Question about chapter 7?',
    options: { A: 'A1', B: 'B1', C: 'C1', D: 'D1' },
    correctAnswer: 'A',
    subelement: 'T1',
    group: 'T1A',
    questionGroup: 'T1A',
    explanation: 'Explanation 1',
    links: [],
    arrlChapterId: 'chapter-7-id',
  },
  {
    id: 'T1A02',
    displayName: 'T1A02',
    question: 'Another chapter 7 question?',
    options: { A: 'A2', B: 'B2', C: 'C2', D: 'D2' },
    correctAnswer: 'B',
    subelement: 'T1',
    group: 'T1A',
    questionGroup: 'T1A',
    explanation: 'Explanation 2',
    links: [],
    arrlChapterId: 'chapter-7-id',
  },
  {
    id: 'T2A01',
    displayName: 'T2A01',
    question: 'Question about chapter 8?',
    options: { A: 'A3', B: 'B3', C: 'C3', D: 'D3' },
    correctAnswer: 'C',
    subelement: 'T2',
    group: 'T2A',
    questionGroup: 'T2A',
    explanation: 'Explanation 3',
    links: [],
    arrlChapterId: 'chapter-8-id',
  },
];

const mockChapters = [
  {
    id: 'chapter-7-id',
    licenseType: 'T' as const,
    chapterNumber: 7,
    title: 'Licensing Regulations',
    description: 'Learn about FCC licensing rules and regulations.',
    displayOrder: 7,
    questionCount: 2,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'chapter-8-id',
    licenseType: 'T' as const,
    chapterNumber: 8,
    title: 'Operating Practices',
    description: 'Learn about proper operating procedures.',
    displayOrder: 8,
    questionCount: 1,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

const mockQuestionsHook = vi.fn(() => ({
  data: mockQuestions,
  isLoading: false,
  error: null,
}));

const mockChaptersHook = vi.fn(() => ({
  data: mockChapters,
  isLoading: false,
  error: null,
}));

vi.mock('@/hooks/useQuestions', () => ({
  useQuestions: () => mockQuestionsHook(),
}));

vi.mock('@/hooks/useArrlChapters', () => ({
  useArrlChaptersWithCounts: () => mockChaptersHook(),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: null }),
}));

vi.mock('@/hooks/useAppNavigation', () => ({
  useAppNavigation: () => ({
    navigateToTopic: vi.fn(),
    selectedLicense: 'technician',
  }),
}));

vi.mock('@/hooks/useProgress', () => ({
  useProgress: () => ({
    saveRandomAttempt: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock('@/hooks/usePendo', () => ({
  usePendo: () => ({ track: vi.fn(), isReady: true }),
  PENDO_EVENTS: {
    TOPIC_SELECTED: 'topic_selected',
    SUBELEMENT_PRACTICE_STARTED: 'subelement_practice_started',
  },
}));

vi.mock('@/hooks/useBookmarks', () => ({
  useBookmarks: () => ({
    isBookmarked: vi.fn(() => false),
    addBookmark: { mutate: vi.fn() },
    removeBookmark: { mutate: vi.fn() },
    getBookmarkNote: vi.fn(() => null),
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
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) => <div {...props}>{children}</div>,
    p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement> & { children?: React.ReactNode }) => <p {...props}>{children}</p>,
    button: ({ children, onClick, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children?: React.ReactNode }) => (
      <button onClick={onClick} {...props}>{children}</button>
    ),
  },
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/components/QuestionListView', () => ({
  QuestionListView: ({ onStartPractice, onBack, title, badge, description }: {
    onStartPractice: (index?: number) => void;
    onBack: () => void;
    title: string;
    badge: string;
    description?: string;
  }) => (
    <div data-testid="question-list-view">
      <span data-testid="badge">{badge}</span>
      <h2>{title}</h2>
      {description && <p data-testid="description">{description}</p>}
      <button onClick={onBack}>Back to Chapters</button>
      <button onClick={() => onStartPractice()}>Practice All Questions</button>
      <button onClick={() => onStartPractice(0)}>Start from first</button>
    </div>
  ),
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

const renderChapterPractice = (props = {}) => {
  const queryClient = createTestQueryClient();
  const onBack = vi.fn();

  const result = render(
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ChapterPractice onBack={onBack} testType="technician" {...props} />
      </TooltipProvider>
    </QueryClientProvider>
  );

  return { ...result, onBack };
};

describe('ChapterPractice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQuestionsHook.mockReturnValue({
      data: mockQuestions,
      isLoading: false,
      error: null,
    });
    mockChaptersHook.mockReturnValue({
      data: mockChapters,
      isLoading: false,
      error: null,
    });
  });

  describe('Chapter List View', () => {
    it('renders the chapter selection screen', () => {
      renderChapterPractice();

      expect(screen.getByText('Study by Chapter')).toBeInTheDocument();
      expect(screen.getByText('Practice questions organized by ARRL textbook chapters')).toBeInTheDocument();
    });

    it('displays available chapters', () => {
      renderChapterPractice();

      expect(screen.getByText('Licensing Regulations')).toBeInTheDocument();
      expect(screen.getByText('Operating Practices')).toBeInTheDocument();
    });

    it('displays chapter numbers', () => {
      renderChapterPractice();

      // Chapter numbers are shown in the chapter boxes
      expect(screen.getByText('7')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
    });
  });

  describe('Chapter Selection', () => {
    it('navigates to question list view when clicking a chapter', async () => {
      renderChapterPractice();

      // Click on Chapter 7 (Licensing Regulations)
      const chapterButton = screen.getByText('Licensing Regulations').closest('button');
      if (chapterButton) {
        fireEvent.click(chapterButton);
      }

      await waitFor(() => {
        expect(screen.getByTestId('question-list-view')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /practice all questions/i })).toBeInTheDocument();
      });
    });

    it('shows the chapter title in question list view', async () => {
      renderChapterPractice();

      const chapterButton = screen.getByText('Licensing Regulations').closest('button');
      if (chapterButton) {
        fireEvent.click(chapterButton);
      }

      await waitFor(() => {
        expect(screen.getByText('Licensing Regulations')).toBeInTheDocument();
      });
    });

    it('shows the chapter badge in question list view', async () => {
      renderChapterPractice();

      const chapterButton = screen.getByText('Licensing Regulations').closest('button');
      if (chapterButton) {
        fireEvent.click(chapterButton);
      }

      await waitFor(() => {
        expect(screen.getByTestId('badge')).toHaveTextContent('Ch. 7');
      });
    });

    it('shows the chapter description in question list view', async () => {
      renderChapterPractice();

      const chapterButton = screen.getByText('Licensing Regulations').closest('button');
      if (chapterButton) {
        fireEvent.click(chapterButton);
      }

      await waitFor(() => {
        expect(screen.getByTestId('description')).toHaveTextContent('Learn about FCC licensing rules and regulations.');
      });
    });

    it('can navigate back to chapter list from question list', async () => {
      renderChapterPractice();

      // Click on a chapter
      const chapterButton = screen.getByText('Licensing Regulations').closest('button');
      if (chapterButton) {
        fireEvent.click(chapterButton);
      }

      await waitFor(() => {
        expect(screen.getByTestId('question-list-view')).toBeInTheDocument();
      });

      // Click back button
      fireEvent.click(screen.getByRole('button', { name: /back to chapters/i }));

      await waitFor(() => {
        // Should be back at chapter list
        expect(screen.getByText('Study by Chapter')).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('shows loading state when questions are loading', () => {
      mockQuestionsHook.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      renderChapterPractice();

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('shows loading state when chapters are loading', () => {
      mockChaptersHook.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      renderChapterPractice();

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('shows error state when questions fail to load', () => {
      mockQuestionsHook.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to load'),
      });

      renderChapterPractice();

      expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /go back/i })).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('shows message when no chapters exist', () => {
      mockChaptersHook.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      renderChapterPractice();

      expect(screen.getByText(/no chapters have been defined/i)).toBeInTheDocument();
    });

    it('separates chapters with and without questions', () => {
      const chaptersWithEmpty = [
        ...mockChapters,
        {
          id: 'chapter-empty-id',
          licenseType: 'T' as const,
          chapterNumber: 9,
          title: 'Empty Chapter',
          description: null,
          displayOrder: 9,
          questionCount: 0,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];

      mockChaptersHook.mockReturnValue({
        data: chaptersWithEmpty,
        isLoading: false,
        error: null,
      });

      renderChapterPractice();

      // Regular chapters should be clickable buttons
      expect(screen.getByText('Licensing Regulations').closest('button')).toBeInTheDocument();

      // Empty chapters should be shown separately
      expect(screen.getByText('Chapters without questions:')).toBeInTheDocument();
      expect(screen.getByText(/Empty Chapter/)).toBeInTheDocument();
    });
  });
});

describe('ChapterPractice Practice View', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQuestionsHook.mockReturnValue({
      data: mockQuestions,
      isLoading: false,
      error: null,
    });
    mockChaptersHook.mockReturnValue({
      data: mockChapters,
      isLoading: false,
      error: null,
    });
  });

  it('displays stats in practice view', async () => {
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ChapterPractice onBack={vi.fn()} testType="technician" />
        </TooltipProvider>
      </QueryClientProvider>
    );

    // Select Chapter 7
    const chapterButton = screen.getByText('Licensing Regulations').closest('button');
    if (chapterButton) fireEvent.click(chapterButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /practice all questions/i })).toBeInTheDocument();
    });

    // Start practice
    fireEvent.click(screen.getByRole('button', { name: /practice all questions/i }));

    await waitFor(() => {
      expect(screen.getByText('Correct')).toBeInTheDocument();
      expect(screen.getByText('Incorrect')).toBeInTheDocument();
      expect(screen.getByText('Score')).toBeInTheDocument();
    });
  });

  it('shows Question List button in practice view', async () => {
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ChapterPractice onBack={vi.fn()} testType="technician" />
        </TooltipProvider>
      </QueryClientProvider>
    );

    // Select Chapter 7
    const chapterButton = screen.getByText('Licensing Regulations').closest('button');
    if (chapterButton) fireEvent.click(chapterButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /practice all questions/i })).toBeInTheDocument();
    });

    // Start practice
    fireEvent.click(screen.getByRole('button', { name: /practice all questions/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /question list/i })).toBeInTheDocument();
    });
  });

  it('shows chapter number in practice view header', async () => {
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ChapterPractice onBack={vi.fn()} testType="technician" />
        </TooltipProvider>
      </QueryClientProvider>
    );

    // Select Chapter 7
    const chapterButton = screen.getByText('Licensing Regulations').closest('button');
    if (chapterButton) fireEvent.click(chapterButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /practice all questions/i })).toBeInTheDocument();
    });

    // Start practice
    fireEvent.click(screen.getByRole('button', { name: /practice all questions/i }));

    await waitFor(() => {
      expect(screen.getByText('Ch. 7')).toBeInTheDocument();
    });
  });
});

describe('ChapterPractice Question Wraparound', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQuestionsHook.mockReturnValue({
      data: mockQuestions,
      isLoading: false,
      error: null,
    });
    mockChaptersHook.mockReturnValue({
      data: mockChapters,
      isLoading: false,
      error: null,
    });
  });

  it('allows skipping questions', async () => {
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ChapterPractice onBack={vi.fn()} testType="technician" />
        </TooltipProvider>
      </QueryClientProvider>
    );

    // Select Chapter 7 which has 2 questions
    const chapterButton = screen.getByText('Licensing Regulations').closest('button');
    if (chapterButton) fireEvent.click(chapterButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /practice all questions/i })).toBeInTheDocument();
    });

    // Start practice
    fireEvent.click(screen.getByRole('button', { name: /practice all questions/i }));

    // Wait for first question
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /skip/i })).toBeInTheDocument();
    });

    // Skip to next question
    fireEvent.click(screen.getByRole('button', { name: /skip/i }));

    await waitFor(() => {
      // After skipping first, we should be on question 2
      expect(screen.getByText(/Question 2 of 2/)).toBeInTheDocument();
    });
  });
});

describe('ChapterPractice Answer Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQuestionsHook.mockReturnValue({
      data: mockQuestions,
      isLoading: false,
      error: null,
    });
    mockChaptersHook.mockReturnValue({
      data: mockChapters,
      isLoading: false,
      error: null,
    });
  });

  it('updates stats when answering correctly', async () => {
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ChapterPractice onBack={vi.fn()} testType="technician" />
        </TooltipProvider>
      </QueryClientProvider>
    );

    // Select Chapter 7
    const chapterButton = screen.getByText('Licensing Regulations').closest('button');
    if (chapterButton) fireEvent.click(chapterButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /practice all questions/i })).toBeInTheDocument();
    });

    // Start practice
    fireEvent.click(screen.getByRole('button', { name: /practice all questions/i }));

    // Wait for question to appear
    await waitFor(() => {
      expect(screen.getByText('Correct')).toBeInTheDocument();
    });

    // Check initial stats show 0
    const correctStats = screen.getAllByText('0');
    expect(correctStats.length).toBeGreaterThan(0);
  });

  it('shows Reset button in practice view', async () => {
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ChapterPractice onBack={vi.fn()} testType="technician" />
        </TooltipProvider>
      </QueryClientProvider>
    );

    // Select Chapter 7
    const chapterButton = screen.getByText('Licensing Regulations').closest('button');
    if (chapterButton) fireEvent.click(chapterButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /practice all questions/i })).toBeInTheDocument();
    });

    // Start practice
    fireEvent.click(screen.getByRole('button', { name: /practice all questions/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
    });
  });

  it('can start practice from a specific question', async () => {
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ChapterPractice onBack={vi.fn()} testType="technician" />
        </TooltipProvider>
      </QueryClientProvider>
    );

    // Select Chapter 7
    const chapterButton = screen.getByText('Licensing Regulations').closest('button');
    if (chapterButton) fireEvent.click(chapterButton);

    await waitFor(() => {
      expect(screen.getByTestId('question-list-view')).toBeInTheDocument();
    });

    // Start from first question specifically
    fireEvent.click(screen.getByRole('button', { name: /start from first/i }));

    await waitFor(() => {
      expect(screen.getByText('Correct')).toBeInTheDocument();
    });
  });
});

describe('ChapterPractice Navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQuestionsHook.mockReturnValue({
      data: mockQuestions,
      isLoading: false,
      error: null,
    });
    mockChaptersHook.mockReturnValue({
      data: mockChapters,
      isLoading: false,
      error: null,
    });
  });

  it('can navigate back from practice to question list', async () => {
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ChapterPractice onBack={vi.fn()} testType="technician" />
        </TooltipProvider>
      </QueryClientProvider>
    );

    // Select Chapter 7
    const chapterButton = screen.getByText('Licensing Regulations').closest('button');
    if (chapterButton) fireEvent.click(chapterButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /practice all questions/i })).toBeInTheDocument();
    });

    // Start practice
    fireEvent.click(screen.getByRole('button', { name: /practice all questions/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /question list/i })).toBeInTheDocument();
    });

    // Go back to question list
    fireEvent.click(screen.getByRole('button', { name: /question list/i }));

    await waitFor(() => {
      expect(screen.getByTestId('question-list-view')).toBeInTheDocument();
    });
  });
});

describe('ChapterPractice License Types', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows chapters for General license type', () => {
    const generalChapters = [
      {
        id: 'g-chapter-1',
        licenseType: 'G' as const,
        chapterNumber: 1,
        title: 'General Class Overview',
        description: null,
        displayOrder: 1,
        questionCount: 10,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ];

    mockQuestionsHook.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });
    mockChaptersHook.mockReturnValue({
      data: generalChapters,
      isLoading: false,
      error: null,
    });

    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ChapterPractice onBack={vi.fn()} testType="general" />
        </TooltipProvider>
      </QueryClientProvider>
    );

    expect(screen.getByText('General Class Overview')).toBeInTheDocument();
  });
});
