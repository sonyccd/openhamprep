import { Target, TrendingUp, CheckCircle, LucideIcon } from 'lucide-react';

/**
 * Readiness level categories for UI display.
 * The actual readiness score (0-100) is calculated by the edge function
 * and mapped to these levels for display purposes.
 */
export type ReadinessLevel = 'not-started' | 'needs-work' | 'getting-close' | 'ready';

export interface ReadinessState {
  color: string;
  bg: string;
  border: string;
  icon: LucideIcon;
  progress: number;
}

/**
 * UI configuration for each readiness level.
 * Used for styling the readiness indicator in the dashboard.
 */
export const READINESS_CONFIG: Record<ReadinessLevel, ReadinessState> = {
  'not-started': {
    color: 'text-muted-foreground',
    bg: 'bg-secondary',
    border: 'border-border',
    icon: Target,
    progress: 0,
  },
  'needs-work': {
    color: 'text-foreground',
    bg: 'bg-secondary',
    border: 'border-border',
    icon: TrendingUp,
    progress: 33,
  },
  'getting-close': {
    color: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/30',
    icon: TrendingUp,
    progress: 66,
  },
  'ready': {
    color: 'text-success',
    bg: 'bg-success/10',
    border: 'border-success/30',
    icon: CheckCircle,
    progress: 100,
  },
};

/**
 * Get the readiness message for a given level.
 */
export function getReadinessMessage(level: ReadinessLevel): string {
  const messages: Record<ReadinessLevel, string> = {
    'not-started': 'Take some practice tests to see your readiness',
    'needs-work': 'Keep practicing to improve your scores',
    'getting-close': "Almost there! A few more passing scores and you'll be ready",
    'ready': "You're ready to take the real exam!",
  };
  return messages[level];
}

/**
 * Get the readiness title for a given level.
 */
export function getReadinessTitle(level: ReadinessLevel): string {
  const titles: Record<ReadinessLevel, string> = {
    'not-started': 'Test Readiness Unknown',
    'needs-work': 'Not Ready Yet',
    'getting-close': 'Almost Ready!',
    'ready': 'Ready to Pass!',
  };
  return titles[level];
}

/**
 * Get the default progress bar width percentage for a readiness level.
 * Note: The actual progress is now derived from the readiness score (0-100)
 * calculated by the edge function. This is used as a fallback.
 */
export function getReadinessProgress(level: ReadinessLevel): number {
  const progressMap: Record<ReadinessLevel, number> = {
    'not-started': 0,
    'needs-work': 40,
    'getting-close': 75,
    'ready': 100,
  };
  return progressMap[level];
}

/**
 * @deprecated Use the readiness score from useReadinessScore hook instead.
 * This function is kept for backwards compatibility but will be removed.
 *
 * The actual readiness calculation is now done by the calculate-readiness
 * edge function, which provides a more sophisticated model including:
 * - Coverage (unique questions seen)
 * - Mastery (questions correct 2+ times)
 * - Recency penalty (days since last study)
 * - Per-subelement analysis
 */
export function calculateReadinessLevel(
  totalTests: number,
  recentAvgScore: number,
  recentPassCount: number,
  lastFiveTestsCount: number
): ReadinessLevel {
  if (totalTests < 1) {
    return 'not-started';
  }

  if (recentAvgScore >= 85 && recentPassCount >= Math.min(3, lastFiveTestsCount)) {
    return 'ready';
  }

  if (recentAvgScore >= 74 && recentPassCount >= 1) {
    return 'getting-close';
  }

  return 'needs-work';
}
