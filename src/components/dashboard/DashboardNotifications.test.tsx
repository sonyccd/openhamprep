import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DashboardNotifications } from './DashboardNotifications';
import { AlertTriangle, TrendingDown, Clock, Target, Trophy } from 'lucide-react';
import type { DashboardNotification, NotificationVariant } from '@/hooks/useDashboardNotifications';

// Mock the useDashboardNotifications hook
const mockUseDashboardNotifications = vi.fn();
vi.mock('@/hooks/useDashboardNotifications', () => ({
  useDashboardNotifications: () => mockUseDashboardNotifications(),
}));

// Helper to create mock notifications
const createMockNotification = (
  overrides: Partial<DashboardNotification> = {}
): DashboardNotification => ({
  id: 'test-notification',
  type: 'exam-urgent',
  priority: 1,
  title: 'Test Title',
  description: 'Test description',
  icon: AlertTriangle,
  variant: 'destructive' as NotificationVariant,
  dismissible: true,
  ...overrides,
});

// Default props for the component
const defaultProps = {
  examType: 'technician' as const,
  userId: 'user-123',
  thisWeekQuestions: 30,
  questionsGoal: 50,
  thisWeekTests: 1,
  testsGoal: 2,
  userTarget: null,
  onNavigate: vi.fn(),
  maxVisible: 1,
};

