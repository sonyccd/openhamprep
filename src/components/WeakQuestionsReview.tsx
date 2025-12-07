import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { QuestionCard } from "@/components/QuestionCard";
import { useQuestions, Question } from "@/hooks/useQuestions";
import { useProgress } from "@/hooks/useProgress";
import { ArrowLeft, AlertTriangle, SkipForward, RotateCcw, Loader2, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

interface WeakQuestionsReviewProps {
  weakQuestionIds: string[];
  onBack: () => void;
}

export function WeakQuestionsReview({ weakQuestionIds, onBack }: WeakQuestionsReviewProps) {
  const { data: allQuestions, isLoading, error } = useQuestions();
  const { saveRandomAttempt } = useProgress();
  
  const weakQuestions = allQuestions?.filter(q => weakQuestionIds.includes(q.id)) || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [stats, setStats] = useState({ correct: 0, total: 0 });
  const [completed, setCompleted] = useState(false);

  const currentQuestion = weakQuestions[currentIndex];

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

  if (error || weakQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <CheckCircle className="w-12 h-12 text-success mx-auto mb-4" />
          <p className="text-foreground font-medium mb-2">No weak questions!</p>
          <p className="text-muted-foreground mb-4">You're doing great. Keep practicing!</p>
          <Button onClick={onBack}>Go Back</Button>
        </div>
      </div>
    );
  }

  if (completed) {
    const percentage = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-success" />
          </div>
          <h1 className="text-2xl font-mono font-bold text-foreground mb-2">Review Complete!</h1>
          <p className="text-muted-foreground mb-6">
            You got {stats.correct} out of {stats.total} correct ({percentage}%)
          </p>
          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={() => {
              setCurrentIndex(0);
              setStats({ correct: 0, total: 0 });
              setCompleted(false);
              setSelectedAnswer(null);
              setShowResult(false);
            }}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Review Again
            </Button>
            <Button onClick={onBack}>Back to Dashboard</Button>
          </div>
        </motion.div>
      </div>
    );
  }

  const handleSelectAnswer = async (answer: 'A' | 'B' | 'C' | 'D') => {
    if (showResult) return;
    
    setSelectedAnswer(answer);
    setShowResult(true);
    
    const isCorrect = answer === currentQuestion.correctAnswer;
    setStats(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1
    }));

    await saveRandomAttempt(currentQuestion, answer);
  };

  const handleNext = () => {
    if (currentIndex < weakQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setCompleted(true);
    }
  };

  const handleSkip = () => {
    if (currentIndex < weakQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setCompleted(true);
    }
  };

  const percentage = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      {/* Header */}
      <div className="max-w-3xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={onBack} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div className="flex items-center gap-2 text-foreground">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-mono font-semibold">Review Weak Areas</span>
          </div>
        </div>

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-lg p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              Question {currentIndex + 1} of {weakQuestions.length}
            </span>
            <span className="text-sm font-mono text-primary">
              {stats.correct}/{stats.total} correct ({percentage}%)
            </span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-destructive transition-all"
              style={{ width: `${((currentIndex + 1) / weakQuestions.length) * 100}%` }}
            />
          </div>
        </motion.div>
      </div>

      {/* Question */}
      <QuestionCard
        question={currentQuestion}
        selectedAnswer={selectedAnswer}
        onSelectAnswer={handleSelectAnswer}
        showResult={showResult}
        questionNumber={currentIndex + 1}
        totalQuestions={weakQuestions.length}
      />

      {/* Actions */}
      <div className="max-w-3xl mx-auto mt-8 flex justify-center gap-4">
        {!showResult ? (
          <Button variant="outline" onClick={handleSkip} className="gap-2">
            <SkipForward className="w-4 h-4" />
            Skip
          </Button>
        ) : (
          <Button onClick={handleNext} variant="default" size="lg" className="gap-2">
            {currentIndex < weakQuestions.length - 1 ? 'Next Question' : 'Finish Review'}
          </Button>
        )}
      </div>
    </div>
  );
}
