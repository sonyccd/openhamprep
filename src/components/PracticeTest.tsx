import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { QuestionCard } from "@/components/QuestionCard";
import { TestResults } from "@/components/TestResults";
import { useQuestions, Question } from "@/hooks/useQuestions";
import { useProgress } from "@/hooks/useProgress";
import { usePostHog, ANALYTICS_EVENTS } from "@/hooks/usePostHog";
import { useKeyboardShortcuts, KeyboardShortcut } from "@/hooks/useKeyboardShortcuts";
import { KeyboardShortcutsHelp } from "@/components/KeyboardShortcutsHelp";
import { ArrowLeft, ArrowRight, CheckCircle, Loader2, Clock, Info, Play, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TestType, testConfig } from "@/types/navigation";
import { PageContainer } from "@/components/ui/page-container";
interface PracticeTestProps {
  onBack: () => void;
  onTestStateChange?: (inProgress: boolean) => void;
  testType: TestType;
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
  testType
}: PracticeTestProps) {
  const {
    data: allQuestions,
    isLoading,
    error
  } = useQuestions(testType);
  const {
    saveTestResult
  } = useProgress();
  const { capture } = usePostHog();
  const [hasStarted, setHasStarted] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({});
  const [isFinished, setIsFinished] = useState(false);

  // Timer state
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(120 * 60); // 120 minutes in seconds

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
    capture(ANALYTICS_EVENTS.PRACTICE_TEST_STARTED, { question_count: questionCount });
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
    return (
      <PageContainer width="narrow" mobileNavPadding>
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            
            
          </div>

          {/* Start Card */}
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} className="bg-card border border-border rounded-xl p-8 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Play className="w-8 h-8 text-primary" />
            </div>
            
            <h1 className="text-2xl font-mono font-bold text-foreground mb-4">
              Ready to Begin?
            </h1>
            
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              This practice test simulates the real Amateur Radio exam with {questionCount} randomly selected questions.
            </p>

            {/* Warning Box */}
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 mb-8">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <div className="text-left">
                  <p className="text-sm font-medium text-destructive mb-1">
                    Important: Progress will not be saved
                  </p>
                  <p className="text-sm text-muted-foreground">
                    If you navigate away or exit the test before completing it, your progress will be lost. This simulates real exam conditions.
                  </p>
                </div>
              </div>
            </div>

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
      const correctCount = questions.filter(q => answers[q.id] === q.correctAnswer).length;
      const percentage = Math.round((correctCount / questions.length) * 100);
      const passed = percentage >= 74;
      
      capture(ANALYTICS_EVENTS.PRACTICE_TEST_COMPLETED, {
        score: correctCount,
        total: questions.length,
        percentage,
        passed,
        timer_enabled: timerEnabled,
      });
      
      if (passed) {
        capture(ANALYTICS_EVENTS.PRACTICE_TEST_PASSED, { percentage });
      } else {
        capture(ANALYTICS_EVENTS.PRACTICE_TEST_FAILED, { percentage });
      }
      
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
              <div className={cn(
                "inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-mono",
                timeRemaining < 300
                  ? "bg-destructive/10 text-destructive"
                  : "text-muted-foreground"
              )}>
                <Clock className="w-3.5 h-3.5" />
                {formatTime(timeRemaining)}
              </div>
            )}
            <KeyboardShortcutsHelp />
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
          <div className="hidden md:flex flex-wrap justify-center gap-1 max-w-md">
            {questions.map((q, idx) => <button key={q.id} onClick={() => setCurrentIndex(idx)} className={`w-8 h-8 rounded text-xs font-mono transition-colors ${idx === currentIndex ? "bg-primary text-primary-foreground" : answers[q.id] ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground hover:bg-secondary"}`}>
                {idx + 1}
              </button>)}
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