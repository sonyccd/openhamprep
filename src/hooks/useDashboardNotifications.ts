import { useMemo, useCallback, useEffect, useRef } from 'react';
import { LucideIcon, AlertTriangle, TrendingDown, Clock, Target, Trophy } from 'lucide-react';
import { useDailyStreak } from '@/hooks/useDailyStreak';
import { useReadinessScore } from '@/hooks/useReadinessScore';
import { useReadinessSnapshots, calculateTrend } from '@/hooks/useReadinessSnapshots';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { getLocalDateString } from '@/lib/streakConstants';
import { TestType, View } from '@/types/navigation';
import type { UserTargetExam } from '@/hooks/useExamSessions';

const DISMISS_PREFIX = 'notification-dismissed-';
const PUSH_SENT_PREFIX = 'push-sent-';
const MILESTONE_THRESHOLDS = [70, 80, 90] as const;

/**
 * Types of notifications the system can generate.
 * Note: streak-at-risk is handled by StreakDisplay, not here.
 */
export type NotificationType =
  | 'exam-urgent'
  | 'declining-performance'
  | 'inactivity'
  | 'weekly-goal-close'
  | 'readiness-milestone';

/**
 * Visual variant for notification styling.
 */
export type NotificationVariant = 'destructive' | 'warning' | 'success' | 'muted';

/**
 * A single dashboard notification.
 */
export interface DashboardNotification {
  /** Unique identifier for this notification */
  id: string;
  /** Type of notification for tracking/analytics */
  type: NotificationType;
  /** Priority (lower = more important, 1-6) */
  priority: number;
  /** Main heading */
  title: string;
  /** Supporting text with details */
  description: string;
  /** Icon to display */
  icon: LucideIcon;
  /** Visual styling variant */
  variant: NotificationVariant;
  /** Optional action button */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Whether this notification can be dismissed */
  dismissible: boolean;
}

/**
 * Options for the useDashboardNotifications hook.
 */
export interface UseDashboardNotificationsOptions {
  /** Current exam type being studied */
  examType: TestType;
  /** Current user ID (undefined if not logged in) */
  userId: string | undefined;
  /** Questions answered this week */
  thisWeekQuestions: number;
  /** Weekly question goal */
  questionsGoal: number;
  /** Tests completed this week */
  thisWeekTests: number;
  /** Weekly test goal */
  testsGoal: number;
  /** User's target exam (for exam urgency) */
  userTarget: UserTargetExam | null;
  /** Navigation handler */
  onNavigate: (view: View) => void;
  /** Maximum notifications to show (default: 1) */
  maxVisible?: number;
}

/**
 * Result returned by useDashboardNotifications.
 */
export interface UseDashboardNotificationsResult {
  /** Prioritized list of notifications to show */
  notifications: DashboardNotification[];
  /** Dismiss a notification */
  dismissNotification: (id: string) => void;
  /** Whether the hook is still loading data */
  isLoading: boolean;
  /** Push notification state and actions */
  push: {
    permission: NotificationPermission;
    isSupported: boolean;
    hasAskedPermission: boolean;
    requestPermission: () => Promise<NotificationPermission>;
  };
}

/**
 * Get the dismissal key for a notification.
 * Different notification types have different dismissal strategies.
 */
function getDismissKey(type: NotificationType, milestone?: number): string {
  const today = getLocalDateString();

  switch (type) {
    // Day-based dismissals (reset daily)
    case 'exam-urgent':
    case 'inactivity':
    case 'weekly-goal-close':
      return `${DISMISS_PREFIX}${type}-${today}`;

    // Milestone dismissals (permanent after achieved)
    case 'readiness-milestone':
      return `${DISMISS_PREFIX}${type}-${milestone}`;

    // Never dismissible (declining-performance auto-resolves when trend improves)
    default:
      return '';
  }
}

/**
 * Check if a notification has been dismissed.
 */
function isDismissed(type: NotificationType, milestone?: number): boolean {
  const key = getDismissKey(type, milestone);
  if (!key) return false;
  return localStorage.getItem(key) === 'true';
}

/**
 * Calculate days until a date.
 */
function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const diff = target.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Calculate days since last activity.
 */
