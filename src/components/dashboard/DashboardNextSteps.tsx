import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NextStep {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
  badge?: string;
  variant: 'primary' | 'secondary' | 'warning';
}

interface DashboardNextStepsProps {
  steps: NextStep[];
}

export function DashboardNextSteps({ steps }: DashboardNextStepsProps) {
  if (steps.length === 0) return null;

  const getVariantClasses = (variant: NextStep['variant']) => {
    switch (variant) {
      case 'warning':
        return {
          icon: 'bg-warning/10 text-warning',
          badge: 'bg-warning text-warning-foreground',
          hover: 'hover:border-warning/50',
        };
      case 'primary':
        return {
          icon: 'bg-primary/10 text-primary',
          badge: 'bg-primary text-primary-foreground',
          hover: 'hover:border-primary/50',
        };
      default:
        return {
          icon: 'bg-secondary text-muted-foreground',
          badge: 'bg-muted text-muted-foreground',
          hover: 'hover:border-border',
        };
    }
  };

  return (
    <div className="mb-6">
      <h2 className="text-sm font-mono font-bold text-muted-foreground mb-3 px-1">
        What to do next
      </h2>
      <div className={cn(
        'grid gap-3',
        steps.length === 1 && 'grid-cols-1',
        steps.length === 2 && 'grid-cols-1 sm:grid-cols-2',
        steps.length >= 3 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
      )}>
        {steps.map((step, index) => {
          const Icon = step.icon;
          const classes = getVariantClasses(step.variant);

          return (
            <motion.button
              key={step.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={step.onClick}
              className={cn(
                'flex items-start gap-3 p-4 rounded-xl border border-border bg-card text-left',
                'transition-all duration-200',
                'hover:bg-secondary/50 hover:shadow-sm',
                classes.hover
              )}
            >
              <div className={cn('p-2 rounded-lg shrink-0', classes.icon)}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{step.title}</span>
                  {step.badge && (
                    <span className={cn(
                      'text-xs font-mono font-bold px-1.5 py-0.5 rounded',
                      classes.badge
                    )}>
                      {step.badge}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                  {step.description}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
