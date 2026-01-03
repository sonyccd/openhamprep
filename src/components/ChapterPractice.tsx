import { useState, useCallback, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { QuestionCard } from "@/components/QuestionCard";
import { useQuestions, Question } from "@/hooks/useQuestions";
import { useProgress } from "@/hooks/useProgress";
import { useAppNavigation } from "@/hooks/useAppNavigation";
import { usePostHog, ANALYTICS_EVENTS } from "@/hooks/usePostHog";
import { useKeyboardShortcuts, KeyboardShortcut } from "@/hooks/useKeyboardShortcuts";
import { KeyboardShortcutsHelp } from "@/components/KeyboardShortcutsHelp";
import { useArrlChaptersWithCounts } from "@/hooks/useArrlChapters";
import { ChapterLanding } from "@/components/ChapterLanding";
import { SkipForward, RotateCcw, Loader2, ChevronRight, CheckCircle, ArrowLeft, ChevronLeft, Book } from "lucide-react";
import { motion } from "framer-motion";
import { TestType } from "@/types/navigation";
import { PageContainer } from "@/components/ui/page-container";
import type { ArrlChapterWithCount, LicenseType } from "@/types/chapters";

interface HistoryEntry {
  question: Question;
  selectedAnswer: 'A' | 'B' | 'C' | 'D' | null;
  showResult: boolean;
}

interface ChapterPracticeProps {
  onBack: () => void;
  testType: TestType;
}

type ChapterView = 'list' | 'landing' | 'practice';

// Map test type to license type
const TEST_TYPE_TO_LICENSE: Record<TestType, LicenseType> = {
  technician: 'T',
  general: 'G',
  extra: 'E',
};

export function ChapterPractice({
  onBack,
  testType
}: ChapterPracticeProps) {
  const { navigateToTopic } = useAppNavigation();
  const licenseType = TEST_TYPE_TO_LICENSE[testType];

  const {
    data: allQuestions,
    isLoading: questionsLoading,
    error: questionsError
  } = useQuestions(testType);

  const {
    data: chapters,
    isLoading: chaptersLoading,
  } = useArrlChaptersWithCounts(licenseType);

  const { saveRandomAttempt } = useProgress();
  const { capture } = usePostHog();

  const [selectedChapter, setSelectedChapter] = useState<ArrlChapterWithCount | null>(null);
  const [chapterView, setChapterView] = useState<ChapterView>('list');
  const [stats, setStats] = useState({
    correct: 0,
    total: 0
  });
  const [askedIds, setAskedIds] = useState<string[]>([]);

  // Session history for back navigation
  const [questionHistory, setQuestionHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Current question from history
  const currentEntry = historyIndex >= 0 ? questionHistory[historyIndex] : null;
  const question = currentEntry?.question || null;
  const selectedAnswer = currentEntry?.selectedAnswer || null;
  const showResult = currentEntry?.showResult || false;

  // Reset state when test type changes
  useEffect(() => {
    setSelectedChapter(null);
    setChapterView('list');
    setQuestionHistory([]);
    setHistoryIndex(-1);
    setStats({ correct: 0, total: 0 });
    setAskedIds([]);
  }, [testType]);

  // Get questions for selected chapter
  const currentQuestions = useMemo(() => {
    if (!selectedChapter || !allQuestions) return [];
    return allQuestions.filter(q => q.arrlChapterId === selectedChapter.id);
  }, [selectedChapter, allQuestions]);

  const getRandomQuestion = useCallback((excludeIds: string[] = []): { question: Question; shouldResetAskedIds: boolean } | null => {
    if (currentQuestions.length === 0) return null;
    const available = currentQuestions.filter(q => !excludeIds.includes(q.id));
    if (available.length === 0) {
      // All questions have been asked, wrap around
      return {
        question: currentQuestions[Math.floor(Math.random() * currentQuestions.length)],
        shouldResetAskedIds: true
      };
    }
    return {
      question: available[Math.floor(Math.random() * available.length)],
      shouldResetAskedIds: false
    };
  }, [currentQuestions]);

  // Update current entry in history
  const updateCurrentEntry = (updates: Partial<HistoryEntry>) => {
    setQuestionHistory(prev => {
      const newHistory = [...prev];
      if (historyIndex >= 0 && historyIndex < newHistory.length) {
        newHistory[historyIndex] = { ...newHistory[historyIndex], ...updates };
      }
      return newHistory;
    });
  };

  const handleSelectChapter = (chapter: ArrlChapterWithCount) => {
    setSelectedChapter(chapter);
    setChapterView('landing');
    setQuestionHistory([]);
    setHistoryIndex(-1);
    setStats({
      correct: 0,
      total: 0
    });
    setAskedIds([]);

    capture(ANALYTICS_EVENTS.TOPIC_SELECTED, {
      chapter_id: chapter.id,
      chapter_number: chapter.chapterNumber,
      chapter_title: chapter.title
    });
  };

  const handleStartPractice = () => {
    setChapterView('practice');
    const result = getRandomQuestion();
    if (result) {
      setQuestionHistory([{ question: result.question, selectedAnswer: null, showResult: false }]);
      setHistoryIndex(0);
    }
    capture(ANALYTICS_EVENTS.SUBELEMENT_PRACTICE_STARTED, {
      chapter_id: selectedChapter?.id,
      chapter_number: selectedChapter?.chapterNumber,
      chapter_title: selectedChapter?.title
    });
  };

  const handleBackToLanding = () => {
    setChapterView('landing');
    setQuestionHistory([]);
    setHistoryIndex(-1);
  };

  const handleBackToList = () => {
    setSelectedChapter(null);
    setChapterView('list');
    setQuestionHistory([]);
    setHistoryIndex(-1);
    setStats({
      correct: 0,
      total: 0
    });
    setAskedIds([]);
  };

  // Current question from history
  const canGoBack = historyIndex > 0;

  const handleSelectAnswer = async (answer: 'A' | 'B' | 'C' | 'D') => {
    if (showResult || !question) return;

    updateCurrentEntry({ selectedAnswer: answer, showResult: true });

    const isCorrect = answer === question.correctAnswer;
    setStats(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1
    }));
    await saveRandomAttempt(question, answer, 'chapter_practice');
  };

  const handleNextQuestion = () => {
    if (!question) return;
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
        setQuestionHistory([{ question: result.question, selectedAnswer: null, showResult: false }]);
        setHistoryIndex(0);
      } else {
        setAskedIds(newAskedIds);
        setQuestionHistory(prev => [...prev, { question: result.question, selectedAnswer: null, showResult: false }]);
        setHistoryIndex(prev => prev + 1);
      }
    }
  };

  const handleSkip = () => {
    if (!question) return;
    const newAskedIds = [...askedIds, question.id];
    const result = getRandomQuestion(newAskedIds);
    if (result) {
      // If we've gone through all questions, reset the asked IDs to start fresh
      if (result.shouldResetAskedIds) {
        setAskedIds([result.question.id]);
        setQuestionHistory([{ question: result.question, selectedAnswer: null, showResult: false }]);
        setHistoryIndex(0);
      } else {
        setAskedIds(newAskedIds);
        setQuestionHistory(prev => [...prev, { question: result.question, selectedAnswer: null, showResult: false }]);
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
      setQuestionHistory([{ question: result.question, selectedAnswer: null, showResult: false }]);
      setHistoryIndex(0);
    }
    setStats({
      correct: 0,
      total: 0
    });
  };

  // Keyboard shortcuts
  const shortcuts: KeyboardShortcut[] = [
    { key: 'a', description: 'Select A', action: () => handleSelectAnswer('A'), disabled: showResult || !question },
    { key: 'b', description: 'Select B', action: () => handleSelectAnswer('B'), disabled: showResult || !question },
    { key: 'c', description: 'Select C', action: () => handleSelectAnswer('C'), disabled: showResult || !question },
    { key: 'd', description: 'Select D', action: () => handleSelectAnswer('D'), disabled: showResult || !question },
    { key: 'ArrowRight', description: 'Next', action: handleNextQuestion, disabled: !showResult },
    { key: 'ArrowLeft', description: 'Previous', action: handlePreviousQuestion, disabled: !canGoBack },
    { key: 's', description: 'Skip', action: handleSkip, disabled: showResult || !question },
  ];

  useKeyboardShortcuts(shortcuts, { enabled: chapterView === 'practice' });

  const isLoading = questionsLoading || chaptersLoading;

  if (isLoading) {
    return (
      <PageContainer width="standard" mobileNavPadding className="flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading chapters...</p>
        </div>
      </PageContainer>
    );
  }

  if (questionsError || !allQuestions) {
    return (
      <PageContainer width="standard" mobileNavPadding className="flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">Failed to load questions</p>
          <Button onClick={onBack}>Go Back</Button>
        </div>
      </PageContainer>
    );
  }

  // Show chapter selection list
  if (chapterView === 'list' || !selectedChapter) {
    const chaptersWithQuestions = chapters?.filter(c => c.questionCount > 0) || [];
    const emptyChapters = chapters?.filter(c => c.questionCount === 0) || [];

    return (
      <PageContainer width="standard" mobileNavPadding>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-mono font-bold text-foreground mb-2">
            Study by Chapter
          </h1>
          <p className="text-muted-foreground">
            Practice questions organized by ARRL textbook chapters
          </p>
        </motion.div>

        {chaptersWithQuestions.length === 0 && emptyChapters.length === 0 ? (
          <div className="text-center py-12">
            <Book className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              No chapters have been defined yet.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Ask an admin to add ARRL textbook chapters.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {chaptersWithQuestions.length > 0 && (
              <div className="grid gap-3">
                {chaptersWithQuestions.map((chapter, index) => (
                  <motion.button
                    key={chapter.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleSelectChapter(chapter)}
                    className="w-full p-4 rounded-xl border bg-card text-left hover:bg-secondary hover:border-foreground/20 hover:shadow-lg transition-all duration-200 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center font-mono font-bold text-foreground">
                          {chapter.chapterNumber}
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {chapter.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {chapter.questionCount} questions
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                  </motion.button>
                ))}
              </div>
            )}

            {emptyChapters.length > 0 && (
              <div className="mt-8">
                <p className="text-sm text-muted-foreground mb-3">
                  Chapters without questions:
                </p>
                <div className="grid gap-2">
                  {emptyChapters.map((chapter) => (
                    <div
                      key={chapter.id}
                      className="p-3 rounded-lg border border-dashed bg-muted/30 text-muted-foreground"
                    >
                      <span className="font-mono mr-2">Ch. {chapter.chapterNumber}:</span>
                      {chapter.title}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </PageContainer>
    );
  }

  // Show chapter landing page
  if (chapterView === 'landing') {
    return (
      <ChapterLanding
        chapter={selectedChapter}
        questions={currentQuestions}
        onBack={handleBackToList}
        onStartPractice={handleStartPractice}
      />
    );
  }

  // Show practice view
  if (!question) {
    return (
      <PageContainer width="standard" mobileNavPadding className="flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </PageContainer>
    );
  }

  const isViewingHistory = historyIndex < questionHistory.length - 1;
  const percentage = stats.total > 0 ? Math.round(stats.correct / stats.total * 100) : 0;
  const progress = Math.round(askedIds.length / currentQuestions.length * 100);

  return (
    <PageContainer width="standard" mobileNavPadding>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={handleBackToLanding} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Chapter Overview
          </Button>
          <div className="flex items-center gap-2">
            <KeyboardShortcutsHelp />
            <div className="flex items-center gap-2 text-primary">
              <Book className="w-4 h-4" />
              <span className="font-mono font-bold">Ch. {selectedChapter?.chapterNumber}</span>
            </div>
          </div>
        </div>

        {/* Progress & Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-lg p-4"
        >
          <div className="flex items-center justify-between mb-3">
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
          </div>

          {/* Chapter progress bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-primary rounded-full"
              />
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              {askedIds.length}/{currentQuestions.length}
            </span>
            {askedIds.length === currentQuestions.length && (
              <CheckCircle className="w-4 h-4 text-success" />
            )}
          </div>
        </motion.div>
      </div>

      {/* Question */}
      <QuestionCard
        question={question}
        selectedAnswer={selectedAnswer}
        onSelectAnswer={handleSelectAnswer}
        showResult={showResult}
        enableGlossaryHighlight
        onTopicClick={navigateToTopic}
      />

      {/* Actions */}
      <div className="mt-8 flex justify-center gap-4">
        {canGoBack && (
          <Button variant="outline" onClick={handlePreviousQuestion} className="gap-2">
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>
        )}
        {!showResult ? (
          <Button variant="outline" onClick={handleSkip} className="gap-2">
            <SkipForward className="w-4 h-4" />
            Skip Question
          </Button>
        ) : (
          <Button onClick={handleNextQuestion} variant="default" size="lg" className="gap-2">
            {isViewingHistory ? "Next" : "Next Question"}
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* History indicator */}
      {questionHistory.length > 1 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-muted-foreground text-sm mt-4"
        >
          Question {historyIndex + 1} of {questionHistory.length}
        </motion.p>
      )}
    </PageContainer>
  );
}
