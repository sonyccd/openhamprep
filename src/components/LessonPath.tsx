import { motion } from "framer-motion";
import { Check, ChevronRight, Lock, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LessonTopic } from "@/types/lessons";
import { cn } from "@/lib/utils";

interface TopicProgress {
  topic_id: string;
  is_completed: boolean;
}

interface LessonPathProps {
  topics: LessonTopic[];
  topicProgress: TopicProgress[] | undefined;
  currentTopicIndex: number;
  onTopicClick: (slug: string) => void;
}

export function LessonPath({
  topics,
  topicProgress,
  currentTopicIndex,
  onTopicClick,
}: LessonPathProps) {
  const isCompleted = (topicId: string) =>
    topicProgress?.some((p) => p.topic_id === topicId && p.is_completed) ?? false;

  return (
    <div className="relative">
      {topics.map((lessonTopic, index) => {
        const topic = lessonTopic.topic;
        if (!topic) return null;

        const completed = isCompleted(topic.id);
        const isCurrent = index === currentTopicIndex;
        const isLocked = !completed && index > currentTopicIndex;
        const isLast = index === topics.length - 1;

        return (
          <motion.div
            key={lessonTopic.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: index * 0.08,
              duration: 0.4,
              ease: [0.25, 0.46, 0.45, 0.94]
            }}
            className="relative"
          >
            {/* Connecting track - continuous line behind nodes */}
            {!isLast && (
              <div className="absolute left-[22px] top-[48px] w-[4px] h-[calc(100%)] z-0">
                {/* Background track */}
                <div className="absolute inset-0 bg-border/50 rounded-full" />
                {/* Progress fill */}
                <motion.div
                  className={cn(
                    "absolute top-0 left-0 w-full rounded-full",
                    completed ? "bg-success" : "bg-border/30"
                  )}
                  initial={{ height: 0 }}
                  animate={{ height: completed ? "100%" : "0%" }}
                  transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
                />
              </div>
            )}

            {/* Topic card */}
            <button
              onClick={() => !isLocked && onTopicClick(topic.slug)}
              disabled={isLocked}
              className={cn(
                "relative z-10 flex items-start gap-4 w-full text-left py-4 pr-4 transition-all group",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-lg",
                !isLocked && "cursor-pointer"
              )}
            >
              {/* Node indicator */}
              <div className="relative shrink-0">
                {/* Outer glow ring for current */}
                {isCurrent && (
                  <motion.div
                    className="absolute -inset-2 rounded-full bg-primary/20"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 0.2, 0.5]
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 2.5,
                      ease: "easeInOut"
                    }}
                  />
                )}

                {/* Main node */}
                <motion.div
                  className={cn(
                    "relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300",
                    "border-2",
                    completed && "bg-success border-success text-success-foreground shadow-[0_0_20px_hsl(var(--success)/0.4)]",
                    isCurrent && "bg-primary border-primary text-primary-foreground shadow-[0_0_25px_hsl(var(--primary)/0.5)]",
                    isLocked && "bg-muted/50 border-border text-muted-foreground",
                    !completed && !isCurrent && !isLocked && "bg-card border-border text-foreground hover:border-primary/50 hover:shadow-[0_0_15px_hsl(var(--primary)/0.2)]"
                  )}
                  whileHover={!isLocked ? { scale: 1.05 } : undefined}
                  whileTap={!isLocked ? { scale: 0.98 } : undefined}
                >
                  {completed ? (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <Check className="w-5 h-5 stroke-[3]" />
                    </motion.div>
                  ) : isCurrent ? (
                    <Zap className="w-5 h-5 fill-current" />
                  ) : isLocked ? (
                    <Lock className="w-4 h-4" />
                  ) : (
                    <span className="font-mono font-bold text-sm">{index + 1}</span>
                  )}
                </motion.div>

                {/* Step number badge for completed */}
                {completed && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-card border border-success flex items-center justify-center">
                    <span className="text-[10px] font-mono font-bold text-success">{index + 1}</span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className={cn(
                "flex-1 min-w-0 py-0.5 transition-all duration-300",
                isLocked && "opacity-50"
              )}>
                {/* Title row */}
                <div className="flex items-center gap-2 mb-1">
                  <h3
                    className={cn(
                      "font-mono font-semibold text-base tracking-tight transition-colors",
                      completed && "text-success",
                      isCurrent && "text-primary",
                      isLocked && "text-muted-foreground",
                      !completed && !isCurrent && !isLocked && "text-foreground group-hover:text-primary"
                    )}
                  >
                    {topic.title}
                  </h3>
                  {isCurrent && (
                    <Badge
                      variant="outline"
                      className="border-primary/50 text-primary bg-primary/10 text-[10px] px-1.5 py-0 h-5 uppercase tracking-wider font-medium"
                    >
                      Next
                    </Badge>
                  )}
                </div>

                {/* Description */}
                {topic.description && (
                  <p className={cn(
                    "text-sm leading-relaxed mb-2.5 line-clamp-2",
                    completed ? "text-success/70" : "text-muted-foreground"
                  )}>
                    {topic.description}
                  </p>
                )}

                {/* Subelement badges */}
                {topic.subelements && topic.subelements.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {topic.subelements.slice(0, 4).map((sub) => (
                      <span
                        key={sub.id}
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium tracking-wide transition-colors",
                          completed && "bg-success/15 text-success border border-success/30",
                          isCurrent && "bg-primary/15 text-primary border border-primary/30",
                          !completed && !isCurrent && "bg-muted text-muted-foreground border border-border"
                        )}
                      >
                        {sub.subelement}
                      </span>
                    ))}
                    {topic.subelements.length > 4 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono text-muted-foreground bg-muted border border-border">
                        +{topic.subelements.length - 4}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Action indicator */}
              <div className={cn(
                "shrink-0 self-center transition-all duration-300",
                isLocked ? "opacity-0" : "opacity-100"
              )}>
                <motion.div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                    completed && "text-success group-hover:bg-success/10",
                    isCurrent && "text-primary group-hover:bg-primary/10",
                    !completed && !isCurrent && !isLocked && "text-muted-foreground group-hover:text-primary group-hover:bg-primary/10"
                  )}
                  whileHover={{ x: 3 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <ChevronRight className="w-5 h-5" />
                </motion.div>
              </div>
            </button>

            {/* Spacer between items */}
            {!isLast && <div className="h-2" />}
          </motion.div>
        );
      })}

      {/* Empty state */}
      {topics.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
            <Zap className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground font-medium">No topics have been added to this lesson yet.</p>
        </motion.div>
      )}
    </div>
  );
}
