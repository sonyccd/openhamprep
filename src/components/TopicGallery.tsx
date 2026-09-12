import { useState } from "react";
import Box from "@mui/material/Box";
import InputAdornment from "@mui/material/InputAdornment";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useTopics, useTopicProgress } from "@/hooks/useTopics";
import { useAppNavigation } from "@/hooks/useAppNavigation";
import { TopicCard } from "./TopicCard";
import { Search, FileText } from "lucide-react";
import { TestType } from "@/types/navigation";
import { PageContainer } from "@/components/ui/page-container";
import { MotionBox } from "@/components/ohp/MotionBox";
import { tokenAlpha } from "@/theme/muiTheme";

interface TopicGalleryProps {
  testType?: TestType;
}

// grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6. The breakpoint keys line up
// with Tailwind's because muiTheme pins them to Tailwind's values.
const cardGrid = {
  display: "grid",
  gap: 3,
  gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" },
} as const;

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
      topic.subelements?.some((sub) => sub.subelement.toLowerCase().includes(query))
    );
  });

  // Check if a topic is completed
  const isTopicCompleted = (topicId: string) =>
    progress?.some((p) => p.topic_id === topicId && p.is_completed) ?? false;

  const completedCount = topics?.filter((t) => isTopicCompleted(t.id)).length ?? 0;
  const totalCount = topics?.length ?? 0;

  if (error) {
    return (
      <Box sx={{ textAlign: "center", py: 6 }}>
        <Typography sx={{ color: "error.main" }}>
          Failed to load topics. Please try again.
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
              <Box component={FileText} aria-hidden="true" sx={{ width: 24, height: 24 }} />
              Topics
            </Typography>
            {totalCount > 0 && (
              <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                {completedCount} of {totalCount} completed
              </Typography>
            )}
          </Box>

          <TextField
            size="small"
            placeholder="Search topics..."
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
              </Stack>
            ))}
          </Box>
        )}

        {!isLoading && filteredTopics && filteredTopics.length > 0 && (
          <Box sx={cardGrid}>
            {filteredTopics.map((topic, index) => (
              <MotionBox
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
              </MotionBox>
            ))}
          </Box>
        )}

        {!isLoading && filteredTopics && filteredTopics.length === 0 && (
          <Box
            sx={{
              textAlign: "center",
              py: 6,
              borderRadius: 2,
              bgcolor: (theme) => tokenAlpha(theme.vars.palette.muted, 30),
            }}
          >
            <Box
              component={FileText}
              aria-hidden="true"
              sx={{ width: 48, height: 48, mx: "auto", mb: 2, color: "text.secondary" }}
            />
            <Typography variant="h6" component="h3" sx={{ fontWeight: 500, mb: 1 }}>
              {searchQuery ? "No topics found" : "No topics available"}
            </Typography>
            <Typography sx={{ color: "text.secondary" }}>
              {searchQuery
                ? `No topics match "${searchQuery}". Try a different search term.`
                : "Topics will appear here once they're published."}
            </Typography>
          </Box>
        )}
      </Stack>
    </PageContainer>
  );
}
