import { useState } from "react";
import Box from "@mui/material/Box";
import InputAdornment from "@mui/material/InputAdornment";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useLessons } from "@/hooks/useLessons";
import { useTopicProgress } from "@/hooks/useTopics";
import { useAppNavigation } from "@/hooks/useAppNavigation";
import { LessonCard } from "./LessonCard";
import { Search, Route } from "lucide-react";
import { TestType } from "@/types/navigation";
import { PageContainer } from "@/components/ohp/PageContainer";
import { Lesson } from "@/types/lessons";
import { MotionBox } from "@/components/ohp/MotionBox";
import { tokenAlpha } from "@/theme/muiTheme";

interface LessonGalleryProps {
  testType?: TestType;
}

// grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6. The breakpoint keys line up
// with Tailwind's because muiTheme pins them to Tailwind's values.
const cardGrid = {
  display: "grid",
  gap: 3,
  gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" },
} as const;

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
      <Box sx={{ textAlign: "center", py: 6 }}>
        <Typography sx={{ color: "error.main" }}>
          Failed to load lessons. Please try again.
        </Typography>
      </Box>
    );
  }

  return (
    <PageContainer width="wide">
      {/* space-y-8 became Stack spacing, so no Tailwind class is passed down. */}
      <Stack spacing={4}>
        <MotionBox
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: 2,
            alignItems: { xs: "flex-start", sm: "center" },
            justifyContent: "space-between",
          }}
        >
          <Box>
            <Typography
              variant="h5"
              component="h1"
              sx={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }}
            >
              <Box component={Route} aria-hidden="true" sx={{ width: 24, height: 24 }} />
              Lessons
            </Typography>
            {totalCount > 0 && (
              <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                {completedLessonsCount} of {totalCount} completed
              </Typography>
            )}
          </Box>

          <TextField
            size="small"
            placeholder="Search lessons..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ width: { xs: "100%", sm: 288 } }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    {/* Was an absolutely positioned icon with pl-10 on the input. */}
                    <Box
                      component={Search}
                      aria-hidden="true"
                      sx={{ width: 16, height: 16, color: "text.secondary" }}
                    />
                  </InputAdornment>
                ),
              },
            }}
          />
        </MotionBox>

        {isLoading && (
          <Box sx={cardGrid}>
            {[...Array(6)].map((_, i) => (
              <Stack key={i} spacing={1.5}>
                {/*
                  data-testid is carried over from the shadcn Skeleton, which had
                  it built in. A skeleton is a visual placeholder with no role to
                  query, so the testid is the only handle a test has.
                */}
                <Skeleton data-testid="skeleton" variant="rectangular" sx={{ aspectRatio: "16 / 9", borderRadius: 2 }} />
                <Skeleton data-testid="skeleton" variant="rectangular" sx={{ height: 24, width: "75%" }} />
                <Skeleton data-testid="skeleton" variant="rectangular" sx={{ height: 16, width: "100%" }} />
                <Skeleton data-testid="skeleton" variant="rectangular" sx={{ height: 8, borderRadius: 999 }} />
              </Stack>
            ))}
          </Box>
        )}

        {!isLoading && filteredLessons && filteredLessons.length > 0 && (
          <Box sx={cardGrid}>
            {filteredLessons.map((lesson, index) => (
              <MotionBox
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
              </MotionBox>
            ))}
          </Box>
        )}

        {!isLoading && filteredLessons && filteredLessons.length === 0 && (
          <Box
            sx={{
              textAlign: "center",
              py: 6,
              borderRadius: 2,
              bgcolor: (theme) => tokenAlpha(theme.vars.palette.muted, 30),
            }}
          >
            <Box
              component={Route}
              aria-hidden="true"
              sx={{ width: 48, height: 48, mx: "auto", mb: 2, color: "text.secondary" }}
            />
            <Typography variant="h6" component="h3" sx={{ fontWeight: 500, mb: 1 }}>
              {searchQuery ? "No lessons found" : "No lessons available"}
            </Typography>
            <Typography sx={{ color: "text.secondary" }}>
              {searchQuery
                ? `No lessons match "${searchQuery}". Try a different search term.`
                : "Lessons will appear here once they're published."}
            </Typography>
          </Box>
        )}
      </Stack>
    </PageContainer>
  );
}
