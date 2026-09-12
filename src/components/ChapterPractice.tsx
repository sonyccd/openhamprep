import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { QuestionCard } from "@/components/QuestionCard";
import { useQuestions } from "@/hooks/useQuestions";
import { useProgress } from "@/hooks/useProgress";
import { useAppNavigation } from "@/hooks/useAppNavigation";
import { useKeyboardShortcuts, KeyboardShortcut } from "@/hooks/useKeyboardShortcuts";
import { KeyboardShortcutsHelp } from "@/components/KeyboardShortcutsHelp";
import { useQuizSession } from "@/hooks/useQuizSession";
import { QuestionListView } from "@/components/QuestionListView";
import { useArrlChaptersWithCounts } from "@/hooks/useArrlChapters";
import { RotateCcw, ChevronRight, CheckCircle, ArrowLeft, Book } from "lucide-react";
import { motion } from "framer-motion";
import { TestType } from "@/types/navigation";
import { PageContainer } from "@/components/ohp/PageContainer";
import { QuizShell, QuizShellPending, QuizShellError, QuizNavControls } from "@/components/QuizShell";
import type { ArrlChapterWithCount, LicenseType } from "@/types/chapters";

interface ChapterPracticeProps {
  onBack: () => void;
  testType: TestType;
}

type ChapterView = 'list' | 'questions' | 'practice';

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

  const [selectedChapter, setSelectedChapter] = useState<ArrlChapterWithCount | null>(null);
  const [chapterView, setChapterView] = useState<ChapterView>('list');

  // Get questions for selected chapter
  const currentQuestions = useMemo(() => {
    if (!selectedChapter || !allQuestions) return [];
    return allQuestions.filter(q => q.arrlChapterId === selectedChapter.id);
  }, [selectedChapter, allQuestions]);

  const session = useQuizSession({
    questions: currentQuestions,
    // Picking a different chapter — including via the test-type reset below,
    // which clears the selection — abandons the session and its score.
    resetKey: selectedChapter?.id ?? null,
    onAttempt: (question, answer, _isCorrect, timeElapsedMs) =>
      saveRandomAttempt(question, answer, 'chapter_practice', timeElapsedMs),
  });

  const { question, selectedAnswer, showResult, stats, canGoBack } = session;

  // Reset state when test type changes
  useEffect(() => {
    setSelectedChapter(null);
    setChapterView('list');
  }, [testType]);

  const handleSelectChapter = (chapter: ArrlChapterWithCount) => {
    setSelectedChapter(chapter);
    setChapterView('questions');
  };

  const handleStartPractice = (startIndex?: number) => {
    setChapterView('practice');
    session.start(startIndex);
  };

  const handleBackToQuestions = () => {
    setChapterView('questions');
    // Leaves the question, not the run: resetKey does not fire here because the
    // chapter is unchanged, and the score carries over to when practice resumes.
    session.clearHistory();
  };

  const handleBackToList = () => {
    setSelectedChapter(null);
    setChapterView('list');
  };

  // Keyboard shortcuts
  const shortcuts: KeyboardShortcut[] = [
    { key: 'a', description: 'Select A', action: () => session.selectAnswer('A'), disabled: showResult || !question },
    { key: 'b', description: 'Select B', action: () => session.selectAnswer('B'), disabled: showResult || !question },
    { key: 'c', description: 'Select C', action: () => session.selectAnswer('C'), disabled: showResult || !question },
    { key: 'd', description: 'Select D', action: () => session.selectAnswer('D'), disabled: showResult || !question },
    { key: 'ArrowRight', description: 'Next', action: session.next, disabled: !showResult },
    { key: 'ArrowLeft', description: 'Previous', action: session.previous, disabled: !canGoBack },
    { key: 's', description: 'Skip', action: session.skip, disabled: showResult || !question },
  ];

  useKeyboardShortcuts(shortcuts, { enabled: chapterView === 'practice' });

  const isLoading = questionsLoading || chaptersLoading;

  if (isLoading) return <QuizShellPending message="Loading chapters..." />;

  if (questionsError || !allQuestions) return <QuizShellError onBack={onBack} />;

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

  // Show question list view
  if (chapterView === 'questions') {
    return (
      <QuestionListView
        title={selectedChapter.title}
        subtitle={`Chapter ${selectedChapter.chapterNumber} from the ARRL textbook`}
        badge={`Ch. ${selectedChapter.chapterNumber}`}
        questions={currentQuestions}
        onBack={handleBackToList}
        onStartPractice={handleStartPractice}
        description={selectedChapter.description || undefined}
      />
    );
  }

  // Show practice view
  if (!question) return <QuizShellPending />;

  const percentage = stats.total > 0 ? Math.round(stats.correct / stats.total * 100) : 0;
  const progress = Math.round(session.askedIds.length / currentQuestions.length * 100);

  return (
    <QuizShell
      header={
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" onClick={handleBackToQuestions} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Question List
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
              <Button variant="ghost" size="sm" onClick={session.reset} className="gap-2">
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
                {session.askedIds.length}/{currentQuestions.length}
              </span>
              {session.askedIds.length === currentQuestions.length && (
                <CheckCircle className="w-4 h-4 text-success" />
              )}
            </div>
          </motion.div>
        </div>
      }
      actions={<QuizNavControls session={session} />}
      footer={
        session.history.length > 1 &&
        `Question ${session.historyIndex + 1} of ${session.history.length}`
      }
    >
      <QuestionCard
        question={question}
        selectedAnswer={selectedAnswer}
        onSelectAnswer={session.selectAnswer}
        showResult={showResult}
        enableGlossaryHighlight
        onTopicClick={navigateToTopic}
      />
    </QuizShell>
  );
}
