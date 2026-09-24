import { Icon } from '@/components/ohp/Icon';
import Box from '@mui/material/Box';
import type { SxProps, Theme } from '@mui/material/styles';
import { Flame } from 'lucide-react';
import { MotionBox } from '@/components/ohp/MotionBox';
import { useDailyStreak } from '@/hooks/useDailyStreak';
import { tokenAlpha } from '@/theme/muiTheme';
import { tintedPanelSx } from './tintSx';
import { StreakHeader } from './StreakHeader';
import { StreakProgress } from './StreakProgress';

interface StreakDisplayProps {
  sx?: SxProps<Theme>;
  /** Compact mode shows just the streak count, full mode shows progress */
  variant?: 'compact' | 'full';
  /** Callback when user clicks the action button */
  onAction?: () => void;
}

export function StreakDisplay({ sx, variant = 'full', onAction }: StreakDisplayProps) {
  const {
    currentStreak,
    longestStreak,
    todayQualifies,
    questionsToday,
    questionsNeeded,
    streakAtRisk,
    isLoading,
    error,
  } = useDailyStreak();

  // Handle error state gracefully - show nothing rather than crash
  if (error) {
    return null;
  }

  if (isLoading) {
    return (
      <Box
        role="status"
        aria-label="Loading streak"
        sx={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite', ...sx }}
      >
        <Box sx={{ height: 32, width: 80, bgcolor: 'muted', borderRadius: '8px' }} />
      </Box>
    );
  }

  const hasStreak = currentStreak > 0;

  // Compact variant - just shows streak count with flame
  if (variant === 'compact') {
    return (
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.75,
          px: 1.5,
          py: 0.75,
          borderRadius: '9999px',
          ...(hasStreak
            ? {
                bgcolor: (t) => tokenAlpha(t.vars.palette.primary.main, 10),
                color: 'primary.main',
              }
            : { bgcolor: 'muted', color: 'text.secondary' }),
          ...sx,
        }}
      >
        <Icon
  icon={Flame}
          sx={{ width: 16, height: 16, ...(hasStreak && { color: 'warning.main' }) }}
/>
        <Box component="span" sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.875rem' }}>
          {currentStreak}
        </Box>
      </Box>
    );
  }

  return (
    <MotionBox
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      sx={{
        ...tintedPanelSx(streakAtRisk ? 'warning' : hasStreak ? 'primary' : null),
        // The streak card tints its border lighter than the shared panel.
        ...(hasStreak && !streakAtRisk && {
          borderColor: (t) => tokenAlpha(t.vars.palette.primary.main, 20),
        }),
        ...sx,
      }}
    >
      <StreakHeader currentStreak={currentStreak} longestStreak={longestStreak} />

      <StreakProgress
        currentStreak={currentStreak}
        questionsToday={questionsToday}
        questionsNeeded={questionsNeeded}
        todayQualifies={todayQualifies}
        streakAtRisk={streakAtRisk}
        onAction={onAction}
      />
    </MotionBox>
  );
}
