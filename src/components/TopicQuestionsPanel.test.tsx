import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TopicQuestionsPanel } from './TopicQuestionsPanel';

// Mock useTopicQuestions hook
const mockQuestions = [
  { id: 'q1', displayName: 'T1A01', question: 'What is amateur radio?' },
  { id: 'q2', displayName: 'T1A02', question: 'What frequencies can technicians use?' },
  { id: 'q3', displayName: 'T1B01', question: 'What is the purpose of the FCC?' },
];

let mockIsLoading = false;
let mockQuestionsData: typeof mockQuestions | null = mockQuestions;

vi.mock('@/hooks/useTopics', () => ({
  useTopicQuestions: () => ({
    data: mockQuestionsData,
    isLoading: mockIsLoading,
  }),
  useToggleTopicComplete: () => ({
    mutate: vi.fn(),
  }),
}));

vi.mock('@/hooks/useQuestions', () => ({
  useQuestionsByIds: () => ({
    data: [],
    isLoading: false,
  }),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
  }),
}));

vi.mock('@/hooks/useProgress', () => ({
  useProgress: () => ({
    saveRandomAttempt: vi.fn(),
  }),
}));

describe('TopicQuestionsPanel', () => {
  let queryClient: QueryClient;
  const mockOnQuestionClick = vi.fn();

  const renderComponent = (topicId: string = 'topic-123') => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    return render(
      <QueryClientProvider client={queryClient}>
        <TopicQuestionsPanel topicId={topicId} onQuestionClick={mockOnQuestionClick} />
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockIsLoading = false;
    mockQuestionsData = mockQuestions;
  });

  describe('Loading State', () => {
    it('should show loading skeleton when loading', () => {
      mockIsLoading = true;
      const { container } = renderComponent();

      // Check for skeleton elements
      expect(container.querySelectorAll('[class*="animate-pulse"]').length).toBeGreaterThan(0);
    });
  });

  describe('Empty State', () => {
    it('should render nothing when no questions', () => {
      mockQuestionsData = [];
      const { container } = renderComponent();

      // Should return null and not render anything
      expect(container.firstChild).toBeNull();
    });

    it('should render nothing when questions is null', () => {
      mockQuestionsData = null;
      const { container } = renderComponent();

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Rendering Questions', () => {
    it('should show "Related Questions" header', () => {
      renderComponent();
      // Both desktop and mobile views render the header
      expect(screen.getAllByText('Related Questions').length).toBeGreaterThanOrEqual(1);
    });

    it('should show question count badge', () => {
      renderComponent();
      // Badge appears in both views (visible even when collapsed)
      expect(screen.getAllByText('3').length).toBeGreaterThanOrEqual(1);
    });

    it('should display all question display names after expanding', () => {
      renderComponent();

      // Click to expand the collapsible panel (desktop view)
      const relatedQuestionsButton = screen.getAllByText('Related Questions')[0];
      fireEvent.click(relatedQuestionsButton);

      expect(screen.getAllByText('T1A01').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('T1A02').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('T1B01').length).toBeGreaterThanOrEqual(1);
    });

    it('should display question text after expanding', () => {
      renderComponent();

      // Click to expand the collapsible panel (desktop view)
      const relatedQuestionsButton = screen.getAllByText('Related Questions')[0];
      fireEvent.click(relatedQuestionsButton);

      expect(screen.getAllByText('What is amateur radio?').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('What frequencies can technicians use?').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('What is the purpose of the FCC?').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Interactions', () => {
    it('should call onQuestionClick when a question is clicked', () => {
      renderComponent();

      // First expand the panel
      const relatedQuestionsButton = screen.getAllByText('Related Questions')[0];
      fireEvent.click(relatedQuestionsButton);

      // Click the first matching element (from desktop view)
      const t1a01Elements = screen.getAllByText('T1A01');
      fireEvent.click(t1a01Elements[0]);

      expect(mockOnQuestionClick).toHaveBeenCalledWith('q1');
    });

    it('should call onQuestionClick with correct ID for each question', () => {
      renderComponent();

      // First expand the panel
      const relatedQuestionsButton = screen.getAllByText('Related Questions')[0];
      fireEvent.click(relatedQuestionsButton);

      const t1a02Elements = screen.getAllByText('T1A02');
      fireEvent.click(t1a02Elements[0]);
      expect(mockOnQuestionClick).toHaveBeenCalledWith('q2');

      const t1b01Elements = screen.getAllByText('T1B01');
      fireEvent.click(t1b01Elements[0]);
      expect(mockOnQuestionClick).toHaveBeenCalledWith('q3');
    });
  });

  describe('Collapsible Behavior', () => {
    it('should have collapsible trigger on desktop', () => {
      const { container } = renderComponent();

      // Look for chevron icons indicating collapsibility
      const chevrons = container.querySelectorAll('svg[class*="chevron-up"], svg[class*="chevron-down"]');
      expect(chevrons.length).toBeGreaterThan(0);
    });
  });

  describe('Mobile View', () => {
    it('should render mobile card view', () => {
      const { container } = renderComponent();

      // The mobile view should have a Card component
      // Both desktop and mobile views are rendered (hidden via CSS)
      const helpCircleIcons = container.querySelectorAll('svg[class*="circle-help"]');
      expect(helpCircleIcons.length).toBeGreaterThan(0);
    });
  });
});
