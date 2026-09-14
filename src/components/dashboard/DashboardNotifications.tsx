import { useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { SxProps, Theme } from '@mui/material/styles';
import { AnimatePresence } from 'framer-motion';
import { X, Bell } from 'lucide-react';
import { MotionBox } from '@/components/ohp/MotionBox';
import {
  useDashboardNotifications,
  PUSH_NOTIFICATION_PRIORITY_THRESHOLD,
  type DashboardNotification,
  type NotificationVariant,
} from '@/hooks/useDashboardNotifications';
import { TestType, View } from '@/types/navigation';
import { NotificationItem } from './NotificationItem';

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
  /** Navigation handler */
  onNavigate: (view: View) => void;
  /** Maximum notifications to show (default: 1) */
  maxVisible?: number;
  /** Additional styles for the list wrapper */
  sx?: SxProps<Theme>;
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
 *   onNavigate={changeView}
 * />
 * ```
 */
export function DashboardNotifications({
  examType,
  userId,
  thisWeekQuestions,
  questionsGoal,
  onNavigate,
  maxVisible = 1,
  sx,
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
    topNotification.priority <= PUSH_NOTIFICATION_PRIORITY_THRESHOLD;

  return (
    <Stack spacing={1.5} sx={{ mb: 3, ...sx }}>
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
    </Stack>
  );
}
