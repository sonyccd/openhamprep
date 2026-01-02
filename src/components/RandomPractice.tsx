import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { QuestionCard } from "@/components/QuestionCard";
import { useQuestions, Question } from "@/hooks/useQuestions";
import { useProgress } from "@/hooks/useProgress";
import { useAuth } from "@/hooks/useAuth";
import { useAppNavigation } from "@/hooks/useAppNavigation";
import { usePostHog, ANALYTICS_EVENTS } from "@/hooks/usePostHog";
import { useKeyboardShortcuts, KeyboardShortcut } from "@/hooks/useKeyboardShortcuts";
import { KeyboardShortcutsHelp } from "@/components/KeyboardShortcutsHelp";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Zap, SkipForward, RotateCcw, Loader2, Flame, Trophy, Award, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { TestType } from "@/types/navigation";
import { PageContainer } from "@/components/ui/page-container";

interface HistoryEntry {
  question: Question;
  selectedAnswer: 'A' | 'B' | 'C' | 'D' | null;
  showResult: boolean;
}

interface RandomPracticeProps {
  onBack: () => void;
  testType: TestType;
}
export function RandomPractice({
  onBack,
  testType
}: RandomPracticeProps) {
  const {
    user
  } = useAuth();
  const { navigateToTopic } = useAppNavigation();
  const queryClient = useQueryClient();
  const {
    data: allQuestions,
    isLoading,
    error
  } = useQuestions(testType);
  const {
    saveRandomAttempt
  } = useProgress();
  const {
    capture
  } = usePostHog();
  const [stats, setStats] = useState({
    correct: 0,
    total: 0
  });
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [allTimeBestStreak, setAllTimeBestStreak] = useState(0);
  const [showStreakCelebration, setShowStreakCelebration] = useState(false);
  const [askedIds, setAskedIds] = useState<string[]>([]);

  // Session history for back navigation
  const [questionHistory, setQuestionHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const STREAK_MILESTONES = [5, 10, 15, 20, 25];
  const getMilestoneMessage = (milestone: number) => {
    switch (milestone) {
      case 5:
        return "Nice! 5 in a row!";
      case 10:
        return "Amazing! 10 streak!";
      case 15:
        return "Incredible! 15 streak!";
      case 20:
        return "Unstoppable! 20 streak!";
      case 25:
        return "LEGENDARY! 25 streak!";
      default:
        return `${milestone} streak!`;
    }
  };

  // Current question from history
  const currentEntry = historyIndex >= 0 ? questionHistory[historyIndex] : null;
  const question = currentEntry?.question || null;
  const selectedAnswer = currentEntry?.selectedAnswer || null;
  const showResult = currentEntry?.showResult || false;

  // Load all-time best streak from database
  useEffect(() => {
    const loadBestStreak = async () => {
      if (!user) return;
      const {
        data,
        error
      } = await supabase.from('profiles').select('best_streak').eq('id', user.id).maybeSingle();
      if (data && !error) {
        setAllTimeBestStreak(data.best_streak || 0);
        setBestStreak(data.best_streak || 0);
      }
    };
    loadBestStreak();
  }, [user]);

  // Reset state when test type changes
  useEffect(() => {
    setQuestionHistory([]);
    setHistoryIndex(-1);
    setAskedIds([]);
    setStats({ correct: 0, total: 0 });
    setStreak(0);
    setBestStreak(allTimeBestStreak);
  }, [testType]);

  // Save best streak to database when it's beaten
  const saveBestStreak = async (newBestStreak: number) => {
    if (!user) return;
    await supabase.from('profiles').update({
      best_streak: newBestStreak
    }).eq('id', user.id);

    // Invalidate profile-stats query so dashboard updates
    queryClient.invalidateQueries({ queryKey: ['profile-stats', user.id] });
  };
  const getRandomQuestion = useCallback((excludeIds: string[] = []): { question: Question; shouldResetAskedIds: boolean } | null => {
    if (!allQuestions || allQuestions.length === 0) return null;
    const available = allQuestions.filter(q => !excludeIds.includes(q.id));
    if (available.length === 0) {
      // All questions have been asked, wrap around
      return {
        question: allQuestions[Math.floor(Math.random() * allQuestions.length)],
        shouldResetAskedIds: true
      };
    }
    return {
      question: available[Math.floor(Math.random() * available.length)],
      shouldResetAskedIds: false
    };
  }, [allQuestions]);

  // Initialize first question
  useEffect(() => {
    if (allQuestions && allQuestions.length > 0 && questionHistory.length === 0) {
      const result = getRandomQuestion();
      if (result) {
        setQuestionHistory([{
          question: result.question,
          selectedAnswer: null,
          showResult: false
        }]);
        setHistoryIndex(0);
      }
    }
  }, [allQuestions, questionHistory.length, getRandomQuestion]);

  // Update current entry in history
  const updateCurrentEntry = (updates: Partial<HistoryEntry>) => {
    setQuestionHistory(prev => {
      const newHistory = [...prev];
      if (historyIndex >= 0 && historyIndex < newHistory.length) {
        newHistory[historyIndex] = {
          ...newHistory[historyIndex],
          ...updates
        };
      }
      return newHistory;
    });
  };

  const handleSelectAnswer = async (answer: 'A' | 'B' | 'C' | 'D') => {
    if (showResult || !question) return;
    updateCurrentEntry({
      selectedAnswer: answer,
      showResult: true
    });
    const isCorrect = answer === question.correctAnswer;
    setStats(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1
    }));

    // Track question answered
    capture(ANALYTICS_EVENTS.QUESTION_ANSWERED, {
      question_id: question.id,
      is_correct: isCorrect,
      subelement: question.subelement,
      practice_type: 'random'
    });

    // Update streak
    if (isCorrect) {
      setStreak(prev => {
        const newStreak = prev + 1;
        if (newStreak > bestStreak) {
          setBestStreak(newStreak);

          // Save to database if it beats the all-time best
          if (newStreak > allTimeBestStreak) {
            setAllTimeBestStreak(newStreak);
            saveBestStreak(newStreak);

            // Track new best streak
            capture(ANALYTICS_EVENTS.NEW_BEST_STREAK, {
              streak: newStreak
            });

            // Show special message for new all-time best
            if (newStreak > 1) {
              toast.success(`New all-time best: ${newStreak} streak!`, {
                icon: <Award className="w-5 h-5 text-primary" />,
                duration: 3000
              });
            }
          }
        }

        // Check for milestone celebration
        if (STREAK_MILESTONES.includes(newStreak)) {
          setShowStreakCelebration(true);

          // Track streak milestone
          capture(ANALYTICS_EVENTS.STREAK_MILESTONE, {
            milestone: newStreak
          });
          toast.success(getMilestoneMessage(newStreak), {
            icon: <Trophy className="w-5 h-5 text-primary" />,
            duration: 3000
          });
          setTimeout(() => setShowStreakCelebration(false), 1500);
        }
        return newStreak;
      });
    } else {
      setStreak(0);
    }

    // Save attempt to database
    await saveRandomAttempt(question, answer);
  };
  const handleNextQuestion = () => {
    // If we're not at the end of history, just move forward
    if (historyIndex < questionHistory.length - 1) {
      setHistoryIndex(historyIndex + 1);
      return;
    }

    // Otherwise, get a new question
    const newAskedIds = [...askedIds, question.id];
    const result = getRandomQuestion(newAskedIds);
    if (result) {
      // If we've gone through all questions, reset the asked IDs to start fresh
      if (result.shouldResetAskedIds) {
        setAskedIds([result.question.id]);
        setQuestionHistory([{
          question: result.question,
          selectedAnswer: null,
          showResult: false
        }]);
        setHistoryIndex(0);
      } else {
        setAskedIds(newAskedIds);
        setQuestionHistory(prev => [...prev, {
          question: result.question,
          selectedAnswer: null,
          showResult: false
        }]);
        setHistoryIndex(prev => prev + 1);
      }
    }
  };
  const handleSkip = () => {
    const newAskedIds = [...askedIds, question.id];
    const result = getRandomQuestion(newAskedIds);
    if (result) {
      // If we've gone through all questions, reset the asked IDs to start fresh
      if (result.shouldResetAskedIds) {
        setAskedIds([result.question.id]);
        setQuestionHistory([{
          question: result.question,
          selectedAnswer: null,
          showResult: false
        }]);
        setHistoryIndex(0);
      } else {
        setAskedIds(newAskedIds);
        setQuestionHistory(prev => [...prev, {
          question: result.question,
          selectedAnswer: null,
          showResult: false
        }]);
        setHistoryIndex(prev => prev + 1);
      }
    }
  };
  const handlePreviousQuestion = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
    }
  };
  const handleReset = () => {
    setAskedIds([]);
    const result = getRandomQuestion();
    if (result) {
      setQuestionHistory([{
        question: result.question,
        selectedAnswer: null,
        showResult: false
      }]);
      setHistoryIndex(0);
    }
    setStats({
      correct: 0,
      total: 0
    });
    setStreak(0);
    setBestStreak(allTimeBestStreak);
  };

  const canGoBack = historyIndex > 0;
  const isViewingHistory = historyIndex < questionHistory.length - 1;

  // Keyboard shortcuts - must be called before any early returns
  const shortcuts: KeyboardShortcut[] = [
    { key: 'a', description: 'Select A', action: () => handleSelectAnswer('A'), disabled: showResult || !question || isLoading },
    { key: 'b', description: 'Select B', action: () => handleSelectAnswer('B'), disabled: showResult || !question || isLoading },
    { key: 'c', description: 'Select C', action: () => handleSelectAnswer('C'), disabled: showResult || !question || isLoading },
    { key: 'd', description: 'Select D', action: () => handleSelectAnswer('D'), disabled: showResult || !question || isLoading },
    { key: 'ArrowRight', description: 'Next', action: handleNextQuestion, disabled: !showResult || isLoading },
    { key: 'ArrowLeft', description: 'Previous', action: handlePreviousQuestion, disabled: !canGoBack || isLoading },
    { key: 's', description: 'Skip', action: handleSkip, disabled: showResult || !question || isLoading },
  ];

  useKeyboardShortcuts(shortcuts, { enabled: !isLoading && !!question });

  if (isLoading) {
    return (
      <PageContainer width="standard" mobileNavPadding className="flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading questions...</p>
        </div>
      </PageContainer>
    );
  }
  if (error || !allQuestions || allQuestions.length === 0) {
    return (
      <PageContainer width="standard" mobileNavPadding className="flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">Failed to load questions</p>
          <Button onClick={onBack}>Go Back</Button>
        </div>
      </PageContainer>
    );
  }
  if (!question) {
    return (
      <PageContainer width="standard" mobileNavPadding className="flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </PageContainer>
    );
  }

  return (
    <PageContainer width="standard" mobileNavPadding>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-end mb-6">
          <KeyboardShortcutsHelp />
        </div>

        {/* Stats Bar */}
        <motion.div initial={{
        opacity: 0,
        y: -10
      }} animate={{
        opacity: 1,
        y: 0
      }} className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-2xl font-mono font-bold text-success">{stats.correct}</p>
              <p className="text-xs text-muted-foreground">Correct</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-mono font-bold text-destructive">{stats.total - stats.correct}</p>
              <p className="text-xs text-muted-foreground">Incorrect</p>
            </div>
            <div className="text-center relative">
              <AnimatePresence>
                {showStreakCelebration && <motion.div initial={{
                scale: 0,
                opacity: 0
              }} animate={{
                scale: [1, 1.5, 1],
                opacity: [1, 1, 0]
              }} exit={{
                opacity: 0
              }} transition={{
                duration: 1.5
              }} className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                      <Trophy className="w-8 h-8 text-primary" />
                    </div>
                  </motion.div>}
              </AnimatePresence>
              <motion.div className="flex items-center justify-center gap-1" animate={showStreakCelebration ? {
              scale: [1, 1.2, 1]
            } : {}} transition={{
              duration: 0.3
            }}>
                <Flame className={`w-5 h-5 ${streak > 0 ? 'text-primary' : 'text-muted-foreground'} ${streak >= 5 ? 'animate-pulse' : ''}`} />
                <p className={`text-2xl font-mono font-bold ${streak > 0 ? 'text-primary' : 'text-muted-foreground'}`}>{streak}</p>
              </motion.div>
              <p className="text-xs text-muted-foreground">Streak</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleReset} className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
        </motion.div>
      </div>

      {/* Question */}
      <QuestionCard question={question} selectedAnswer={selectedAnswer} onSelectAnswer={handleSelectAnswer} showResult={showResult} enableGlossaryHighlight onTopicClick={navigateToTopic} />

      {/* Actions */}
      <div className="mt-8 flex justify-center gap-4">
        {canGoBack && <Button variant="outline" onClick={handlePreviousQuestion} className="gap-2">
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>}
        {!showResult ? <Button variant="outline" onClick={handleSkip} className="gap-2">
            <SkipForward className="w-4 h-4" />
            Skip Question
          </Button> : <Button onClick={handleNextQuestion} variant="default" size="lg" className="gap-2">
            {isViewingHistory ? "Next" : "Next Question"}
            <Zap className="w-4 h-4" />
          </Button>}
      </div>

      {/* History indicator */}
      {questionHistory.length > 1 && <motion.p initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} className="text-center text-muted-foreground text-sm mt-4">
          Question {historyIndex + 1} of {questionHistory.length}
        </motion.p>}

      {/* Keyboard Hint */}

    </PageContainer>
  );
}