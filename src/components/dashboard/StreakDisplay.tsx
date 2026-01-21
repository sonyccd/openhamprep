import { motion, AnimatePresence } from 'framer-motion';
import { Flame, AlertCircle, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useDailyStreak } from '@/hooks/useDailyStreak';
import { STREAK_QUESTIONS_THRESHOLD } from '@/lib/streakConstants';

interface StreakDisplayProps {
  className?: string;
  /** Compact mode shows just the streak count, full mode shows progress */
  variant?: 'compact' | 'full';
  /** Callback when user clicks the action button */
  onAction?: () => void;
}

export function StreakDisplay({ className, variant = 'full', onAction }: StreakDisplayProps) {
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
      <div className={cn('animate-pulse', className)}>
        <div className="h-8 w-20 bg-muted rounded-lg" />
      </div>
    );
  }

  // Compact variant - just shows streak count with flame
  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full',
          currentStreak > 0
            ? 'bg-primary/10 text-primary'
            : 'bg-muted text-muted-foreground',
          className
        )}
      >
        <Flame
          className={cn(
            'w-4 h-4',
            currentStreak > 0 && 'text-warning'
          )}
        />
        <span className="font-mono font-bold text-sm">
          {currentStreak}
        </span>
      </div>
    );
  }

  // Full variant - shows progress and warnings
  const progressPercent = Math.min(100, (questionsToday / STREAK_QUESTIONS_THRESHOLD) * 100);
  const isNewRecord = currentStreak > 0 && currentStreak === longestStreak;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-xl p-4 border transition-colors',
        streakAtRisk
          ? 'bg-warning/5 border-warning/30'
          : currentStreak > 0
            ? 'bg-primary/5 border-primary/20'
            : 'bg-card border-border',
        className
      )}
    >
      {/* Header with streak count */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'p-2 rounded-lg',
              currentStreak > 0
                ? 'bg-gradient-to-br from-warning/20 to-warning/10'
                : 'bg-muted'
            )}
          >
            <Flame
              className={cn(
                'w-5 h-5',
                currentStreak > 0 ? 'text-warning' : 'text-muted-foreground'
              )}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <AnimatePresence mode="wait">
                <motion.span
                  key={currentStreak}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className={cn(
                    'text-2xl font-bold font-mono',
                    currentStreak > 0 ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {currentStreak}
                </motion.span>
              </AnimatePresence>
              <span className="text-sm text-muted-foreground">
                {currentStreak === 1 ? 'day' : 'days'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {currentStreak > 0 ? 'Current streak' : 'Start a streak!'}
            </p>
          </div>
        </div>

        {/* Best streak badge */}
        {longestStreak > 0 && (
          <div
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-full text-xs',
              isNewRecord
                ? 'bg-success/10 text-success'
                : 'bg-muted text-muted-foreground'
            )}
          >
            <Trophy className="w-3 h-3" />
            <span className="font-mono">{longestStreak}</span>
          </div>
        )}
      </div>

      {/* Today's progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Today's progress</span>
          {todayQualifies ? (
            <span className="text-success font-medium">Complete!</span>
          ) : (
            <span className="font-mono text-muted-foreground">
              {questionsToday}/{STREAK_QUESTIONS_THRESHOLD} questions
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className={cn(
              'h-full rounded-full transition-colors',
              todayQualifies
                ? 'bg-success'
                : streakAtRisk
                  ? 'bg-warning'
                  : 'bg-primary'
            )}
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>

        {/* Warning message and action */}
        {streakAtRisk && !todayQualifies && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="flex items-center justify-between gap-3 mt-2"
          >
            <div className="flex items-center gap-2 text-warning text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>
                Answer {questionsNeeded} more {questionsNeeded === 1 ? 'question' : 'questions'} to keep your streak!
              </span>
            </div>
            {onAction && (
              <Button
                size="sm"
                variant="secondary"
                onClick={onAction}
                className="shrink-0"
              >
                Practice Now
              </Button>
            )}
          </motion.div>
        )}

        {/* Action button for users who haven't started today (no streak at risk) */}
        {!todayQualifies && !streakAtRisk && onAction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-end mt-2"
          >
            <Button
              size="sm"
              variant="secondary"
              onClick={onAction}
            >
              {currentStreak > 0 ? 'Keep Going' : 'Start Practicing'}
            </Button>
          </motion.div>
        )}

        {/* Completion celebration */}
        {todayQualifies && currentStreak > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-success text-sm"
          >
            Great work! Come back tomorrow to continue your streak.
          </motion.p>
        )}
      </div>
    </motion.div>
  );
}
