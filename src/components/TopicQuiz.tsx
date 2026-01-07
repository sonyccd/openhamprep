import { useState, useMemo } from "react";
import { Question } from "@/hooks/useQuestions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Trophy,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { TOPIC_QUIZ_PASSING_THRESHOLD } from "@/types/navigation";

interface TopicQuizProps {
  questions: Question[];
  onComplete: (passed: boolean, score: number, totalQuestions: number) => void;
  onDone: () => void;
  onSaveAttempt?: (question: Question, selectedAnswer: "A" | "B" | "C" | "D") => void | Promise<void>;
  passingThreshold?: number;
}

type QuizMode = "quiz" | "results";

export function TopicQuiz({
  questions,
  onComplete,
  onDone,
  onSaveAttempt,
  passingThreshold = TOPIC_QUIZ_PASSING_THRESHOLD,
}: TopicQuizProps) {
  const [mode, setMode] = useState<QuizMode>("quiz");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, "A" | "B" | "C" | "D">>(
    {}
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const options = ["A", "B", "C", "D"] as const;
  const currentQuestion = questions[currentIndex];
  const selectedAnswer = answers[currentQuestion?.id];
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === questions.length;
  const progress = (answeredCount / questions.length) * 100;

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

  const handleSelectAnswer = (answer: (typeof options)[number]) => {
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
    try {
      // Save all question attempts before showing results
      if (onSaveAttempt) {
        // Fire all saves in parallel and wait for completion
        await Promise.all(
          questions
            .filter((q) => answers[q.id])
            .map((q) => onSaveAttempt(q, answers[q.id]))
        );
      }
      setMode("results");
      onComplete(results.passed, results.correctCount, questions.length);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    setMode("quiz");
    setCurrentIndex(0);
    setAnswers({});
  };

  const getOptionStyles = (option: (typeof options)[number]) => {
    const isSelected = selectedAnswer === option;
    return isSelected
      ? "border-primary bg-primary/10 text-foreground ring-2 ring-primary/20"
      : "border-border hover:border-primary/50 hover:bg-secondary/50";
  };

  const getResultOptionStyles = (
    question: Question,
    option: (typeof options)[number]
  ) => {
    const userAnswer = answers[question.id];
    const isCorrect = option === question.correctAnswer;
    const isUserAnswer = option === userAnswer;

    if (isCorrect) {
      return "border-success bg-success/10 text-success";
    }
    if (isUserAnswer && !isCorrect) {
      return "border-destructive bg-destructive/10 text-destructive";
    }
    return "border-border opacity-50";
  };

  // Quiz Mode
  if (mode === "quiz") {
    return (
      <div className="space-y-6">
        {/* Header with progress */}
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="font-mono">
            {currentIndex + 1} / {questions.length}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {answeredCount} answered
          </span>
        </div>

        {/* Progress bar */}
        <Progress value={progress} className="h-1.5" />

        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Question ID */}
            <span className="font-mono text-xs text-muted-foreground/80 tracking-wide">
              {currentQuestion.displayName}
            </span>

            {/* Question text */}
            <h3 className="text-lg font-medium text-foreground leading-relaxed">
              {currentQuestion.question}
            </h3>

            {/* Options */}
            <div className="space-y-3">
              {options.map((option) => (
                <button
                  key={option}
                  onClick={() => handleSelectAnswer(option)}
                  className={cn(
                    "w-full text-left p-4 rounded-xl border transition-all duration-200",
                    "flex items-start gap-3",
                    getOptionStyles(option)
                  )}
                >
                  <span
                    className={cn(
                      "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-mono font-semibold text-sm",
                      selectedAnswer === option
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    )}
                  >
                    {option}
                  </span>
                  <span className="flex-1 pt-1 text-sm leading-relaxed">
                    {currentQuestion.options[option]}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="gap-2"
            aria-label={`Go to previous question (${currentIndex} of ${questions.length})`}
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>

          <div className="flex gap-2">
            {currentIndex < questions.length - 1 ? (
              <Button
                onClick={handleNext}
                className="gap-2"
                aria-label={`Go to next question (${currentIndex + 2} of ${questions.length})`}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!allAnswered || isSubmitting}
                className="gap-2"
                aria-label={`Submit quiz with ${answeredCount} of ${questions.length} questions answered`}
              >
                {isSubmitting ? (
                  <>
                    Submitting
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </>
                ) : (
                  <>
                    Submit Quiz
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

      </div>
    );
  }

  // Results Mode
  return (
    <div className="space-y-6">
      {/* Results header */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-6"
      >
        <div
          className={cn(
            "inline-flex items-center justify-center w-16 h-16 rounded-full mb-4",
            results.passed ? "bg-success/10" : "bg-destructive/10"
          )}
        >
          {results.passed ? (
            <Trophy className="w-8 h-8 text-success" />
          ) : (
            <XCircle className="w-8 h-8 text-destructive" />
          )}
        </div>

        <h3 className="text-2xl font-bold text-foreground mb-2">
          {results.passed ? "Congratulations!" : "Keep Practicing"}
        </h3>

        <div className="flex items-center justify-center gap-2 text-lg">
          <span
            className={cn(
              "font-bold",
              results.passed ? "text-success" : "text-destructive"
            )}
          >
            {results.correctCount}/{questions.length}
          </span>
          <span className="text-muted-foreground">
            ({results.percentage}%)
          </span>
        </div>

        <p className="text-sm text-muted-foreground mt-2">
          {results.passed
            ? "You've mastered this topic!"
            : `Score ${Math.ceil(passingThreshold * 100)}% or higher to complete this topic.`}
        </p>
      </motion.div>

      {/* Incorrect answers review */}
      {results.incorrectQuestions.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground">
            Review incorrect answers:
          </h4>
          <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
            {results.incorrectQuestions.map((question) => (
              <div
                key={question.id}
                className="p-4 rounded-xl bg-muted/30 space-y-3"
              >
                <div className="flex items-start gap-2">
                  <Badge variant="outline" className="font-mono shrink-0">
                    {question.displayName}
                  </Badge>
                  <p className="text-sm text-foreground leading-relaxed">
                    {question.question}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {options.map((option) => (
                    <div
                      key={option}
                      className={cn(
                        "p-2 rounded-lg border text-xs",
                        getResultOptionStyles(question, option)
                      )}
                    >
                      <span className="font-mono font-semibold mr-1.5">
                        {option}:
                      </span>
                      <span className="line-clamp-2">
                        {question.options[option]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-center gap-3 pt-4">
        <Button variant="outline" onClick={handleRetry} className="gap-2">
          <RotateCcw className="w-4 h-4" />
          Try Again
        </Button>
        <Button onClick={onDone}>Done</Button>
      </div>
    </div>
  );
}
