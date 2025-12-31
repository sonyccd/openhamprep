import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DashboardRecentPerformance } from './DashboardRecentPerformance';

describe('DashboardRecentPerformance', () => {
  const mockTests = [
    { id: 'test-1', percentage: 85, passed: true, completed_at: '2024-01-15T10:00:00Z' },
    { id: 'test-2', percentage: 68, passed: false, completed_at: '2024-01-14T10:00:00Z' },
    { id: 'test-3', percentage: 92, passed: true, completed_at: '2024-01-13T10:00:00Z' },
  ];

  const defaultProps = {
    recentTests: mockTests,
    onReviewTest: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('displays the section header', () => {
      render(<DashboardRecentPerformance {...defaultProps} />);
      expect(screen.getByText('Recent Performance')).toBeInTheDocument();
    });

    it('displays all recent tests (up to 3)', () => {
      render(<DashboardRecentPerformance {...defaultProps} />);
      expect(screen.getByText('85%')).toBeInTheDocument();
      expect(screen.getByText('68%')).toBeInTheDocument();
      expect(screen.getByText('92%')).toBeInTheDocument();
    });

    it('displays test dates', () => {
      render(<DashboardRecentPerformance {...defaultProps} />);
      // Dates are formatted by toLocaleDateString
      expect(screen.getByText('1/15/2024')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('shows empty message when no tests', () => {
      render(<DashboardRecentPerformance recentTests={[]} onReviewTest={vi.fn()} />);
      expect(screen.getByText(/no tests yet/i)).toBeInTheDocument();
    });
  });

  describe('Pass/Fail Indicators', () => {
    it('shows checkmark for passed tests', () => {
      render(<DashboardRecentPerformance {...defaultProps} />);
      const checkmarks = screen.getAllByText('✓');
      expect(checkmarks).toHaveLength(2); // 2 passed tests
    });

    it('shows X for failed tests', () => {
      render(<DashboardRecentPerformance {...defaultProps} />);
      const xMarks = screen.getAllByText('✗');
      expect(xMarks).toHaveLength(1); // 1 failed test
    });

    it('applies success styling to passed test scores', () => {
      render(<DashboardRecentPerformance {...defaultProps} />);
      expect(screen.getByText('85%')).toHaveClass('text-success');
    });

    it('applies destructive styling to failed test scores', () => {
      render(<DashboardRecentPerformance {...defaultProps} />);
      expect(screen.getByText('68%')).toHaveClass('text-destructive');
    });
  });

  describe('Interactions', () => {
    it('calls onReviewTest with test id when clicked', () => {
      render(<DashboardRecentPerformance {...defaultProps} />);
      const testButtons = screen.getAllByRole('button');
      fireEvent.click(testButtons[0]);
      expect(defaultProps.onReviewTest).toHaveBeenCalledWith('test-1');
    });

    it('calls onReviewTest for each test', () => {
      render(<DashboardRecentPerformance {...defaultProps} />);
      const testButtons = screen.getAllByRole('button');

      fireEvent.click(testButtons[0]);
      expect(defaultProps.onReviewTest).toHaveBeenCalledWith('test-1');

      fireEvent.click(testButtons[1]);
      expect(defaultProps.onReviewTest).toHaveBeenCalledWith('test-2');

      fireEvent.click(testButtons[2]);
      expect(defaultProps.onReviewTest).toHaveBeenCalledWith('test-3');
    });
  });

  describe('Limited Display', () => {
    it('only shows first 3 tests even if more provided', () => {
      const manyTests = [
        ...mockTests,
        { id: 'test-4', percentage: 75, passed: true, completed_at: '2024-01-12T10:00:00Z' },
        { id: 'test-5', percentage: 80, passed: true, completed_at: '2024-01-11T10:00:00Z' },
      ];
      render(<DashboardRecentPerformance recentTests={manyTests} onReviewTest={vi.fn()} />);
      const testButtons = screen.getAllByRole('button');
      expect(testButtons).toHaveLength(3);
    });
  });
});
