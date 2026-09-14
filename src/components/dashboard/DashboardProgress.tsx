import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
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

/**
 * One goal's label, count and bar.
 *
 * The bar is a framer-motion width animation, not MUI's LinearProgress. C5's
 * issue assumed this used shadcn's Progress and could be swapped; it never did.
 * LinearProgress animates its own indicator and would change both the easing
 * and the shape, which Gate 1 rules out for a port.
 */
function GoalBar({
  label,
  current,
  goal,
  delay,
}: {
  label: string;
  current: number;
  goal: number;
  delay: number;
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
      <Box
        sx={{
          height: 8,
          bgcolor: 'secondary.main',
          borderRadius: '9999px',
          overflow: 'hidden',
        }}
      >
        <MotionBox
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.5, delay }}
          sx={{
            height: '100%',
            borderRadius: '9999px',
            bgcolor: reached ? 'success.main' : 'primary.main',
          }}
        />
      </Box>
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
        <GoalBar
          label="Questions"
          current={thisWeekQuestions}
          goal={questionsGoal}
          delay={0.2}
        />
        <GoalBar
          label="Practice Tests"
          current={thisWeekTests}
          goal={testsGoal}
          delay={0.3}
        />
      </Stack>
    </MotionBox>
  );
}
