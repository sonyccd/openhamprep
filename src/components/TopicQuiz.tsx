import { useState, useMemo } from "react";
import { TOPIC_QUIZ_PASSING_THRESHOLD } from "@/types/navigation";
import { TopicQuizQuestion } from "@/components/question/TopicQuizQuestion";
import { TopicQuizResults } from "@/components/question/TopicQuizResults";
import type { Question, AnswerLetter } from "@/hooks/useQuestions";


interface TopicQuizProps {
  questions: Question[];
  onComplete: (passed: boolean, score: number, totalQuestions: number) => void | Promise<void>;
  onDone: () => void;
  onSaveAttempts?: (
    attempts: Array<{ question: Question; selectedAnswer: AnswerLetter }>
  ) => Promise<{ success: boolean; error?: string }>;
  passingThreshold?: number;
}

type QuizMode = "quiz" | "results";

/**
 * The topic mastery quiz: answer every question, submit once, see the score.
 *
 * Unlike the drill modes it does not use useQuizSession — there is no draw and
 * no history stack, just a fixed list answered in any order and scored at the
 * end. The two rendered modes live in components/question/.
 */
export function TopicQuiz({
  questions,
  onComplete,
  onDone,
  onSaveAttempts,
  passingThreshold = TOPIC_QUIZ_PASSING_THRESHOLD,
}: TopicQuizProps) {
  const [mode, setMode] = useState<QuizMode>("quiz");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerLetter>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;

  // Calculate results
  const results = useMemo(() => {
    const correctCount = questions.filter(
      (q) => answers[q.id] === q.correctAnswer
    ).length;
    const percentage = Math.round((correctCount / questions.length) * 100);
    const passed = correctCount / questions.length >= passingThreshold;
    const incorrectQuestions = questions.filter(
      (q) => answers[q.id] && answers[q.id] !== q.correctAnswer
    );
    return { correctCount, percentage, passed, incorrectQuestions };
  }, [answers, questions, passingThreshold]);

  const handleSelectAnswer = (answer: AnswerLetter) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: answer,
    }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Save all question attempts before showing results
      if (onSaveAttempts) {
        const attempts = questions
          .filter((q) => answers[q.id])
          .map((q) => ({ question: q, selectedAnswer: answers[q.id] }));

        const saveResult = await onSaveAttempts(attempts);

        if (!saveResult.success) {
          setSubmitError(saveResult.error || 'Failed to save quiz results. Please try again.');
          return; // Don't show results if save failed
        }
      }

      // Only proceed to results and call onComplete if saves succeeded
      setMode("results");
      await onComplete(results.passed, results.correctCount, questions.length);
    } catch (error) {
      console.error('Quiz submission error:', error);
      setSubmitError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    setMode("quiz");
    setCurrentIndex(0);
    setAnswers({});
  };

  if (mode === "quiz") {
    return (
      <TopicQuizQuestion
        question={currentQuestion}
        questionCount={questions.length}
        currentIndex={currentIndex}
        answeredCount={answeredCount}
        selectedAnswer={answers[currentQuestion?.id]}
        allAnswered={answeredCount === questions.length}
        isSubmitting={isSubmitting}
        submitError={submitError}
        onSelectAnswer={handleSelectAnswer}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onSubmit={handleSubmit}
      />
    );
  }

  return (
    <TopicQuizResults
      questionCount={questions.length}
      passingThreshold={passingThreshold}
      answers={answers}
      results={results}
      onRetry={handleRetry}
      onDone={onDone}
    />
  );
}
