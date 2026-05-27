import { motion } from 'framer-motion';
import { Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DashboardProgressProps {
  thisWeekQuestions: number;
  questionsGoal: number;
  thisWeekTests: number;
  testsGoal: number;
  onOpenGoalsModal: () => void;
}

export function DashboardProgress({
  thisWeekQuestions,
  questionsGoal,
  thisWeekTests,
  testsGoal,
  onOpenGoalsModal,
}: DashboardProgressProps) {
  const questionsProgress = Math.min(100, Math.round((thisWeekQuestions / questionsGoal) * 100));
  const testsProgress = Math.min(100, Math.round((thisWeekTests / testsGoal) * 100));
  const questionsGoalReached = thisWeekQuestions >= questionsGoal;
  const testsGoalReached = thisWeekTests >= testsGoal;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-card border border-border rounded-xl p-4"
    >
      <div className="flex-1">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-mono font-bold text-foreground">This Week</h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onOpenGoalsModal}
          >
            <Settings2 className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-3">
          {/* Questions Progress */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">Questions</span>
              <span className={cn(
                'font-mono font-bold',
                questionsGoalReached ? 'text-success' : 'text-foreground'
              )}>
                {thisWeekQuestions}/{questionsGoal}
              </span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${questionsProgress}%` }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className={cn(
                  'h-full rounded-full',
                  questionsGoalReached ? 'bg-success' : 'bg-primary'
                )}
              />
            </div>
          </div>

          {/* Tests Progress */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">Practice Tests</span>
              <span className={cn(
                'font-mono font-bold',
                testsGoalReached ? 'text-success' : 'text-foreground'
              )}>
                {thisWeekTests}/{testsGoal}
              </span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${testsProgress}%` }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className={cn(
                  'h-full rounded-full',
                  testsGoalReached ? 'bg-success' : 'bg-primary'
                )}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
