import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DashboardReadiness } from './DashboardReadiness';

describe('DashboardReadiness', () => {
  const defaultProps = {
    readinessLevel: 'getting-close' as const,
    readinessTitle: 'Almost Ready!',
    readinessMessage: 'A few more passing scores and you\'ll be ready',
    readinessProgress: 75,
    recentAvgScore: 78,
    passedTests: 3,
    totalTests: 5,
    onStartPracticeTest: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('displays the readiness title', () => {
      render(<DashboardReadiness {...defaultProps} />);
      expect(screen.getByText('Almost Ready!')).toBeInTheDocument();
    });

    it('displays the readiness message', () => {
      render(<DashboardReadiness {...defaultProps} />);
      expect(screen.getByText(/A few more passing scores/)).toBeInTheDocument();
    });

    it('displays the recent average score', () => {
      render(<DashboardReadiness {...defaultProps} />);
      expect(screen.getByText('78%')).toBeInTheDocument();
    });

    it('displays passed/total tests', () => {
      render(<DashboardReadiness {...defaultProps} />);
      expect(screen.getByText('3/5 tests passed')).toBeInTheDocument();
    });

    it('displays passing requirement', () => {
      render(<DashboardReadiness {...defaultProps} />);
      expect(screen.getByText('Need 74% to pass')).toBeInTheDocument();
    });
  });

  describe('Not Started State', () => {
    it('shows CTA button when not started', () => {
      render(
        <DashboardReadiness
          {...defaultProps}
          readinessLevel="not-started"
          readinessTitle="Test Readiness Unknown"
        />
      );
      expect(
        screen.getByRole('button', { name: /take your first practice test/i })
      ).toBeInTheDocument();
    });

    it('shows helper text when not started', () => {
      render(
        <DashboardReadiness
          {...defaultProps}
          readinessLevel="not-started"
        />
      );
      expect(
        screen.getByText(/see where you stand/i)
      ).toBeInTheDocument();
    });

    it('calls onStartPracticeTest when CTA is clicked', () => {
      render(
        <DashboardReadiness
          {...defaultProps}
          readinessLevel="not-started"
        />
      );
      fireEvent.click(
        screen.getByRole('button', { name: /take your first practice test/i })
      );
      expect(defaultProps.onStartPracticeTest).toHaveBeenCalledTimes(1);
    });

    it('displays dash when no score available', () => {
      render(
        <DashboardReadiness
          {...defaultProps}
          readinessLevel="not-started"
          recentAvgScore={0}
        />
      );
      expect(screen.getByText('—')).toBeInTheDocument();
    });
  });

  describe('Needs Work State', () => {
    it('applies warning styling for needs-work', () => {
      render(
        <DashboardReadiness
          {...defaultProps}
          readinessLevel="needs-work"
          readinessTitle="Not Ready Yet"
        />
      );
      expect(screen.getByText('Not Ready Yet')).toHaveClass('text-warning');
    });

    it('does not show CTA button', () => {
      render(
        <DashboardReadiness
          {...defaultProps}
          readinessLevel="needs-work"
        />
      );
      expect(
        screen.queryByRole('button', { name: /take your first practice test/i })
      ).not.toBeInTheDocument();
    });
  });

  describe('Getting Close State', () => {
    it('applies primary styling for getting-close', () => {
      render(<DashboardReadiness {...defaultProps} />);
      expect(screen.getByText('Almost Ready!')).toHaveClass('text-primary');
    });
  });

  describe('Ready State', () => {
    it('applies success styling for ready', () => {
      render(
        <DashboardReadiness
          {...defaultProps}
          readinessLevel="ready"
          readinessTitle="Ready to Pass!"
        />
      );
      expect(screen.getByText('Ready to Pass!')).toHaveClass('text-success');
    });

    it('shows checkmark icon when ready', () => {
      render(
        <DashboardReadiness
          {...defaultProps}
          readinessLevel="ready"
          readinessTitle="Ready to Pass!"
        />
      );
      // CheckCircle icon should be present - there should be an SVG in the component
      const container = screen.getByText('Ready to Pass!').closest('div[class*="rounded-xl"]');
      expect(container?.querySelectorAll('svg').length).toBeGreaterThan(0);
    });
  });
});
