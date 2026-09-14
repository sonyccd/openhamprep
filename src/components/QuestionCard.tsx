import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { MotionBox } from "@/components/ohp/MotionBox";
import { AnswerOptions } from "@/components/question/AnswerOptions";
import { QuestionCardActions } from "@/components/question/QuestionCardActions";
import { QuestionExplanation } from "@/components/question/QuestionExplanation";
import { GlossaryHighlightedText } from "@/components/GlossaryHighlightedText";
import { FigureImage } from "@/components/FigureImage";
import { tokenAlpha } from "@/theme/muiTheme";
import type { Question, AnswerLetter } from "@/hooks/useQuestions";

interface QuestionCardProps {
  question: Question;
  selectedAnswer: string | null;
  onSelectAnswer: (answer: AnswerLetter) => void;
  showResult?: boolean;
  enableGlossaryHighlight?: boolean; // Enable glossary term highlighting (disabled during practice tests)
  hideLinks?: boolean; // Hide links during active practice test (show only on review)
  onTopicClick?: (slug: string) => void; // Navigate to topic when clicked
}

/**
 * One question: its text, its figure, the four options, and — once answered —
 * the verdict and the explanation.
 *
 * The card is the frame only. The three parts that carry their own state or
 * their own data hooks live in components/question/: the floating action
 * cluster, the radiogroup, and the explanation block.
 */
export function QuestionCard({
  question,
  selectedAnswer,
  onSelectAnswer,
  showResult = false,
  hideLinks = false,
  enableGlossaryHighlight = false,
  onTopicClick,
}: QuestionCardProps) {
  const isCorrect = selectedAnswer === question.correctAnswer;
  const showExplanation =
    showResult &&
    !hideLinks &&
    (question.explanation || (question.links && question.links.length > 0));

  return (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      sx={{ width: "100%", maxWidth: 768, mx: "auto" }} // max-w-3xl
    >
      <Box
        sx={{
          position: "relative",
          bgcolor: "background.paper",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: "16px", // rounded-2xl; not a multiple of shape.borderRadius
          p: { xs: 4, md: 5, lg: 6 }, // p-8 md:p-10 lg:p-12
          // Tailwind's shadow-lg, kept verbatim rather than mapped to an MUI
          // elevation — none of the 25 match it, and Gate 1 is no visual change.
          boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
        }}
      >
        <Box
          sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 4 }}
        >
          <Typography
            component="span"
            sx={{
              fontFamily: "monospace",
              fontSize: "0.875rem",
              letterSpacing: "0.025em", // tracking-wide
              color: (t) => tokenAlpha(t.vars.palette.text.secondary, 80),
            }}
          >
            {question.displayName}
          </Typography>
        </Box>

        <QuestionCardActions question={question} />

        <Box sx={{ minHeight: "5rem", mb: 5 }}>
          <Typography
            component="h2"
            sx={{
              fontSize: { xs: "1.125rem", md: "1.25rem", lg: "1.5rem" },
              fontWeight: 500,
              color: "text.primary",
              lineHeight: 1.625, // leading-relaxed
              letterSpacing: "-0.025em", // tracking-tight
            }}
          >
            {enableGlossaryHighlight ? (
              <GlossaryHighlightedText text={question.question} />
            ) : (
              question.question
            )}
          </Typography>
        </Box>

        <FigureImage figureUrl={question.figureUrl} questionId={question.id} />

        <AnswerOptions
          question={question}
          selectedAnswer={selectedAnswer}
          onSelectAnswer={onSelectAnswer}
          showResult={showResult}
        />

        {showResult && (
          <MotionBox
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            sx={{ mt: 4, display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 1,
                px: 2.5,
                py: 1.25,
                borderRadius: "9999px",
                fontSize: "0.875rem",
                fontWeight: 500,
                color: isCorrect ? "success.main" : "error.main",
                bgcolor: (t) =>
                  tokenAlpha(
                    isCorrect ? t.vars.palette.success.main : t.vars.palette.error.main,
                    10
                  ),
              }}
            >
              {isCorrect ? (
                <span>Correct</span>
              ) : (
                <span>
                  The answer is {question.correctAnswer}:{" "}
                  {question.options[question.correctAnswer]}
                </span>
              )}
            </Box>
          </MotionBox>
        )}

        {showExplanation && (
          <QuestionExplanation
            question={question}
            selectedAnswer={selectedAnswer}
            onTopicClick={onTopicClick}
          />
        )}
      </Box>
    </MotionBox>
  );
}
