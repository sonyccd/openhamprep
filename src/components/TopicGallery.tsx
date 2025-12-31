import { useState } from "react";
import { motion } from "framer-motion";
import { useTopics, useTopicProgress } from "@/hooks/useTopics";
import { useAppNavigation } from "@/hooks/useAppNavigation";
import { TopicCard } from "./TopicCard";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, BookOpen } from "lucide-react";
import { TestType } from "@/types/navigation";

interface TopicGalleryProps {
  testType?: TestType;
}

export function TopicGallery({ testType }: TopicGalleryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: topics, isLoading, error } = useTopics(testType);
  const { data: progress } = useTopicProgress();
  const { navigateToTopic } = useAppNavigation();

  // Filter topics by search query
  const filteredTopics = topics?.filter((topic) => {
    const query = searchQuery.toLowerCase();
    return (
      topic.title.toLowerCase().includes(query) ||
      topic.description?.toLowerCase().includes(query) ||
      topic.subelements?.some((s) => s.subelement.toLowerCase().includes(query))
    );
  });

  // Check if a topic is completed
  const isTopicCompleted = (topicId: string) => {
    return progress?.some((p) => p.topic_id === topicId && p.is_completed) ?? false;
  };

  // Calculate completion stats
  const completedCount = topics?.filter((t) => isTopicCompleted(t.id)).length ?? 0;
  const totalCount = topics?.length ?? 0;

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load topics. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto py-8 md:py-12 px-4 md:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
        >
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <BookOpen className="w-6 h-6" />
              Topics
            </h1>
            {totalCount > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                {completedCount} of {totalCount} completed
              </p>
            )}
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </motion.div>

        {/* Loading state */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-video w-full rounded-lg" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        )}

        {/* Topics grid */}
        {!isLoading && filteredTopics && filteredTopics.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTopics.map((topic, index) => (
              <motion.div
                key={topic.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <TopicCard
                  topic={topic}
                  isCompleted={isTopicCompleted(topic.id)}
                  onClick={() => navigateToTopic(topic.slug)}
                />
              </motion.div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && filteredTopics && filteredTopics.length === 0 && (
          <div className="text-center py-12 bg-muted/30 rounded-lg">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            {searchQuery ? (
              <>
                <h3 className="text-lg font-medium text-foreground mb-2">No topics found</h3>
                <p className="text-muted-foreground">
                  No topics match "{searchQuery}". Try a different search term.
                </p>
              </>
            ) : (
              <>
                <h3 className="text-lg font-medium text-foreground mb-2">No topics available</h3>
                <p className="text-muted-foreground">
                  Topics will appear here once they're published.
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
