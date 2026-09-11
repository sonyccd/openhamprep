import { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { QuestionCard } from "@/components/QuestionCard";
import { useQuestions } from "@/hooks/useQuestions";
import { useProgress } from "@/hooks/useProgress";
import { useAuth } from "@/hooks/useAuth";
import { useAppNavigation } from "@/hooks/useAppNavigation";
import { useKeyboardShortcuts, KeyboardShortcut } from "@/hooks/useKeyboardShortcuts";
import { KeyboardShortcutsHelp } from "@/components/KeyboardShortcutsHelp";
import { useQuizSession } from "@/hooks/useQuizSession";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from '@/services/queryKeys';
import { Zap, SkipForward, RotateCcw, Loader2, Flame, Trophy, Award, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { TestType } from "@/types/navigation";
import { PageContainer } from "@/components/ui/page-container";

interface RandomPracticeProps {
  onBack: () => void;
  testType: TestType;
}

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

export function RandomPractice({
  onBack,
  testType
}: RandomPracticeProps) {
  const { user } = useAuth();
  const { navigateToTopic } = useAppNavigation();
  const queryClient = useQueryClient();
  const { data: allQuestions, isLoading, error } = useQuestions(testType);
  const { saveRandomAttempt } = useProgress();

  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [allTimeBestStreak, setAllTimeBestStreak] = useState(0);
  const [showStreakCelebration, setShowStreakCelebration] = useState(false);

  const questions = useMemo(() => allQuestions ?? [], [allQuestions]);

  // Save best streak to database when it's beaten
  const saveBestStreak = async (newBestStreak: number) => {
    if (!user) return;
    await supabase.from('profiles').update({
      best_streak: newBestStreak
    }).eq('id', user.id);

    // Invalidate profile-stats query so dashboard updates
    queryClient.invalidateQueries({ queryKey: queryKeys.progress.profileStats(user.id) });
  };

  // Computed from the current streak rather than inside a setStreak updater.
  // The updater form ran toasts and a database write as a side effect of state
  // computation, which React is free to invoke more than once.
  const applyStreak = (isCorrect: boolean) => {
    if (!isCorrect) {
      setStreak(0);
      return;
    }

    const newStreak = streak + 1;
    setStreak(newStreak);

    if (newStreak > bestStreak) {
      setBestStreak(newStreak);

      if (newStreak > allTimeBestStreak) {
        setAllTimeBestStreak(newStreak);
        saveBestStreak(newStreak);

        // Show special message for new all-time best
        if (newStreak > 1) {
          toast.success(`New all-time best: ${newStreak} streak!`, {
            icon: <Award className="w-5 h-5 text-primary" />,
            duration: 3000
          });
        }
      }
    }

    if (STREAK_MILESTONES.includes(newStreak)) {
      setShowStreakCelebration(true);
      toast.success(getMilestoneMessage(newStreak), {
        icon: <Trophy className="w-5 h-5 text-primary" />,
        duration: 3000
      });
      setTimeout(() => setShowStreakCelebration(false), 1500);
    }
  };

  const session = useQuizSession({
    questions,
    autoStart: true,
    resetKey: testType,
    onAttempt: async (question, answer, isCorrect, timeElapsedMs) => {
      applyStreak(isCorrect);
      await saveRandomAttempt(question, answer, 'random_practice', timeElapsedMs);
    },
  });

  const { question, selectedAnswer, showResult, stats, canGoBack, isViewingHistory } = session;

  // The session resets itself when testType changes; the streak is this
  // component's own state, so it has to be cleared alongside it.
  useEffect(() => {
    setStreak(0);
    setBestStreak(allTimeBestStreak);
  }, [testType]);

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

  const handleReset = () => {
    session.reset();
    setStreak(0);
    setBestStreak(allTimeBestStreak);
  };

  // Refs let the unmount cleanup read the latest user/stats without re-firing
  // every time they change (an effect with [user, stats.total] deps would
  // toast on each answered question).
  const userRef = useRef(user);
  const statsRef = useRef(stats);
  useEffect(() => {
    userRef.current = user;
    statsRef.current = stats;
  }, [user, stats]);

  useEffect(() => {
    return () => {
      if (!userRef.current && statsRef.current.total > 0) {
        toast("Your practice session wasn't saved — create a free account to track your progress.", {
          duration: 5000,
        });
      }
    };
  }, []);

  // Keyboard shortcuts - must be called before any early returns
  const shortcuts: KeyboardShortcut[] = [
    { key: 'a', description: 'Select A', action: () => session.selectAnswer('A'), disabled: showResult || !question || isLoading },
    { key: 'b', description: 'Select B', action: () => session.selectAnswer('B'), disabled: showResult || !question || isLoading },
    { key: 'c', description: 'Select C', action: () => session.selectAnswer('C'), disabled: showResult || !question || isLoading },
    { key: 'd', description: 'Select D', action: () => session.selectAnswer('D'), disabled: showResult || !question || isLoading },
    { key: 'ArrowRight', description: 'Next', action: session.next, disabled: !showResult || isLoading },
    { key: 'ArrowLeft', description: 'Previous', action: session.previous, disabled: !canGoBack || isLoading },
    { key: 's', description: 'Skip', action: session.skip, disabled: showResult || !question || isLoading },
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
      {/* Header - Refined Minimal */}
      <div className="mb-12">
        <div className="flex items-center justify-between">
          {/* Inline Stats */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 text-sm font-mono"
          >
            <span className="text-success font-medium">{stats.correct}</span>
            <span className="text-muted-foreground/40">/</span>
            <span className="text-destructive font-medium">{stats.total - stats.correct}</span>

            {/* Streak - only visible when active */}
            <AnimatePresence>
              {streak > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="ml-3 flex items-center gap-1.5 text-primary relative"
                >
                  {showStreakCelebration && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: [1, 2, 1], opacity: [1, 0.5, 0] }}
                      transition={{ duration: 1 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <Trophy className="w-6 h-6 text-primary" />
                    </motion.div>
                  )}
                  <Flame className={cn("w-4 h-4", streak >= 5 && "animate-pulse")} />
                  <span className="font-semibold">{streak}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            <KeyboardShortcutsHelp />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="sr-only">Reset</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Question */}
      <QuestionCard question={question} selectedAnswer={selectedAnswer} onSelectAnswer={session.selectAnswer} showResult={showResult} enableGlossaryHighlight onTopicClick={navigateToTopic} />

      {/* Actions */}
      <div className="mt-10 flex justify-center gap-4">
        {canGoBack && (
          <Button variant="outline" onClick={session.previous} className="gap-2">
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>
        )}
        {!showResult ? (
          <Button variant="outline" onClick={session.skip} className="gap-2">
            <SkipForward className="w-4 h-4" />
            Skip Question
          </Button>
        ) : (
          <Button onClick={session.next} variant="default" size="lg" className="gap-2">
            {isViewingHistory ? "Next" : "Next Question"}
            <Zap className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* History indicator */}
      {session.history.length > 1 && <motion.p initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} className="text-center text-muted-foreground text-sm mt-4">
          Question {session.historyIndex + 1} of {session.history.length}
        </motion.p>}
    </PageContainer>
  );
}
