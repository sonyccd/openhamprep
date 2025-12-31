import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ExamSession {
  location_name?: string;
  title?: string;
  exam_date: string;
  city: string;
  state: string;
}

interface UserTarget {
  exam_session: ExamSession | null;
}

interface DashboardTargetExamProps {
  userTarget: UserTarget | undefined | null;
  onFindTestSite: () => void;
}

export function DashboardTargetExam({
  userTarget,
  onFindTestSite,
}: DashboardTargetExamProps) {
  const hasTarget = userTarget?.exam_session;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.075 }}
      className={cn(
        'rounded-xl p-4 mb-6 border',
        hasTarget ? 'bg-card border-border' : 'bg-primary/5 border-primary/30'
      )}
    >
      {hasTarget ? (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {userTarget.exam_session!.location_name ||
                userTarget.exam_session!.title ||
                'Exam Session'}
            </p>
            <p className="text-sm text-muted-foreground">
              {new Date(userTarget.exam_session!.exam_date).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}{' '}
              • {userTarget.exam_session!.city}, {userTarget.exam_session!.state}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onFindTestSite}>
            Change
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">No exam date selected</p>
            <p className="text-sm text-muted-foreground">Find a test session near you</p>
          </div>
          <Button size="sm" onClick={onFindTestSite}>
            Find Test Site
          </Button>
        </div>
      )}
    </motion.div>
  );
}
