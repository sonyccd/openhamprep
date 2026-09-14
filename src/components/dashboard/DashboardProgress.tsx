import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Settings2 } from 'lucide-react';
import { MotionBox } from '@/components/ohp/MotionBox';
import { tintedPanelSx } from './tintSx';

interface DashboardProgressProps {
  thisWeekQuestions: number;
  questionsGoal: number;
  thisWeekTests: number;
  testsGoal: number;
  onOpenGoalsModal: () => void;
}

/** One goal's label, count and bar. */
function GoalBar({
  label,
  current,
  goal,
}: {
  label: string;
  current: number;
  goal: number;
}) {
  const percent = Math.min(100, Math.round((current / goal) * 100));
  const reached = current >= goal;

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.75rem',
          mb: 0.5,
        }}
      >
        <Box component="span" sx={{ color: 'text.secondary' }}>
          {label}
        </Box>
        <Box
          component="span"
          sx={{
            fontFamily: 'monospace',
            fontWeight: 700,
            color: reached ? 'success.main' : 'text.primary',
          }}
        >
          {current}/{goal}
        </Box>
      </Box>
      <LinearProgress
        variant="determinate"
        value={percent}
        color={reached ? 'success' : 'primary'}
        aria-label={label}
        aria-valuetext={`${current} of ${goal}`}
        sx={{
          height: 8,
          borderRadius: '9999px',
          bgcolor: 'secondary.main',
          '& .MuiLinearProgress-bar': { borderRadius: '9999px' },
        }}
      />
    </Box>
  );
}

export function DashboardProgress({
  thisWeekQuestions,
  questionsGoal,
  thisWeekTests,
  testsGoal,
  onOpenGoalsModal,
}: DashboardProgressProps) {
  return (
    <MotionBox
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      sx={tintedPanelSx(null)}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 1.5,
        }}
      >
        <Typography
          component="h3"
          sx={{
            fontSize: '0.875rem',
            fontFamily: 'monospace',
            fontWeight: 700,
            color: 'text.primary',
          }}
        >
          This Week
        </Typography>
        <IconButton
          aria-label="Edit weekly goals"
          onClick={onOpenGoalsModal}
          sx={{ width: 28, height: 28 }}
        >
          <Box component={Settings2} aria-hidden="true" sx={{ width: 16, height: 16 }} />
        </IconButton>
      </Box>

      <Stack spacing={1.5}>
        <GoalBar label="Questions" current={thisWeekQuestions} goal={questionsGoal} />
        <GoalBar label="Practice Tests" current={thisWeekTests} goal={testsGoal} />
      </Stack>
    </MotionBox>
  );
}