describe('DashboardNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('renders nothing when loading', () => {
      mockUseDashboardNotifications.mockReturnValue({
        notifications: [],
        dismissNotification: vi.fn(),
        isLoading: true,
        push: {
          permission: 'default',
          isSupported: true,
          hasAskedPermission: false,
          requestPermission: vi.fn(),
        },
      });

      const { container } = render(<DashboardNotifications {...defaultProps} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Empty State', () => {
    it('renders nothing when no notifications', () => {
      mockUseDashboardNotifications.mockReturnValue({
        notifications: [],
        dismissNotification: vi.fn(),
        isLoading: false,
        push: {
          permission: 'default',
          isSupported: true,
          hasAskedPermission: false,
          requestPermission: vi.fn(),
        },
      });

      const { container } = render(<DashboardNotifications {...defaultProps} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Notification Rendering', () => {
    it('renders a single notification', () => {
      const notification = createMockNotification({
        title: 'Your exam is in 3 days!',
        description: "You're at 72% readiness.",
      });

      mockUseDashboardNotifications.mockReturnValue({
        notifications: [notification],
        dismissNotification: vi.fn(),
        isLoading: false,
        push: {
          permission: 'granted',
          isSupported: true,
          hasAskedPermission: true,
          requestPermission: vi.fn(),
        },
      });

      render(<DashboardNotifications {...defaultProps} />);

      expect(screen.getByText('Your exam is in 3 days!')).toBeInTheDocument();
      expect(screen.getByText("You're at 72% readiness.")).toBeInTheDocument();
    });

    it('renders notification action button', () => {
      const handleAction = vi.fn();
      const notification = createMockNotification({
        action: {
          label: 'Take Practice Test',
          onClick: handleAction,
        },
      });

      mockUseDashboardNotifications.mockReturnValue({
        notifications: [notification],
        dismissNotification: vi.fn(),
        isLoading: false,
        push: {
          permission: 'granted',
          isSupported: true,
          hasAskedPermission: true,
          requestPermission: vi.fn(),
        },
      });

      render(<DashboardNotifications {...defaultProps} />);

      const actionButton = screen.getByText('Take Practice Test');
      expect(actionButton).toBeInTheDocument();

      fireEvent.click(actionButton);
      expect(handleAction).toHaveBeenCalledTimes(1);
    });

    it('renders dismiss button for dismissible notifications', () => {
      const notification = createMockNotification({ dismissible: true });

      mockUseDashboardNotifications.mockReturnValue({
        notifications: [notification],
        dismissNotification: vi.fn(),
        isLoading: false,
        push: {
          permission: 'granted',
          isSupported: true,
          hasAskedPermission: true,
          requestPermission: vi.fn(),
        },
      });

      render(<DashboardNotifications {...defaultProps} />);

      expect(screen.getByRole('button', { name: /dismiss/i })).toBeInTheDocument();
    });

    it('does not render dismiss button for non-dismissible notifications', () => {
      const notification = createMockNotification({ dismissible: false });

      mockUseDashboardNotifications.mockReturnValue({
        notifications: [notification],
        dismissNotification: vi.fn(),
        isLoading: false,
        push: {
          permission: 'granted',
          isSupported: true,
          hasAskedPermission: true,
          requestPermission: vi.fn(),
        },
      });

      render(<DashboardNotifications {...defaultProps} />);

      expect(screen.queryByRole('button', { name: /dismiss/i })).not.toBeInTheDocument();
    });
  });

  describe('Dismissal', () => {
    it('calls dismissNotification when dismiss button is clicked', () => {
      const dismissNotification = vi.fn();
      const notification = createMockNotification({ id: 'exam-urgent' });

      mockUseDashboardNotifications.mockReturnValue({
        notifications: [notification],
        dismissNotification,
        isLoading: false,
        push: {
          permission: 'granted',
          isSupported: true,
          hasAskedPermission: true,
          requestPermission: vi.fn(),
        },
      });

      render(<DashboardNotifications {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /dismiss/i }));
      expect(dismissNotification).toHaveBeenCalledWith('exam-urgent');
    });
  });

  describe('Notification Variants', () => {
    it('renders destructive variant with correct styling', () => {
      const notification = createMockNotification({ variant: 'destructive' });

      mockUseDashboardNotifications.mockReturnValue({
        notifications: [notification],
        dismissNotification: vi.fn(),
        isLoading: false,
        push: {
          permission: 'granted',
          isSupported: true,
          hasAskedPermission: true,
          requestPermission: vi.fn(),
        },
      });

      const { container } = render(<DashboardNotifications {...defaultProps} />);
      expect(container.querySelector('.border-destructive\\/30')).toBeInTheDocument();
    });

    it('renders warning variant with correct styling', () => {
      const notification = createMockNotification({
        variant: 'warning',
        icon: TrendingDown,
      });

      mockUseDashboardNotifications.mockReturnValue({
        notifications: [notification],
        dismissNotification: vi.fn(),
        isLoading: false,
        push: {
          permission: 'granted',
          isSupported: true,
          hasAskedPermission: true,
          requestPermission: vi.fn(),
        },
      });

      const { container } = render(<DashboardNotifications {...defaultProps} />);
      expect(container.querySelector('.border-warning\\/30')).toBeInTheDocument();
    });

    it('renders success variant with correct styling', () => {
      const notification = createMockNotification({
        variant: 'success',
        icon: Trophy,
      });

      mockUseDashboardNotifications.mockReturnValue({
        notifications: [notification],
        dismissNotification: vi.fn(),
        isLoading: false,
        push: {
          permission: 'granted',
          isSupported: true,
          hasAskedPermission: true,
          requestPermission: vi.fn(),
        },
      });

      const { container } = render(<DashboardNotifications {...defaultProps} />);
      expect(container.querySelector('.border-success\\/30')).toBeInTheDocument();
    });

    it('renders muted variant with correct styling', () => {
      const notification = createMockNotification({
        variant: 'muted',
        icon: Clock,
      });

      mockUseDashboardNotifications.mockReturnValue({
        notifications: [notification],
        dismissNotification: vi.fn(),
        isLoading: false,
        push: {
          permission: 'granted',
          isSupported: true,
          hasAskedPermission: true,
          requestPermission: vi.fn(),
        },
      });

      const { container } = render(<DashboardNotifications {...defaultProps} />);
      expect(container.querySelector('.border-border')).toBeInTheDocument();
    });
  });

  describe('Push Notification Prompt', () => {
    it('shows push prompt for high-priority notifications when permission not asked', () => {
      const notification = createMockNotification({ priority: 1 });

      mockUseDashboardNotifications.mockReturnValue({
        notifications: [notification],
        dismissNotification: vi.fn(),
        isLoading: false,
        push: {
          permission: 'default',
          isSupported: true,
          hasAskedPermission: false,
          requestPermission: vi.fn(),
        },
      });

      render(<DashboardNotifications {...defaultProps} />);
      expect(screen.getByText('Enable alerts')).toBeInTheDocument();
    });

    it('does not show push prompt when permission already granted', () => {
      const notification = createMockNotification({ priority: 1 });

      mockUseDashboardNotifications.mockReturnValue({
        notifications: [notification],
        dismissNotification: vi.fn(),
        isLoading: false,
        push: {
          permission: 'granted',
          isSupported: true,
          hasAskedPermission: true,
          requestPermission: vi.fn(),
        },
      });

      render(<DashboardNotifications {...defaultProps} />);
      expect(screen.queryByText('Enable alerts')).not.toBeInTheDocument();
    });

    it('does not show push prompt when permission already asked', () => {
      const notification = createMockNotification({ priority: 1 });

      mockUseDashboardNotifications.mockReturnValue({
        notifications: [notification],
        dismissNotification: vi.fn(),
        isLoading: false,
        push: {
          permission: 'default',
          isSupported: true,
          hasAskedPermission: true,
          requestPermission: vi.fn(),
        },
      });

      render(<DashboardNotifications {...defaultProps} />);
      expect(screen.queryByText('Enable alerts')).not.toBeInTheDocument();
    });

    it('does not show push prompt for low-priority notifications', () => {
      const notification = createMockNotification({ priority: 5 });

      mockUseDashboardNotifications.mockReturnValue({
        notifications: [notification],
        dismissNotification: vi.fn(),
        isLoading: false,
        push: {
          permission: 'default',
          isSupported: true,
          hasAskedPermission: false,
          requestPermission: vi.fn(),
        },
      });

      render(<DashboardNotifications {...defaultProps} />);
      expect(screen.queryByText('Enable alerts')).not.toBeInTheDocument();
    });

    it('does not show push prompt when notifications not supported', () => {
      const notification = createMockNotification({ priority: 1 });

      mockUseDashboardNotifications.mockReturnValue({
        notifications: [notification],
        dismissNotification: vi.fn(),
        isLoading: false,
        push: {
          permission: 'default',
          isSupported: false,
          hasAskedPermission: false,
          requestPermission: vi.fn(),
        },
      });

      render(<DashboardNotifications {...defaultProps} />);
      expect(screen.queryByText('Enable alerts')).not.toBeInTheDocument();
    });

    it('calls requestPermission when push prompt button is clicked', () => {
      const requestPermission = vi.fn();
      const notification = createMockNotification({ priority: 1 });

      mockUseDashboardNotifications.mockReturnValue({
        notifications: [notification],
        dismissNotification: vi.fn(),
        isLoading: false,
        push: {
          permission: 'default',
          isSupported: true,
          hasAskedPermission: false,
          requestPermission,
        },
      });

      render(<DashboardNotifications {...defaultProps} />);

      fireEvent.click(screen.getByText('Enable alerts'));
      expect(requestPermission).toHaveBeenCalledTimes(1);
    });
  });

  describe('Multiple Notifications', () => {
    it('renders multiple notifications when present', () => {
      const notifications = [
        createMockNotification({
          id: 'exam-urgent',
          title: 'Exam in 3 days!',
          priority: 1,
        }),
        createMockNotification({
          id: 'declining-performance',
          title: 'Accuracy declining',
          priority: 2,
        }),
      ];

      mockUseDashboardNotifications.mockReturnValue({
        notifications,
        dismissNotification: vi.fn(),
        isLoading: false,
        push: {
          permission: 'granted',
          isSupported: true,
          hasAskedPermission: true,
          requestPermission: vi.fn(),
        },
      });

      render(<DashboardNotifications {...defaultProps} maxVisible={2} />);

      expect(screen.getByText('Exam in 3 days!')).toBeInTheDocument();
      expect(screen.getByText('Accuracy declining')).toBeInTheDocument();
    });
  });

  describe('Notification Types', () => {
    it('renders exam-urgent notification correctly', () => {
      const notification = createMockNotification({
        type: 'exam-urgent',
        title: 'Your exam is in 3 days!',
        description: "You're at 72% readiness. Take a practice test to prepare.",
        icon: AlertTriangle,
        variant: 'destructive',
      });

      mockUseDashboardNotifications.mockReturnValue({
        notifications: [notification],
        dismissNotification: vi.fn(),
        isLoading: false,
        push: {
          permission: 'granted',
          isSupported: true,
          hasAskedPermission: true,
          requestPermission: vi.fn(),
        },
      });

      render(<DashboardNotifications {...defaultProps} />);
      expect(screen.getByText('Your exam is in 3 days!')).toBeInTheDocument();
    });

    it('renders declining-performance notification correctly', () => {
      const notification = createMockNotification({
        type: 'declining-performance',
        title: 'Your accuracy has been declining',
        description: 'Keep practicing to get back on track.',
        icon: TrendingDown,
        variant: 'warning',
      });

      mockUseDashboardNotifications.mockReturnValue({
        notifications: [notification],
        dismissNotification: vi.fn(),
        isLoading: false,
        push: {
          permission: 'granted',
          isSupported: true,
          hasAskedPermission: true,
          requestPermission: vi.fn(),
        },
      });

      render(<DashboardNotifications {...defaultProps} />);
      expect(screen.getByText('Your accuracy has been declining')).toBeInTheDocument();
    });

    it('renders weekly-goal-close notification correctly', () => {
      const notification = createMockNotification({
        type: 'weekly-goal-close',
        title: 'Almost there! 80% of weekly goal complete',
        description: 'Just 10 more questions to hit your target.',
        icon: Target,
        variant: 'success',
      });

      mockUseDashboardNotifications.mockReturnValue({
        notifications: [notification],
        dismissNotification: vi.fn(),
        isLoading: false,
        push: {
          permission: 'granted',
          isSupported: true,
          hasAskedPermission: true,
          requestPermission: vi.fn(),
        },
      });

      render(<DashboardNotifications {...defaultProps} />);
      expect(screen.getByText('Almost there! 80% of weekly goal complete')).toBeInTheDocument();
    });

    it('renders readiness-milestone notification correctly', () => {
      const notification = createMockNotification({
        id: 'readiness-milestone-80',
        type: 'readiness-milestone',
        title: "You've reached 80% readiness! You're almost exam-ready.",
        description: 'Keep practicing to maintain your skills.',
        icon: Trophy,
        variant: 'success',
      });

      mockUseDashboardNotifications.mockReturnValue({
        notifications: [notification],
        dismissNotification: vi.fn(),
        isLoading: false,
        push: {
          permission: 'granted',
          isSupported: true,
          hasAskedPermission: true,
          requestPermission: vi.fn(),
        },
      });

      render(<DashboardNotifications {...defaultProps} />);
      expect(screen.getByText("You've reached 80% readiness! You're almost exam-ready.")).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has accessible dismiss button', () => {
      const notification = createMockNotification({ dismissible: true });

      mockUseDashboardNotifications.mockReturnValue({
        notifications: [notification],
        dismissNotification: vi.fn(),
        isLoading: false,
        push: {
          permission: 'granted',
          isSupported: true,
          hasAskedPermission: true,
          requestPermission: vi.fn(),
        },
      });

      render(<DashboardNotifications {...defaultProps} />);

      const dismissButton = screen.getByRole('button', { name: /dismiss notification/i });
      expect(dismissButton).toBeInTheDocument();
    });
  });
});
