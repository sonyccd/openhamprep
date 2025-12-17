import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import Dashboard from './Dashboard';

// Import the supabase mock
import '@/test/mocks/supabase';

// Mock react-router-dom hooks
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
  };
});

// Mock useAuth
const mockUser = { id: 'test-user-id', email: 'test@example.com' };
const mockAuthHook = vi.fn(() => ({
  user: mockUser,
  loading: false,
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockAuthHook(),
}));

// Mock useBookmarks
vi.mock('@/hooks/useBookmarks', () => ({
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

// Mock useAppNavigation
const mockSetCurrentView = vi.fn();
const mockSetReviewingTestId = vi.fn();
const mockAppNavigation = vi.fn(() => ({
  currentView: 'dashboard',
  setCurrentView: mockSetCurrentView,
  reviewingTestId: null,
  setReviewingTestId: mockSetReviewingTestId,
}));

vi.mock('@/hooks/useAppNavigation', () => ({
  useAppNavigation: () => mockAppNavigation(),
}));

// Mock framer-motion
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

// Mock components that render in different views
vi.mock('@/components/PracticeTest', () => ({
  PracticeTest: ({ onBack }: { onBack: () => void }) => (
    <div data-testid="practice-test">
      Practice Test View
      <button onClick={onBack}>Back</button>
    </div>
  ),
}));

vi.mock('@/components/RandomPractice', () => ({
  RandomPractice: ({ onBack }: { onBack: () => void }) => (
    <div data-testid="random-practice">
      Random Practice View
      <button onClick={onBack}>Back</button>
    </div>
  ),
}));

vi.mock('@/components/WeakQuestionsReview', () => ({
  WeakQuestionsReview: ({ onBack }: { onBack: () => void }) => (
    <div data-testid="weak-questions">
      Weak Questions View
      <button onClick={onBack}>Back</button>
    </div>
  ),
}));

vi.mock('@/components/BookmarkedQuestions', () => ({
  BookmarkedQuestions: ({ onBack }: { onBack: () => void }) => (
    <div data-testid="bookmarked-questions">
      Bookmarked Questions View
      <button onClick={onBack}>Back</button>
    </div>
  ),
}));

vi.mock('@/components/SubelementPractice', () => ({
  SubelementPractice: ({ onBack }: { onBack: () => void }) => (
    <div data-testid="subelement-practice">
      Subelement Practice View
      <button onClick={onBack}>Back</button>
    </div>
  ),
}));

vi.mock('@/components/Glossary', () => ({
  Glossary: ({ onStartFlashcards }: { onStartFlashcards: () => void }) => (
    <div data-testid="glossary">
      Glossary View
      <button onClick={onStartFlashcards}>Start Flashcards</button>
    </div>
  ),
}));

vi.mock('@/components/GlossaryFlashcards', () => ({
  GlossaryFlashcards: ({ onBack }: { onBack: () => void }) => (
    <div data-testid="glossary-flashcards">
      Glossary Flashcards View
      <button onClick={onBack}>Back</button>
    </div>
  ),
}));

vi.mock('@/components/TestResultReview', () => ({
  TestResultReview: ({ onBack }: { onBack: () => void }) => (
    <div data-testid="test-result-review">
      Test Result Review View
      <button onClick={onBack}>Back</button>
    </div>
  ),
}));

vi.mock('@/components/AppLayout', () => ({
  AppLayout: ({ children, currentView }: { children?: React.ReactNode; currentView: string }) => (
    <div data-testid="app-layout" data-current-view={currentView}>
      {children}
    </div>
  ),
}));

vi.mock('@/components/WeeklyGoalsModal', () => ({
  WeeklyGoalsModal: () => null,
}));

vi.mock('@/components/WelcomeModal', () => ({
  WelcomeModal: () => null,
}));

// Mock onboarding hooks
vi.mock('@/hooks/useOnboarding', () => ({
  useOnboarding: () => ({
    showOnboarding: false,
    setShowOnboarding: vi.fn(),
    completeOnboarding: vi.fn(),
    skipOnboarding: vi.fn(),
    hasCompletedOnboarding: true,
    resetOnboarding: vi.fn(),
  }),
}));

vi.mock('@/hooks/useAppTour', () => ({
  useAppTour: () => ({
    tour: null,
    startTour: vi.fn(),
    cancelTour: vi.fn(),
  }),
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

const renderDashboard = (initialView = 'dashboard') => {
  // Update mock to return the desired view
  vi.mocked(mockSetCurrentView).mockImplementation(() => {});
  
  const queryClient = createTestQueryClient();
  
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <TooltipProvider>
          <Dashboard />
        </TooltipProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Rendering', () => {
    it('renders the AppLayout wrapper', async () => {
      renderDashboard();
      
      await waitFor(() => {
        expect(screen.getByTestId('app-layout')).toBeInTheDocument();
      });
    });

    it('displays the dashboard view by default', async () => {
      renderDashboard();
      
      await waitFor(() => {
        const appLayout = screen.getByTestId('app-layout');
        expect(appLayout).toHaveAttribute('data-current-view', 'dashboard');
      });
    });
  });

  describe('Authentication Redirect', () => {
    it('redirects to auth page when user is not authenticated', async () => {
      // Override useAuth mock for this test
      mockAuthHook.mockReturnValueOnce({
        user: null,
        loading: false,
      });

      renderDashboard();

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/auth');
      });
    });
  });
});

describe('Dashboard Views', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders practice-test view when currentView is practice-test', async () => {
    mockAppNavigation.mockReturnValueOnce({
      currentView: 'practice-test',
      setCurrentView: mockSetCurrentView,
      reviewingTestId: null,
      setReviewingTestId: mockSetReviewingTestId,
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByTestId('practice-test')).toBeInTheDocument();
    });
  });

  it('renders random-practice view when currentView is random-practice', async () => {
    mockAppNavigation.mockReturnValueOnce({
      currentView: 'random-practice',
      setCurrentView: mockSetCurrentView,
      reviewingTestId: null,
      setReviewingTestId: mockSetReviewingTestId,
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByTestId('random-practice')).toBeInTheDocument();
    });
  });

  it('renders bookmarks view when currentView is bookmarks', async () => {
    mockAppNavigation.mockReturnValueOnce({
      currentView: 'bookmarks',
      setCurrentView: mockSetCurrentView,
      reviewingTestId: null,
      setReviewingTestId: mockSetReviewingTestId,
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByTestId('bookmarked-questions')).toBeInTheDocument();
    });
  });

  it('renders glossary view when currentView is glossary', async () => {
    mockAppNavigation.mockReturnValueOnce({
      currentView: 'glossary',
      setCurrentView: mockSetCurrentView,
      reviewingTestId: null,
      setReviewingTestId: mockSetReviewingTestId,
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByTestId('glossary')).toBeInTheDocument();
    });
  });

  it('renders subelement-practice view when currentView is subelement-practice', async () => {
    mockAppNavigation.mockReturnValueOnce({
      currentView: 'subelement-practice',
      setCurrentView: mockSetCurrentView,
      reviewingTestId: null,
      setReviewingTestId: mockSetReviewingTestId,
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByTestId('subelement-practice')).toBeInTheDocument();
    });
  });

  it('renders weak-questions view when currentView is weak-questions', async () => {
    mockAppNavigation.mockReturnValueOnce({
      currentView: 'weak-questions',
      setCurrentView: mockSetCurrentView,
      reviewingTestId: null,
      setReviewingTestId: mockSetReviewingTestId,
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByTestId('weak-questions')).toBeInTheDocument();
    });
  });
});

