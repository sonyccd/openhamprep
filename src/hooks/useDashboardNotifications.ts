import { useMemo, useCallback, useEffect, useRef, useState } from 'react';
import { LucideIcon, TrendingDown, Clock, Target, Trophy } from 'lucide-react';
import { useDailyStreak } from '@/hooks/useDailyStreak';
import { useReadinessScore } from '@/hooks/useReadinessScore';
import { useReadinessSnapshots, calculateTrend } from '@/hooks/useReadinessSnapshots';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { getLocalDateString } from '@/lib/streakConstants';
import { safeGetItem, safeSetItem } from '@/lib/localStorage';
import { TestType, View } from '@/types/navigation';

// ============================================================================
// Constants (exported for use in components)
// ============================================================================

const DISMISS_PREFIX = 'notification-dismissed-';
const PUSH_SENT_PREFIX = 'push-sent-';

/**
 * Number of days to keep localStorage keys before cleanup.
 * Old dismissal/push-sent keys are removed to prevent localStorage bloat.
 */
const STORAGE_KEY_MAX_AGE_DAYS = 30;

/** Readiness milestones that trigger celebration notifications */
const MILESTONE_THRESHOLDS = [70, 80, 90] as const;

/** Maximum priority level for push notifications (1-3 get push, 4+ don't) */
export const PUSH_NOTIFICATION_PRIORITY_THRESHOLD = 3;

/**
 * Days of inactivity before showing inactivity notification.
 * Research shows 3 days is when habit formation breaks and churn risk increases.
 * @see https://jamesclear.com/habit-guide
 */
const INACTIVITY_THRESHOLD_DAYS = 3;

/**
 * Weekly goal progress percentage to show "almost there" notification.
 * 80% is the psychological "near completion" threshold that motivates
 * finishing (goal gradient effect).
 * @see https://en.wikipedia.org/wiki/Goal_gradient_effect
 */
const WEEKLY_GOAL_CLOSE_THRESHOLD = 80;

// ============================================================================
// Types
// ============================================================================

/**
 * Types of notifications the system can generate.
 * Note: streak-at-risk is handled by StreakDisplay, not here.
 */
export type NotificationType =
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
  /** Priority (lower = more important, 1-5) */
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

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get the dismissal key for a notification.
 * Different notification types have different dismissal strategies.
 */
