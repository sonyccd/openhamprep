import { Question } from "@/data/questionPool";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface QuestionCardProps {
  question: Question;
  selectedAnswer: string | null;
  onSelectAnswer: (answer: 'A' | 'B' | 'C' | 'D') => void;
  showResult?: boolean;
  questionNumber?: number;
  totalQuestions?: number;
}

export function QuestionCard({
  question,
  selectedAnswer,
  onSelectAnswer,
  showResult = false,
  questionNumber,
  totalQuestions,
}: QuestionCardProps) {
  const options = ['A', 'B', 'C', 'D'] as const;

  const getOptionStyles = (option: typeof options[number]) => {
    if (!showResult) {
      return selectedAnswer === option
        ? "border-primary bg-primary/10 text-foreground"
        : "border-border hover:border-primary/50 hover:bg-secondary/50";
    }

    if (option === question.correctAnswer) {
      return "border-success bg-success/10 text-success";
    }

    if (selectedAnswer === option && option !== question.correctAnswer) {
      return "border-destructive bg-destructive/10 text-destructive";
    }

    return "border-border opacity-50";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-3xl mx-auto"
    >
      <div className="bg-card border border-border rounded-xl p-6 md:p-8 shadow-xl">
        {/* Question Header */}
        <div className="flex items-center justify-between mb-4">
          <span className="font-mono text-sm text-muted-foreground bg-secondary px-3 py-1 rounded-md">
            {question.id}
          </span>
          {questionNumber && totalQuestions && (
            <span className="font-mono text-sm text-primary">
              {questionNumber} / {totalQuestions}
            </span>
          )}
        </div>

        {/* Question Text */}
        <h2 className="text-lg md:text-xl font-semibold text-foreground mb-6 leading-relaxed">
          {question.question}
        </h2>

        {/* Options */}
        <div className="space-y-3">
          {options.map((option) => (
            <button
              key={option}
              onClick={() => !showResult && onSelectAnswer(option)}
              disabled={showResult}
              className={cn(
                "w-full text-left p-4 rounded-lg border-2 transition-all duration-200",
                "flex items-start gap-4",
                getOptionStyles(option),
                !showResult && "cursor-pointer"
              )}
            >
              <span
                className={cn(
                  "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold text-sm",
                  selectedAnswer === option && !showResult
                    ? "bg-primary text-primary-foreground"
                    : showResult && option === question.correctAnswer
                    ? "bg-success text-success-foreground"
                    : showResult && selectedAnswer === option && option !== question.correctAnswer
                    ? "bg-destructive text-destructive-foreground"
                    : "bg-secondary text-secondary-foreground"
                )}
              >
                {option}
              </span>
              <span className="flex-1 pt-1">{question.options[option]}</span>
            </button>
          ))}
        </div>

        {/* Result Indicator */}
        {showResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              "mt-6 p-4 rounded-lg text-center font-semibold",
              selectedAnswer === question.correctAnswer
                ? "bg-success/10 text-success border border-success/30"
                : "bg-destructive/10 text-destructive border border-destructive/30"
            )}
          >
            {selectedAnswer === question.correctAnswer ? (
              <span>✓ Correct!</span>
            ) : (
              <span>
                ✗ Incorrect. The correct answer is {question.correctAnswer}:{" "}
                {question.options[question.correctAnswer]}
              </span>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
