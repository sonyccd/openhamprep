import { useState, useEffect, useRef, useMemo } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
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
import { Zap, RotateCcw, Trophy, Award } from "lucide-react";
import { toast } from "sonner";
import { TestType } from "@/types/navigation";
import { QuizShell, QuizShellPending, QuizShellError, QuizNavControls } from "@/components/QuizShell";
import { QuizScoreline } from "@/components/QuizScoreline";
import { StreakIndicator } from "@/components/StreakIndicator";
import { MotionBox } from "@/components/ohp/MotionBox";

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
            icon: <Box component={Award} aria-hidden="true" sx={{ width: 20, height: 20, color: "primary.main" }} />,
            duration: 3000
          });
        }
      }
    }

    if (STREAK_MILESTONES.includes(newStreak)) {
      setShowStreakCelebration(true);
      toast.success(getMilestoneMessage(newStreak), {
        icon: <Box component={Trophy} aria-hidden="true" sx={{ width: 20, height: 20, color: "primary.main" }} />,
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

  const { question, selectedAnswer, showResult, stats, canGoBack } = session;

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

  if (isLoading) return <QuizShellPending message="Loading questions..." />;
  if (error || !allQuestions || allQuestions.length === 0) {
    return <QuizShellError onBack={onBack} />;
  }
  if (!question) return <QuizShellPending />;

  return (
    <QuizShell
      header={
        <Box sx={{ mb: 6 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <MotionBox
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              sx={{ display: "flex", alignItems: "center" }}
            >
              <QuizScoreline correct={stats.correct} incorrect={stats.total - stats.correct} />
              <StreakIndicator streak={streak} celebrating={showStreakCelebration} />
            </MotionBox>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <KeyboardShortcutsHelp />
              <IconButton
                aria-label="Reset"
                size="small"
                onClick={handleReset}
                sx={{ color: "text.secondary", "&:hover": { color: "text.primary" } }}
              >
                <Box component={RotateCcw} aria-hidden="true" sx={{ width: 16, height: 16 }} />
              </IconButton>
            </Box>
          </Box>
        </Box>
      }
      actions={
        <QuizNavControls
          session={session}
          nextIcon={<Box component={Zap} aria-hidden="true" sx={{ width: 16, height: 16 }} />}
          sx={{ mt: 5 }}
        />
      }
      footer={
        session.history.length > 1 &&
        `Question ${session.historyIndex + 1} of ${session.history.length}`
      }
    >
      <QuestionCard question={question} selectedAnswer={selectedAnswer} onSelectAnswer={session.selectAnswer} showResult={showResult} enableGlossaryHighlight onTopicClick={navigateToTopic} />
    </QuizShell>
  );
}
