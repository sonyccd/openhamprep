import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { QuestionCard } from "@/components/QuestionCard";
import { TestResults } from "@/components/TestResults";
import { useQuestions, Question } from "@/hooks/useQuestions";
import { useProgress } from "@/hooks/useProgress";
import { useKeyboardShortcuts, KeyboardShortcut } from "@/hooks/useKeyboardShortcuts";
import { KeyboardShortcutsHelp } from "@/components/KeyboardShortcutsHelp";
import { toast } from "sonner";
import { TestType, testConfig, examDistribution } from "@/types/navigation";
import { selectExamQuestions } from "@/lib/examQuestions";
import { trackPracticeTestStarted } from "@/lib/amplitude";
import { PageContainer } from "@/components/ohp/PageContainer";
import { QuizShell, QuizShellPending, QuizShellError } from "@/components/QuizShell";
import { QuizProgress } from "@/components/QuizProgress";
import { useRecentTestHistory } from "@/hooks/useRecentTestHistory";
import { PracticeTestStart } from "./practiceTest/PracticeTestStart";
import { TestNavigator } from "./practiceTest/TestNavigator";
interface PracticeTestProps {
  onBack: () => void;
  onTestStateChange?: (inProgress: boolean) => void;
  testType: TestType;
  onReviewTest?: (testId: string) => void;
}


export function PracticeTest({
  onBack,
  onTestStateChange,
  testType,
  onReviewTest
}: PracticeTestProps) {
  const {
    data: allQuestions,
    isLoading,
    error
  } = useQuestions(testType);
  const {
    saveTestResult
  } = useProgress();

  // Fetch test history for this test type
  const {
    data: testHistory,
    isLoading: historyLoading,
    error: historyError,
  } = useRecentTestHistory(testType);

  const [hasStarted, setHasStarted] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({});
  const [isFinished, setIsFinished] = useState(false);

  const currentQuestion = questions.length > 0 ? questions[currentIndex] : null;
  const answeredCount = Object.keys(answers).length;

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
  }, [testType]);

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
    const examQuestions = selectExamQuestions(allQuestions, questionCount, examDistribution[testType]);
    setQuestions(examQuestions);
    setHasStarted(true);
    trackPracticeTestStarted({ test_type: testType, question_count: questionCount });
  };

  if (isLoading) {
    return (
      <QuizShellPending message="Loading questions..." width="narrow" />
    );
  }
  if (error || !allQuestions || allQuestions.length === 0) {
    return (
      <QuizShellError onBack={onBack} width="narrow" />
    );
  }

  if (!hasStarted) {
    return (
      <PracticeTestStart
        questionCount={questionCount}
        passingScore={passingScore}
        onStart={handleStartTest}
        history={{ tests: testHistory, isLoading: historyLoading, error: historyError }}
        onReviewTest={onReviewTest}
      />
    );
  }

  if (!currentQuestion) {
    return (
      <PageContainer
        width="narrow"
        mobileNavPadding
        contentSx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <Box sx={{ textAlign: "center" }}>
          <Typography sx={{ color: "error.main", mb: 2 }}>No questions available</Typography>
          <Button variant="contained" onClick={onBack}>
            Go Back
          </Button>
        </Box>
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
  };

  if (isFinished) {
    return <TestResults questions={questions} answers={answers} onRetake={handleRetake} onBack={onBack} testType={testType} />;
  }

  return (
    <QuizShell
      header={
        <Box sx={{ mb: 6 }}>
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 4 }}>
            <KeyboardShortcutsHelp />
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <QuizProgress asked={answeredCount} total={questions.length} />
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.75rem",
                color: "text.secondary",
              }}
            >
              <Box component="span">Progress</Box>
              <Box component="span" sx={{ fontFamily: "monospace" }}>
                {answeredCount} / {questions.length}
              </Box>
            </Box>
          </Box>
        </Box>
      }
      actions={
        <TestNavigator
          questions={questions}
          answers={answers}
          currentIndex={currentIndex}
          onGoTo={setCurrentIndex}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onFinish={handleFinish}
        />
      }
    >
      <QuestionCard question={currentQuestion} selectedAnswer={answers[currentQuestion.id] || null} onSelectAnswer={handleSelectAnswer} showResult={false} />
    </QuizShell>
  );
}