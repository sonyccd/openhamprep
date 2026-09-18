import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { ArrowLeft, FileText } from "lucide-react";
import { useTopic, useTopicQuestions, useTopicCompleted, useToggleTopicComplete } from "@/hooks/useTopics";
import { useQuestionsByIds, Question } from "@/hooks/useQuestions";
import { useAuth } from "@/hooks/useAuth";
import { useProgress } from "@/hooks/useProgress";
import { useAppNavigation } from "@/hooks/useAppNavigation";
import { trackTopicViewed, trackQuizStarted } from "@/lib/amplitude";
import { TOPIC_QUIZ_PASSING_THRESHOLD } from "@/types/navigation";
import { GuestPrompt } from "@/components/ohp/GuestPrompt";
import { MotionBox } from "@/components/ohp/MotionBox";
import { PageContainer } from "@/components/ohp/PageContainer";
import { TopicContent } from "./TopicContent";
import { TopicProgressButton } from "./TopicProgressButton";
import { TopicQuestionsPanel } from "./TopicQuestionsPanel";
import { TopicResourcePanel } from "./TopicResourcePanel";
import { TopicDetailSkeleton } from "./topic/TopicDetailSkeleton";
import { TopicHeader } from "./topic/TopicHeader";
import { TopicQuizCta } from "./topic/TopicQuizCta";
import { TopicQuizDialog } from "./topic/TopicQuizDialog";
import { TopicSidebar } from "./topic/TopicSidebar";

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
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    trackTopicViewed(slug);
  }, [slug]);

  const questionCount = topicQuestions?.length || 0;
  const isCompleted = useTopicCompleted(topic?.id);

  const questionIds = topicQuestions?.map((q) => q.id) || [];
  const { data: fullQuestions, isLoading: fullQuestionsLoading } = useQuestionsByIds(questionIds);

  const { mutate: toggleComplete } = useToggleTopicComplete();
  const { saveQuizAttempts } = useProgress();

  const backLabel = topicSource === "lesson" ? "Back to Lesson" : "Back to Topics";

  const handleStartQuiz = () => {
    setIsQuizOpen(true);
    trackQuizStarted({ topic_slug: slug, question_count: questionCount });
  };

  const handleQuizComplete = (passed: boolean) => {
    if (passed && topic) toggleComplete({ topicId: topic.id, isCompleted: true });
  };

  const handleSaveAttempts = (
    attempts: Array<{ question: Question; selectedAnswer: "A" | "B" | "C" | "D" }>
  ) => saveQuizAttempts(attempts, "topic_quiz");

  if (topicLoading) return <TopicDetailSkeleton />;

  if (topicError || !topic) {
    return (
      <PageContainer
        width="full"
        contentSx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <Box sx={{ textAlign: "center" }}>
          <Box
            component={FileText}
            aria-hidden="true"
            sx={{ width: 48, height: 48, mx: "auto", mb: 2, color: "text.secondary", display: "block" }}
          />
          <Typography variant="h6" component="h2" sx={{ fontSize: "1.125rem", fontWeight: 500, mb: 1 }}>
            Topic not found
          </Typography>
          <Typography sx={{ color: "text.secondary", mb: 2 }}>
            The topic you're looking for doesn't exist or has been removed.
          </Typography>
          <Button
            variant="contained"
            onClick={onBack}
            startIcon={<Box component={ArrowLeft} aria-hidden="true" sx={{ width: 16, height: 16 }} />}
          >
            {backLabel}
          </Button>
        </Box>
      </PageContainer>
    );
  }

  const displayContent =
    topic.content ||
    `# ${topic.title}\n\n${topic.description || "Content coming soon..."}\n\nThis topic is still being developed. Check back later for the full article.`;

  // Only reserve the sidebar column when there is something to put in it.
  const hasSidebarContent = questionCount > 0 || (topic.resources?.length ?? 0) > 0;

  return (
    <Box sx={{ flex: 1, overflowY: "auto" }}>
      <TopicHeader topic={topic} questionCount={questionCount} backLabel={backLabel} onBack={onBack} />

      <Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 2, md: 4 }, py: { xs: 4, md: 6 } }}>
        <Box
          data-testid="topic-layout-grid"
          sx={{
            display: "grid",
            gap: 4,
            gridTemplateColumns: {
              xs: "1fr",
              lg: !hasSidebarContent ? "1fr" : sidebarOpen ? "1fr 280px" : "1fr auto",
            },
          }}
        >
          <MotionBox
            component="main"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            sx={{ minWidth: 0 }}
          >
            <TopicContent content={displayContent} />

            {/*
              A guest reaches here from a lesson whose later topics show as
              locked, and nothing said what would unlock them: the quiz CTA
              below is gated on `user`, so they saw neither the quiz nor a
              reason. The prompt names the mechanism — a quiz score is what
              marks a topic complete — per the guest-mode copy rule.
            */}
            {!user && questionCount > 0 && (
              <GuestPrompt
                message={`This topic has a ${questionCount}-question quiz. Scoring 80% marks the topic complete and unlocks the next one — that needs an account, since the score has to be saved somewhere.`}
                sx={{ mt: 5 }}
              />
            )}

            {user && questionCount > 0 && (
              <TopicQuizCta questionCount={questionCount} isCompleted={isCompleted} onStart={handleStartQuiz} />
            )}

            {/* The header's progress control again, for mobile, where the header is far above. */}
            <Box sx={{ display: { lg: "none" }, mt: 4, pt: 4, borderTop: "1px solid", borderColor: "divider" }}>
              <TopicProgressButton topicId={topic.id} questionCount={questionCount} sx={{ width: "100%" }} />
            </Box>
          </MotionBox>

          {hasSidebarContent && (
            <TopicSidebar resetKey={slug} onOpenChange={setSidebarOpen}>
              <TopicQuestionsPanel
                topicId={topic.id}
                onQuestionClick={(questionId) => navigate(`/questions/${questionId}`)}
              />
              <TopicResourcePanel resources={topic.resources || []} />
            </TopicSidebar>
          )}
        </Box>
      </Box>

      <TopicQuizDialog
        open={isQuizOpen}
        onClose={() => setIsQuizOpen(false)}
        title={topic.title}
        questions={fullQuestions}
        isLoadingQuestions={fullQuestionsLoading}
        onComplete={handleQuizComplete}
        onDone={() => setIsQuizOpen(false)}
        onSaveAttempts={handleSaveAttempts}
        passingThreshold={TOPIC_QUIZ_PASSING_THRESHOLD}
      />
    </Box>
  );
}