function getDismissKey(type: NotificationType, milestone?: number): string {
  const today = getLocalDateString();

  switch (type) {
    // Day-based dismissals (reset daily)
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
  return safeGetItem(key) === 'true';
}

/**
 * Clean up stale localStorage keys to prevent storage bloat.
 * Removes day-based dismissal keys and push-sent keys older than STORAGE_KEY_MAX_AGE_DAYS.
 * Should be called once on app initialization.
 */
function cleanupStaleStorageKeys(): void {
  try {
    const keysToRemove: string[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      // Check if it's a notification-related key with a date suffix
      if (key.startsWith(DISMISS_PREFIX) || key.startsWith(PUSH_SENT_PREFIX)) {
        // Extract date from key (format: prefix-type-YYYY-MM-DD)
        const dateMatch = key.match(/(\d{4}-\d{2}-\d{2})$/);
        if (dateMatch) {
          const keyDate = new Date(dateMatch[1]);
          keyDate.setHours(0, 0, 0, 0);

          const ageInDays = Math.floor(
            (today.getTime() - keyDate.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (ageInDays > STORAGE_KEY_MAX_AGE_DAYS) {
            keysToRemove.push(key);
          }
        }
      }
    }

    // Remove stale keys
    keysToRemove.forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch {
        // Ignore removal errors
      }
    });
  } catch {
    // Ignore errors (localStorage may be unavailable)
  }
}

/**
 * Calculate days since a past date.
 * Returns Infinity if dateStr is null.
 */
function daysSince(dateStr: string | null): number {
  if (!dateStr) return Infinity;
  const from = new Date(dateStr);
  from.setHours(0, 0, 0, 0);
  const to = new Date();
  to.setHours(0, 0, 0, 0);
  return Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
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

// ============================================================================
// Hook
// ============================================================================

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
    thisWeekQuestions,
    questionsGoal,
    onNavigate,
    maxVisible = 1,
  } = options;

  // Track dismissal state changes (for cross-tab sync)
  const [dismissalVersion, setDismissalVersion] = useState(0);

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

  // Stable ref for sendNotification to prevent effect re-runs
  const sendNotificationRef = useRef(sendNotification);
  sendNotificationRef.current = sendNotification;

  const isLoading = streakLoading || readinessLoading || snapshotsLoading;

  // Calculate derived values
  const readinessScore = readinessData?.readiness_score ?? null;
  const lastStudyAt = readinessData?.last_study_at ?? null;
  const trend = snapshots ? calculateTrend(snapshots) : 'unknown';

  const inactivityDays = daysSince(lastStudyAt || lastActivityDate);

  // Weekly goal progress percentage
  const weeklyProgress = questionsGoal > 0
    ? Math.round((thisWeekQuestions / questionsGoal) * 100)
    : 0;

  // Listen for cross-tab dismissal changes with debouncing
  // Debouncing prevents excessive re-renders if multiple dismissals happen rapidly
  useEffect(() => {
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key?.startsWith(DISMISS_PREFIX)) {
        // Debounce to prevent rapid re-renders from multiple storage events
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          setDismissalVersion((v) => v + 1);
        }, 100);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, []);

  // Clean up stale localStorage keys on mount (runs once)
  useEffect(() => {
    cleanupStaleStorageKeys();
  }, []);

  /**
   * Generate all applicable notifications based on current state.
   */
  const allNotifications = useMemo((): DashboardNotification[] => {
    const notifications: DashboardNotification[] = [];

    // 1. Declining Performance (Priority 1)
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
    if (
      inactivityDays >= INACTIVITY_THRESHOLD_DAYS &&
      inactivityDays < Infinity &&
      !isDismissed('inactivity')
    ) {
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
      weeklyProgress >= WEEKLY_GOAL_CLOSE_THRESHOLD &&
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
    readinessScore,
    trend,
    inactivityDays,
    weeklyProgress,
    questionsGoal,
    thisWeekQuestions,
    onNavigate,
    maxVisible,
    dismissalVersion, // Re-compute when dismissals change across tabs
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
      safeSetItem(key, 'true');
    } else {
      // Validate that id is a known notification type before casting
      const validTypes: NotificationType[] = [
        'declining-performance',
        'inactivity',
        'weekly-goal-close',
        'readiness-milestone',
      ];
      if (!validTypes.includes(id as NotificationType)) {
        console.warn(`Unknown notification type: ${id}`);
        return;
      }
      const type = id as NotificationType;
      const key = getDismissKey(type);
      if (key) {
        safeSetItem(key, 'true');
      }
    }

    // Trigger re-render to remove dismissed notification
    setDismissalVersion((v) => v + 1);
  }, []);

  /**
   * Send push notifications for high-priority items (once per day).
   * Only sends when tab is hidden to avoid interrupting active users.
   *
   * Uses a ref for sendNotification to avoid effect re-runs when the callback
   * reference changes (which would cause notification spam).
   */
  useEffect(() => {
    if (permission !== 'granted' || allNotifications.length === 0) return;

    const topNotification = allNotifications[0];
    // Only send push for high-priority notifications
    if (topNotification.priority > PUSH_NOTIFICATION_PRIORITY_THRESHOLD) return;

    // Only send push when user is not actively viewing the app
    if (document.visibilityState === 'visible') return;

    // Check if we've already sent this push today
    const today = getLocalDateString();
    const pushKey = `${PUSH_SENT_PREFIX}${topNotification.id}-${today}`;

    // Check both localStorage and our session ref
    if (safeGetItem(pushKey) || sentPushRef.current.has(pushKey)) return;

    // Send the push notification using the stable ref
    sendNotificationRef.current(topNotification.title, {
      body: topNotification.description,
      tag: topNotification.id, // Prevents duplicate notifications
    });

    // Mark as sent
    safeSetItem(pushKey, 'true');
    sentPushRef.current.add(pushKey);
  }, [allNotifications, permission]);

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
