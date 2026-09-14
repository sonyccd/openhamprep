import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import LinearProgress from "@mui/material/LinearProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { MotionBox } from "@/components/ohp/MotionBox";
import { FigureImage } from "@/components/FigureImage";
import { TopicQuizOptions, type AnswerLetter } from "@/components/question/TopicQuizOptions";
import { tokenAlpha } from "@/theme/muiTheme";
import type { Question } from "@/hooks/useQuestions";

interface TopicQuizQuestionProps {
  question: Question;
  questionCount: number;
  currentIndex: number;
  answeredCount: number;
  selectedAnswer: AnswerLetter | undefined;
  allAnswered: boolean;
  isSubmitting: boolean;
  submitError: string | null;
  onSelectAnswer: (answer: AnswerLetter) => void;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

export function TopicQuizQuestion({
  question,
  questionCount,
  currentIndex,
  answeredCount,
  selectedAnswer,
  allAnswered,
  isSubmitting,
  submitError,
  onSelectAnswer,
  onPrevious,
  onNext,
  onSubmit,
}: TopicQuizQuestionProps) {
  const progress = (answeredCount / questionCount) * 100;

  return (
    <Stack spacing={3}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Chip
          label={`${currentIndex + 1} / ${questionCount}`}
          size="small"
          sx={{ fontFamily: "monospace", fontWeight: 600 }}
        />
        <Typography sx={{ fontSize: "0.875rem", color: "text.secondary" }}>
          {answeredCount} answered
        </Typography>
      </Box>

      <LinearProgress
        variant="determinate"
        value={progress}
        aria-label="Quiz progress"
        sx={{ height: 6, borderRadius: "9999px" }}
      />

      <AnimatePresence mode="wait">
        <MotionBox
          key={question.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          sx={{ display: "flex", flexDirection: "column", gap: 3 }}
        >
          <Typography
            component="span"
            sx={{
              fontFamily: "monospace",
              fontSize: "0.75rem",
              letterSpacing: "0.025em",
              color: (t) => tokenAlpha(t.vars.palette.text.secondary, 80),
            }}
          >
            {question.displayName}
          </Typography>

          <Typography
            component="h3"
            sx={{
              fontSize: "1.125rem",
              fontWeight: 500,
              color: "text.primary",
              lineHeight: 1.625,
            }}
          >
            {question.question}
          </Typography>

          <FigureImage figureUrl={question.figureUrl} questionId={question.id} />

          <TopicQuizOptions
            question={question}
            selectedAnswer={selectedAnswer}
            onSelectAnswer={onSelectAnswer}
          />
        </MotionBox>
      </AnimatePresence>

      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pt: 2 }}>
        <Button
          variant="outlined"
          onClick={onPrevious}
          disabled={currentIndex === 0}
          startIcon={<Box component={ChevronLeft} sx={{ width: 16, height: 16 }} />}
          aria-label={`Go to previous question (${currentIndex} of ${questionCount})`}
        >
          Previous
        </Button>

        {currentIndex < questionCount - 1 ? (
          <Button
            variant="contained"
            onClick={onNext}
            endIcon={<Box component={ChevronRight} sx={{ width: 16, height: 16 }} />}
            aria-label={`Go to next question (${currentIndex + 2} of ${questionCount})`}
          >
            Next
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={onSubmit}
            disabled={!allAnswered || isSubmitting}
            endIcon={
              isSubmitting ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <Box component={CheckCircle2} sx={{ width: 16, height: 16 }} />
              )
            }
            aria-label={`Submit quiz with ${answeredCount} of ${questionCount} questions answered`}
          >
            {isSubmitting ? "Submitting" : "Submit Quiz"}
          </Button>
        )}
      </Box>

      {submitError && (
        <Box
          sx={{
            p: 1.5,
            borderRadius: "8px",
            bgcolor: (t) => tokenAlpha(t.vars.palette.error.main, 10),
            border: "1px solid",
            borderColor: (t) => tokenAlpha(t.vars.palette.error.main, 20),
            color: "error.main",
            fontSize: "0.875rem",
          }}
        >
          {submitError}
        </Box>
      )}
    </Stack>
  );
}
