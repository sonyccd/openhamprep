import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Route } from "lucide-react";
import { Lesson } from "@/types/lessons";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface LessonCardProps {
  lesson: Lesson;
  completion: {
    total: number;
    completed: number;
    percentage: number;
  };
  onClick: () => void;
}

export function LessonCard({ lesson, completion, onClick }: LessonCardProps) {
  const isComplete = completion.percentage === 100;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] group overflow-hidden",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        isComplete && "ring-2 ring-success/50"
      )}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`${lesson.title}, ${completion.percentage}% complete${isComplete ? ' (completed)' : ''}`}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-muted overflow-hidden">
        {lesson.thumbnail_url ? (
          <img
            src={lesson.thumbnail_url}
            alt={lesson.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-accent/10 to-accent/5">
            <Route className="w-12 h-12 text-accent/40" />
          </div>
        )}

        {/* Completion badge overlay */}
        {isComplete && (
          <div className="absolute top-2 right-2">
            <Badge variant="default" className="bg-success text-success-foreground gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Completed
            </Badge>
          </div>
        )}

        {/* Topic count badge */}
        <div className="absolute bottom-2 right-2">
          <Badge
            variant="secondary"
            className="bg-background/80 backdrop-blur-sm text-xs"
          >
            {completion.completed}/{completion.total} topics
          </Badge>
        </div>
      </div>

      <CardContent className="p-4">
        <h3 className="font-semibold text-foreground line-clamp-2 mb-2 group-hover:text-primary transition-colors">
          {lesson.title}
        </h3>
        {lesson.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {lesson.description}
          </p>
        )}

        {/* Progress bar */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
            <span>{completion.percentage}% complete</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              className={cn(
                "h-full rounded-full",
                isComplete ? "bg-success" : "bg-primary"
              )}
              initial={{ width: 0 }}
              animate={{ width: `${completion.percentage}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
