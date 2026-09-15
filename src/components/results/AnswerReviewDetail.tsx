import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { QuestionCard } from "@/components/QuestionCard";
import type { AnswerLetter, Question } from "@/hooks/useQuestions";

interface AnswerReviewDetailProps {
  question: Question;
  selectedAnswer: AnswerLetter | null;
  index: number;
  total: number;
  onBack: () => void;
  onPrev: () => void;
  onNext: () => void;
  /** TestResultReview highlights glossary terms; TestResults does not. */
  enableGlossaryHighlight?: boolean;
  onTopicClick?: (slug: string) => void;
}

/**
 * One answered question, reviewed after the fact.
 *
 * Shared by TestResults and TestResultReview, which had byte-identical copies
 * of this apart from the glossary flag.
 */
export function AnswerReviewDetail({
  question,
  selectedAnswer,
  index,
  total,
  onBack,
  onPrev,
  onNext,
  enableGlossaryHighlight = false,
  onTopicClick,
}: AnswerReviewDetailProps) {
  return (
    <>
      <Box sx={{ mb: 4 }}>
        <Button
          variant="text"
          onClick={onBack}
          startIcon={<Box component={ArrowLeft} sx={{ width: 16, height: 16 }} />}
          sx={{ color: "text.primary" }}
        >
          Back to Results
        </Button>
      </Box>

      <QuestionCard
        question={question}
        selectedAnswer={selectedAnswer}
        // Review is read-only: the answer is already recorded.
        onSelectAnswer={() => {}}
        showResult
        enableGlossaryHighlight={enableGlossaryHighlight}
        onTopicClick={onTopicClick}
      />

      <Box sx={{ mt: 4, display: "flex", justifyContent: "space-between" }}>
        <Button
          variant="outlined"
          onClick={onPrev}
          disabled={index === 0}
          startIcon={<Box component={ArrowLeft} sx={{ width: 16, height: 16 }} />}
        >
          Previous
        </Button>
        <Button
          variant="outlined"
          onClick={onNext}
          disabled={index === total - 1}
          endIcon={<Box component={ArrowRight} sx={{ width: 16, height: 16 }} />}
        >
          Next
        </Button>
      </Box>
    </>
  );
}
