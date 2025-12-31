import { Target, TrendingUp, CheckCircle, LucideIcon } from 'lucide-react';

export type ReadinessLevel = 'not-started' | 'needs-work' | 'getting-close' | 'ready';

export interface ReadinessState {
  color: string;
  bg: string;
  border: string;
  icon: LucideIcon;
  progress: number;
}

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
 * Calculate the readiness level based on test performance.
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
 * Get the progress bar width percentage for a readiness level.
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
