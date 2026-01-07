import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToggleTopicComplete, useTopicCompleted } from "@/hooks/useTopics";
import { CheckCircle2, Circle, Loader2, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface TopicProgressButtonProps {
  topicId: string;
  questionCount: number;
  className?: string;
}

export function TopicProgressButton({
  topicId,
  questionCount,
  className,
}: TopicProgressButtonProps) {
  const { user } = useAuth();
  const isCompleted = useTopicCompleted(topicId);
  const { mutate: toggleComplete, isPending } = useToggleTopicComplete();

  if (!user) {
    return null;
  }

  const handleClick = () => {
    toggleComplete({ topicId, isCompleted: !isCompleted });
  };

  // Topics with questions: show status badge only (no manual toggle)
  if (questionCount > 0) {
    return (
      <Badge
        variant={isCompleted ? "default" : "secondary"}
        className={cn(
          "gap-1.5 py-1.5 px-3 text-sm font-medium",
          isCompleted
            ? "bg-success text-success-foreground hover:bg-success/90"
            : "bg-muted text-muted-foreground",
          className
        )}
      >
        {isCompleted ? (
          <>
            <CheckCircle2 className="w-4 h-4" />
            Completed
          </>
        ) : (
          <>
            <Target className="w-4 h-4" />
            Score 80% to complete
          </>
        )}
      </Badge>
    );
  }

  // Topics without questions: manual toggle button (existing behavior)
  return (
    <Button
      variant={isCompleted ? "default" : "outline"}
      className={cn(
        "gap-2 transition-all",
        isCompleted
          ? "bg-success hover:bg-success/90 text-success-foreground"
          : "hover:border-success hover:text-success",
        className
      )}
      onClick={handleClick}
      disabled={isPending}
    >
      {isPending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isCompleted ? (
        <CheckCircle2 className="w-4 h-4" />
      ) : (
        <Circle className="w-4 h-4" />
      )}
      {isCompleted ? "Completed" : "Mark as Complete"}
    </Button>
  );
}
