import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import QuestionPage from './QuestionPage';

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock useAuth
let mockUser: { id: string; email: string } | null = null;
let mockAuthLoading = false;
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
    loading: mockAuthLoading,
  }),
}));

// Mock useAppNavigation
vi.mock('@/hooks/useAppNavigation', () => ({
  useAppNavigation: () => ({
    navigateToQuestion: vi.fn(),
    selectedLicense: 'technician',
  }),
}));

// Mock useQuestion
let mockQuestion: {
  id: string;
  question: string;
  options: { A: string; B: string; C: string; D: string };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  subelement: string;
  group: string;
  explanation: string | null;
  links: [];
} | null = null;
let mockQuestionLoading = false;
let mockQuestionError: Error | null = null;

vi.mock('@/hooks/useQuestions', () => ({
  useQuestion: () => ({
    data: mockQuestion,
    isLoading: mockQuestionLoading,
    error: mockQuestionError,
  }),
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) => (
      <div {...props}>{children}</div>
    ),
  },
}));

// Mock ThemeToggle
vi.mock('@/components/ThemeToggle', () => ({
  ThemeToggle: () => <div data-testid="theme-toggle">Theme Toggle</div>,
}));

// Mock QuestionCard
vi.mock('@/components/QuestionCard', () => ({
  QuestionCard: ({ question, showResult, selectedAnswer }: {
    question: { id: string; question: string };
    showResult: boolean;
    selectedAnswer: string | null;
  }) => (
    <div data-testid="question-card">
      <div data-testid="question-id">{question.id}</div>
      <div data-testid="question-text">{question.question}</div>
      <div data-testid="show-result">{showResult ? 'true' : 'false'}</div>
      <div data-testid="selected-answer">{selectedAnswer}</div>
    </div>
  ),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {children}
      </TooltipProvider>
    </QueryClientProvider>
  );
};

const renderQuestionPage = (questionId: string) => {
  const Wrapper = createWrapper();
  return render(
    <Wrapper>
      <MemoryRouter initialEntries={[`/questions/${questionId}`]}>
        <Routes>
          <Route path="/questions/:id" element={<QuestionPage />} />
        </Routes>
      </MemoryRouter>
    </Wrapper>
  );
};

describe('QuestionPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = { id: 'test-user', email: 'test@example.com' };
    mockAuthLoading = false;
    mockQuestion = {
      id: 'T1A01',
      question: 'What is the purpose of the Amateur Radio Service?',
      options: {
        A: 'Emergency communications',
        B: 'Making money',
        C: 'Broadcasting music',
        D: 'Replacing cell phones',
      },
      correctAnswer: 'A',
      subelement: 'T1',
      group: 'T1A',
      explanation: 'Amateur radio is for emergency communications.',
      links: [],
    };
    mockQuestionLoading = false;
    mockQuestionError = null;
  });

  describe('Public Access', () => {
    it('renders question page for anonymous users', () => {
      mockUser = null;
      mockAuthLoading = false;

      renderQuestionPage('T1A01');

      // Should show the question card, not redirect
      expect(screen.getByTestId('question-card')).toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalledWith(expect.stringContaining('/auth'), { replace: true });
    });

    it('shows sign-up CTA for anonymous users', () => {
      mockUser = null;
      mockAuthLoading = false;

      renderQuestionPage('T1A01');

      expect(screen.getByText(/create a free account/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create free account/i })).toBeInTheDocument();
    });

    it('does not show sign-up CTA for logged-in users', () => {
      mockUser = { id: 'test-user', email: 'test@example.com' };

      renderQuestionPage('T1A01');

      expect(screen.queryByText(/create a free account/i)).not.toBeInTheDocument();
    });

    it('does not show back/dashboard button for anonymous users (shared URL context)', () => {
      mockUser = null;
      mockAuthLoading = false;

      renderQuestionPage('T1A01');

      // Anonymous users from shared URLs should not see a back button since we don't know where they came from
      expect(screen.queryByRole('button', { name: /^dashboard$/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /back to dashboard/i })).not.toBeInTheDocument();
    });

    it('shows Start Practicing button for anonymous users', () => {
      mockUser = null;
      mockAuthLoading = false;

      renderQuestionPage('T1A01');

      expect(screen.getByRole('button', { name: /start practicing/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /practice more questions/i })).not.toBeInTheDocument();
    });
  });

  describe('Question ID Validation', () => {
    it('shows error for invalid question ID format', () => {
      renderQuestionPage('INVALID');

      expect(screen.getByText('Invalid Question ID')).toBeInTheDocument();
      expect(screen.getByText(/The question ID "INVALID" is not a valid format/)).toBeInTheDocument();
    });

    it('shows error for question ID without proper structure', () => {
      renderQuestionPage('T1');

      expect(screen.getByText('Invalid Question ID')).toBeInTheDocument();
    });

    it('accepts valid Technician question ID', () => {
      renderQuestionPage('T1A01');

      expect(screen.queryByText('Invalid Question ID')).not.toBeInTheDocument();
    });

    it('accepts valid General question ID', () => {
      mockQuestion = { ...mockQuestion!, id: 'G2B03' };
      renderQuestionPage('G2B03');

      expect(screen.queryByText('Invalid Question ID')).not.toBeInTheDocument();
    });

    it('accepts valid Extra question ID', () => {
      mockQuestion = { ...mockQuestion!, id: 'E3C12' };
      renderQuestionPage('E3C12');

      expect(screen.queryByText('Invalid Question ID')).not.toBeInTheDocument();
    });

    it('accepts lowercase question IDs', () => {
      renderQuestionPage('t1a01');

      expect(screen.queryByText('Invalid Question ID')).not.toBeInTheDocument();
    });
  });

  describe('Question Loading', () => {
    it('shows loading state while fetching question', () => {
      mockQuestionLoading = true;
      mockQuestion = null;

      renderQuestionPage('T1A01');

      expect(screen.getByText('Loading question...')).toBeInTheDocument();
    });

    it('shows error when question is not found', () => {
      mockQuestion = null;
      mockQuestionError = new Error('Not found');

      renderQuestionPage('T1A01');

      expect(screen.getByText('Question Not Found')).toBeInTheDocument();
      expect(screen.getByText(/We couldn't find question "T1A01"/)).toBeInTheDocument();
    });
  });

  describe('Question Display', () => {
    it('renders QuestionCard with correct props', () => {
      renderQuestionPage('T1A01');

      const questionCard = screen.getByTestId('question-card');
      expect(questionCard).toBeInTheDocument();

      expect(screen.getByTestId('question-id')).toHaveTextContent('T1A01');
      expect(screen.getByTestId('show-result')).toHaveTextContent('true');
      expect(screen.getByTestId('selected-answer')).toHaveTextContent('A');
    });

    it('shows correct answer selected', () => {
      renderQuestionPage('T1A01');

      // The selectedAnswer should be the correctAnswer
      expect(screen.getByTestId('selected-answer')).toHaveTextContent(mockQuestion!.correctAnswer);
    });
  });

  describe('Navigation', () => {
    it('renders Dashboard button for logged-in users', () => {
      mockUser = { id: 'test-user', email: 'test@example.com' };
      renderQuestionPage('T1A01');

      // Should show "Dashboard" button at top (not "Back")
      expect(screen.getByRole('button', { name: /^dashboard$/i })).toBeInTheDocument();
    });

    it('renders Back to Dashboard button in navigation actions for logged-in users', () => {
      mockUser = { id: 'test-user', email: 'test@example.com' };
      renderQuestionPage('T1A01');

      expect(screen.getByRole('button', { name: /back to dashboard/i })).toBeInTheDocument();
    });

    it('renders Practice More Questions button for logged-in users', () => {
      mockUser = { id: 'test-user', email: 'test@example.com' };
      renderQuestionPage('T1A01');

      expect(screen.getByRole('button', { name: /practice more questions/i })).toBeInTheDocument();
    });
  });

  describe('Document Title', () => {
    it('updates document title with question ID', () => {
      renderQuestionPage('T1A01');

      expect(document.title).toBe('Question T1A01 | Open Ham Prep');
    });

    it('uppercases question ID in title', () => {
      renderQuestionPage('t1a01');

      expect(document.title).toBe('Question T1A01 | Open Ham Prep');
    });
  });
});
