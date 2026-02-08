import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { weeklyGoalsService } from '@/services/weeklyGoals/weeklyGoalsService';
import { unwrapOrThrow } from '@/services/types';
import { toast } from 'sonner';
import { Target, Brain, Loader2 } from 'lucide-react';

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Weekly Study Goals</DialogTitle>
          <DialogDescription>
            Set your weekly targets to stay on track with your studies.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Questions Goal */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-primary" />
                Questions per week
              </Label>
              <span className="text-lg font-mono font-bold text-primary">
                {questionsGoal}
              </span>
            </div>
            <Slider
              value={[questionsGoal]}
              onValueChange={(value) => setQuestionsGoal(value[0])}
              min={10}
              max={200}
              step={10}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>10</span>
              <span>200</span>
            </div>
          </div>

          {/* Tests Goal */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                Practice tests per week
              </Label>
              <span className="text-lg font-mono font-bold text-primary">
                {testsGoal}
              </span>
            </div>
            <Slider
              value={[testsGoal]}
              onValueChange={(value) => setTestsGoal(value[0])}
              min={1}
              max={10}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1</span>
              <span>10</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Save Goals
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
