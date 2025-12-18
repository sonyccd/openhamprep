import { useState, useCallback, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { QuestionCard } from "@/components/QuestionCard";
import { useQuestions, Question } from "@/hooks/useQuestions";
import { useProgress } from "@/hooks/useProgress";
import { useAuth } from "@/hooks/useAuth";
import { useKeyboardShortcuts, KeyboardShortcut } from "@/hooks/useKeyboardShortcuts";
import { KeyboardShortcutsHelp } from "@/components/KeyboardShortcutsHelp";
import { AlertTriangle, Loader2, CheckCircle, ArrowLeft, ChevronLeft, ChevronRight, Dices } from "lucide-react";
import { motion } from "framer-motion";
import { TestType } from "@/types/navigation";

// Number of correct answers in a row needed to clear a weak question
const STREAK_TO_CLEAR = 3;
interface WeakQuestionsReviewProps {
  weakQuestionIds: string[];
  onBack: () => void;
  testType: TestType;
}
export function WeakQuestionsReview({
  weakQuestionIds,
  onBack,
  testType
}: WeakQuestionsReviewProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const {
    data: allQuestions,
    isLoading,
    error
  } = useQuestions(testType);
  const {
    saveRandomAttempt
  } = useProgress();
  const weakQuestions = useMemo(
    () => allQuestions?.filter(q => weakQuestionIds.includes(q.id)) || [],
    [allQuestions, weakQuestionIds]
  );
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [showResult, setShowResult] = useState(false);
  // Track correct streaks per question - need STREAK_TO_CLEAR in a row to clear
  const [streaks, setStreaks] = useState<Record<string, number>>({});
  // Track questions cleared this session (STREAK_TO_CLEAR correct in a row)
  const [clearedQuestions, setClearedQuestions] = useState<Set<string>>(new Set());

  // Filter out cleared questions from the active list (memoized for performance)
  const activeWeakQuestions = useMemo(
    () => weakQuestions.filter(q => !clearedQuestions.has(q.id)),
    [weakQuestions, clearedQuestions]
  );
  const currentQuestion = currentIndex !== null ? activeWeakQuestions[currentIndex] : null;

  // Navigation helpers
  const canGoPrev = currentIndex !== null && currentIndex > 0;
  const canGoNext = currentIndex !== null && currentIndex < activeWeakQuestions.length - 1;

  const handlePrevQuestion = () => {
    if (canGoPrev) {
      setCurrentIndex(currentIndex - 1);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };

  const handleNextQuestion = () => {
    if (canGoNext) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };

  const handleBackToList = () => {
    setCurrentIndex(null);
    setSelectedAnswer(null);
    setShowResult(false);
  };

  const handleRandomize = () => {
    if (activeWeakQuestions.length <= 1) return;
    // Pick a random index different from current with max iteration guard
    let newIndex: number;
    let attempts = 0;
    const maxAttempts = 10;
    do {
      newIndex = Math.floor(Math.random() * activeWeakQuestions.length);
      attempts++;
    } while (newIndex === currentIndex && attempts < maxAttempts);
    setCurrentIndex(newIndex);
    setSelectedAnswer(null);
    setShowResult(false);
  };

  // Reset state when test type changes
  useEffect(() => {
    setCurrentIndex(null);
    setSelectedAnswer(null);
    setShowResult(false);
    setStreaks({});
    setClearedQuestions(new Set());
  }, [testType]);

  const handleSelectAnswer = useCallback(async (answer: 'A' | 'B' | 'C' | 'D') => {
    if (showResult || !currentQuestion) return;
    setSelectedAnswer(answer);
    setShowResult(true);
    const isCorrect = answer === currentQuestion.correctAnswer;
    const questionId = currentQuestion.id;

    // Update streak for this question using functional updates to avoid stale closures
    if (isCorrect) {
      setStreaks(prevStreaks => {
        const newStreak = (prevStreaks[questionId] || 0) + 1;
        if (newStreak >= STREAK_TO_CLEAR) {
          // Question cleared! Update cleared questions set
          setClearedQuestions(prevCleared => {
            const newClearedSet = new Set([...prevCleared, questionId]);
            const remainingCount = weakQuestions.filter(q => !newClearedSet.has(q.id)).length;

            // Adjust current index based on new list length
            setCurrentIndex(prevIndex => {
              if (prevIndex === null) return null;
              // If no questions remain, return to list view
              if (remainingCount === 0) return null;
              // If current index would be out of bounds, move to last valid index
              if (prevIndex >= remainingCount) {
                return remainingCount - 1;
              }
              return prevIndex;
            });

            return newClearedSet;
          });
          // Don't include the cleared question in streaks
          return prevStreaks;
        }
        return { ...prevStreaks, [questionId]: newStreak };
      });
    } else {
      // Wrong answer - reset streak
      setStreaks(prev => ({ ...prev, [questionId]: 0 }));
    }

    // Save attempt with error handling
    try {
      await saveRandomAttempt(currentQuestion, answer, 'weak_questions');
      // Invalidate cache so weak questions list updates
      if (user) {
        queryClient.invalidateQueries({ queryKey: ['question-attempts', user.id] });
      }
    } catch (error) {
      console.error('Failed to save attempt:', error);
      // Continue without blocking - the user can still use the app
    }
  }, [showResult, currentQuestion, saveRandomAttempt, queryClient, user, weakQuestions]);

  // Keyboard shortcuts - must be called before any early returns
  const shortcuts: KeyboardShortcut[] = [
    { key: 'a', description: 'Select A', action: () => handleSelectAnswer('A'), disabled: showResult },
    { key: 'b', description: 'Select B', action: () => handleSelectAnswer('B'), disabled: showResult },
    { key: 'c', description: 'Select C', action: () => handleSelectAnswer('C'), disabled: showResult },
    { key: 'd', description: 'Select D', action: () => handleSelectAnswer('D'), disabled: showResult },
    { key: 'ArrowLeft', description: 'Previous', action: handlePrevQuestion, disabled: !canGoPrev },
    { key: 'ArrowRight', description: 'Next', action: handleNextQuestion, disabled: !canGoNext },
    { key: 'Escape', description: 'Go back', action: handleBackToList },
  ];

  useKeyboardShortcuts(shortcuts, { enabled: !!currentQuestion });

  if (isLoading) {
    return <div className="flex-1 bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading questions...</p>
        </div>
      </div>;
  }
  // Empty state - no weak questions or all cleared
  if (error || activeWeakQuestions.length === 0) {
    const allCleared = clearedQuestions.size > 0 && weakQuestions.length > 0;
    return <div className="flex-1 bg-background py-8 px-4 pb-24 md:pb-8 overflow-y-auto">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardContent className="pt-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-success mx-auto mb-4" />
              <p className="text-foreground font-medium mb-2">
                {allCleared ? "All weak questions cleared!" : "No weak questions!"}
              </p>
              <p className="text-muted-foreground mb-4">
                {allCleared
                  ? `You cleared ${clearedQuestions.size} question${clearedQuestions.size !== 1 ? 's' : ''} this session!`
                  : "You're doing great. Keep practicing!"}
              </p>
              <Button onClick={onBack}>Go Back</Button>
            </motion.div>
          </CardContent>
        </Card>
      </div>
    </div>;
  }

  // Question detail view
  if (currentQuestion) {
    const currentStreak = streaks[currentQuestion.id] || 0;
    return <div className="flex-1 bg-background py-8 px-4 pb-24 md:pb-8 overflow-y-auto">
      <div className="max-w-3xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={handleBackToList} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Weak Questions
          </Button>
          <div className="flex items-center gap-2">
            <KeyboardShortcutsHelp />
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-mono font-semibold">Weak Area</span>
            </div>
          </div>
        </div>

        {/* Streak Progress */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-lg p-4 mb-4"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Streak to clear ({STREAK_TO_CLEAR} correct in a row)</span>
            <div className="flex items-center gap-2">
              {Array.from({ length: STREAK_TO_CLEAR }, (_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    i < currentStreak ? 'bg-success' : 'bg-muted'
                  }`}
                />
              ))}
              <span className="text-sm font-mono text-primary ml-2">{currentStreak}/{STREAK_TO_CLEAR}</span>
            </div>
          </div>
        </motion.div>

      </div>

      <QuestionCard question={currentQuestion} selectedAnswer={selectedAnswer} onSelectAnswer={handleSelectAnswer} showResult={showResult} enableGlossaryHighlight />

      {/* Navigation Actions */}
      <div className="max-w-3xl mx-auto mt-8 flex justify-center gap-4">
        <Button variant="outline" onClick={handlePrevQuestion} disabled={!canGoPrev} className="gap-2">
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>
        <Button
          variant="outline"
          onClick={handleRandomize}
          disabled={activeWeakQuestions.length <= 1}
          className="gap-2"
          title="Random question"
          aria-label="Jump to random question"
        >
          <Dices className="w-4 h-4" />
        </Button>
        <Button variant={showResult ? "default" : "outline"} onClick={handleNextQuestion} disabled={!canGoNext} className="gap-2">
          Next
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Question counter */}
      {activeWeakQuestions.length > 1 && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-muted-foreground text-sm mt-4">
        Question {currentIndex + 1} of {activeWeakQuestions.length}
        {clearedQuestions.size > 0 && (
          <span className="text-success ml-2">({clearedQuestions.size} cleared)</span>
        )}
      </motion.p>}
    </div>;
  }

  // List view - show all weak questions
  return <div className="flex-1 bg-background py-8 px-4 pb-24 md:pb-8 overflow-y-auto">
    <div className="max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Weak Questions
          </h2>
          <p className="text-sm text-muted-foreground">
            {activeWeakQuestions.length} question{activeWeakQuestions.length !== 1 ? 's' : ''} to review
            {clearedQuestions.size > 0 && (
              <span className="text-success ml-1">({clearedQuestions.size} cleared)</span>
            )}
          </p>
        </div>
        {activeWeakQuestions.map((question, index) => {
          const questionStreak = streaks[question.id] || 0;
          return (
            <div key={question.id} className="bg-card border border-border rounded-lg p-4 hover:border-destructive/50 transition-colors">
              <button onClick={() => setCurrentIndex(index)} className="w-full text-left">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                      {question.id}
                    </span>
                    <span className="text-xs text-destructive">Needs practice</span>
                  </div>
                  {/* Streak indicator */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: STREAK_TO_CLEAR }, (_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full ${
                          i < questionStreak ? 'bg-success' : 'bg-muted'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-foreground line-clamp-2">
                  {question.question}
                </p>
              </button>
            </div>
          );
        })}
      </motion.div>
    </div>
  </div>;
}