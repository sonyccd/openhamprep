import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import { BookmarkList } from "@/components/bookmarks/BookmarkList";
import { BookmarkQuestionView } from "@/components/bookmarks/BookmarkQuestionView";
import { useQuestionsByIds } from "@/hooks/useQuestions";
import { useBookmarks } from "@/hooks/useBookmarks";
import { useAppNavigation } from "@/hooks/useAppNavigation";
import { useKeyboardShortcuts, KeyboardShortcut } from "@/hooks/useKeyboardShortcuts";
import { TestType } from "@/types/navigation";
import { PageContainer } from "@/components/ohp/PageContainer";
import { filterByTestType } from "@/lib/testTypeUtils";


interface BookmarkedQuestionsProps {
  onBack: () => void;
  onStartPractice: () => void;
  testType: TestType;
}
export function BookmarkedQuestions({
  onBack,
  onStartPractice,
  testType
}: BookmarkedQuestionsProps) {
  const { navigateToTopic } = useAppNavigation();
  const {
    bookmarks,
    isLoading: bookmarksLoading,
    removeBookmark
  } = useBookmarks();

  // Filter bookmarks by test type first (same logic as AppLayout sidebar count)
  // This ensures the displayed list matches the count shown in the sidebar
  const filteredBookmarks = filterByTestType(
    bookmarks || [],
    testType,
    (b) => b.display_name
  );

  // Get question UUIDs from filtered bookmarks
  const bookmarkQuestionIds = filteredBookmarks.map(b => b.question_id);

  // Fetch only the bookmarked questions (not all questions)
  const {
    data: bookmarkedQuestions,
    isLoading: questionsLoading
  } = useQuestionsByIds(bookmarkQuestionIds);

  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [showResult, setShowResult] = useState(false);
  const isLoading = questionsLoading || bookmarksLoading;

  const questions = bookmarkedQuestions || [];
  const selectedQuestion = currentIndex !== null ? questions[currentIndex] : null;
  const selectedBookmark = selectedQuestion ? filteredBookmarks?.find(b => b.question_id === selectedQuestion.id) : null;

  // Navigation helpers
  const canGoPrev = currentIndex !== null && currentIndex > 0;
  const canGoNext = currentIndex !== null && currentIndex < questions.length - 1;

  const handlePrevQuestion = () => {
    if (canGoPrev) {
      setCurrentIndex(currentIndex - 1);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };

  const handleNextQuestion = () => {
    if (canGoNext) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };

  const handleRandomize = () => {
    if (questions.length <= 1) return;
    // Pick a random index different from current with max iteration guard
    let newIndex: number;
    let attempts = 0;
    const maxAttempts = 10;
    do {
      newIndex = Math.floor(Math.random() * questions.length);
      attempts++;
    } while (newIndex === currentIndex && attempts < maxAttempts);
    setCurrentIndex(newIndex);
    setSelectedAnswer(null);
    setShowResult(false);
  };

  // Reset state when test type changes
  useEffect(() => {
    setCurrentIndex(null);
    setSelectedAnswer(null);
    setShowResult(false);
  }, [testType]);

  // Keyboard shortcuts for bookmarked question view - must be before any early returns
  const handleAnswerSelect = (answer: 'A' | 'B' | 'C' | 'D') => {
    if (!showResult) {
      setSelectedAnswer(answer);
      setShowResult(true);
    }
  };

  const shortcuts: KeyboardShortcut[] = [
    { key: 'a', description: 'Select A', action: () => handleAnswerSelect('A'), disabled: showResult },
    { key: 'b', description: 'Select B', action: () => handleAnswerSelect('B'), disabled: showResult },
    { key: 'c', description: 'Select C', action: () => handleAnswerSelect('C'), disabled: showResult },
    { key: 'd', description: 'Select D', action: () => handleAnswerSelect('D'), disabled: showResult },
    { key: 'ArrowLeft', description: 'Previous', action: handlePrevQuestion, disabled: !canGoPrev },
    { key: 'ArrowRight', description: 'Next', action: handleNextQuestion, disabled: !canGoNext },
    { key: 'Escape', description: 'Go back', action: () => { setCurrentIndex(null); setSelectedAnswer(null); setShowResult(false); } },
  ];

  useKeyboardShortcuts(shortcuts, { enabled: !!selectedQuestion });

  if (isLoading) {
    return (
      <PageContainer
        width="standard"
        mobileNavPadding
        sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <Box sx={{ textAlign: "center" }}>
          <CircularProgress size={32} sx={{ mb: 2 }} />
          <Typography sx={{ color: "text.secondary" }}>Loading bookmarks...</Typography>
        </Box>
      </PageContainer>
    );
  }

  const backToList = () => {
    setCurrentIndex(null);
    setSelectedAnswer(null);
    setShowResult(false);
  };

  if (selectedQuestion) {
    return (
      <PageContainer width="standard" mobileNavPadding>
        <BookmarkQuestionView
          question={selectedQuestion}
          note={selectedBookmark?.note}
          selectedAnswer={selectedAnswer}
          showResult={showResult}
          index={currentIndex}
          total={questions.length}
          canGoPrev={canGoPrev}
          canGoNext={canGoNext}
          onSelectAnswer={(answer) => {
            setSelectedAnswer(answer);
            setShowResult(true);
          }}
          onBackToList={backToList}
          onPrev={handlePrevQuestion}
          onNext={handleNextQuestion}
          onRandomize={handleRandomize}
          onTryAgain={() => {
            setSelectedAnswer(null);
            setShowResult(false);
          }}
          onTopicClick={navigateToTopic}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer width="standard" mobileNavPadding>
      <BookmarkList
        questions={questions}
        noteFor={(id) => filteredBookmarks?.find((b) => b.question_id === id)?.note}
        onSelect={setCurrentIndex}
        onRemove={(id) => removeBookmark.mutate(id)}
        onStartPractice={onStartPractice}
      />
    </PageContainer>
  );
}
