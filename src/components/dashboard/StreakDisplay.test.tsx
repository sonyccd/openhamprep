import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StreakDisplay } from './StreakDisplay';

// Mock the useDailyStreak hook
const mockUseDailyStreak = vi.fn();
vi.mock('@/hooks/useDailyStreak', () => ({
  useDailyStreak: () => mockUseDailyStreak(),
}));

describe('StreakDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('shows loading skeleton when loading', () => {
      mockUseDailyStreak.mockReturnValue({
        currentStreak: 0,
        longestStreak: 0,
        todayQualifies: false,
        questionsToday: 0,
        questionsNeeded: 5,
        streakAtRisk: false,
        isLoading: true,
      });

      const { container } = render(<StreakDisplay />);
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });
  });

  describe('Compact Variant', () => {
    it('renders compact version with streak count', () => {
      mockUseDailyStreak.mockReturnValue({
        currentStreak: 7,
        longestStreak: 10,
        todayQualifies: true,
        questionsToday: 8,
        questionsNeeded: 0,
        streakAtRisk: false,
        isLoading: false,
      });

      render(<StreakDisplay variant="compact" />);
      expect(screen.getByText('7')).toBeInTheDocument();
    });

    it('shows muted style for zero streak in compact mode', () => {
      mockUseDailyStreak.mockReturnValue({
        currentStreak: 0,
        longestStreak: 0,
        todayQualifies: false,
        questionsToday: 0,
        questionsNeeded: 5,
        streakAtRisk: false,
        isLoading: false,
      });

      const { container } = render(<StreakDisplay variant="compact" />);
      expect(container.querySelector('.bg-muted')).toBeInTheDocument();
    });
  });

  describe('Full Variant - Active Streak', () => {
    beforeEach(() => {
      mockUseDailyStreak.mockReturnValue({
        currentStreak: 7,
        longestStreak: 10,
        todayQualifies: true,
        questionsToday: 8,
        questionsNeeded: 0,
        streakAtRisk: false,
        isLoading: false,
      });
    });

    it('displays current streak count', () => {
      render(<StreakDisplay />);
      expect(screen.getByText('7')).toBeInTheDocument();
      expect(screen.getByText('days')).toBeInTheDocument();
    });

    it('displays "Current streak" label', () => {
      render(<StreakDisplay />);
      expect(screen.getByText('Current streak')).toBeInTheDocument();
    });

    it('shows best streak badge', () => {
      render(<StreakDisplay />);
      expect(screen.getByText('10')).toBeInTheDocument();
    });

    it('shows "Complete!" when today qualifies', () => {
      render(<StreakDisplay />);
      expect(screen.getByText('Complete!')).toBeInTheDocument();
    });

    it('shows success message when streak continues', () => {
      render(<StreakDisplay />);
      expect(screen.getByText('Great work! Come back tomorrow to continue your streak.')).toBeInTheDocument();
    });
  });

  describe('Full Variant - No Streak', () => {
    beforeEach(() => {
      mockUseDailyStreak.mockReturnValue({
        currentStreak: 0,
        longestStreak: 0,
        todayQualifies: false,
        questionsToday: 0,
        questionsNeeded: 5,
        streakAtRisk: false,
        isLoading: false,
      });
    });

    it('displays zero streak', () => {
      render(<StreakDisplay />);
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('shows "Start a streak!" message', () => {
      render(<StreakDisplay />);
      expect(screen.getByText('Start a streak!')).toBeInTheDocument();
    });

    it('shows progress toward 5 questions', () => {
      render(<StreakDisplay />);
      expect(screen.getByText('0/5 questions')).toBeInTheDocument();
    });

    it('does not show best streak badge when no history', () => {
      render(<StreakDisplay />);
      // Only the streak count "0" should be visible, not a separate badge
      const zeros = screen.getAllByText('0');
      expect(zeros).toHaveLength(1);
    });
  });

  describe('Full Variant - Streak At Risk', () => {
    beforeEach(() => {
      mockUseDailyStreak.mockReturnValue({
        currentStreak: 5,
        longestStreak: 8,
        todayQualifies: false,
        questionsToday: 2,
        questionsNeeded: 3,
        streakAtRisk: true,
        isLoading: false,
      });
    });

    it('shows warning when streak is at risk', () => {
      render(<StreakDisplay />);
      expect(screen.getByText(/Answer 3 more questions to keep your streak!/)).toBeInTheDocument();
    });

    it('shows current progress', () => {
      render(<StreakDisplay />);
      expect(screen.getByText('2/5 questions')).toBeInTheDocument();
    });

    it('displays current streak count', () => {
      render(<StreakDisplay />);
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  describe('Full Variant - Partial Progress', () => {
    it('shows correct progress for partial completion', () => {
      mockUseDailyStreak.mockReturnValue({
        currentStreak: 3,
        longestStreak: 3,
        todayQualifies: false,
        questionsToday: 3,
        questionsNeeded: 2,
        streakAtRisk: true,
        isLoading: false,
      });

      render(<StreakDisplay />);
      expect(screen.getByText('3/5 questions')).toBeInTheDocument();
      expect(screen.getByText(/Answer 2 more questions/)).toBeInTheDocument();
    });

    it('shows singular "question" for 1 needed', () => {
      mockUseDailyStreak.mockReturnValue({
        currentStreak: 2,
        longestStreak: 2,
        todayQualifies: false,
        questionsToday: 4,
        questionsNeeded: 1,
        streakAtRisk: true,
        isLoading: false,
      });

      render(<StreakDisplay />);
      expect(screen.getByText(/Answer 1 more question to keep your streak!/)).toBeInTheDocument();
    });
  });

  describe('Full Variant - New Record', () => {
    it('highlights when current streak equals longest streak', () => {
      mockUseDailyStreak.mockReturnValue({
        currentStreak: 10,
        longestStreak: 10,
        todayQualifies: true,
        questionsToday: 6,
        questionsNeeded: 0,
        streakAtRisk: false,
        isLoading: false,
      });

      const { container } = render(<StreakDisplay />);
      // The trophy badge should have success styling
      expect(container.querySelector('.text-success')).toBeInTheDocument();
    });
  });

  describe('Singular vs Plural', () => {
    it('shows "day" for streak of 1', () => {
      mockUseDailyStreak.mockReturnValue({
        currentStreak: 1,
        longestStreak: 1,
        todayQualifies: true,
        questionsToday: 5,
        questionsNeeded: 0,
        streakAtRisk: false,
        isLoading: false,
      });

      render(<StreakDisplay />);
      expect(screen.getByText('day')).toBeInTheDocument();
    });

    it('shows "days" for streak greater than 1', () => {
      mockUseDailyStreak.mockReturnValue({
        currentStreak: 5,
        longestStreak: 5,
        todayQualifies: true,
        questionsToday: 5,
        questionsNeeded: 0,
        streakAtRisk: false,
        isLoading: false,
      });

      render(<StreakDisplay />);
      expect(screen.getByText('days')).toBeInTheDocument();
    });
  });
});
