import { useState, useEffect, useMemo } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { QuestionCard } from "@/components/QuestionCard";
import { useQuestions } from "@/hooks/useQuestions";
import { useProgress } from "@/hooks/useProgress";
import { useAppNavigation } from "@/hooks/useAppNavigation";
import { useKeyboardShortcuts, KeyboardShortcut } from "@/hooks/useKeyboardShortcuts";
import { KeyboardShortcutsHelp } from "@/components/KeyboardShortcutsHelp";
import { useQuizSession } from "@/hooks/useQuizSession";
import { QuestionListView } from "@/components/QuestionListView";
import { useArrlChaptersWithCounts } from "@/hooks/useArrlChapters";
import { RotateCcw, ArrowLeft, Book } from "lucide-react";
import { MotionBox } from "@/components/ohp/MotionBox";
import { ChoiceRow } from "@/components/ChoiceRow";
import { QuizProgress } from "@/components/QuizProgress";
import { tokenAlpha } from "@/theme/muiTheme";
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

/** One of the three large figures in the chapter practice header. */
const StatTile = ({
  value,
  label,
  color,
}: {
  value: number | string;
  label: string;
  color: string;
}) => (
  <Box sx={{ textAlign: "center" }}>
    <Typography
      component="p"
      sx={{ fontSize: "1.5rem", fontFamily: "monospace", fontWeight: 700, color }}
    >
      {value}
    </Typography>
    <Typography component="p" sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
      {label}
    </Typography>
  </Box>
);

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
        <MotionBox initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} sx={{ mb: 3 }}>
          <Typography
            variant="h5"
            component="h1"
            sx={{ fontFamily: "monospace", fontWeight: 700, mb: 1 }}
          >
            Study by Chapter
          </Typography>
          <Typography sx={{ color: "text.secondary" }}>
            Practice questions organized by ARRL textbook chapters
          </Typography>
        </MotionBox>

        {chaptersWithQuestions.length === 0 && emptyChapters.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 6 }}>
            <Box
              component={Book}
              aria-hidden="true"
              sx={{ width: 48, height: 48, mx: "auto", mb: 2, color: "text.secondary", opacity: 0.5, display: "block" }}
            />
            <Typography sx={{ color: "text.secondary" }}>No chapters have been defined yet.</Typography>
            <Typography sx={{ fontSize: "0.875rem", color: "text.secondary", mt: 1 }}>
              Ask an admin to add ARRL textbook chapters.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {chaptersWithQuestions.length > 0 && (
              <Box sx={{ display: "grid", gap: 1.5 }}>
                {chaptersWithQuestions.map((chapter, index) => (
                  <ChoiceRow
                    key={chapter.id}
                    index={index}
                    badge={chapter.chapterNumber}
                    title={chapter.title}
                    onClick={() => handleSelectChapter(chapter)}
                  />
                ))}
              </Box>
            )}

            {emptyChapters.length > 0 && (
              <Box sx={{ mt: 4 }}>
                <Typography sx={{ fontSize: "0.875rem", color: "text.secondary", mb: 1.5 }}>
                  Chapters without questions:
                </Typography>
                <Box sx={{ display: "grid", gap: 1 }}>
                  {emptyChapters.map((chapter) => (
                    <Box
                      key={chapter.id}
                      sx={{
                        p: 1.5,
                        borderRadius: "8px",
                        border: "1px dashed",
                        borderColor: "divider",
                        bgcolor: (t) => tokenAlpha(t.vars.palette.muted, 30),
                        color: "text.secondary",
                      }}
                    >
                      <Box component="span" sx={{ fontFamily: "monospace", mr: 1 }}>
                        Ch. {chapter.chapterNumber}:
                      </Box>
                      {chapter.title}
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </Box>
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

  return (
    <QuizShell
      header={
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
            <Button
              variant="text"
              onClick={handleBackToQuestions}
              startIcon={<Box component={ArrowLeft} aria-hidden="true" sx={{ width: 16, height: 16 }} />}
              sx={{ color: "text.primary" }}
            >
              Question List
            </Button>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <KeyboardShortcutsHelp />
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "primary.main" }}>
                <Box component={Book} aria-hidden="true" sx={{ width: 16, height: 16 }} />
                <Box component="span" sx={{ fontFamily: "monospace", fontWeight: 700 }}>
                  Ch. {selectedChapter?.chapterNumber}
                </Box>
              </Box>
            </Box>
          </Box>

          <Paper
            component={MotionBox}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            variant="outlined"
            sx={{ p: 2, borderRadius: "8px" }}
          >
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
                <StatTile value={stats.correct} label="Correct" color="success.main" />
                <StatTile value={stats.total - stats.correct} label="Incorrect" color="error.main" />
                <StatTile value={`${percentage}%`} label="Score" color="primary.main" />
              </Box>
              <Button
                variant="text"
                size="small"
                onClick={session.reset}
                startIcon={<Box component={RotateCcw} aria-hidden="true" sx={{ width: 16, height: 16 }} />}
              >
                Reset
              </Button>
            </Box>

            <QuizProgress
              variant="labelled"
              height={8}
              asked={session.askedIds.length}
              total={currentQuestions.length}
            />
          </Paper>
        </Box>
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
