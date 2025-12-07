import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Question } from "@/data/questionPool";
import { QuestionCard } from "@/components/QuestionCard";
import { ArrowLeft, ArrowRight, RotateCcw, Home, Trophy, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TestResultsProps {
  questions: Question[];
  answers: Record<string, 'A' | 'B' | 'C' | 'D'>;
  onRetake: () => void;
  onBack: () => void;
}

export function TestResults({ questions, answers, onRetake, onBack }: TestResultsProps) {
  const [reviewIndex, setReviewIndex] = useState<number | null>(null);

  const correctCount = questions.filter(
    (q) => answers[q.id] === q.correctAnswer
  ).length;
  const totalQuestions = questions.length;
  const percentage = Math.round((correctCount / totalQuestions) * 100);
  const passed = correctCount >= 26;

  const incorrectQuestions = questions.filter(
    (q) => answers[q.id] !== q.correctAnswer
  );

  if (reviewIndex !== null) {
    const question = questions[reviewIndex];
    return (
      <div className="min-h-screen bg-background py-8 px-4">
        <div className="max-w-3xl mx-auto mb-8">
          <Button
            variant="ghost"
            onClick={() => setReviewIndex(null)}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Results
          </Button>
        </div>

        <QuestionCard
          question={question}
          selectedAnswer={answers[question.id] || null}
          onSelectAnswer={() => {}}
          showResult={true}
          questionNumber={reviewIndex + 1}
          totalQuestions={totalQuestions}
        />

        <div className="max-w-3xl mx-auto mt-8 flex justify-between">
          <Button
            variant="outline"
            onClick={() => setReviewIndex(Math.max(0, reviewIndex - 1))}
            disabled={reviewIndex === 0}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              setReviewIndex(Math.min(questions.length - 1, reviewIndex + 1))
            }
            disabled={reviewIndex === questions.length - 1}
            className="gap-2"
          >
            Next
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4 radio-wave-bg">
      <div className="max-w-2xl mx-auto">
        {/* Result Header */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            "text-center p-8 rounded-2xl border-2 mb-8",
            passed
              ? "bg-success/10 border-success/30"
              : "bg-destructive/10 border-destructive/30"
          )}
        >
          <div className="flex justify-center mb-4">
            {passed ? (
              <Trophy className="w-16 h-16 text-success" />
            ) : (
              <XCircle className="w-16 h-16 text-destructive" />
            )}
          </div>
          <h1
            className={cn(
              "text-4xl font-mono font-bold mb-2",
              passed ? "text-success" : "text-destructive"
            )}
          >
            {passed ? "PASSED!" : "NOT PASSED"}
          </h1>
          <p className="text-lg text-muted-foreground mb-4">
            {passed
              ? "Congratulations! You passed the practice exam."
              : "Keep studying and try again!"}
          </p>

          {/* Score Display */}
          <div className="flex items-center justify-center gap-8 mt-6">
            <div className="text-center">
              <p className="text-5xl font-mono font-bold text-foreground">
                {correctCount}
              </p>
              <p className="text-sm text-muted-foreground">Correct</p>
            </div>
            <div className="w-px h-16 bg-border" />
            <div className="text-center">
              <p className="text-5xl font-mono font-bold text-foreground">
                {totalQuestions - correctCount}
              </p>
              <p className="text-sm text-muted-foreground">Incorrect</p>
            </div>
            <div className="w-px h-16 bg-border" />
            <div className="text-center">
              <p className="text-5xl font-mono font-bold text-foreground">
                {percentage}%
              </p>
              <p className="text-sm text-muted-foreground">Score</p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mt-4">
            Passing score: 26 out of 35 (74%)
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-4 mb-8"
        >
          <Button onClick={onRetake} variant="default" className="flex-1 gap-2">
            <RotateCcw className="w-4 h-4" />
            Retake Test
          </Button>
          <Button onClick={onBack} variant="outline" className="flex-1 gap-2">
            <Home className="w-4 h-4" />
            Back to Menu
          </Button>
        </motion.div>

        {/* Review Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <h2 className="text-xl font-mono font-bold text-foreground mb-4">
            Review Your Answers
          </h2>

          <div className="space-y-2">
            {questions.map((q, idx) => {
              const isCorrect = answers[q.id] === q.correctAnswer;
              return (
                <button
                  key={q.id}
                  onClick={() => setReviewIndex(idx)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left",
                    isCorrect
                      ? "border-success/30 bg-success/5 hover:bg-success/10"
                      : "border-destructive/30 bg-destructive/5 hover:bg-destructive/10"
                  )}
                >
                  <span
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-mono font-bold",
                      isCorrect
                        ? "bg-success text-success-foreground"
                        : "bg-destructive text-destructive-foreground"
                    )}
                  >
                    {idx + 1}
                  </span>
                  <span className="flex-1 text-sm text-muted-foreground truncate">
                    {q.id}: {q.question.substring(0, 60)}...
                  </span>
                  <span
                    className={cn(
                      "text-xs font-mono",
                      isCorrect ? "text-success" : "text-destructive"
                    )}
                  >
                    {isCorrect ? "✓" : "✗"}
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
