import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DashboardWeakAreas } from './DashboardWeakAreas';

describe('DashboardWeakAreas', () => {
  const defaultProps = {
    weakQuestionCount: 12,
    onReviewWeakQuestions: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('displays the section header', () => {
      render(<DashboardWeakAreas {...defaultProps} />);
      expect(screen.getByText('Areas to Improve')).toBeInTheDocument();
    });

    it('displays weak question count', () => {
      render(<DashboardWeakAreas {...defaultProps} />);
      expect(screen.getByText('12')).toBeInTheDocument();
    });

    it('displays label for weak questions', () => {
      render(<DashboardWeakAreas {...defaultProps} />);
      expect(screen.getByText('Questions to review')).toBeInTheDocument();
    });
  });

  describe('With Weak Questions', () => {
    it('shows review button when there are weak questions', () => {
      render(<DashboardWeakAreas {...defaultProps} />);
      expect(
        screen.getByRole('button', { name: /review weak questions/i })
      ).toBeInTheDocument();
    });

    it('calls onReviewWeakQuestions when button is clicked', () => {
      render(<DashboardWeakAreas {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /review weak questions/i }));
      expect(defaultProps.onReviewWeakQuestions).toHaveBeenCalledTimes(1);
    });

    it('applies warning color to count', () => {
      render(<DashboardWeakAreas {...defaultProps} />);
      expect(screen.getByText('12')).toHaveClass('text-warning');
    });
  });

  describe('No Weak Questions', () => {
    it('shows success message when no weak questions', () => {
      render(<DashboardWeakAreas weakQuestionCount={0} onReviewWeakQuestions={vi.fn()} />);
      expect(screen.getByText(/no weak areas detected/i)).toBeInTheDocument();
    });

    it('shows checkmark icon when no weak questions', () => {
      render(<DashboardWeakAreas weakQuestionCount={0} onReviewWeakQuestions={vi.fn()} />);
      // CheckCircle icon should be present
      const successMessage = screen.getByText(/no weak areas detected/i);
      const container = successMessage.closest('div');
      expect(container?.querySelector('svg')).toBeInTheDocument();
    });

    it('does not show review button when no weak questions', () => {
      render(<DashboardWeakAreas weakQuestionCount={0} onReviewWeakQuestions={vi.fn()} />);
      expect(
        screen.queryByRole('button', { name: /review weak questions/i })
      ).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles single weak question', () => {
      render(<DashboardWeakAreas weakQuestionCount={1} onReviewWeakQuestions={vi.fn()} />);
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /review weak questions/i })
      ).toBeInTheDocument();
    });

    it('handles large number of weak questions', () => {
      render(<DashboardWeakAreas weakQuestionCount={150} onReviewWeakQuestions={vi.fn()} />);
      expect(screen.getByText('150')).toBeInTheDocument();
    });
  });
});
