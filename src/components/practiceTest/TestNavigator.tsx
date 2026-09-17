import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import { ArrowLeft, ArrowRight, CheckCircle } from "lucide-react";
import { MotionBox } from "@/components/ohp/MotionBox";
import type { Question } from "@/hooks/useQuestions";

interface TestNavigatorProps {
  questions: Question[];
  answers: Record<string, string>;
  currentIndex: number;
  onGoTo: (index: number) => void;
  onPrevious: () => void;
  onNext: () => void;
  onFinish: () => void;
}

/**
 * Previous / Next / Finish, with the numbered jump-to grid between them.
 *
 * Unlike the drill modes this is index-driven with no session history, so it
 * does not use QuizNavControls. The grid is hidden below md (768px, the
 * theme's Tailwind-aligned value), where 35 to 50 tiles would not fit; each
 * tile's name says whether it is answered and current so the colour is not
 * the only signal.
 */
export function TestNavigator({
  questions,
  answers,
  currentIndex,
  onGoTo,
  onPrevious,
  onNext,
  onFinish,
}: TestNavigatorProps) {
  const answeredCount = Object.keys(answers).length;
  const onLast = currentIndex === questions.length - 1;
  const unanswered = questions.length - answeredCount;

  return (
    <Box sx={{ mt: 5 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
        <Button
          variant="outlined"
          onClick={onPrevious}
          disabled={currentIndex === 0}
          startIcon={<Box component={ArrowLeft} aria-hidden="true" sx={{ width: 16, height: 16 }} />}
        >
          Previous
        </Button>

        <Box
          component="nav"
          aria-label="Question navigator"
          sx={{
            display: { xs: "none", md: "flex" },
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 0.5,
            maxWidth: 448,
          }}
        >
          {questions.map((q, idx) => {
            const answered = Boolean(answers[q.id]);
            const current = idx === currentIndex;
            return (
              <ButtonBase
                key={q.id}
                onClick={() => onGoTo(idx)}
                aria-label={`Question ${idx + 1}${answered ? ", answered" : ", unanswered"}${current ? ", current" : ""}`}
                aria-current={current ? "step" : undefined}
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: "4px",
                  fontSize: "0.75rem",
                  fontFamily: "monospace",
                  transition: "background-color 150ms, color 150ms",
                  ...(current
                    ? { bgcolor: "primary.main", color: "primary.contrastText" }
                    : answered
                      ? { bgcolor: "secondary.main", color: "secondary.contrastText" }
                      : {
                          bgcolor: "muted",
                          color: "text.secondary",
                          "&:hover": { bgcolor: "secondary.main" },
                        }),
                }}
              >
                {idx + 1}
              </ButtonBase>
            );
          })}
        </Box>

        {onLast ? (
          <Button
            variant="contained"
            color={answeredCount === questions.length ? "primary" : "secondary"}
            onClick={onFinish}
            startIcon={<Box component={CheckCircle} aria-hidden="true" sx={{ width: 16, height: 16 }} />}
          >
            Finish Test
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={onNext}
            endIcon={<Box component={ArrowRight} aria-hidden="true" sx={{ width: 16, height: 16 }} />}
          >
            Next
          </Button>
        )}
      </Box>

      {onLast && unanswered > 0 && (
        <MotionBox
          component="p"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          sx={{ textAlign: "center", color: "text.secondary", fontSize: "0.875rem", mt: 2 }}
        >
          You have {unanswered} unanswered question(s). You can still submit, but unanswered
          questions will be marked incorrect.
        </MotionBox>
      )}
    </Box>
  );
}
