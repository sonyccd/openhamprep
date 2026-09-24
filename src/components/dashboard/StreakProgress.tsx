import { Icon } from '@/components/ohp/Icon';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import { AlertCircle } from 'lucide-react';
import { MotionBox } from '@/components/ohp/MotionBox';
import { STREAK_QUESTIONS_THRESHOLD } from '@/lib/streakConstants';

interface StreakProgressProps {
  currentStreak: number;
  questionsToday: number;
  questionsNeeded: number;
  todayQualifies: boolean;
  streakAtRisk: boolean;
  onAction?: () => void;
}

/** Today's bar, the at-risk warning, and whichever call to action applies. */
export function StreakProgress({
  currentStreak,
  questionsToday,
  questionsNeeded,
  todayQualifies,
  streakAtRisk,
  onAction,
}: StreakProgressProps) {
  const hasStreak = currentStreak > 0;
  const progressPercent = Math.min(100, (questionsToday / STREAK_QUESTIONS_THRESHOLD) * 100);
  const barToken = todayQualifies ? 'success' : streakAtRisk ? 'warning' : 'primary';

  const actionButton = (label: string) => (
    <Button variant="contained" color="secondary" size="small" onClick={onAction}>
      {label}
    </Button>
  );

  return (
    <Stack spacing={1}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.875rem',
        }}
      >
        <Box component="span" sx={{ color: 'text.secondary' }}>
          Today's progress
        </Box>
        {todayQualifies ? (
          <Box component="span" sx={{ color: 'success.main', fontWeight: 500 }}>
            Complete!
          </Box>
        ) : (
          <Box component="span" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
            {questionsToday}/{STREAK_QUESTIONS_THRESHOLD} questions
          </Box>
        )}
      </Box>

      <LinearProgress
        variant="determinate"
        value={progressPercent}
        color={barToken}
        aria-label="Today's progress"
        aria-valuetext={`${questionsToday} of ${STREAK_QUESTIONS_THRESHOLD} questions`}
        sx={{
          height: 8,
          borderRadius: '9999px',
          bgcolor: 'secondary.main',
          '& .MuiLinearProgress-bar': { borderRadius: '9999px' },
        }}
      />

      {streakAtRisk && !todayQualifies && (
        <MotionBox
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { sm: 'center' },
            justifyContent: 'space-between',
            gap: { xs: 1, sm: 1.5 },
            mt: 1,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              color: 'warning.main',
              fontSize: '0.875rem',
              minWidth: 0,
            }}
          >
            <Icon icon={AlertCircle} size={16} sx={{ flexShrink: 0 }} />
            <Box component="span">
              Answer {questionsNeeded} more{' '}
              {questionsNeeded === 1 ? 'question' : 'questions'} to keep your streak!
            </Box>
          </Box>
          {onAction && (
            <Box sx={{ flexShrink: 0, alignSelf: { xs: 'flex-start', sm: 'auto' } }}>
              {actionButton('Practice Now')}
            </Box>
          )}
        </MotionBox>
      )}

      {!todayQualifies && !streakAtRisk && onAction && (
        <MotionBox
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}
        >
          {actionButton(hasStreak ? 'Keep Going' : 'Start Practicing')}
        </MotionBox>
      )}

      {todayQualifies && hasStreak && (
        <MotionBox
          component="p"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          sx={{ color: 'success.main', fontSize: '0.875rem', m: 0 }}
        >
          Great work! Come back tomorrow to continue your streak.
        </MotionBox>
      )}
    </Stack>
  );
}
