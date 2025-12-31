import { Button } from "@/components/ui/button";
import { useToggleTopicComplete, useTopicCompleted } from "@/hooks/useTopics";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface TopicProgressButtonProps {
  topicId: string;
  className?: string;
}

export function TopicProgressButton({
  topicId,
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
