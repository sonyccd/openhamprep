import { motion } from 'framer-motion';
import { CheckCircle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DashboardWeakAreasProps {
  weakQuestionCount: number;
  onReviewWeakQuestions: () => void;
}

export function DashboardWeakAreas({
  weakQuestionCount,
  onReviewWeakQuestions,
}: DashboardWeakAreasProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-card border border-border rounded-xl p-4"
    >
      <h3 className="text-sm font-mono font-bold text-foreground mb-3">
        Areas to Improve
      </h3>
      {weakQuestionCount === 0 ? (
        <div className="flex flex-col items-center justify-center py-4 text-center">
          <CheckCircle className="w-8 h-8 text-success mb-2" />
          <p className="text-sm text-muted-foreground">No weak areas detected yet!</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Questions to review</span>
            <span className="text-lg font-mono font-bold text-warning">
              {weakQuestionCount}
            </span>
          </div>
          <Button
            variant="outline"
            className="w-full gap-2 border-warning/30 text-warning hover:bg-warning/10"
            onClick={onReviewWeakQuestions}
          >
            <Zap className="w-4 h-4" />
            Review Weak Questions
          </Button>
        </div>
      )}
    </motion.div>
  );
}
