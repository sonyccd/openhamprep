import { motion } from 'framer-motion';
import { CalendarDays, Settings2, CheckCircle, Brain, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DashboardWeeklyGoalsProps {
  thisWeekQuestions: number;
  thisWeekTests: number;
  questionsGoal: number;
  testsGoal: number;
  onOpenGoalsModal: () => void;
  onStartRandomPractice: () => void;
  onStartPracticeTest: () => void;
}

export function DashboardWeeklyGoals({
  thisWeekQuestions,
  thisWeekTests,
  questionsGoal,
  testsGoal,
  onOpenGoalsModal,
  onStartRandomPractice,
  onStartPracticeTest,
}: DashboardWeeklyGoalsProps) {
  const questionsProgress = Math.min(100, Math.round((thisWeekQuestions / questionsGoal) * 100));
  const testsProgress = Math.min(100, Math.round((thisWeekTests / testsGoal) * 100));
  const questionsGoalReached = thisWeekQuestions >= questionsGoal;
  const testsGoalReached = thisWeekTests >= testsGoal;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="bg-card border border-border rounded-xl p-4 mb-6"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-mono font-bold text-foreground">This Week</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Resets Sunday</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onOpenGoalsModal}
          >
            <Settings2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">Questions</span>
            <span
              className={cn(
                'font-mono font-bold',
                questionsGoalReached ? 'text-success' : 'text-foreground'
              )}
            >
              {thisWeekQuestions}/{questionsGoal}
            </span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden mb-2">
            <div
              className={cn(
                'h-full transition-all duration-500 rounded-full',
                questionsGoalReached ? 'bg-success' : 'bg-primary'
              )}
              style={{ width: `${questionsProgress}%` }}
            />
          </div>
          {questionsGoalReached ? (
            <div className="flex items-center gap-1 text-xs text-success">
              <CheckCircle className="w-3 h-3" />
              <span>Goal reached!</span>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs h-7 gap-1"
              onClick={onStartRandomPractice}
            >
              <Brain className="w-3 h-3" />
              Practice Questions
            </Button>
          )}
        </div>
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">Practice Tests</span>
            <span
              className={cn(
                'font-mono font-bold',
                testsGoalReached ? 'text-success' : 'text-foreground'
              )}
            >
              {thisWeekTests}/{testsGoal}
            </span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden mb-2">
            <div
              className={cn(
                'h-full transition-all duration-500 rounded-full',
                testsGoalReached ? 'bg-success' : 'bg-primary'
              )}
              style={{ width: `${testsProgress}%` }}
            />
          </div>
          {testsGoalReached ? (
            <div className="flex items-center gap-1 text-xs text-success">
              <CheckCircle className="w-3 h-3" />
              <span>Goal reached!</span>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs h-7 gap-1"
              onClick={onStartPracticeTest}
            >
              <Target className="w-3 h-3" />
              Take a Test
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
