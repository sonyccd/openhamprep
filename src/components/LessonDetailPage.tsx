import { Icon } from "@/components/ohp/Icon";
import { useEffect } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import { ArrowLeft, CheckCircle2, Route } from "lucide-react";
import { useLesson } from "@/hooks/useLessons";
import { useTopicProgress } from "@/hooks/useTopics";
import { useAppNavigation } from "@/hooks/useAppNavigation";
import { trackLessonViewed } from "@/lib/amplitude";
import { MotionBox } from "@/components/ohp/MotionBox";
import { PageContainer } from "@/components/ohp/PageContainer";
import { ScoreRing } from "@/components/ohp/ScoreRing";
import { tokenAlpha } from "@/theme/muiTheme";
import { LessonPath } from "./LessonPath";

interface LessonDetailPageProps {
  slug: string;
  onBack: () => void;
}

const LoadingSkeleton = () => (
  <PageContainer width="narrow">
    <Box sx={{ mb: 4 }}>
      <Skeleton variant="rounded" width={128} height={32} sx={{ mb: 2 }} />
      <Skeleton variant="rounded" width="75%" height={40} sx={{ mb: 1 }} />
      <Skeleton variant="rounded" width="100%" height={20} sx={{ mb: 3 }} />
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Skeleton variant="circular" width={64} height={64} />
        <Skeleton variant="rounded" width={128} height={20} />
      </Box>
    </Box>
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {[...Array(4)].map((_, i) => (
        <Box key={i} sx={{ display: "flex", alignItems: "flex-start", gap: 2, p: 2 }}>
          <Skeleton variant="circular" width={48} height={48} sx={{ flexShrink: 0 }} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="rounded" width="75%" height={20} sx={{ mb: 1 }} />
            <Skeleton variant="rounded" width="100%" height={16} />
          </Box>
        </Box>
      ))}
    </Box>
  </PageContainer>
);

export function LessonDetailPage({ slug, onBack }: LessonDetailPageProps) {
  const { data: lesson, isLoading, error } = useLesson(slug);
  const { data: topicProgress } = useTopicProgress();
  const { navigateToTopic } = useAppNavigation();

  useEffect(() => {
    trackLessonViewed(slug);
  }, [slug]);

  const getTopicStatus = (topicId: string) =>
    topicProgress?.some((p) => p.topic_id === topicId && p.is_completed) ?? false;

  const topics = lesson?.topics || [];
  const completedCount = topics.filter((lt) => getTopicStatus(lt.topic_id)).length;
  const totalCount = topics.length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isComplete = completedCount === totalCount && totalCount > 0;

  // The first incomplete topic is "current"; once all are done there is none.
  const currentTopicIndex = topics.findIndex((lt) => !getTopicStatus(lt.topic_id));
  const adjustedCurrentIndex =
    currentTopicIndex === -1 && totalCount > 0 ? totalCount : currentTopicIndex;

  if (isLoading) return <LoadingSkeleton />;

  if (error || !lesson) {
    return (
      <PageContainer width="narrow">
        <Box sx={{ textAlign: "center", py: 6 }}>
          <Icon icon={Route} size={48} sx={{ mx: "auto", mb: 2, color: "text.secondary", display: "block" }} />
          <Typography variant="h6" component="h2" sx={{ fontWeight: 600, mb: 1 }}>
            Lesson not found
          </Typography>
          <Typography sx={{ color: "text.secondary", mb: 2 }}>
            The lesson you're looking for doesn't exist or has been removed.
          </Typography>
          <Button
            variant="outlined"
            onClick={onBack}
            startIcon={<Icon icon={ArrowLeft} size={16} />}
          >
            Back to Lessons
          </Button>
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer width="narrow" contentSx={{ py: 0 }}>
      <MotionBox
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        sx={{
          position: "relative",
          zIndex: 1,
          mx: -2,
          px: 2,
          py: 3,
          bgcolor: "background.default",
          borderBottom: "1px solid",
          borderColor: "divider",
          mb: 3,
        }}
      >
        <Button
          variant="text"
          size="small"
          onClick={onBack}
          startIcon={<Icon icon={ArrowLeft} size={16} />}
          sx={{ mb: 2, ml: -1, color: "text.secondary", "&:hover": { color: "text.primary" } }}
        >
          Back to Lessons
        </Button>

        <Typography
          variant="h4"
          component="h1"
          sx={{ fontSize: { xs: "1.5rem", md: "1.875rem" }, fontWeight: 700, mb: 1 }}
        >
          {lesson.title}
        </Typography>
        {lesson.description && (
          <Typography sx={{ color: "text.secondary", mb: 2 }}>{lesson.description}</Typography>
        )}

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          {/*
            #296: the ring was always amber. The old CircularProgress took its
            arc colour from a separate progressClassName prop, and this caller
            passed className instead — which landed on the wrapper, never the
            arc. ScoreRing's colour is a theme callback, so there is no wrong
            element for it to land on.
          */}
          <ScoreRing
            value={completionPercentage}
            size={48}
            strokeWidth={4}
            color={(t) => (isComplete ? t.vars.palette.success.main : t.vars.palette.primary.main)}
            label="Lesson progress"
            valueText={`${completedCount} of ${totalCount} topics completed`}
          >
            {isComplete ? (
              <Icon icon={CheckCircle2} size={20} sx={{ color: "success.main" }} />
            ) : (
              <Box component="span" sx={{ fontSize: "0.75rem", fontWeight: 700 }}>
                {completionPercentage}%
              </Box>
            )}
          </ScoreRing>
          <Box sx={{ fontSize: "0.875rem" }}>
            <Box component="span" sx={{ fontWeight: 500 }}>
              {completedCount}/{totalCount}
            </Box>
            <Box component="span" sx={{ color: "text.secondary", ml: 0.5 }}>
              topics completed
            </Box>
          </Box>
        </Box>
      </MotionBox>

      <MotionBox initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} sx={{ pb: 4 }}>
        <LessonPath
          topics={topics}
          topicProgress={topicProgress}
          currentTopicIndex={adjustedCurrentIndex}
          onTopicClick={(topicSlug) => navigateToTopic(topicSlug, "lesson")}
        />
      </MotionBox>

      {isComplete && (
        <MotionBox
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          sx={{
            textAlign: "center",
            py: 4,
            mb: 4,
            borderRadius: "12px",
            border: "1px solid",
            borderColor: (t) => tokenAlpha(t.vars.palette.success.main, 20),
            bgcolor: (t) => tokenAlpha(t.vars.palette.success.main, 5),
          }}
        >
          <Icon icon={CheckCircle2} size={48} sx={{ mx: "auto", mb: 1.5, color: "success.main", display: "block" }} />
          <Typography variant="h6" component="h3" sx={{ fontWeight: 600, color: "success.main", mb: 0.5 }}>
            Lesson Complete!
          </Typography>
          <Typography sx={{ color: "text.secondary" }}>
            You've completed all {totalCount} topics in this lesson.
          </Typography>
        </MotionBox>
      )}
    </PageContainer>
  );
}
