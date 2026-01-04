import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CircularProgress } from '@/components/ui/circular-progress';
import { cn } from '@/lib/utils';
import type { ReadinessLevel } from '@/lib/readinessConfig';

interface NextAction {
  title: string;
  description: string;
  actionLabel: string;
  icon: LucideIcon;
  priority: 'start' | 'weak' | 'practice' | 'ready' | 'default';
}

interface DashboardHeroProps {
  readinessLevel: ReadinessLevel;
  readinessTitle: string;
  readinessMessage: string;
  recentAvgScore: number;
  nextAction: NextAction;
  onAction: () => void;
}

export function DashboardHero({
  readinessLevel,
  readinessTitle,
  readinessMessage,
  recentAvgScore,
  nextAction,
  onAction,
}: DashboardHeroProps) {
  const getColorClasses = () => {
    switch (readinessLevel) {
      case 'ready':
        return {
          progress: 'stroke-success',
          score: 'text-success',
          title: 'text-success',
          button: 'bg-success text-success-foreground hover:bg-success/90',
        };
      case 'getting-close':
        return {
          progress: 'stroke-primary',
          score: 'text-primary',
          title: 'text-primary',
          button: '',
        };
      case 'needs-work':
        return {
          progress: 'stroke-warning',
          score: 'text-warning',
          title: 'text-warning',
          button: 'bg-warning text-warning-foreground hover:bg-warning/90',
        };
      default:
        return {
          progress: 'stroke-muted-foreground/30',
          score: 'text-muted-foreground',
          title: 'text-foreground',
          button: '',
        };
    }
  };

  const colors = getColorClasses();
  const ActionIcon = nextAction.icon;
  const showDashedCircle = readinessLevel === 'not-started';

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8 p-6 md:p-8">
        {/* Circular Score */}
        <div className="shrink-0">
          {showDashedCircle ? (
            <div
              className="relative flex items-center justify-center rounded-full border-4 border-dashed border-muted-foreground/30"
              style={{ width: 140, height: 140 }}
            >
              <span className="text-4xl font-mono font-bold text-muted-foreground">?</span>
            </div>
          ) : (
            <CircularProgress
              value={recentAvgScore}
              size={140}
              strokeWidth={10}
              progressClassName={colors.progress}
              trackClassName="stroke-secondary"
            >
              <span className={cn('text-4xl font-mono font-bold', colors.score)}>
                {recentAvgScore}%
              </span>
            </CircularProgress>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 text-center md:text-left space-y-3">
          <div>
            <h1 className={cn('text-2xl md:text-3xl font-bold', colors.title)}>
              {readinessTitle}
            </h1>
            <p className="text-muted-foreground mt-1 max-w-md">
              {readinessMessage}
            </p>
          </div>

          <Button
            size="lg"
            className={cn('gap-2 mt-2', colors.button)}
            onClick={onAction}
          >
            <ActionIcon className="w-5 h-5" />
            {nextAction.actionLabel}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
