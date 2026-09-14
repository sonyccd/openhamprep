import Box from "@mui/material/Box";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import { visuallyHidden } from "@mui/utils";
import { tokenAlpha } from "@/theme/muiTheme";
import type { Question } from "@/hooks/useQuestions";

const OPTIONS = ["A", "B", "C", "D"] as const;
export type AnswerLetter = (typeof OPTIONS)[number];

interface AnswerOptionsProps {
  question: Question;
  selectedAnswer: string | null;
  onSelectAnswer: (answer: AnswerLetter) => void;
  showResult: boolean;
}

/**
 * A real radiogroup of native <input type="radio">, per #274.
 *
 * These were four independent <button>s with aria-pressed, which describes four
 * toggles rather than one choice among four — and gave four tab stops with no
 * arrow-key movement.
 *
 * The inputs are visually hidden rather than shown, which is option 2 in #274:
 * the platform supplies arrow keys, a single tab stop landing on the checked
 * option, and grouping by name, while the row keeps exactly the appearance it
 * had. The circled letter stays the visible selection indicator, so no radio dot
 * competes with it.
 *
 * Focus has to be drawn on the row instead, since the input carrying it is
 * invisible — hence :focus-within.
 */
export function AnswerOptions({
  question,
  selectedAnswer,
  onSelectAnswer,
  showResult,
}: AnswerOptionsProps) {
  /** The row's border, fill and text for each of the four states. */
  const getOptionSx = (option: AnswerLetter) => {
    if (!showResult) {
      return selectedAnswer === option
        ? {
            borderColor: "primary.main",
            bgcolor: (t) => tokenAlpha(t.vars.palette.primary.main, 10),
          }
        : {
            borderColor: "divider",
            "&:hover": {
              borderColor: (t) => tokenAlpha(t.vars.palette.primary.main, 50),
              bgcolor: (t) => tokenAlpha(t.vars.palette.secondary.main, 50),
            },
          };
    }

    if (option === question.correctAnswer) {
      return {
        borderColor: "success.main",
        bgcolor: (t) => tokenAlpha(t.vars.palette.success.main, 10),
        color: "success.main",
      };
    }

    if (selectedAnswer === option && option !== question.correctAnswer) {
      return {
        borderColor: "error.main",
        bgcolor: (t) => tokenAlpha(t.vars.palette.error.main, 10),
        color: "error.main",
      };
    }

    return { borderColor: "divider", opacity: 0.5 };
  };

  /** The circled letter, which doubles as the selection indicator. */
  const getBadgeSx = (option: AnswerLetter) => {
    if (selectedAnswer === option && !showResult) {
      return { bgcolor: "primary.main", color: "primary.contrastText" };
    }
    if (showResult && option === question.correctAnswer) {
      return { bgcolor: "success.main", color: "success.contrastText" };
    }
    if (showResult && selectedAnswer === option && option !== question.correctAnswer) {
      return { bgcolor: "error.main", color: "error.contrastText" };
    }
    return { bgcolor: "secondary.main", color: "secondary.contrastText" };
  };

  return (
    <RadioGroup
      name={`question-${question.id}`}
      aria-label="Answer options"
      value={selectedAnswer ?? ""}
      onChange={(event) => onSelectAnswer(event.target.value as AnswerLetter)}
      // space-y-4
      sx={{ gap: 2 }}
    >
      {OPTIONS.map((option) => (
        <FormControlLabel
          key={option}
          value={option}
          disabled={showResult}
          control={<Radio sx={visuallyHidden} />}
          sx={{
            m: 0,
            p: 2.5, // p-5
            // rounded-xl is 12px, and sx multiplies this by shape.borderRadius,
            // which is also 12. So 1, not 3 — 3 emits calc(3 * 12px) and rounds
            // the rows three times as hard as the design.
            borderRadius: 1,
            border: "1px solid",
            alignItems: "flex-start",
            transition: "all 200ms",
            cursor: showResult ? "default" : "pointer",
            "&:focus-within": {
              outline: "2px solid",
              outlineColor: "primary.main",
              outlineOffset: 2,
            },
            "&.Mui-disabled": { cursor: "default" },
            ...getOptionSx(option),
          }}
          label={
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, width: "100%" }}>
              <Box
                component="span"
                sx={{
                  flexShrink: 0,
                  width: 36, // w-9
                  height: 36, // h-9
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "monospace",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  ...getBadgeSx(option),
                }}
              >
                {option}
              </Box>
              <Box component="span" sx={{ flex: 1, pt: 0.75, lineHeight: 1.6 }}>
                {question.options[option]}
              </Box>
            </Box>
          }
        />
      ))}
    </RadioGroup>
  );
}
