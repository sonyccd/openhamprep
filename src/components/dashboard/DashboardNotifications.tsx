import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  useDashboardNotifications,
  type DashboardNotification,
  type NotificationVariant,
} from '@/hooks/useDashboardNotifications';
import { TestType, View } from '@/types/navigation';
import type { UserTargetExam } from '@/hooks/useExamSessions';

/**
 * Props for the DashboardNotifications component.
 */
export interface DashboardNotificationsProps {
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
  /** User's target exam */
  userTarget: UserTargetExam | null;
  /** Navigation handler */
  onNavigate: (view: View) => void;
  /** Maximum notifications to show (default: 1) */
  maxVisible?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Get CSS classes for a notification variant.
 */
function getVariantClasses(variant: NotificationVariant): {
  container: string;
  iconBg: string;
  icon: string;
} {
  switch (variant) {
    case 'destructive':
      return {
        container: 'bg-destructive/5 border-destructive/30',
        iconBg: 'bg-destructive/10',
        icon: 'text-destructive',
      };
    case 'warning':
      return {
        container: 'bg-warning/5 border-warning/30',
        iconBg: 'bg-warning/10',
        icon: 'text-warning',
      };
    case 'success':
      return {
        container: 'bg-success/5 border-success/30',
        iconBg: 'bg-success/10',
        icon: 'text-success',
      };
    case 'muted':
    default:
      return {
        container: 'bg-card border-border',
        iconBg: 'bg-muted',
        icon: 'text-muted-foreground',
      };
  }
}

/**
 * Single notification item component.
 */
function NotificationItem({
  notification,
  onDismiss,
  showPushPrompt,
  onRequestPush,
}: {
  notification: DashboardNotification;
  onDismiss: () => void;
  showPushPrompt: boolean;
  onRequestPush: () => void;
}) {
  const { icon: Icon, title, description, action, dismissible, variant } = notification;
  const classes = getVariantClasses(variant);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.98 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn(
        'rounded-xl p-4 border transition-colors',
        classes.container
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={cn('p-2 rounded-lg shrink-0', classes.iconBg)}>
          <Icon className={cn('w-5 h-5', classes.icon)} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground">{title}</p>
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Push notification prompt */}
          {showPushPrompt && (
            <Button
              size="sm"
              variant="outline"
              onClick={onRequestPush}
              className="hidden sm:flex"
            >
              <Bell className="w-4 h-4 mr-1.5" />
              Enable alerts
            </Button>
          )}

          {/* Main action */}
          {action && (
            <Button size="sm" variant="secondary" onClick={action.onClick}>
              {action.label}
            </Button>
          )}

          {/* Dismiss button */}
          {dismissible && (
            <Button
              size="icon"
              variant="ghost"
              onClick={onDismiss}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
              <span className="sr-only">Dismiss notification</span>
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Dashboard notifications component.
 *
 * Displays contextual, actionable notifications to motivate users
 * and guide them toward their study goals.
 *
 * @example
 * ```tsx
 * <DashboardNotifications
 *   examType={selectedTest}
 *   userId={user?.id}
 *   thisWeekQuestions={thisWeekQuestions}
 *   questionsGoal={questionsGoal}
 *   thisWeekTests={thisWeekTests}
 *   testsGoal={testsGoal}
 *   userTarget={userTarget}
 *   onNavigate={changeView}
 * />
 * ```
 */
export function DashboardNotifications({
  examType,
  userId,
  thisWeekQuestions,
  questionsGoal,
  thisWeekTests,
  testsGoal,
  userTarget,
  onNavigate,
  maxVisible = 1,
  className,
}: DashboardNotificationsProps) {
  const {
    notifications,
    dismissNotification,
    isLoading,
    push,
  } = useDashboardNotifications({
    examType,
    userId,
    thisWeekQuestions,
    questionsGoal,
    thisWeekTests,
    testsGoal,
    userTarget,
    onNavigate,
    maxVisible,
  });

  // Track locally dismissed notifications for immediate UI feedback
  const [locallyDismissed, setLocallyDismissed] = useState<Set<string>>(new Set());

  const handleDismiss = useCallback((id: string) => {
    setLocallyDismissed((prev) => new Set([...prev, id]));
    dismissNotification(id);
  }, [dismissNotification]);

  const handleRequestPush = useCallback(async () => {
    await push.requestPermission();
  }, [push]);

  // Filter out locally dismissed notifications
  const visibleNotifications = notifications.filter(
    (n) => !locallyDismissed.has(n.id)
  );

  // Don't render anything while loading or if no notifications
  if (isLoading || visibleNotifications.length === 0) {
    return null;
  }

  // Determine if we should show the push notification prompt
  // Show on high-priority notifications when we haven't asked yet
  const topNotification = visibleNotifications[0];
  const showPushPrompt =
    push.isSupported &&
    push.permission === 'default' &&
    !push.hasAskedPermission &&
    topNotification.priority <= 3;

  return (
    <div className={cn('mb-6 space-y-3', className)}>
      <AnimatePresence mode="popLayout">
        {visibleNotifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onDismiss={() => handleDismiss(notification.id)}
            showPushPrompt={showPushPrompt && notification.id === topNotification.id}
            onRequestPush={handleRequestPush}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
