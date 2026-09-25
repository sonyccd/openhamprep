import { Icon } from "@/components/ohp/Icon";
import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import { QuestionCard } from "@/components/QuestionCard";
import { useQuestions, Question } from "@/hooks/useQuestions";
import { useProgress } from "@/hooks/useProgress";
import { useAuth } from "@/hooks/useAuth";
import { useAppNavigation } from "@/hooks/useAppNavigation";
import { useKeyboardShortcuts, KeyboardShortcut } from "@/hooks/useKeyboardShortcuts";
import { CheckCircle, ChevronLeft, ChevronRight, Dices } from "lucide-react";
import { MotionBox } from "@/components/ohp/MotionBox";
import { TestType } from "@/types/navigation";
import { PageContainer } from "@/components/ohp/PageContainer";
import { QuizShell, QuizShellPending } from "@/components/QuizShell";
import { WeakQuestionHeader } from "./weakQuestions/WeakQuestionHeader";
import { WeakQuestionList } from "./weakQuestions/WeakQuestionList";

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
  const { navigateToTopic } = useAppNavigation();
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
  // Track correct streaks per question - need STREAK_TO_CLEAR in a row to clear (when streak mode is on)
  const [streaks, setStreaks] = useState<Record<string, number>>({});
  // Track questions cleared this session
  const [clearedQuestions, setClearedQuestions] = useState<Set<string>>(new Set());
  // Streak mode toggle - when OFF (default), 1 correct clears; when ON, need STREAK_TO_CLEAR in a row
  const [streakModeEnabled, setStreakModeEnabled] = useState(false);
  // Track the question that was just cleared (so user can still view it until they navigate away)
  const [justClearedQuestion, setJustClearedQuestion] = useState<Question | null>(null);

  // Filter out cleared questions from the active list (memoized for performance)
  const activeWeakQuestions = useMemo(
    () => weakQuestions.filter(q => !clearedQuestions.has(q.id)),
    [weakQuestions, clearedQuestions]
  );
  // Use the just-cleared question if we're viewing it, otherwise use the active list
  const currentQuestion = justClearedQuestion || (currentIndex !== null ? activeWeakQuestions[currentIndex] : null);

  // Timer for tracking time spent on current question
  const questionStartTimeRef = useRef<number>(Date.now());

  // Reset timer when question changes
  useEffect(() => {
    questionStartTimeRef.current = Date.now();
  }, [currentQuestion?.id]);

  // Navigation helpers
  const canGoPrev = currentIndex !== null && currentIndex > 0;
  const canGoNext = currentIndex !== null && currentIndex < activeWeakQuestions.length - 1;

  const handlePrevQuestion = () => {
    if (canGoPrev) {
      setCurrentIndex(currentIndex - 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setJustClearedQuestion(null);
    }
  };

  const handleNextQuestion = () => {
    // If we just cleared a question
    if (justClearedQuestion) {
      if (activeWeakQuestions.length > 0) {
        // There are more questions, go to the current index (which is now a different question)
        setJustClearedQuestion(null);
        setSelectedAnswer(null);
        setShowResult(false);
        // Adjust index if needed
        if (currentIndex !== null && currentIndex >= activeWeakQuestions.length) {
          setCurrentIndex(activeWeakQuestions.length - 1);
        }
      } else {
        // No more questions, go back to list view (which will show "All cleared" message)
        setJustClearedQuestion(null);
        setCurrentIndex(null);
        setSelectedAnswer(null);
        setShowResult(false);
      }
      return;
    }
    if (canGoNext) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setJustClearedQuestion(null);
    }
  };

  const handleBackToList = () => {
    setCurrentIndex(null);
    setSelectedAnswer(null);
    setShowResult(false);
    setJustClearedQuestion(null);
  };

  const handleTryAgain = () => {
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
    setJustClearedQuestion(null);
  };

  // Reset state when test type changes
  useEffect(() => {
    setCurrentIndex(null);
    setSelectedAnswer(null);
    setShowResult(false);
    setStreaks({});
    setClearedQuestions(new Set());
    setJustClearedQuestion(null);
  }, [testType]);

  const handleSelectAnswer = useCallback(async (answer: 'A' | 'B' | 'C' | 'D') => {
    if (showResult || !currentQuestion) return;

    // Capture elapsed time before any state updates
    const timeElapsedMs = Date.now() - questionStartTimeRef.current;

    setSelectedAnswer(answer);
    setShowResult(true);
    const isCorrect = answer === currentQuestion.correctAnswer;
    const questionId = currentQuestion.id;

    // Helper to mark a question as cleared (user stays on question to see explanation)
    const clearQuestion = () => {
      // Store the current question so user can still see it after it's removed from the list
      setJustClearedQuestion(currentQuestion);
      setClearedQuestions(prevCleared => new Set([...prevCleared, questionId]));
    };

    // Update streak for this question using functional updates to avoid stale closures
    if (isCorrect) {
      if (!streakModeEnabled) {
        // Simple mode: 1 correct answer clears the question
        clearQuestion();
      } else {
        // Streak mode: need STREAK_TO_CLEAR correct in a row
        setStreaks(prevStreaks => {
          const newStreak = (prevStreaks[questionId] || 0) + 1;
          if (newStreak >= STREAK_TO_CLEAR) {
            // Question cleared!
            clearQuestion();
            // Don't include the cleared question in streaks
            return prevStreaks;
          }
          return { ...prevStreaks, [questionId]: newStreak };
        });
      }
    } else {
      // Wrong answer - reset streak (only matters in streak mode)
      if (streakModeEnabled) {
        setStreaks(prev => ({ ...prev, [questionId]: 0 }));
      }
    }

    // Save attempt with error handling
    try {
      await saveRandomAttempt(currentQuestion, answer, 'weak_questions', timeElapsedMs);
      // Invalidate cache so weak questions list updates
      if (user) {
        queryClient.invalidateQueries({ queryKey: ['question-attempts', user.id] });
      }
    } catch (error) {
      console.error('Failed to save attempt:', error);
      // Continue without blocking - the user can still use the app
    }
  }, [showResult, currentQuestion, saveRandomAttempt, queryClient, user, weakQuestions, streakModeEnabled]);

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
    return (
      <QuizShellPending message="Loading questions..." />
    );
  }
  // Empty state - no weak questions or all cleared
  if (error || activeWeakQuestions.length === 0) {
    const allCleared = clearedQuestions.size > 0 && weakQuestions.length > 0;
    return (
      <PageContainer width="standard" mobileNavPadding>
        <Card variant="outlined">
          <CardContent sx={{ pt: 3 }}>
            <MotionBox initial={{ opacity: 0 }} animate={{ opacity: 1 }} sx={{ textAlign: "center", py: 4 }}>
              <Icon icon={CheckCircle} size={48} sx={{ color: "success.main", mx: "auto", mb: 2, display: "block" }} />
              <Typography sx={{ fontWeight: 500, mb: 1 }}>
                {allCleared ? "All weak questions cleared!" : "No weak questions!"}
              </Typography>
              <Typography sx={{ color: "text.secondary", mb: 2 }}>
                {allCleared
                  ? `You cleared ${clearedQuestions.size} question${clearedQuestions.size !== 1 ? 's' : ''} this session!`
                  : "You're doing great. Keep practicing!"}
              </Typography>
              <Button variant="contained" onClick={onBack}>
                Go Back
              </Button>
            </MotionBox>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  // Question detail view
  if (currentQuestion) {
    const currentStreak = streaks[currentQuestion.id] || 0;
    const isJustCleared = justClearedQuestion !== null;
    const hasMoreQuestions = activeWeakQuestions.length > 0;

    return (
      <QuizShell
        header={
          <WeakQuestionHeader
            isJustCleared={isJustCleared}
            streakModeEnabled={streakModeEnabled}
            currentStreak={currentStreak}
            streakToClear={STREAK_TO_CLEAR}
            onBack={handleBackToList}
          />
        }
        actions={
          <Box sx={{ mt: 4, display: "flex", justifyContent: "center", gap: 2 }}>
            <Button
              variant="outlined"
              onClick={handlePrevQuestion}
              disabled={!canGoPrev || isJustCleared}
              startIcon={<Icon icon={ChevronLeft} size={16} />}
            >
              Previous
            </Button>
            <IconButton
              onClick={handleRandomize}
              disabled={activeWeakQuestions.length <= 1 || isJustCleared}
              title="Random question"
              aria-label="Jump to random question"
              sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1 }}
            >
              <Icon icon={Dices} size={16} />
            </IconButton>
            {showResult && !isJustCleared && (
              <Button variant="outlined" onClick={handleTryAgain}>
                Try Again
              </Button>
            )}
            <Button
              variant={showResult ? "contained" : "outlined"}
              onClick={handleNextQuestion}
              disabled={!isJustCleared && !canGoNext}
              endIcon={<Icon icon={ChevronRight} size={16} />}
            >
              {isJustCleared && !hasMoreQuestions ? 'Done' : 'Next'}
            </Button>
          </Box>
        }
        footer={
          (activeWeakQuestions.length > 1 || isJustCleared) && (
            <>
                {isJustCleared ? (
                  activeWeakQuestions.length > 0
                    ? `${activeWeakQuestions.length} remaining`
                    : 'All questions cleared!'
                ) : (
                  `Question ${(currentIndex || 0) + 1} of ${activeWeakQuestions.length}`
                )}
                {clearedQuestions.size > 0 && (
                  <Box component="span" sx={{ color: "success.main", ml: 1 }}>
                    ({clearedQuestions.size} cleared)
                  </Box>
                )}
            </>
          )
        }
      >
        <QuestionCard question={currentQuestion} selectedAnswer={selectedAnswer} onSelectAnswer={handleSelectAnswer} showResult={showResult} enableGlossaryHighlight onTopicClick={navigateToTopic} />
      </QuizShell>
    );
  }

  return (
    <WeakQuestionList
      questions={activeWeakQuestions}
      streaks={streaks}
      streakToClear={STREAK_TO_CLEAR}
      clearedCount={clearedQuestions.size}
      streakModeEnabled={streakModeEnabled}
      onStreakModeChange={setStreakModeEnabled}
      onSelect={setCurrentIndex}
    />
  );
}
