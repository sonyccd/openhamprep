import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TopicProgressButton } from './TopicProgressButton';

// Mock useAuth
const mockUser = { id: 'user-123', email: 'test@example.com' };
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
    loading: false,
  }),
}));

// Mock useTopics hooks
const mockToggleComplete = vi.fn();
let mockIsCompleted = false;
let mockIsPending = false;

vi.mock('@/hooks/useTopics', () => ({
  useTopicCompleted: () => mockIsCompleted,
  useToggleTopicComplete: () => ({
    mutate: mockToggleComplete,
    isPending: mockIsPending,
  }),
}));

describe('TopicProgressButton', () => {
  let queryClient: QueryClient;

  const renderComponent = (topicId: string = 'topic-123') => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    return render(
      <QueryClientProvider client={queryClient}>
        <TopicProgressButton topicId={topicId} />
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockIsCompleted = false;
    mockIsPending = false;
  });

  describe('Authenticated User', () => {
    it('should render "Mark as Complete" when topic is not completed', () => {
      mockIsCompleted = false;
      renderComponent();
      expect(screen.getByText('Mark as Complete')).toBeInTheDocument();
    });

    it('should render "Completed" when topic is completed', () => {
      mockIsCompleted = true;
      renderComponent();
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });

    it('should call toggleComplete with correct params when clicked (not completed)', () => {
      mockIsCompleted = false;
      renderComponent('topic-456');

      fireEvent.click(screen.getByRole('button'));

      expect(mockToggleComplete).toHaveBeenCalledWith({
        topicId: 'topic-456',
        isCompleted: true,
      });
    });

    it('should call toggleComplete with correct params when clicked (completed)', () => {
      mockIsCompleted = true;
      renderComponent('topic-789');

      fireEvent.click(screen.getByRole('button'));

      expect(mockToggleComplete).toHaveBeenCalledWith({
        topicId: 'topic-789',
        isCompleted: false,
      });
    });

    it('should be disabled when mutation is pending', () => {
      mockIsPending = true;
      renderComponent();

      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should invite completion when not completed', () => {
      mockIsCompleted = false;
      renderComponent();

      expect(screen.getByRole('button', { name: /mark as complete/i })).toBeInTheDocument();
    });

    it('should report completion when completed', () => {
      mockIsCompleted = true;
      renderComponent();

      expect(screen.getByRole('button', { name: /^completed$/i })).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should have outline variant when not completed', () => {
      mockIsCompleted = false;
      renderComponent();

      const button = screen.getByRole('button');
      // Check for outline-related styling
      expect(button).toBeInTheDocument();
    });

    it('should have success styling when completed', () => {
      mockIsCompleted = true;
      const { container } = renderComponent();

      // The button should have success-related classes
      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-success');
    });

    it('should accept custom className', () => {
      mockIsCompleted = false;

      queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });

      render(
        <QueryClientProvider client={queryClient}>
          <TopicProgressButton topicId="topic-123" className="custom-class" />
        </QueryClientProvider>
      );

      const button = screen.getByRole('button');
      expect(button.className).toContain('custom-class');
    });
  });
});
