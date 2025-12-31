import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TestResult {
  id: string;
  percentage: number | string;
  passed: boolean;
  completed_at: string;
}

interface DashboardRecentPerformanceProps {
  recentTests: TestResult[];
  onReviewTest: (testId: string) => void;
}

export function DashboardRecentPerformance({
  recentTests,
  onReviewTest,
}: DashboardRecentPerformanceProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="bg-card border border-border rounded-xl p-4"
    >
      <h3 className="text-sm font-mono font-bold text-foreground mb-3">
        Recent Performance
      </h3>
      {recentTests.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No tests yet. Take your first practice test!
        </p>
      ) : (
        <div className="space-y-2">
          {recentTests.slice(0, 3).map((test) => (
            <button
              key={test.id}
              onClick={() => onReviewTest(test.id)}
              className={cn(
                'w-full flex items-center justify-between p-2 rounded-lg transition-colors',
                'hover:bg-secondary/50'
              )}
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold',
                    test.passed
                      ? 'bg-success text-success-foreground'
                      : 'bg-destructive text-destructive-foreground'
                  )}
                >
                  {test.passed ? '✓' : '✗'}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(test.completed_at).toLocaleDateString()}
                </span>
              </div>
              <span
                className={cn(
                  'text-sm font-mono font-bold',
                  test.passed ? 'text-success' : 'text-destructive'
                )}
              >
                {test.percentage}%
              </span>
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}
