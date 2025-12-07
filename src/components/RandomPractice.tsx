import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { QuestionCard } from "@/components/QuestionCard";
import { useQuestions, Question } from "@/hooks/useQuestions";
import { useProgress } from "@/hooks/useProgress";
import { ArrowLeft, Zap, SkipForward, RotateCcw, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface RandomPracticeProps {
  onBack: () => void;
}

export function RandomPractice({ onBack }: RandomPracticeProps) {
  const { data: allQuestions, isLoading, error } = useQuestions();
  const { saveRandomAttempt } = useProgress();
  const [question, setQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [stats, setStats] = useState({ correct: 0, total: 0 });
  const [askedIds, setAskedIds] = useState<string[]>([]);

  const getRandomQuestion = useCallback((excludeIds: string[] = []): Question | null => {
    if (!allQuestions || allQuestions.length === 0) return null;
    
    const available = allQuestions.filter(q => !excludeIds.includes(q.id));
    if (available.length === 0) {
      return allQuestions[Math.floor(Math.random() * allQuestions.length)];
    }
    return available[Math.floor(Math.random() * available.length)];
  }, [allQuestions]);

  useEffect(() => {
    if (allQuestions && allQuestions.length > 0 && !question) {
      setQuestion(getRandomQuestion());
    }
  }, [allQuestions, question, getRandomQuestion]);

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

  if (error || !allQuestions || allQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">Failed to load questions</p>
          <Button onClick={onBack}>Go Back</Button>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleSelectAnswer = async (answer: 'A' | 'B' | 'C' | 'D') => {
    if (showResult) return;
    
    setSelectedAnswer(answer);
    setShowResult(true);
    
    const isCorrect = answer === question.correctAnswer;
    setStats(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1
    }));

    // Save attempt to database
    await saveRandomAttempt(question, answer);
  };

  const handleNextQuestion = () => {
    const newAskedIds = [...askedIds, question.id];
    setAskedIds(newAskedIds);
    setQuestion(getRandomQuestion(newAskedIds));
    setSelectedAnswer(null);
    setShowResult(false);
  };

  const handleSkip = () => {
    const newAskedIds = [...askedIds, question.id];
    setAskedIds(newAskedIds);
    setQuestion(getRandomQuestion(newAskedIds));
    setSelectedAnswer(null);
    setShowResult(false);
  };

  const handleReset = () => {
    setAskedIds([]);
    setQuestion(getRandomQuestion());
    setSelectedAnswer(null);
    setShowResult(false);
    setStats({ correct: 0, total: 0 });
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
            <Zap className="w-5 h-5" />
            <span className="font-mono font-semibold">Random Practice</span>
          </div>
        </div>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-lg p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-2xl font-mono font-bold text-success">{stats.correct}</p>
              <p className="text-xs text-muted-foreground">Correct</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-mono font-bold text-destructive">{stats.total - stats.correct}</p>
              <p className="text-xs text-muted-foreground">Incorrect</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-mono font-bold text-primary">{percentage}%</p>
              <p className="text-xs text-muted-foreground">Score</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleReset} className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
        </motion.div>
      </div>

      {/* Question */}
      <QuestionCard
        question={question}
        selectedAnswer={selectedAnswer}
        onSelectAnswer={handleSelectAnswer}
        showResult={showResult}
      />

      {/* Actions */}
      <div className="max-w-3xl mx-auto mt-8 flex justify-center gap-4">
        {!showResult ? (
          <Button variant="outline" onClick={handleSkip} className="gap-2">
            <SkipForward className="w-4 h-4" />
            Skip Question
          </Button>
        ) : (
          <Button onClick={handleNextQuestion} variant="default" size="lg" className="gap-2">
            Next Question
            <Zap className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Keyboard Hint */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center text-muted-foreground text-sm mt-8"
      >
        Tip: Click an answer option to see if you&apos;re correct
      </motion.p>
    </div>
  );
}
