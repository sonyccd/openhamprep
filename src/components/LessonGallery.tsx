import { useState } from "react";
import { motion } from "framer-motion";
import { useLessons } from "@/hooks/useLessons";
import { useTopicProgress } from "@/hooks/useTopics";
import { useAppNavigation } from "@/hooks/useAppNavigation";
import { LessonCard } from "./LessonCard";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Route } from "lucide-react";
import { TestType } from "@/types/navigation";
import { PageContainer } from "@/components/ui/page-container";
import { Lesson } from "@/types/lessons";

interface LessonGalleryProps {
  testType?: TestType;
}

export function LessonGallery({ testType }: LessonGalleryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: lessons, isLoading, error } = useLessons(testType);
  const { data: topicProgress } = useTopicProgress();
  const { navigateToLesson } = useAppNavigation();

  // Calculate completion for a lesson based on its topics
  const getLessonCompletion = (lesson: Lesson) => {
    const topicIds = lesson.topics?.map((lt) => lt.topic_id) || [];
    const completedCount = topicIds.filter((id) =>
      topicProgress?.some((p) => p.topic_id === id && p.is_completed)
    ).length;
    return {
      total: topicIds.length,
      completed: completedCount,
      percentage: topicIds.length > 0 ? Math.round((completedCount / topicIds.length) * 100) : 0,
    };
  };

  // Filter lessons by search query
  const filteredLessons = lessons?.filter((lesson) => {
    const query = searchQuery.toLowerCase();
    return (
      lesson.title.toLowerCase().includes(query) ||
      lesson.description?.toLowerCase().includes(query)
    );
  });

  // Calculate overall stats
  const completedLessonsCount =
    filteredLessons?.filter((l) => getLessonCompletion(l).percentage === 100).length ?? 0;
  const totalCount = filteredLessons?.length ?? 0;

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load lessons. Please try again.</p>
      </div>
    );
  }

  return (
    <PageContainer width="wide" contentClassName="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Route className="w-6 h-6" />
            Lessons
          </h1>
          {totalCount > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              {completedLessonsCount} of {totalCount} completed
            </p>
          )}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search lessons..."
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
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          ))}
        </div>
      )}

      {/* Lessons grid */}
      {!isLoading && filteredLessons && filteredLessons.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLessons.map((lesson, index) => (
            <motion.div
              key={lesson.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <LessonCard
                lesson={lesson}
                completion={getLessonCompletion(lesson)}
                onClick={() => navigateToLesson(lesson.slug)}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filteredLessons && filteredLessons.length === 0 && (
        <div className="text-center py-12 bg-muted/30 rounded-lg">
          <Route className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          {searchQuery ? (
            <>
              <h3 className="text-lg font-medium text-foreground mb-2">No lessons found</h3>
              <p className="text-muted-foreground">
                No lessons match "{searchQuery}". Try a different search term.
              </p>
            </>
          ) : (
            <>
              <h3 className="text-lg font-medium text-foreground mb-2">No lessons available</h3>
              <p className="text-muted-foreground">
                Lessons will appear here once they're published.
              </p>
            </>
          )}
        </div>
      )}
    </PageContainer>
  );
}
