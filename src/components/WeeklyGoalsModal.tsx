import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { weeklyGoalsService } from '@/services/weeklyGoals/weeklyGoalsService';
import { unwrapOrThrow } from '@/services/types';
import { toast } from 'sonner';
import { Target, Brain } from 'lucide-react';

/**
 * One labelled slider. The two goals rendered near-identical 25-line blocks
 * before; the only differences are the icon, the wording and the range.
 *
 * aria-labelledby is the point of the id plumbing. The Radix version had a
 * <Label> with no htmlFor that wrapped nothing, so both sliders had no
 * accessible name at all — verified before the port: a screen reader announced
 * "slider, 50" with no idea what it set.
 */
interface GoalSliderProps {
  id: string;
  icon: React.ElementType;
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
}

function GoalSlider({ id, icon, label, value, onChange, min, max, step }: GoalSliderProps) {
  return (
    <Stack spacing={1.5}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography
          id={`${id}-label`}
          component="label"
          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <Box component={icon} aria-hidden="true" sx={{ width: 16, height: 16, color: 'primary.main' }} />
          {label}
        </Typography>
        <Typography
          sx={{ fontFamily: 'monospace', fontSize: '1.125rem', fontWeight: 700, color: 'primary.main' }}
        >
          {value}
        </Typography>
      </Box>
      <Slider
        aria-labelledby={`${id}-label`}
        value={value}
        onChange={(_event, next) => onChange(next as number)}
        min={min}
        max={max}
        step={step}
      />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'text.secondary' }}>
        <span>{min}</span>
        <span>{max}</span>
      </Box>
    </Stack>
  );
}

interface WeeklyGoalsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  currentGoals: { questions_goal: number; tests_goal: number } | null;
  onGoalsUpdated: () => void;
}

export function WeeklyGoalsModal({
  open,
  onOpenChange,
  userId,
  currentGoals,
  onGoalsUpdated,
}: WeeklyGoalsModalProps) {
  const [questionsGoal, setQuestionsGoal] = useState(50);
  const [testsGoal, setTestsGoal] = useState(2);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (currentGoals) {
      setQuestionsGoal(currentGoals.questions_goal);
      setTestsGoal(currentGoals.tests_goal);
    } else {
      setQuestionsGoal(50);
      setTestsGoal(2);
    }
  }, [currentGoals, open]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      unwrapOrThrow(
        await weeklyGoalsService.upsertGoals(userId, questionsGoal, testsGoal)
      );

      toast.success('Weekly goals updated!');
      onGoalsUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving goals:', error);
      toast.error('Failed to save goals');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => onOpenChange(false)} maxWidth="sm" fullWidth>
      <DialogTitle>Weekly Study Goals</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Set your weekly targets to stay on track with your studies.
        </DialogContentText>

        <Stack spacing={3} sx={{ py: 2 }}>
          <GoalSlider
            id="questions-goal"
            icon={Brain}
            label="Questions per week"
            value={questionsGoal}
            onChange={setQuestionsGoal}
            min={10}
            max={200}
            step={10}
          />
          <GoalSlider
            id="tests-goal"
            icon={Target}
            label="Practice tests per week"
            value={testsGoal}
            onChange={setTestsGoal}
            min={1}
            max={10}
            step={1}
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ gap: 1 }}>
        <Button variant="outlined" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={isSaving}
          startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          Save Goals
        </Button>
      </DialogActions>
    </Dialog>
  );
}
