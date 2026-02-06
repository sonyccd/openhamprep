import { useLesson } from "@/hooks/useLessons";
import { useTopicProgress } from "@/hooks/useTopics";
import { useAppNavigation } from "@/hooks/useAppNavigation";
import { LessonPath } from "./LessonPath";
import { CircularProgress } from "@/components/ui/circular-progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Route, CheckCircle2 } from "lucide-react";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { trackLessonViewed } from "@/lib/amplitude";
import { PageContainer } from "@/components/ui/page-container";

interface LessonDetailPageProps {
  slug: string;
  onBack: () => void;
}

export function LessonDetailPage({ slug, onBack }: LessonDetailPageProps) {
  const { data: lesson, isLoading, error } = useLesson(slug);
  const { data: topicProgress } = useTopicProgress();
  const { navigateToTopic } = useAppNavigation();

  // Track lesson view in Amplitude when slug changes
  useEffect(() => {
    trackLessonViewed(slug);
  }, [slug]);

  // Calculate which topics are completed
  const getTopicStatus = (topicId: string) => {
    return topicProgress?.some((p) => p.topic_id === topicId && p.is_completed) ?? false;
  };

  // Get topics and calculate completion
  const topics = lesson?.topics || [];
  const completedCount = topics.filter((lt) => getTopicStatus(lt.topic_id)).length;
  const totalCount = topics.length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isComplete = completedCount === totalCount && totalCount > 0;

  // Find the next incomplete topic (the "current" one)
  const currentTopicIndex = topics.findIndex((lt) => !getTopicStatus(lt.topic_id));
  // If all complete, set to -1 (no current topic)
  const adjustedCurrentIndex = currentTopicIndex === -1 && totalCount > 0 ? totalCount : currentTopicIndex;

  // Loading state
  if (isLoading) {
    return (
      <PageContainer width="narrow">
        <div className="mb-8">
          <Skeleton className="h-8 w-32 mb-4" />
          <Skeleton className="h-10 w-3/4 mb-2" />
          <Skeleton className="h-5 w-full mb-6" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <Skeleton className="h-5 w-32" />
          </div>
        </div>
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-start gap-4 p-4">
              <Skeleton className="h-12 w-12 rounded-full shrink-0" />
              <div className="flex-1">
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          ))}
        </div>
      </PageContainer>
    );
  }

  // Error state
  if (error || !lesson) {
    return (
      <PageContainer width="narrow">
        <div className="text-center py-12">
          <Route className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Lesson not found</h2>
          <p className="text-muted-foreground mb-4">
            The lesson you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Lessons
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer width="narrow" contentClassName="py-0">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 -mx-4 px-4 py-6 bg-background border-b border-border mb-6"
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Lessons
        </Button>

        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          {lesson.title}
        </h1>
        {lesson.description && (
          <p className="text-muted-foreground mb-4">{lesson.description}</p>
        )}

        {/* Progress indicator */}
        <div className="flex items-center gap-3">
          <CircularProgress
            value={completionPercentage}
            size={48}
            strokeWidth={4}
            className={isComplete ? "text-success" : "text-primary"}
          >
            {isComplete ? (
              <CheckCircle2 className="w-5 h-5 text-success" />
            ) : (
              <span className="text-xs font-bold">{completionPercentage}%</span>
            )}
          </CircularProgress>
          <div className="text-sm">
            <span className="font-medium text-foreground">
              {completedCount}/{totalCount}
            </span>
            <span className="text-muted-foreground ml-1">topics completed</span>
          </div>
        </div>
      </motion.div>

      {/* Lesson Path */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="pb-8"
      >
        <LessonPath
          topics={topics}
          topicProgress={topicProgress}
          currentTopicIndex={adjustedCurrentIndex}
          onTopicClick={(topicSlug) => navigateToTopic(topicSlug, 'lesson')}
        />
      </motion.div>

      {/* Completion celebration */}
      {isComplete && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center py-8 mb-8 bg-success/5 rounded-xl border border-success/20"
        >
          <CheckCircle2 className="w-12 h-12 mx-auto text-success mb-3" />
          <h3 className="text-lg font-semibold text-success mb-1">
            Lesson Complete!
          </h3>
          <p className="text-muted-foreground">
            You've completed all {totalCount} topics in this lesson.
          </p>
        </motion.div>
      )}
    </PageContainer>
  );
}
