import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { tokenAlpha } from "@/theme/muiTheme";
import type { Question } from "@/hooks/useQuestions";

const OPTIONS = ["A", "B", "C", "D"] as const;
type AnswerLetter = (typeof OPTIONS)[number];

interface TopicQuizReviewProps {
  incorrectQuestions: Question[];
  answers: Record<string, AnswerLetter>;
}

/** The questions got wrong, with the right answer beside what was picked. */
export function TopicQuizReview({ incorrectQuestions, answers }: TopicQuizReviewProps) {
  const reviewOptionSx = (question: Question, option: AnswerLetter) => {
    const isCorrect = option === question.correctAnswer;
    const isUserAnswer = option === answers[question.id];

    if (isCorrect) {
      return {
        borderColor: "success.main",
        bgcolor: (t) => tokenAlpha(t.vars.palette.success.main, 10),
        color: "success.main",
      };
    }
    if (isUserAnswer) {
      return {
        borderColor: "error.main",
        bgcolor: (t) => tokenAlpha(t.vars.palette.error.main, 10),
        color: "error.main",
      };
    }
    return { borderColor: "divider", opacity: 0.5 };
  };

  return (
    <Stack spacing={2}>
      <Typography
        component="h4"
        sx={{ fontSize: "0.875rem", fontWeight: 500, color: "text.secondary" }}
      >
        Review incorrect answers:
      </Typography>
      <Stack spacing={2} sx={{ maxHeight: 256, overflowY: "auto", pr: 1 }}>
        {incorrectQuestions.map((question) => (
          <Stack
            key={question.id}
            spacing={1.5}
            sx={{
              p: 2,
              borderRadius: 1, // rounded-xl, and shape.borderRadius is 12
              bgcolor: (t) => tokenAlpha(t.vars.palette.muted, 30),
            }}
          >
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
              <Chip
                label={question.displayName}
                size="small"
                variant="outlined"
                sx={{ fontFamily: "monospace", flexShrink: 0 }}
              />
              <Typography
                component="p"
                sx={{ fontSize: "0.875rem", color: "text.primary", lineHeight: 1.625 }}
              >
                {question.question}
              </Typography>
            </Box>
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 1 }}>
              {OPTIONS.map((option) => (
                <Box
                  key={option}
                  sx={{
                    p: 1,
                    borderRadius: "8px", // rounded-lg
                    border: "1px solid",
                    fontSize: "0.75rem",
                    ...reviewOptionSx(question, option),
                  }}
                >
                  <Box component="span" sx={{ fontFamily: "monospace", fontWeight: 600, mr: 0.75 }}>
                    {option}:
                  </Box>
                  <Box
                    component="span"
                    sx={{
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {question.options[option]}
                  </Box>
                </Box>
              ))}
            </Box>
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
}
