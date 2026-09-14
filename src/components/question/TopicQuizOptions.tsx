import Box from "@mui/material/Box";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import { visuallyHidden } from "@mui/utils";
import { tokenAlpha } from "@/theme/muiTheme";
import type { Question, AnswerLetter } from "@/hooks/useQuestions";

const OPTIONS = ["A", "B", "C", "D"] as const;

interface TopicQuizOptionsProps {
  question: Question;
  selectedAnswer: AnswerLetter | undefined;
  onSelectAnswer: (answer: AnswerLetter) => void;
}

/**
 * The topic quiz's answer options, as a native radiogroup (#274).
 *
 * These were four <button>s with aria-pressed, describing four toggles rather
 * than one choice among four, with four tab stops and no arrow keys.
 *
 * Deliberately not shared with QuestionCard's AnswerOptions. The two rows
 * differ in padding, badge size and type scale, and the quiz has no per-option
 * result state — it scores at the end. Folding them together would mean a prop
 * per difference or a visual change. The shared part is five lines of
 * structure; the styling is what is actually specific.
 */
export function TopicQuizOptions({
  question,
  selectedAnswer,
  onSelectAnswer,
}: TopicQuizOptionsProps) {
  const optionSx = (option: AnswerLetter) =>
    selectedAnswer === option
      ? {
          borderColor: "primary.main",
          bgcolor: (t) => tokenAlpha(t.vars.palette.primary.main, 10),
          color: "text.primary",
          // ring-2 ring-primary/20
          boxShadow: (t) => `0 0 0 2px ${tokenAlpha(t.vars.palette.primary.main, 20)}`,
        }
      : {
          borderColor: "divider",
          "&:hover": {
            borderColor: (t) => tokenAlpha(t.vars.palette.primary.main, 50),
            bgcolor: (t) => tokenAlpha(t.vars.palette.secondary.main, 50),
          },
        };

  return (
    <RadioGroup
      name={`topic-quiz-${question.id}`}
      aria-label="Answer options"
      value={selectedAnswer ?? ""}
      onChange={(event) => onSelectAnswer(event.target.value as AnswerLetter)}
      sx={{ gap: 1.5 }} // space-y-3
    >
      {OPTIONS.map((option) => (
        <FormControlLabel
          key={option}
          value={option}
          control={<Radio sx={visuallyHidden} />}
          sx={{
            m: 0,
            p: 2, // p-4
            borderRadius: 1, // rounded-xl, and shape.borderRadius is 12
            border: "1px solid",
            alignItems: "flex-start",
            transition: "all 200ms",
            "&:focus-within": {
              outline: "2px solid",
              outlineColor: "primary.main",
              outlineOffset: 2,
            },
            ...optionSx(option),
          }}
          label={
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, width: "100%" }}>
              <Box
                component="span"
                sx={{
                  flexShrink: 0,
                  width: 32, // w-8
                  height: 32,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "monospace",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  ...(selectedAnswer === option
                    ? { bgcolor: "primary.main", color: "primary.contrastText" }
                    : { bgcolor: "secondary.main", color: "secondary.contrastText" }),
                }}
              >
                {option}
              </Box>
              <Box
                component="span"
                sx={{ flex: 1, pt: 0.5, fontSize: "0.875rem", lineHeight: 1.625 }}
              >
                {question.options[option]}
              </Box>
            </Box>
          }
        />
      ))}
    </RadioGroup>
  );
}