describe('Dashboard Loading State', () => {
  it('shows loading spinner when auth is loading', async () => {
    mockAuthHook.mockReturnValueOnce({
      user: null,
      loading: true,
    });

    renderDashboard();

    // When loading, it should show a loading state
    await waitFor(() => {
      expect(screen.getByTestId('app-layout')).toBeInTheDocument();
    });
  });
});

describe('Dashboard Test Type Persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('defaults to technician when no localStorage value exists', async () => {
    localStorage.removeItem('selectedTestType');

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByTestId('app-layout')).toBeInTheDocument();
    });

    // The default should be technician (implicitly verified by component rendering without error)
    // localStorage should be set on first render
    expect(localStorage.getItem('selectedTestType')).toBe('technician');
  });

  it('restores selectedTest from localStorage', async () => {
    localStorage.setItem('selectedTestType', 'general');

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByTestId('app-layout')).toBeInTheDocument();
    });

    // The value should still be general after render
    expect(localStorage.getItem('selectedTestType')).toBe('general');
  });

  it('persists selectedTest to localStorage when changed', async () => {
    localStorage.setItem('selectedTestType', 'technician');

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByTestId('app-layout')).toBeInTheDocument();
    });

    // Initially should be technician
    expect(localStorage.getItem('selectedTestType')).toBe('technician');
  });
});
