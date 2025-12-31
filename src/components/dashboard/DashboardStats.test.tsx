import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DashboardStats } from './DashboardStats';

describe('DashboardStats', () => {
  const defaultProps = {
    overallAccuracy: 75,
    passedTests: 3,
    totalTests: 5,
    weakQuestionCount: 8,
    bestStreak: 12,
  };

  describe('Rendering', () => {
    it('displays overall accuracy percentage', () => {
      render(<DashboardStats {...defaultProps} />);
      expect(screen.getByText('75%')).toBeInTheDocument();
      expect(screen.getByText('Accuracy')).toBeInTheDocument();
    });

    it('displays passed/total tests ratio', () => {
      render(<DashboardStats {...defaultProps} />);
      expect(screen.getByText('3/5')).toBeInTheDocument();
      expect(screen.getByText('Tests Passed')).toBeInTheDocument();
    });

    it('displays weak question count', () => {
      render(<DashboardStats {...defaultProps} />);
      expect(screen.getByText('8')).toBeInTheDocument();
      expect(screen.getByText('Weak Questions')).toBeInTheDocument();
    });

    it('displays best streak', () => {
      render(<DashboardStats {...defaultProps} />);
      expect(screen.getByText('12')).toBeInTheDocument();
      expect(screen.getByText('Best Streak')).toBeInTheDocument();
    });
  });

  describe('Conditional Styling', () => {
    it('applies warning color when weak questions exceed 10', () => {
      render(<DashboardStats {...defaultProps} weakQuestionCount={15} />);
      const weakCount = screen.getByText('15');
      expect(weakCount).toHaveClass('text-warning');
    });

    it('applies normal color when weak questions are 10 or less', () => {
      render(<DashboardStats {...defaultProps} weakQuestionCount={10} />);
      const weakCount = screen.getByText('10');
      expect(weakCount).toHaveClass('text-foreground');
    });

    it('shows flame icon when best streak is greater than 0', () => {
      render(<DashboardStats {...defaultProps} bestStreak={5} />);
      // Flame icon should be present (rendered as SVG)
      const streakContainer = screen.getByText('5').closest('div');
      expect(streakContainer?.querySelector('svg')).toBeInTheDocument();
    });

    it('does not show flame icon when best streak is 0', () => {
      render(<DashboardStats {...defaultProps} bestStreak={0} />);
      const streakText = screen.getByText('0');
      expect(streakText).toHaveClass('text-muted-foreground');
    });
  });

  describe('Edge Cases', () => {
    it('handles zero values correctly', () => {
      render(
        <DashboardStats
          overallAccuracy={0}
          passedTests={0}
          totalTests={0}
          weakQuestionCount={0}
          bestStreak={0}
        />
      );
      expect(screen.getByText('0%')).toBeInTheDocument();
      expect(screen.getByText('0/0')).toBeInTheDocument();
    });

    it('handles 100% accuracy', () => {
      render(<DashboardStats {...defaultProps} overallAccuracy={100} />);
      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });
});
