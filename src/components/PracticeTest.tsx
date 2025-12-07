import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { QuestionCard } from "@/components/QuestionCard";
import { TestResults } from "@/components/TestResults";
import { useQuestions, Question } from "@/hooks/useQuestions";
import { useProgress } from "@/hooks/useProgress";
import { ArrowLeft, ArrowRight, CheckCircle, Radio, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface PracticeTestProps {
  onBack: () => void;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function PracticeTest({ onBack }: PracticeTestProps) {
  const { data: allQuestions, isLoading, error } = useQuestions();
  const { saveTestResult } = useProgress();
  const questions = useMemo(() => {
    if (!allQuestions) return [];
    return shuffleArray([...allQuestions]).slice(0, 35);
  }, [allQuestions]);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({});
  const [isFinished, setIsFinished] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading questions...</p>
        </div>
      </div>
    );
  }

  if (error || questions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">Failed to load questions</p>
          <Button onClick={onBack}>Go Back</Button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / questions.length) * 100;

  const handleSelectAnswer = (answer: 'A' | 'B' | 'C' | 'D') => {
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

  const handleFinish = async () => {
    setIsFinished(true);
    const result = await saveTestResult(questions, answers);
    if (result) {
      toast.success('Test results saved!');
    }
  };

  const handleRetake = () => {
    setAnswers({});
    setCurrentIndex(0);
    setIsFinished(false);
  };

  if (isFinished) {
    return (
      <TestResults
        questions={questions}
        answers={answers}
        onRetake={handleRetake}
        onBack={onBack}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      {/* Header */}
      <div className="max-w-3xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={onBack} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Exit Test
          </Button>
          <div className="flex items-center gap-2 text-foreground">
            <Radio className="w-5 h-5" />
            <span className="font-mono font-semibold">Practice Test</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Progress</span>
            <span className="text-sm font-mono text-primary">
              {answeredCount} / {questions.length} answered
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Question */}
      <QuestionCard
        question={currentQuestion}
        selectedAnswer={answers[currentQuestion.id] || null}
        onSelectAnswer={handleSelectAnswer}
        showResult={false}
        questionNumber={currentIndex + 1}
        totalQuestions={questions.length}
      />

      {/* Navigation */}
      <div className="max-w-3xl mx-auto mt-8">
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </Button>

          {/* Question Navigator */}
          <div className="hidden md:flex flex-wrap justify-center gap-1 max-w-md">
            {questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(idx)}
                className={`w-8 h-8 rounded text-xs font-mono transition-colors ${
                  idx === currentIndex
                    ? "bg-primary text-primary-foreground"
                    : answers[q.id]
                    ? "bg-secondary text-secondary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-secondary"
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          {currentIndex === questions.length - 1 ? (
            <Button
              onClick={handleFinish}
              className="gap-2"
              variant={answeredCount === questions.length ? "default" : "secondary"}
            >
              <CheckCircle className="w-4 h-4" />
              Finish Test
            </Button>
          ) : (
            <Button onClick={handleNext} className="gap-2">
              Next
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Unanswered Warning */}
        {currentIndex === questions.length - 1 && answeredCount < questions.length && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-muted-foreground text-sm mt-4"
          >
            You have {questions.length - answeredCount} unanswered question(s).
            You can still submit, but unanswered questions will be marked incorrect.
          </motion.p>
        )}
      </div>
    </div>
  );
}
