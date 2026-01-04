import { motion } from 'framer-motion';
import { Settings2, MapPin, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DashboardProgressProps {
  thisWeekQuestions: number;
  questionsGoal: number;
  thisWeekTests: number;
  testsGoal: number;
  examDate?: string | null;
  examLocation?: string;
  onOpenGoalsModal: () => void;
  onFindTestSite: () => void;
}

export function DashboardProgress({
  thisWeekQuestions,
  questionsGoal,
  thisWeekTests,
  testsGoal,
  examDate,
  examLocation,
  onOpenGoalsModal,
  onFindTestSite,
}: DashboardProgressProps) {
  const questionsProgress = Math.min(100, Math.round((thisWeekQuestions / questionsGoal) * 100));
  const testsProgress = Math.min(100, Math.round((thisWeekTests / testsGoal) * 100));
  const questionsGoalReached = thisWeekQuestions >= questionsGoal;
  const testsGoalReached = thisWeekTests >= testsGoal;

  const getDaysUntilExam = (dateStr: string): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exam = new Date(dateStr);
    exam.setHours(0, 0, 0, 0);
    return Math.ceil((exam.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getExamCountdownText = (days: number): { text: string; urgent: boolean } => {
    if (days <= 0) return { text: 'Today!', urgent: true };
    if (days === 1) return { text: 'Tomorrow!', urgent: true };
    if (days <= 7) return { text: `${days} days left`, urgent: true };
    return { text: `${days} days`, urgent: false };
  };

  const daysUntil = examDate ? getDaysUntilExam(examDate) : null;
  const countdown = daysUntil !== null ? getExamCountdownText(daysUntil) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-card border border-border rounded-xl p-4"
    >
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        {/* Weekly Progress */}
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

        {/* Divider */}
        <div className="hidden lg:block w-px h-16 bg-border" />

        {/* Exam Countdown */}
        <div className="lg:w-48 shrink-0">
          {examDate && countdown ? (
            <button
              onClick={onFindTestSite}
              className="w-full text-left p-3 -m-3 rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <Calendar className={cn(
                  'w-4 h-4',
                  countdown.urgent ? 'text-warning' : 'text-muted-foreground'
                )} />
                <span className={cn(
                  'text-lg font-mono font-bold',
                  countdown.urgent ? 'text-warning' : 'text-foreground'
                )}>
                  {countdown.text}
                </span>
              </div>
              {examLocation && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate">{examLocation}</span>
                </div>
              )}
            </button>
          ) : (
            <button
              onClick={onFindTestSite}
              className="w-full flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <MapPin className="w-4 h-4" />
              <span>Set exam date</span>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
