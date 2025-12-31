import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardStatsProps {
  overallAccuracy: number;
  passedTests: number;
  totalTests: number;
  weakQuestionCount: number;
  bestStreak: number;
}

export function DashboardStats({
  overallAccuracy,
  passedTests,
  totalTests,
  weakQuestionCount,
  bestStreak,
}: DashboardStatsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6"
    >
      <div className="bg-card border border-border rounded-xl p-3 text-center">
        <p className="text-2xl font-mono font-bold text-foreground">
          {overallAccuracy}%
        </p>
        <p className="text-xs text-muted-foreground">Accuracy</p>
      </div>
      <div className="bg-card border border-border rounded-xl p-3 text-center">
        <p className="text-2xl font-mono font-bold text-success">
          {passedTests}/{totalTests}
        </p>
        <p className="text-xs text-muted-foreground">Tests Passed</p>
      </div>
      <div className="bg-card border border-border rounded-xl p-3 text-center">
        <p
          className={cn(
            'text-2xl font-mono font-bold',
            weakQuestionCount > 10 ? 'text-warning' : 'text-foreground'
          )}
        >
          {weakQuestionCount}
        </p>
        <p className="text-xs text-muted-foreground">Weak Questions</p>
      </div>
      <div className="bg-card border border-border rounded-xl p-3 text-center">
        <div className="flex items-center justify-center gap-1">
          <p
            className={cn(
              'text-2xl font-mono font-bold',
              bestStreak > 0 ? 'text-warning' : 'text-muted-foreground'
            )}
          >
            {bestStreak}
          </p>
          {bestStreak > 0 && <Flame className="w-5 h-5 text-warning" />}
        </div>
        <p className="text-xs text-muted-foreground">Best Streak</p>
      </div>
    </motion.div>
  );
}
