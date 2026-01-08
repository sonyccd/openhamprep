import { useTopic, useTopicQuestions, useTopicCompleted, useToggleTopicComplete } from "@/hooks/useTopics";
import { useQuestionsByIds, Question } from "@/hooks/useQuestions";
import { useAuth } from "@/hooks/useAuth";
import { useProgress } from "@/hooks/useProgress";
import { useAppNavigation } from "@/hooks/useAppNavigation";
import { TopicTableOfContents } from "./TopicTableOfContents";
import { TopicContent } from "./TopicContent";
import { TopicResourcePanel } from "./TopicResourcePanel";
import { TopicQuestionsPanel } from "./TopicQuestionsPanel";
import { TopicProgressButton } from "./TopicProgressButton";
import { TopicQuiz } from "./TopicQuiz";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, FileText, PlayCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { PageContainer } from "@/components/ui/page-container";
import { TOPIC_QUIZ_PASSING_THRESHOLD } from "@/types/navigation";

interface TopicDetailPageProps {
  slug: string;
  onBack: () => void;
}

export function TopicDetailPage({ slug, onBack }: TopicDetailPageProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { topicSource } = useAppNavigation();
  const { data: topic, isLoading: topicLoading, error: topicError } = useTopic(slug);
  const { data: topicQuestions } = useTopicQuestions(topic?.id);
  const [activeHeadingId, setActiveHeadingId] = useState<string>();
  const [isQuizOpen, setIsQuizOpen] = useState(false);

  const questionCount = topicQuestions?.length || 0;
  const isCompleted = useTopicCompleted(topic?.id);

  // Fetch full question data for quiz
  const questionIds = topicQuestions?.map((q) => q.id) || [];
  const { data: fullQuestions, isLoading: fullQuestionsLoading } = useQuestionsByIds(questionIds);

  // Hook for marking topic complete
  const { mutate: toggleComplete } = useToggleTopicComplete();

  // Hook for saving question attempts
  const { saveQuizAttempts } = useProgress();

  const handleStartQuiz = () => {
    setIsQuizOpen(true);
  };

  const handleQuizComplete = (passed: boolean, score: number, totalQuestions: number) => {
    // Auto-mark topic as complete if passed
    if (passed && topic) {
      toggleComplete({ topicId: topic.id, isCompleted: true });
    }
  };

  const handleCloseQuiz = () => {
    setIsQuizOpen(false);
  };

  const handleSaveAttempts = async (
    attempts: Array<{ question: Question; selectedAnswer: "A" | "B" | "C" | "D" }>
  ) => {
    return saveQuizAttempts(attempts, 'topic_quiz');
  };

  const handleQuestionClick = (questionId: string) => {
    navigate(`/questions/${questionId}`);
  };

  // Loading state
  if (topicLoading) {
    return (
      <PageContainer width="full">
        {/* Header skeleton */}
        <div className="mb-8">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-10 w-3/4 mb-4" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-16" />
          </div>
        </div>
        {/* Content skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr_250px] gap-8">
          <div className="hidden lg:block">
            <Skeleton className="h-48 w-full" />
          </div>
          <div>
            <Skeleton className="h-6 w-full mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-4 w-5/6 mb-4" />
            <Skeleton className="h-6 w-2/3 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-4/5" />
          </div>
          <div className="hidden lg:block">
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </PageContainer>
    );
  }

  // Error state
  if (topicError || !topic) {
    return (
      <PageContainer width="full" className="flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-medium text-foreground mb-2">Topic not found</h2>
          <p className="text-muted-foreground mb-4">
            The topic you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {topicSource === 'lesson' ? 'Back to Lesson' : 'Back to Topics'}
          </Button>
        </div>
      </PageContainer>
    );
  }

  // Default content if no markdown is available
  const displayContent = topic.content || `# ${topic.title}\n\n${topic.description || "Content coming soon..."}\n\nThis topic is still being developed. Check back later for the full article.`;

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-border bg-card"
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
          {/* Back button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {topicSource === 'lesson' ? 'Back to Lesson' : 'Back to Topics'}
          </Button>

          {/* Title and metadata */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                {topic.title}
              </h1>
              {topic.description && (
                <p className="text-muted-foreground max-w-2xl">
                  {topic.description}
                </p>
              )}
              {/* Subelement badges */}
              {topic.subelements && topic.subelements.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {topic.subelements.map((sub) => (
                    <Badge key={sub.id} variant="secondary">
                      {sub.subelement}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Progress button */}
            <TopicProgressButton topicId={topic.id} questionCount={questionCount} className="shrink-0" />
          </div>
        </div>
      </motion.div>

      {/* Main content area - three column layout */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr_280px] gap-8">
          {/* Left sidebar - Table of Contents */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:order-1 order-2"
          >
            <TopicTableOfContents
              content={displayContent}
              activeId={activeHeadingId}
              onItemClick={setActiveHeadingId}
            />
          </motion.aside>

          {/* Main content */}
          <motion.main
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="lg:order-2 order-1 min-w-0"
          >
            <TopicContent content={displayContent} />

            {/* Take Quiz CTA after content */}
            {user && questionCount > 0 && (
              <div className="mt-10 pt-8 border-t border-border">
                <div className="bg-muted/30 rounded-xl p-6 text-center">
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Ready to test your knowledge?
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {isCompleted
                      ? "You've already completed this topic. Take the quiz again to reinforce your learning."
                      : `Answer ${questionCount} question${questionCount !== 1 ? 's' : ''} and score 80% or higher to complete this topic.`
                    }
                  </p>
                  <Button onClick={handleStartQuiz} size="lg" className="gap-2">
                    <PlayCircle className="w-5 h-5" />
                    {isCompleted ? "Retake Quiz" : "Take Quiz"}
                  </Button>
                </div>
              </div>
            )}

            {/* Bottom progress button for mobile */}
            <div className="lg:hidden mt-8 pt-8 border-t border-border">
              <TopicProgressButton topicId={topic.id} questionCount={questionCount} className="w-full" />
            </div>
          </motion.main>

          {/* Right sidebar - Questions and Resources */}
          <motion.aside
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:order-3 order-3"
          >
            <div className="sticky top-4 space-y-0">
              <TopicQuestionsPanel
                topicId={topic.id}
                onQuestionClick={handleQuestionClick}
              />
              <TopicResourcePanel resources={topic.resources || []} />
            </div>
          </motion.aside>
        </div>
      </div>

      {/* Quiz Modal */}
      <Dialog open={isQuizOpen} onOpenChange={setIsQuizOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Quiz: {topic.title}</DialogTitle>
          </DialogHeader>
          {fullQuestionsLoading || !fullQuestions ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <TopicQuiz
              questions={fullQuestions}
              onComplete={handleQuizComplete}
              onDone={handleCloseQuiz}
              onSaveAttempts={handleSaveAttempts}
              passingThreshold={TOPIC_QUIZ_PASSING_THRESHOLD}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
