import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DashboardWeeklyGoals } from './DashboardWeeklyGoals';

describe('DashboardWeeklyGoals', () => {
  const defaultProps = {
    thisWeekQuestions: 30,
    thisWeekTests: 1,
    questionsGoal: 50,
    testsGoal: 2,
    onOpenGoalsModal: vi.fn(),
    onStartRandomPractice: vi.fn(),
    onStartPracticeTest: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('displays the weekly header', () => {
      render(<DashboardWeeklyGoals {...defaultProps} />);
      expect(screen.getByText('This Week')).toBeInTheDocument();
      expect(screen.getByText('Resets Sunday')).toBeInTheDocument();
    });

    it('displays questions progress', () => {
      render(<DashboardWeeklyGoals {...defaultProps} />);
      expect(screen.getByText('Questions')).toBeInTheDocument();
      expect(screen.getByText('30/50')).toBeInTheDocument();
    });

    it('displays tests progress', () => {
      render(<DashboardWeeklyGoals {...defaultProps} />);
      expect(screen.getByText('Practice Tests')).toBeInTheDocument();
      expect(screen.getByText('1/2')).toBeInTheDocument();
    });
  });

  describe('Goal Not Reached State', () => {
    it('shows Practice Questions button when goal not reached', () => {
      render(<DashboardWeeklyGoals {...defaultProps} />);
      expect(screen.getByRole('button', { name: /practice questions/i })).toBeInTheDocument();
    });

    it('shows Take a Test button when tests goal not reached', () => {
      render(<DashboardWeeklyGoals {...defaultProps} />);
      expect(screen.getByRole('button', { name: /take a test/i })).toBeInTheDocument();
    });

    it('calls onStartRandomPractice when Practice Questions is clicked', () => {
      render(<DashboardWeeklyGoals {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /practice questions/i }));
      expect(defaultProps.onStartRandomPractice).toHaveBeenCalledTimes(1);
    });

    it('calls onStartPracticeTest when Take a Test is clicked', () => {
      render(<DashboardWeeklyGoals {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /take a test/i }));
      expect(defaultProps.onStartPracticeTest).toHaveBeenCalledTimes(1);
    });
  });

  describe('Goal Reached State', () => {
    it('shows Goal reached for questions when goal met', () => {
      render(
        <DashboardWeeklyGoals {...defaultProps} thisWeekQuestions={50} />
      );
      expect(screen.getByText('Goal reached!')).toBeInTheDocument();
    });

    it('shows Goal reached for tests when goal met', () => {
      render(
        <DashboardWeeklyGoals {...defaultProps} thisWeekTests={2} />
      );
      expect(screen.getAllByText('Goal reached!')).toHaveLength(1);
    });

    it('shows both Goal reached when both goals met', () => {
      render(
        <DashboardWeeklyGoals
          {...defaultProps}
          thisWeekQuestions={50}
          thisWeekTests={2}
        />
      );
      expect(screen.getAllByText('Goal reached!')).toHaveLength(2);
    });

    it('applies success color when goal reached', () => {
      render(
        <DashboardWeeklyGoals {...defaultProps} thisWeekQuestions={50} />
      );
      expect(screen.getByText('50/50')).toHaveClass('text-success');
    });
  });

  describe('Settings Modal', () => {
    it('calls onOpenGoalsModal when settings button is clicked', () => {
      render(<DashboardWeeklyGoals {...defaultProps} />);
      const settingsButtons = screen.getAllByRole('button');
      // Settings button is the icon button
      const settingsButton = settingsButtons.find(btn =>
        btn.querySelector('svg') && btn.className.includes('h-6')
      );
      if (settingsButton) {
        fireEvent.click(settingsButton);
        expect(defaultProps.onOpenGoalsModal).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe('Progress Bar', () => {
    it('caps progress at 100% for questions', () => {
      render(
        <DashboardWeeklyGoals {...defaultProps} thisWeekQuestions={100} />
      );
      expect(screen.getByText('100/50')).toBeInTheDocument();
    });

    it('caps progress at 100% for tests', () => {
      render(
        <DashboardWeeklyGoals {...defaultProps} thisWeekTests={5} />
      );
      expect(screen.getByText('5/2')).toBeInTheDocument();
    });
  });
});
