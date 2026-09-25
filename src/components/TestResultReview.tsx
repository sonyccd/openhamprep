import { Icon } from "@/components/ohp/Icon";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { Calendar } from "lucide-react";
import { Question, useQuestions } from "@/hooks/useQuestions";
import { useAppNavigation } from "@/hooks/useAppNavigation";
import { supabase } from "@/integrations/supabase/client";
import { MotionBox } from "@/components/ohp/MotionBox";
import { PageContainer } from "@/components/ohp/PageContainer";
import { AnswerReviewDetail } from "@/components/results/AnswerReviewDetail";
import { AnswerReviewList } from "@/components/results/AnswerReviewList";
import { ScoreBanner } from "@/components/results/ScoreBanner";

interface TestResultReviewProps {
  testResultId: string;
  onBack: () => void;
}

const indexToAnswer: Record<number, 'A' | 'B' | 'C' | 'D'> = {
  0: 'A',
  1: 'B',
  2: 'C',
  3: 'D'
};

export function TestResultReview({ testResultId, onBack }: TestResultReviewProps) {
  const [reviewIndex, setReviewIndex] = useState<number | null>(null);
  const { navigateToTopic } = useAppNavigation();
  const { data: allQuestions } = useQuestions();

  // Fetch the test result
  const { data: testResult, isLoading: resultLoading } = useQuery({
    queryKey: ['test-result', testResultId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('practice_test_results')
        .select('*')
        .eq('id', testResultId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch the attempts for this test
  const { data: attempts, isLoading: attemptsLoading } = useQuery({
    queryKey: ['test-attempts', testResultId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('question_attempts')
        .select('*')
        .eq('test_result_id', testResultId)
        .order('attempted_at', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  if (resultLoading || attemptsLoading || !allQuestions) {
    return (
      <PageContainer
        width="narrow"
        sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <CircularProgress size={32} role="status" aria-label="Loading results" />
      </PageContainer>
    );
  }

  if (!testResult || !attempts) {
    return (
      <PageContainer
        width="narrow"
        sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <Box sx={{ textAlign: "center" }}>
          <Typography sx={{ color: "error.main", mb: 2 }}>Test result not found</Typography>
          <Button variant="contained" onClick={onBack}>
            Go Back
          </Button>
        </Box>
      </PageContainer>
    );
  }

  // Build questions array from attempts
  const questionsMap = new Map(allQuestions.map(q => [q.id, q]));
  const questions: Question[] = attempts
    .map(a => questionsMap.get(a.question_id))
    .filter((q): q is Question => q !== undefined);

  // Build answers record from attempts
  const answers: Record<string, 'A' | 'B' | 'C' | 'D'> = {};
  attempts.forEach(a => {
    answers[a.question_id] = indexToAnswer[a.selected_answer] || 'A';
  });

  const correctCount = testResult.score;
  const totalQuestions = testResult.total_questions;
  const percentage = Number(testResult.percentage);
  const passed = testResult.passed;
  const completedAt = new Date(testResult.completed_at);

  if (reviewIndex !== null && questions[reviewIndex]) {
    const question = questions[reviewIndex];
    return (
      <PageContainer width="standard">
        <AnswerReviewDetail
          question={question}
          selectedAnswer={answers[question.id] || null}
          index={reviewIndex}
          total={questions.length}
          onBack={() => setReviewIndex(null)}
          onPrev={() => setReviewIndex(Math.max(0, reviewIndex - 1))}
          onNext={() => setReviewIndex(Math.min(questions.length - 1, reviewIndex + 1))}
          enableGlossaryHighlight
          onTopicClick={navigateToTopic}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      width="narrow"
      radioWaveBg
      sx={{ display: "flex", flexDirection: "column", height: "100%" }}
      contentSx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}
    >
      <ScoreBanner
        passed={passed}
        correctCount={correctCount}
        totalQuestions={totalQuestions}
        percentage={percentage}
        size="compact"
        meta={
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 1, color: "text.secondary", mb: 2 }}
          >
            <Icon icon={Calendar} size={16} />
            <Box component="span" sx={{ fontSize: "0.875rem" }}>
              {completedAt.toLocaleDateString()} at{" "}
              {completedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </Box>
          </Box>
        }
      />

      <MotionBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}
      >
        <Paper
          variant="outlined"
          sx={{
            borderRadius: 1,
            p: 3,
            display: "flex",
            flexDirection: "column",
            flex: 1,
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          <Typography
            component="h2"
            sx={{
              fontSize: "1.25rem",
              fontFamily: "monospace",
              fontWeight: 700,
              mb: 2,
              flexShrink: 0,
            }}
          >
            Review Your Answers
          </Typography>
          <AnswerReviewList
            questions={questions}
            answers={answers}
            onSelect={setReviewIndex}
            scrollable
          />
        </Paper>
      </MotionBox>
    </PageContainer>
  );
}
