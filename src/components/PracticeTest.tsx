import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { QuestionCard } from "@/components/QuestionCard";
import { TestResults } from "@/components/TestResults";
import { useQuestions, Question } from "@/hooks/useQuestions";
import { useProgress } from "@/hooks/useProgress";
import { useAuth } from "@/hooks/useAuth";
import { useKeyboardShortcuts, KeyboardShortcut } from "@/hooks/useKeyboardShortcuts";
import { KeyboardShortcutsHelp } from "@/components/KeyboardShortcutsHelp";
import { ArrowLeft, ArrowRight, CheckCircle, Loader2, Clock, Info, Play, AlertTriangle, History, Trophy, XCircle, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TestType, testConfig } from "@/types/navigation";
import { PageContainer } from "@/components/ui/page-container";
import { supabase } from "@/integrations/supabase/client";
interface PracticeTestProps {
  onBack: () => void;
  onTestStateChange?: (inProgress: boolean) => void;
  testType: TestType;
  onReviewTest?: (testId: string) => void;
}

interface TestHistoryResult {
  id: string;
  score: number;
  total_questions: number;
  percentage: number;
  passed: boolean;
  completed_at: string;
  test_type: string;
}
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor(seconds % 3600 / 60);
  const secs = seconds % 60;
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}
export function PracticeTest({
  onBack,
  onTestStateChange,
  testType,
  onReviewTest
}: PracticeTestProps) {
  const { user } = useAuth();
  const {
    data: allQuestions,
    isLoading,
    error
  } = useQuestions(testType);
  const {
    saveTestResult
  } = useProgress();

  // Fetch test history for this test type
  const { data: testHistory, isLoading: historyLoading, error: historyError } = useQuery({
    queryKey: ['test-history', user?.id, testType],
    queryFn: async () => {
      // Handle both legacy 'practice' test_type and new test type values
      const testTypesToMatch = testType === 'technician'
        ? ['practice', 'technician']
        : [testType];

      const { data, error } = await supabase
        .from('practice_test_results')
        .select('*')
        .eq('user_id', user!.id)
        .in('test_type', testTypesToMatch)
        .order('completed_at', { ascending: false })
        .limit(5); // Only show recent 5 on landing page

      if (error) throw error;
      return data as TestHistoryResult[];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2, // Cache for 2 minutes
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `Today at ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Yesterday`;
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };
  const [hasStarted, setHasStarted] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({});
  const [isFinished, setIsFinished] = useState(false);

  // Timer state
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(120 * 60); // 120 minutes in seconds
  const [timerAnnouncement, setTimerAnnouncement] = useState<string>('');

  const currentQuestion = questions.length > 0 ? questions[currentIndex] : null;
  const answeredCount = Object.keys(answers).length;
  const progress = questions.length > 0 ? answeredCount / questions.length * 100 : 0;

  // Notify parent of test state changes
  useEffect(() => {
    onTestStateChange?.(hasStarted && !isFinished);
  }, [hasStarted, isFinished, onTestStateChange]);

  // Reset state when test type changes
  useEffect(() => {
    setHasStarted(false);
    setQuestions([]);
    setCurrentIndex(0);
    setAnswers({});
    setIsFinished(false);
    setTimerEnabled(false);
    setTimeRemaining(120 * 60);
  }, [testType]);

  // Timer effect
  useEffect(() => {
    if (!timerEnabled || isFinished || !hasStarted) return;
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          toast.warning("Time's up! Submitting your test.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerEnabled, isFinished, hasStarted]);

  // Auto-submit when time runs out
  useEffect(() => {
    if (timerEnabled && timeRemaining === 0 && !isFinished && hasStarted) {
      setIsFinished(true);
      saveTestResult(questions, answers, testType).then(result => {
        if (result) {
          toast.success('Test results saved!');
        }
      });
    }
  }, [timeRemaining, timerEnabled, isFinished, hasStarted, questions, answers, saveTestResult, testType]);

  // Announce timer warnings at key moments for screen readers
  useEffect(() => {
    if (!timerEnabled || isFinished || !hasStarted) return;

    if (timeRemaining === 5 * 60) {
      setTimerAnnouncement('5 minutes remaining');
    } else if (timeRemaining === 60) {
      setTimerAnnouncement('1 minute remaining');
    } else if (timeRemaining === 0) {
      setTimerAnnouncement('Time is up. Test submitted.');
    }
  }, [timeRemaining, timerEnabled, isFinished, hasStarted]);

  // Handlers defined before useKeyboardShortcuts to avoid hooks ordering issues
  const handleSelectAnswer = (answer: 'A' | 'B' | 'C' | 'D') => {
    if (!currentQuestion) return;
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: answer
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

  // Keyboard shortcuts - must be called unconditionally before any returns
  const practiceShortcuts: KeyboardShortcut[] = [
    { key: 'a', description: 'Select A', action: () => handleSelectAnswer('A'), disabled: !hasStarted || isFinished },
    { key: 'b', description: 'Select B', action: () => handleSelectAnswer('B'), disabled: !hasStarted || isFinished },
    { key: 'c', description: 'Select C', action: () => handleSelectAnswer('C'), disabled: !hasStarted || isFinished },
    { key: 'd', description: 'Select D', action: () => handleSelectAnswer('D'), disabled: !hasStarted || isFinished },
    { key: 'ArrowRight', description: 'Next', action: handleNext, disabled: !hasStarted || isFinished || currentIndex >= questions.length - 1 },
    { key: 'ArrowLeft', description: 'Previous', action: handlePrevious, disabled: !hasStarted || isFinished || currentIndex === 0 },
  ];

  useKeyboardShortcuts(practiceShortcuts, { enabled: hasStarted && !isFinished });

  const { questionCount, passingScore } = testConfig[testType];

  const handleStartTest = () => {
    if (!allQuestions) return;
    const shuffledQuestions = shuffleArray([...allQuestions]).slice(0, questionCount);
    setQuestions(shuffledQuestions);
    setHasStarted(true);
  };

  if (isLoading) {
    return (
      <PageContainer width="narrow" mobileNavPadding className="flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading questions...</p>
        </div>
      </PageContainer>
    );
  }
  if (error || !allQuestions || allQuestions.length === 0) {
    return (
      <PageContainer width="narrow" mobileNavPadding className="flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">Failed to load questions</p>
          <Button onClick={onBack}>Go Back</Button>
        </div>
      </PageContainer>
    );
  }

  // Start Screen
  if (!hasStarted) {
    const hasHistory = testHistory && testHistory.length > 0;

    return (
      <PageContainer width="standard" mobileNavPadding>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Start Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-xl p-8 text-center"
          >
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Play className="w-8 h-8 text-primary" />
            </div>

            <h1 className="text-2xl font-mono font-bold text-foreground mb-4">
              Ready to Begin?
            </h1>

            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              This practice test simulates the real Amateur Radio exam with {questionCount} randomly selected questions.
            </p>

            {/* Test Info */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="text-center">
                <p className="text-2xl font-mono font-bold text-foreground">{questionCount}</p>
                <p className="text-xs text-muted-foreground">Questions</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-mono font-bold text-foreground">74%</p>
                <p className="text-xs text-muted-foreground">To Pass</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-mono font-bold text-foreground">{passingScore}</p>
                <p className="text-xs text-muted-foreground">Correct Needed</p>
              </div>
            </div>

            <Button size="lg" onClick={handleStartTest} className="gap-2">
              <Play className="w-5 h-5" />
              Start Test
            </Button>
          </motion.div>

          {/* Test History Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border border-border rounded-xl p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <History className="w-5 h-5 text-muted-foreground" />
              <h2 className="font-semibold text-foreground">Recent Tests</h2>
            </div>

            {historyLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : historyError ? (
              <div className="text-center py-8">
                <AlertTriangle className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Could not load test history</p>
              </div>
            ) : !hasHistory ? (
              <div className="text-center py-8">
                <History className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No tests taken yet</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Complete a test to see your history</p>
              </div>
            ) : (
              <div className="space-y-2">
                {testHistory.map((test, index) => (
                  <motion.button
                    key={test.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => onReviewTest?.(test.id)}
                    disabled={!onReviewTest}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg border border-border text-left transition-colors",
                      onReviewTest && "hover:border-primary/50 cursor-pointer group"
                    )}
                  >
                    {/* Pass/Fail Icon */}
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                      test.passed ? "bg-success/10" : "bg-destructive/10"
                    )}>
                      {test.passed ? (
                        <Trophy className="w-4 h-4 text-success" />
                      ) : (
                        <XCircle className="w-4 h-4 text-destructive" />
                      )}
                    </div>

                    {/* Score Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "font-bold",
                          test.passed ? "text-success" : "text-destructive"
                        )}>
                          {test.percentage}%
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({test.score}/{test.total_questions})
                        </span>
                        {test.passed && (
                          <span className="text-[10px] bg-success/10 text-success px-1.5 py-0.5 rounded font-medium">
                            PASS
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {formatDate(test.completed_at)}
                      </p>
                    </div>

                    {/* Review Arrow */}
                    {onReviewTest && (
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                    )}
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </PageContainer>
    );
  }
  if (!currentQuestion) {
    return (
      <PageContainer width="narrow" mobileNavPadding className="flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">No questions available</p>
          <Button onClick={onBack}>Go Back</Button>
        </div>
      </PageContainer>
    );
  }

  const handleFinishInternal = async () => {
    setIsFinished(true);
    const result = await saveTestResult(questions, answers, testType);
    if (result) {
      toast.success('Test results saved!');
    }
  };

  const handleFinish = () => {
    handleFinishInternal();
  };

  const handleRetake = () => {
    setAnswers({});
    setCurrentIndex(0);
    setIsFinished(false);
    setHasStarted(false);
    setTimeRemaining(120 * 60);
  };

  const handleTimerToggle = (enabled: boolean) => {
    setTimerEnabled(enabled);
    if (enabled) {
      setTimeRemaining(120 * 60);
    }
  };
  if (isFinished) {
    return <TestResults questions={questions} answers={answers} onRetake={handleRetake} onBack={onBack} testType={testType} />;
  }

  return (
    <PageContainer width="standard" mobileNavPadding>
      {/* Header - Refined Minimal */}
      <div className="mb-12">
        {/* Top row: Timer toggle and keyboard help */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch id="timer-toggle" checked={timerEnabled} onCheckedChange={handleTimerToggle} />
              <Label htmlFor="timer-toggle" className="text-sm text-muted-foreground cursor-pointer">
                Timer
              </Label>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-3.5 h-3.5 text-muted-foreground/60 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">
                  The real exam has no official time limit—only how long your Volunteer Examiners are willing to wait (typically around 2 hours). This timer is optional for practice.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="flex items-center gap-4">
            {timerEnabled && (
              <div
                role="timer"
                aria-label={`Time remaining: ${formatTime(timeRemaining)}`}
                className={cn(
                  "inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-mono",
                  timeRemaining < 300
                    ? "bg-destructive/10 text-destructive"
                    : "text-muted-foreground"
                )}
              >
                <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                {formatTime(timeRemaining)}
              </div>
            )}
            <KeyboardShortcutsHelp />
          </div>

          {/* Screen reader announcement for timer warnings */}
          <div aria-live="assertive" aria-atomic="true" className="sr-only">
            {timerAnnouncement}
          </div>
        </div>

        {/* Progress - Minimal bar with count */}
        <div className="space-y-3">
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-primary rounded-full transition-all duration-300"
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span className="font-mono">{answeredCount} / {questions.length}</span>
          </div>
        </div>
      </div>

      {/* Question */}
      <QuestionCard question={currentQuestion} selectedAnswer={answers[currentQuestion.id] || null} onSelectAnswer={handleSelectAnswer} showResult={false} questionNumber={currentIndex + 1} totalQuestions={questions.length} />

      {/* Navigation */}
      <div className="mt-10">
        <div className="flex items-center justify-between gap-4">
          <Button variant="outline" onClick={handlePrevious} disabled={currentIndex === 0} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Previous
          </Button>

          {/* Question Navigator */}
          <div className="hidden md:flex flex-wrap justify-center gap-1 max-w-md" role="navigation" aria-label="Question navigator">
            {questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Question ${idx + 1}${answers[q.id] ? ', answered' : ', unanswered'}${idx === currentIndex ? ', current' : ''}`}
                aria-current={idx === currentIndex ? 'step' : undefined}
                className={`w-8 h-8 rounded text-xs font-mono transition-colors ${idx === currentIndex ? "bg-primary text-primary-foreground" : answers[q.id] ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground hover:bg-secondary"}`}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          {currentIndex === questions.length - 1 ? <Button onClick={handleFinish} className="gap-2" variant={answeredCount === questions.length ? "default" : "secondary"}>
              <CheckCircle className="w-4 h-4" />
              Finish Test
            </Button> : <Button onClick={handleNext} className="gap-2">
              Next
              <ArrowRight className="w-4 h-4" />
            </Button>}
        </div>

        {/* Unanswered Warning */}
        {currentIndex === questions.length - 1 && answeredCount < questions.length && <motion.p initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} className="text-center text-muted-foreground text-sm mt-4">
            You have {questions.length - answeredCount} unanswered question(s).
            You can still submit, but unanswered questions will be marked incorrect.
          </motion.p>}
      </div>
    </PageContainer>
  );
}