function daysSince(dateStr: string | null): number {
  if (!dateStr) return Infinity;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastDate = new Date(dateStr);
  lastDate.setHours(0, 0, 0, 0);
  const diff = today.getTime() - lastDate.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * Find the highest milestone the user has crossed.
 */
function getHighestMilestone(readinessScore: number | null): number | null {
  if (readinessScore === null) return null;
  for (let i = MILESTONE_THRESHOLDS.length - 1; i >= 0; i--) {
    if (readinessScore >= MILESTONE_THRESHOLDS[i]) {
      return MILESTONE_THRESHOLDS[i];
    }
  }
  return null;
}

/**
 * Hook to compute and manage dashboard notifications.
 *
 * Aggregates data from multiple sources (streaks, readiness, snapshots)
 * to generate contextual, actionable notifications prioritized by importance.
 *
 * @example
 * ```tsx
 * const { notifications, dismissNotification } = useDashboardNotifications({
 *   examType: 'technician',
 *   userId: user?.id,
 *   thisWeekQuestions: 42,
 *   questionsGoal: 50,
 *   thisWeekTests: 1,
 *   testsGoal: 2,
 *   userTarget: targetExam,
 *   onNavigate: changeView,
 * });
 * ```
 */
export function useDashboardNotifications(
  options: UseDashboardNotificationsOptions
): UseDashboardNotificationsResult {
  const {
    examType,
    userId,
    thisWeekQuestions,
    questionsGoal,
    thisWeekTests,
    testsGoal,
    userTarget,
    onNavigate,
    maxVisible = 1,
  } = options;

  // Fetch data from existing hooks
  // Note: streak-at-risk is handled by StreakDisplay, so we only need lastActivityDate here
  const {
    lastActivityDate,
    isLoading: streakLoading,
  } = useDailyStreak();

  const { data: readinessData, isLoading: readinessLoading } = useReadinessScore(examType);
  const { data: snapshots, isLoading: snapshotsLoading } = useReadinessSnapshots({
    examType,
    days: 14, // Only need 2 weeks for trend calculation
  });

  const {
    permission,
    isSupported,
    hasAskedPermission,
    requestPermission,
    sendNotification,
  } = usePushNotifications();

  // Track which push notifications we've sent this session
  const sentPushRef = useRef<Set<string>>(new Set());

  const isLoading = streakLoading || readinessLoading || snapshotsLoading;

  // Calculate derived values
  const readinessScore = readinessData?.readiness_score ?? null;
  const lastStudyAt = readinessData?.last_study_at ?? null;
  const trend = snapshots ? calculateTrend(snapshots) : 'unknown';

  // Get exam date from target
  const examDate = userTarget?.exam_session?.exam_date ?? userTarget?.custom_exam_date ?? null;
  const daysToExam = examDate ? daysUntil(examDate) : null;
  const inactivityDays = daysSince(lastStudyAt || lastActivityDate);

  // Weekly goal progress percentage
  const weeklyProgress = questionsGoal > 0
    ? Math.round((thisWeekQuestions / questionsGoal) * 100)
    : 0;

  /**
   * Generate all applicable notifications based on current state.
   */
  const allNotifications = useMemo((): DashboardNotification[] => {
    const notifications: DashboardNotification[] = [];

    // 1. Exam Urgency (Priority 1)
    // Trigger: Exam in ≤7 days AND readiness < 75%
    if (
      daysToExam !== null &&
      daysToExam <= 7 &&
      daysToExam > 0 &&
      readinessScore !== null &&
      readinessScore < 75 &&
      !isDismissed('exam-urgent')
    ) {
      notifications.push({
        id: 'exam-urgent',
        type: 'exam-urgent',
        priority: 1,
        title: `Your exam is in ${daysToExam} day${daysToExam === 1 ? '' : 's'}!`,
        description: `You're at ${Math.round(readinessScore)}% readiness. Take a practice test to prepare.`,
        icon: AlertTriangle,
        variant: 'destructive',
        action: {
          label: 'Take Practice Test',
          onClick: () => onNavigate('practice-test'),
        },
        dismissible: true,
      });
    }

    // 2. Declining Performance (Priority 2)
    // Note: streak-at-risk is handled by StreakDisplay, not here
    // Trigger: calculateTrend() === 'declining'
    if (trend === 'declining' && !isDismissed('declining-performance')) {
      notifications.push({
        id: 'declining-performance',
        type: 'declining-performance',
        priority: 2,
        title: 'Your accuracy has been declining',
        description: 'Keep practicing to get back on track.',
        icon: TrendingDown,
        variant: 'warning',
        action: {
          label: 'Practice Now',
          onClick: () => onNavigate('random-practice'),
        },
        dismissible: false, // Disappears when trend improves
      });
    }

    // 3. Inactivity (Priority 3)
    // Trigger: last_study_at > 3 days ago
    if (inactivityDays >= 3 && inactivityDays < Infinity && !isDismissed('inactivity')) {
      notifications.push({
        id: 'inactivity',
        type: 'inactivity',
        priority: 3,
        title: `You haven't studied in ${inactivityDays} days`,
        description: 'Get back on track to reach your goals!',
        icon: Clock,
        variant: 'muted',
        action: {
          label: 'Start Studying',
          onClick: () => onNavigate('random-practice'),
        },
        dismissible: true,
      });
    }

    // 4. Weekly Goal Close (Priority 4)
    // Trigger: 80-99% of weekly goal complete
    if (
      weeklyProgress >= 80 &&
      weeklyProgress < 100 &&
      !isDismissed('weekly-goal-close')
    ) {
      const remaining = questionsGoal - thisWeekQuestions;
      notifications.push({
        id: 'weekly-goal-close',
        type: 'weekly-goal-close',
        priority: 4,
        title: `Almost there! ${weeklyProgress}% of weekly goal complete`,
        description: `Just ${remaining} more question${remaining === 1 ? '' : 's'} to hit your target.`,
        icon: Target,
        variant: 'success',
        action: {
          label: 'Keep Practicing',
          onClick: () => onNavigate('random-practice'),
        },
        dismissible: true,
      });
    }

    // 5. Readiness Milestone (Priority 5)
    // Trigger: First time crossing 70%, 80%, or 90%
    const milestone = getHighestMilestone(readinessScore);
    if (milestone !== null && !isDismissed('readiness-milestone', milestone)) {
      const milestoneMessages: Record<number, string> = {
        70: "You've reached 70% readiness! Keep up the momentum.",
        80: "You've reached 80% readiness! You're almost exam-ready.",
        90: "You've reached 90% readiness! You're well-prepared for the exam.",
      };

      notifications.push({
        id: `readiness-milestone-${milestone}`,
        type: 'readiness-milestone',
        priority: 5,
        title: milestoneMessages[milestone],
        description: 'Keep practicing to maintain your skills.',
        icon: Trophy,
        variant: 'success',
        action: {
          label: 'Take Practice Test',
          onClick: () => onNavigate('practice-test'),
        },
        dismissible: true,
      });
    }

    // Sort by priority and limit
    return notifications.sort((a, b) => a.priority - b.priority).slice(0, maxVisible);
  }, [
    daysToExam,
    readinessScore,
    trend,
    inactivityDays,
    weeklyProgress,
    questionsGoal,
    thisWeekQuestions,
    onNavigate,
    maxVisible,
  ]);

  /**
   * Dismiss a notification.
   * Sets localStorage key to prevent it from showing again (based on dismissal strategy).
   */
  const dismissNotification = useCallback((id: string) => {
    // Extract type and milestone from id
    const milestoneMatch = id.match(/^readiness-milestone-(\d+)$/);
    if (milestoneMatch) {
      const milestone = parseInt(milestoneMatch[1], 10);
      const key = getDismissKey('readiness-milestone', milestone);
      localStorage.setItem(key, 'true');
    } else {
      const type = id as NotificationType;
      const key = getDismissKey(type);
      if (key) {
        localStorage.setItem(key, 'true');
      }
    }

    // Force re-render by triggering a state update
    // This is handled by the parent component re-rendering
  }, []);

  /**
   * Send push notifications for high-priority items (once per day).
   */
  useEffect(() => {
    if (permission !== 'granted' || allNotifications.length === 0) return;

    const topNotification = allNotifications[0];
    // Only send push for priority 1-3 notifications
    if (topNotification.priority > 3) return;

    // Check if we've already sent this push today
    const today = getLocalDateString();
    const pushKey = `${PUSH_SENT_PREFIX}${topNotification.id}-${today}`;

    // Check both localStorage and our session ref
    if (localStorage.getItem(pushKey) || sentPushRef.current.has(pushKey)) return;

    // Send the push notification
    sendNotification(topNotification.title, {
      body: topNotification.description,
      tag: topNotification.id, // Prevents duplicate notifications
    });

    // Mark as sent
    localStorage.setItem(pushKey, 'true');
    sentPushRef.current.add(pushKey);
  }, [allNotifications, permission, sendNotification]);

  return {
    notifications: allNotifications,
    dismissNotification,
    isLoading,
    push: {
      permission,
      isSupported,
      hasAskedPermission,
      requestPermission,
    },
  };
}
