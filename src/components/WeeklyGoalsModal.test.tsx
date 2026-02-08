import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WeeklyGoalsModal } from './WeeklyGoalsModal';

// Mock weeklyGoalsService
const mockUpsertGoals = vi.fn();
vi.mock('@/services/weeklyGoals/weeklyGoalsService', () => ({
  weeklyGoalsService: {
    upsertGoals: (...args: unknown[]) => mockUpsertGoals(...args),
  },
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock unwrapOrThrow - pass through success, throw on failure
vi.mock('@/services/types', () => ({
  unwrapOrThrow: (result: { success: boolean; data?: unknown; error?: { message: string } }) => {
    if (result.success) return result.data;
    throw new Error(result.error?.message || 'Service error');
  },
}));

import { toast } from 'sonner';

describe('WeeklyGoalsModal', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    userId: 'user-123',
    currentGoals: null,
    onGoalsUpdated: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Default: upsert succeeds
    mockUpsertGoals.mockResolvedValue({ success: true, data: undefined });
  });

  describe('Display', () => {
    it('renders dialog title', () => {
      render(<WeeklyGoalsModal {...defaultProps} />);

      expect(screen.getByText('Weekly Study Goals')).toBeInTheDocument();
    });

    it('renders dialog description', () => {
      render(<WeeklyGoalsModal {...defaultProps} />);

      expect(screen.getByText('Set your weekly targets to stay on track with your studies.')).toBeInTheDocument();
    });

    it('renders questions per week label', () => {
      render(<WeeklyGoalsModal {...defaultProps} />);

      expect(screen.getByText('Questions per week')).toBeInTheDocument();
    });

    it('renders practice tests per week label', () => {
      render(<WeeklyGoalsModal {...defaultProps} />);

      expect(screen.getByText('Practice tests per week')).toBeInTheDocument();
    });

    it('renders Save Goals button', () => {
      render(<WeeklyGoalsModal {...defaultProps} />);

      expect(screen.getByRole('button', { name: /save goals/i })).toBeInTheDocument();
    });

    it('renders Cancel button', () => {
      render(<WeeklyGoalsModal {...defaultProps} />);

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });
  });

  describe('Initial Values', () => {
    it('shows default values when currentGoals is null', () => {
      render(<WeeklyGoalsModal {...defaultProps} currentGoals={null} />);

      // Default values are 50 questions and 2 tests
      expect(screen.getByText('50')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('shows current goals values when provided', () => {
      render(
        <WeeklyGoalsModal
          {...defaultProps}
          currentGoals={{ questions_goal: 100, tests_goal: 5 }}
        />
      );

      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  describe('Slider Bounds', () => {
    it('displays questions slider min and max labels', () => {
      render(<WeeklyGoalsModal {...defaultProps} />);

      // Questions slider: min 10, max 200
      expect(screen.getAllByText('10').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('200')).toBeInTheDocument();
    });

    it('displays tests slider min and max labels', () => {
      render(<WeeklyGoalsModal {...defaultProps} />);

      // Tests slider: min 1, max 10
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getAllByText('10').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Cancel Button', () => {
    it('calls onOpenChange with false when Cancel is clicked', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();

      render(<WeeklyGoalsModal {...defaultProps} onOpenChange={onOpenChange} />);

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('Save Goals', () => {
    it('calls upsertGoals with correct params (no current goals)', async () => {
      const user = userEvent.setup();
      const onGoalsUpdated = vi.fn();

      render(
        <WeeklyGoalsModal
          {...defaultProps}
          currentGoals={null}
          onGoalsUpdated={onGoalsUpdated}
        />
      );

      await user.click(screen.getByRole('button', { name: /save goals/i }));

      await waitFor(() => {
        expect(mockUpsertGoals).toHaveBeenCalledWith('user-123', 50, 2);
      });
    });

    it('calls upsertGoals with correct params (existing goals)', async () => {
      const user = userEvent.setup();

      render(
        <WeeklyGoalsModal
          {...defaultProps}
          currentGoals={{ questions_goal: 100, tests_goal: 5 }}
        />
      );

      await user.click(screen.getByRole('button', { name: /save goals/i }));

      await waitFor(() => {
        expect(mockUpsertGoals).toHaveBeenCalledWith('user-123', 100, 5);
      });
    });

    it('shows success toast on successful save', async () => {
      const user = userEvent.setup();

      render(<WeeklyGoalsModal {...defaultProps} currentGoals={null} />);

      await user.click(screen.getByRole('button', { name: /save goals/i }));

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Weekly goals updated!');
      });
    });

    it('calls onGoalsUpdated on successful save', async () => {
      const user = userEvent.setup();
      const onGoalsUpdated = vi.fn();

      render(
        <WeeklyGoalsModal
          {...defaultProps}
          currentGoals={null}
          onGoalsUpdated={onGoalsUpdated}
        />
      );

      await user.click(screen.getByRole('button', { name: /save goals/i }));

      await waitFor(() => {
        expect(onGoalsUpdated).toHaveBeenCalled();
      });
    });

    it('closes dialog on successful save', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();

      render(
        <WeeklyGoalsModal
          {...defaultProps}
          currentGoals={null}
          onOpenChange={onOpenChange}
        />
      );

      await user.click(screen.getByRole('button', { name: /save goals/i }));

      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(false);
      });
    });
  });

  describe('Error Handling', () => {
    it('shows error toast when save fails', async () => {
      const user = userEvent.setup();
      mockUpsertGoals.mockResolvedValueOnce({
        success: false,
        error: { code: 'DATABASE_ERROR', message: 'Database error' },
      });

      render(<WeeklyGoalsModal {...defaultProps} currentGoals={null} />);

      await user.click(screen.getByRole('button', { name: /save goals/i }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to save goals');
      });
    });

    it('does not call onGoalsUpdated when save fails', async () => {
      const user = userEvent.setup();
      const onGoalsUpdated = vi.fn();
      mockUpsertGoals.mockResolvedValueOnce({
        success: false,
        error: { code: 'DATABASE_ERROR', message: 'Database error' },
      });

      render(
        <WeeklyGoalsModal
          {...defaultProps}
          currentGoals={null}
          onGoalsUpdated={onGoalsUpdated}
        />
      );

      await user.click(screen.getByRole('button', { name: /save goals/i }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });

      expect(onGoalsUpdated).not.toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('disables Save button while saving', async () => {
      const user = userEvent.setup();

      // Make the upsert hang
      mockUpsertGoals.mockImplementation(() => new Promise(() => {}));

      render(<WeeklyGoalsModal {...defaultProps} currentGoals={null} />);

      await user.click(screen.getByRole('button', { name: /save goals/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save goals/i })).toBeDisabled();
      });
    });
  });

  describe('Dialog Closed State', () => {
    it('does not render when open is false', () => {
      render(<WeeklyGoalsModal {...defaultProps} open={false} />);

      expect(screen.queryByText('Weekly Study Goals')).not.toBeInTheDocument();
    });
  });
});
