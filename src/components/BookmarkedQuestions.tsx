import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { QuestionCard } from "@/components/QuestionCard";
import { useQuestionsByIds } from "@/hooks/useQuestions";
import { useBookmarks } from "@/hooks/useBookmarks";
import { useAppNavigation } from "@/hooks/useAppNavigation";
import { useKeyboardShortcuts, KeyboardShortcut } from "@/hooks/useKeyboardShortcuts";
import { KeyboardShortcutsHelp } from "@/components/KeyboardShortcutsHelp";
import { Bookmark, Loader2, Trash2, MessageSquare, ArrowLeft, ChevronLeft, ChevronRight, Dices } from "lucide-react";
import { motion } from "framer-motion";
import { TestType } from "@/types/navigation";
import { PageContainer } from "@/components/ui/page-container";
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
      <PageContainer width="standard" mobileNavPadding className="flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading bookmarks...</p>
        </div>
      </PageContainer>
    );
  }

  if (selectedQuestion) {
    return (
      <PageContainer width="standard" mobileNavPadding>
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" onClick={() => {
            setCurrentIndex(null);
            setSelectedAnswer(null);
            setShowResult(false);
          }} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Bookmarks
            </Button>
            <div className="flex items-center gap-2">
              <KeyboardShortcutsHelp />
              <div className="flex items-center gap-2 text-foreground">
                <Bookmark className="w-5 h-5" />
                <span className="font-mono font-semibold">Bookmarked</span>
              </div>
            </div>
          </div>

          {/* Note Display */}
          {selectedBookmark?.note && <motion.div initial={{
          opacity: 0,
          y: -10
        }} animate={{
          opacity: 1,
          y: 0
        }} className="bg-accent/10 border border-accent/30 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-2">
                <MessageSquare className="w-4 h-4 text-accent mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-accent mb-1">Your Note</p>
                  <p className="text-sm text-foreground">{selectedBookmark.note}</p>
                </div>
              </div>
            </motion.div>}
        </div>

        <QuestionCard question={selectedQuestion} selectedAnswer={selectedAnswer} onSelectAnswer={answer => {
        setSelectedAnswer(answer);
        setShowResult(true);
      }} showResult={showResult} enableGlossaryHighlight onTopicClick={navigateToTopic} />

        {/* Navigation Actions */}
        <div className="mt-8 flex justify-center gap-4">
          <Button variant="outline" onClick={handlePrevQuestion} disabled={!canGoPrev} className="gap-2">
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            onClick={handleRandomize}
            disabled={questions.length <= 1}
            className="gap-2"
            title="Random question"
            aria-label="Jump to random question"
          >
            <Dices className="w-4 h-4" />
          </Button>
          {showResult && <Button onClick={() => {
            setSelectedAnswer(null);
            setShowResult(false);
          }} variant="outline">
            Try Again
          </Button>}
          <Button variant={showResult ? "default" : "outline"} onClick={handleNextQuestion} disabled={!canGoNext} className="gap-2">
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Question counter */}
        {questions.length > 1 && <motion.p initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} className="text-center text-muted-foreground text-sm mt-4">
            Question {currentIndex + 1} of {questions.length}
          </motion.p>}
      </PageContainer>
    );
  }
  return (
    <PageContainer width="standard" mobileNavPadding>
        {questions.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <motion.div initial={{
                opacity: 0
              }} animate={{
                opacity: 1
              }} className="text-center py-8">
                <Bookmark className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-foreground font-medium mb-2">No bookmarks yet</p>
                <p className="text-muted-foreground mb-4">
                  Bookmark questions during practice to review them later
                </p>
                <Button onClick={onStartPractice}>Start Practicing</Button>
              </motion.div>
            </CardContent>
          </Card>
        ) : (
          <motion.div initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} className="space-y-3">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Bookmark className="w-5 h-5" />
                Bookmarked Questions
              </h2>
              <p className="text-sm text-muted-foreground">
                {questions.length} question{questions.length !== 1 ? 's' : ''}
              </p>
            </div>
            {questions.map((question, index) => {
              const bookmark = filteredBookmarks?.find(b => b.question_id === question.id);
              return <div key={question.id} className="bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-colors">
                <div className="flex items-start gap-4">
                  <button onClick={() => setCurrentIndex(index)} className="flex-1 text-left">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                        {question.displayName}
                      </span>
                      {bookmark?.note && <span className="flex items-center gap-1 text-xs text-accent">
                        <MessageSquare className="w-3 h-3" />
                        Has note
                      </span>}
                    </div>
                    <p className="text-sm text-foreground line-clamp-2">
                      {question.question}
                    </p>
                  </button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => removeBookmark.mutate(question.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>;
            })}
          </motion.div>
        )}
    </PageContainer>
  );
}