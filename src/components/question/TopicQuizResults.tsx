import { Icon } from "@/components/ohp/Icon";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Trophy, XCircle, RotateCcw } from "lucide-react";
import { MotionBox } from "@/components/ohp/MotionBox";
import { TopicQuizReview } from "@/components/question/TopicQuizReview";
import { tokenAlpha } from "@/theme/muiTheme";
import type { Question, AnswerLetter } from "@/hooks/useQuestions";


interface TopicQuizResultsProps {
  questionCount: number;
  passingThreshold: number;
  answers: Record<string, AnswerLetter>;
  results: {
    correctCount: number;
    percentage: number;
    passed: boolean;
    incorrectQuestions: Question[];
  };
  onRetry: () => void;
  onDone: () => void;
}

export function TopicQuizResults({
  questionCount,
  passingThreshold,
  answers,
  results,
  onRetry,
  onDone,
}: TopicQuizResultsProps) {
  const verdict = results.passed ? "success" : "error";

  return (
    <Stack spacing={3}>
      <MotionBox
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        sx={{ textAlign: "center", py: 3 }}
      >
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 64,
            height: 64,
            borderRadius: "50%",
            mb: 2,
            bgcolor: (t) => tokenAlpha(t.vars.palette[verdict].main, 10),
          }}
        >
          <Icon icon={results.passed ? Trophy : XCircle} size={32} sx={{ color: `${verdict}.main` }} />
        </Box>

        <Typography
          component="h3"
          sx={{ fontSize: "1.5rem", fontWeight: 700, color: "text.primary", mb: 1 }}
        >
          {results.passed ? "Congratulations!" : "Keep Practicing"}
        </Typography>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 1,
            fontSize: "1.125rem",
          }}
        >
          <Box component="span" sx={{ fontWeight: 700, color: `${verdict}.main` }}>
            {results.correctCount}/{questionCount}
          </Box>
          <Box component="span" sx={{ color: "text.secondary" }}>
            ({results.percentage}%)
          </Box>
        </Box>

        <Typography sx={{ fontSize: "0.875rem", color: "text.secondary", mt: 1 }}>
          {results.passed
            ? "You've mastered this topic!"
            : `Score ${Math.ceil(passingThreshold * 100)}% or higher to complete this topic.`}
        </Typography>
      </MotionBox>

      {results.incorrectQuestions.length > 0 && (
        <TopicQuizReview
          incorrectQuestions={results.incorrectQuestions}
          answers={answers}
        />
      )}

      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1.5, pt: 2 }}>
        <Button
          variant="outlined"
          onClick={onRetry}
          startIcon={<Icon icon={RotateCcw} size={16} />}
        >
          Try Again
        </Button>
        <Button variant="contained" onClick={onDone}>
          Done
        </Button>
      </Box>
    </Stack>
  );
}
