import { useTopic, useTopicContent } from "@/hooks/useTopics";
import { TopicTableOfContents } from "./TopicTableOfContents";
import { TopicContent } from "./TopicContent";
import { TopicResourcePanel } from "./TopicResourcePanel";
import { TopicQuestionsPanel } from "./TopicQuestionsPanel";
import { TopicProgressButton } from "./TopicProgressButton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, BookOpen } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

interface TopicDetailPageProps {
  slug: string;
  onBack: () => void;
}

export function TopicDetailPage({ slug, onBack }: TopicDetailPageProps) {
  const navigate = useNavigate();
  const { data: topic, isLoading: topicLoading, error: topicError } = useTopic(slug);
  const { data: content, isLoading: contentLoading } = useTopicContent(topic?.content_path);
  const [activeHeadingId, setActiveHeadingId] = useState<string>();

  const handleQuestionClick = (questionId: string) => {
    navigate(`/questions/${questionId}`);
  };

  // Loading state
  if (topicLoading) {
    return (
      <div className="flex-1 overflow-y-auto py-8 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
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
        </div>
      </div>
    );
  }

  // Error state
  if (topicError || !topic) {
    return (
      <div className="flex-1 flex items-center justify-center py-12">
        <div className="text-center">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-medium text-foreground mb-2">Topic not found</h2>
          <p className="text-muted-foreground mb-4">
            The topic you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Topics
          </Button>
        </div>
      </div>
    );
  }

  // Default content if no markdown is available
  const displayContent = content || `# ${topic.title}\n\n${topic.description || "Content coming soon..."}\n\nThis topic is still being developed. Check back later for the full article.`;

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
            Back to Topics
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
            <TopicProgressButton topicId={topic.id} className="shrink-0" />
          </div>
        </div>
      </motion.div>

      {/* Main content area - three column layout */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
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
            {contentLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            ) : (
              <TopicContent content={displayContent} />
            )}

            {/* Bottom progress button for mobile */}
            <div className="lg:hidden mt-8 pt-8 border-t border-border">
              <TopicProgressButton topicId={topic.id} className="w-full" />
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
    </div>
  );
}
