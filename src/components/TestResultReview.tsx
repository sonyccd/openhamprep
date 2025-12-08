import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Question, useQuestions } from "@/hooks/useQuestions";
import { QuestionCard } from "@/components/QuestionCard";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, ArrowRight, Trophy, XCircle, Loader2, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TestResultReviewProps {
  testResultId: string;
  onBack: () => void;
}

const indexToAnswer: Record<number, 'A' | 'B' | 'C' | 'D'> = {
  0: 'A',
  1: 'B',
  2: 'C',
  3: 'D'
};

export function TestResultReview({ testResultId, onBack }: TestResultReviewProps) {
  const [reviewIndex, setReviewIndex] = useState<number | null>(null);
  const { data: allQuestions } = useQuestions();

  // Fetch the test result
  const { data: testResult, isLoading: resultLoading } = useQuery({
    queryKey: ['test-result', testResultId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('practice_test_results')
        .select('*')
        .eq('id', testResultId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch the attempts for this test
  const { data: attempts, isLoading: attemptsLoading } = useQuery({
    queryKey: ['test-attempts', testResultId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('question_attempts')
        .select('*')
        .eq('test_result_id', testResultId)
        .order('attempted_at', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  if (resultLoading || attemptsLoading || !allQuestions) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!testResult || !attempts) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">Test result not found</p>
          <Button onClick={onBack}>Go Back</Button>
        </div>
      </div>
    );
  }

  // Build questions array from attempts
  const questionsMap = new Map(allQuestions.map(q => [q.id, q]));
  const questions: Question[] = attempts
    .map(a => questionsMap.get(a.question_id))
    .filter((q): q is Question => q !== undefined);

  // Build answers record from attempts
  const answers: Record<string, 'A' | 'B' | 'C' | 'D'> = {};
  attempts.forEach(a => {
    answers[a.question_id] = indexToAnswer[a.selected_answer] || 'A';
  });

  const correctCount = testResult.score;
  const totalQuestions = testResult.total_questions;
  const percentage = Number(testResult.percentage);
  const passed = testResult.passed;
  const completedAt = new Date(testResult.completed_at);

  if (reviewIndex !== null && questions[reviewIndex]) {
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
    <div className="h-full flex flex-col bg-background radio-wave-bg">
      <div className="flex-1 overflow-y-auto py-8 px-4">
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
              {passed ? "PASSED" : "NOT PASSED"}
            </h1>
            
            {/* Date */}
            <div className="flex items-center justify-center gap-2 text-muted-foreground mb-4">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">
                {completedAt.toLocaleDateString()} at {completedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

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
    </div>
  );
}
