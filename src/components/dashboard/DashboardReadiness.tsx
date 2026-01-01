import { motion } from 'framer-motion';
import { CheckCircle, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ReadinessLevel } from '@/lib/readinessConfig';

interface DashboardReadinessProps {
  readinessLevel: ReadinessLevel;
  readinessTitle: string;
  readinessMessage: string;
  readinessProgress: number;
  recentAvgScore: number;
  passedTests: number;
  totalTests: number;
  onStartPracticeTest: () => void;
}

export function DashboardReadiness({
  readinessLevel,
  readinessTitle,
  readinessMessage,
  readinessProgress,
  recentAvgScore,
  passedTests,
  totalTests,
  onStartPracticeTest,
}: DashboardReadinessProps) {
  const getColorClasses = () => {
    switch (readinessLevel) {
      case 'ready':
        return {
          container: 'bg-success/10 border-success/50',
          score: 'bg-success/20 text-success',
          title: 'text-success',
          bar: 'bg-success',
        };
      case 'getting-close':
        return {
          container: 'bg-primary/10 border-primary/50',
          score: 'bg-primary/20 text-primary',
          title: 'text-primary',
          bar: 'bg-primary',
        };
      case 'needs-work':
        return {
          container: 'bg-warning/10 border-warning/50',
          score: 'bg-warning/20 text-warning',
          title: 'text-warning',
          bar: 'bg-warning',
        };
      default:
        return {
          container: 'bg-secondary border-border',
          score: 'bg-secondary text-muted-foreground',
          title: 'text-foreground',
          bar: 'bg-muted-foreground/30',
        };
    }
  };

  const colors = getColorClasses();

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('rounded-xl p-5 mb-6 border-2', colors.container)}
    >
      <div className="flex items-center gap-4 mb-3">
        <div
          className={cn(
            'w-16 h-16 rounded-full flex items-center justify-center shrink-0 text-2xl font-bold',
            colors.score
          )}
        >
          {recentAvgScore > 0 ? `${recentAvgScore}%` : '—'}
        </div>
        <div className="flex-1">
          <h2 className={cn('text-lg font-bold', colors.title)}>{readinessTitle}</h2>
          <p className="text-sm text-muted-foreground">{readinessMessage}</p>
        </div>
        {readinessLevel === 'ready' && (
          <CheckCircle className="w-8 h-8 text-success shrink-0" />
        )}
      </div>
      <div className="h-3 bg-secondary rounded-full overflow-hidden mb-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${readinessProgress}%` }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className={cn('h-full rounded-full', colors.bar)}
        />
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Need 74% to pass</span>
        <span>
          {passedTests}/{totalTests} tests passed
        </span>
      </div>

      {/* CTA for new users */}
      {readinessLevel === 'not-started' && (
        <div className="mt-4 pt-4 border-t border-border flex flex-col items-center">
          <Button onClick={onStartPracticeTest} className="gap-2">
            <Target className="w-4 h-4" />
            Take Your First Practice Test
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-2">
            See where you stand and identify areas to focus on
          </p>
        </div>
      )}
    </motion.div>
  );
}
