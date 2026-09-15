import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import confetti from "canvas-confetti";
import { RotateCcw, Home } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { MotionBox } from "@/components/ohp/MotionBox";
import { PageContainer } from "@/components/ohp/PageContainer";
import { AnswerReviewDetail } from "@/components/results/AnswerReviewDetail";
import { AnswerReviewList } from "@/components/results/AnswerReviewList";
import { ScoreBanner } from "@/components/results/ScoreBanner";
import { TestType, testConfig } from "@/types/navigation";
import type { AnswerLetter, Question } from "@/hooks/useQuestions";

interface TestResultsProps {
  questions: Question[];
  answers: Record<string, AnswerLetter>;
  onRetake: () => void;
  onBack: () => void;
  testType?: TestType;
}

export function TestResults({ questions, answers, onRetake, onBack, testType = 'technician' }: TestResultsProps) {
  const { user } = useAuth();
  const [reviewIndex, setReviewIndex] = useState<number | null>(null);
  const [saveCardDismissed, setSaveCardDismissed] = useState(false);

  const { questionCount, passingScore } = testConfig[testType];
  const correctCount = questions.filter(
    (q) => answers[q.id] === q.correctAnswer
  ).length;
  const passed = correctCount >= passingScore;

  // Fire confetti once when user passes (respects reduced motion preference)
  const hasTriggeredConfetti = useRef(false);
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let timer: ReturnType<typeof setTimeout> | undefined;

    if (passed && !hasTriggeredConfetti.current && !prefersReducedMotion) {
      // Small delay to let the success banner animate in first
      timer = setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }, 200);
      hasTriggeredConfetti.current = true;
    }

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [passed]);

  const totalQuestions = questions.length;
  const percentage = Math.round((correctCount / totalQuestions) * 100);

  if (reviewIndex !== null) {
    const question = questions[reviewIndex];
    return (
      <PageContainer width="standard" mobileNavPadding>
        <AnswerReviewDetail
          question={question}
          selectedAnswer={answers[question.id] || null}
          index={reviewIndex}
          total={questions.length}
          onBack={() => setReviewIndex(null)}
          onPrev={() => setReviewIndex(Math.max(0, reviewIndex - 1))}
          onNext={() => setReviewIndex(Math.min(questions.length - 1, reviewIndex + 1))}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer width="narrow" mobileNavPadding radioWaveBg>
      <ScoreBanner
        passed={passed}
        correctCount={correctCount}
        totalQuestions={totalQuestions}
        percentage={percentage}
        footnote={
          <Typography sx={{ fontSize: "0.875rem", color: "text.secondary", mt: 2 }}>
            Passing score: {passingScore} out of {questionCount} (74%)
          </Typography>
        }
      >
        <Typography sx={{ fontSize: "1.125rem", color: "text.secondary", mb: 2 }}>
          {passed
            ? "Congratulations! You passed the practice exam."
            : "Keep studying and try again!"}
        </Typography>
      </ScoreBanner>

      {!user && !saveCardDismissed && (
        /*
          A save-moment prompt, so an Alert — but severity="info" with the icon
          off and an outlined surface, which keeps the understated look the
          guest-mode spec asks for. role="status" rather than Alert's default
          "alert": this appears with the results rather than interrupting, and
          it must never read as gating the content behind it.
        */
        <Alert
          severity="info"
          variant="outlined"
          icon={false}
          role="status"
          sx={{ mb: 3, borderColor: "divider", bgcolor: "background.paper" }}
        >
          <Typography sx={{ fontSize: "0.875rem", color: "text.secondary", mb: 1.5 }}>
            Test results require an account to save — there's nowhere to put them without one.
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              component={Link}
              to="/auth?returnTo=/dashboard"
              sx={{
                fontSize: "0.875rem",
                fontWeight: 500,
                color: "primary.main",
                textDecoration: "none",
                "&:hover": { textDecoration: "underline" },
              }}
            >
              Create free account
            </Box>
            <Button
              variant="text"
              size="small"
              onClick={() => setSaveCardDismissed(true)}
              sx={{ fontSize: "0.875rem", color: "text.secondary", minWidth: 0, p: 0 }}
            >
              Continue without saving
            </Button>
          </Box>
        </Alert>
      )}

      <MotionBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
          mb: 4,
        }}
      >
        <Button
          variant="contained"
          onClick={onRetake}
          startIcon={<Box component={RotateCcw} sx={{ width: 16, height: 16 }} />}
          sx={{ flex: 1 }}
        >
          Retake Test
        </Button>
        <Button
          variant="outlined"
          onClick={onBack}
          startIcon={<Box component={Home} sx={{ width: 16, height: 16 }} />}
          sx={{ flex: 1 }}
        >
          Back to Menu
        </Button>
      </MotionBox>

      <MotionBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Paper variant="outlined" sx={{ borderRadius: 1, p: 3 }}>
          <Typography
            component="h2"
            sx={{ fontSize: "1.25rem", fontFamily: "monospace", fontWeight: 700, mb: 2 }}
          >
            Review Your Answers
          </Typography>
          <AnswerReviewList
            questions={questions}
            answers={answers}
            onSelect={setReviewIndex}
          />
        </Paper>
      </MotionBox>
    </PageContainer>
  );
}
