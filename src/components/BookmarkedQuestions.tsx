import { useState } from "react";
import { Button } from "@/components/ui/button";
import { QuestionCard } from "@/components/QuestionCard";
import { useQuestions, Question } from "@/hooks/useQuestions";
import { useBookmarks } from "@/hooks/useBookmarks";
import { Bookmark, Loader2, Trash2, MessageSquare, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface BookmarkedQuestionsProps {
  onBack: () => void;
}

export function BookmarkedQuestions({ onBack }: BookmarkedQuestionsProps) {
  const { data: allQuestions, isLoading: questionsLoading } = useQuestions();
  const { bookmarks, isLoading: bookmarksLoading, removeBookmark } = useBookmarks();
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [showResult, setShowResult] = useState(false);

  const isLoading = questionsLoading || bookmarksLoading;

  const bookmarkedQuestions = allQuestions?.filter(q => 
    bookmarks?.some(b => b.question_id === q.id)
  ) || [];

  const selectedQuestion = bookmarkedQuestions.find(q => q.id === selectedQuestionId);
  const selectedBookmark = bookmarks?.find(b => b.question_id === selectedQuestionId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading bookmarks...</p>
        </div>
      </div>
    );
  }

  if (selectedQuestion) {
    return (
      <div className="min-h-screen bg-background py-8 px-4">
        <div className="max-w-3xl mx-auto mb-8">
          <div className="flex items-center justify-between mb-6">
            <Button 
              variant="ghost" 
              onClick={() => {
                setSelectedQuestionId(null);
                setSelectedAnswer(null);
                setShowResult(false);
              }} 
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Bookmarks
            </Button>
            <div className="flex items-center gap-2 text-foreground">
              <Bookmark className="w-5 h-5" />
              <span className="font-mono font-semibold">Bookmarked</span>
            </div>
          </div>

          {/* Note Display */}
          {selectedBookmark?.note && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-accent/10 border border-accent/30 rounded-lg p-4 mb-4"
            >
              <div className="flex items-start gap-2">
                <MessageSquare className="w-4 h-4 text-accent mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-accent mb-1">Your Note</p>
                  <p className="text-sm text-foreground">{selectedBookmark.note}</p>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        <QuestionCard
          question={selectedQuestion}
          selectedAnswer={selectedAnswer}
          onSelectAnswer={(answer) => {
            setSelectedAnswer(answer);
            setShowResult(true);
          }}
          showResult={showResult}
        />

        {showResult && (
          <div className="max-w-3xl mx-auto mt-8 flex justify-center">
            <Button
              onClick={() => {
                setSelectedAnswer(null);
                setShowResult(false);
              }}
              variant="outline"
            >
              Try Again
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-end mb-8">
          <div className="flex items-center gap-2 text-foreground">
            <Bookmark className="w-5 h-5" />
            <span className="font-mono font-semibold">Bookmarked Questions</span>
          </div>
        </div>

        {bookmarkedQuestions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Bookmark className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-foreground font-medium mb-2">No bookmarks yet</p>
            <p className="text-muted-foreground mb-4">
              Bookmark questions during practice to review them later
            </p>
            <Button onClick={onBack}>Start Practicing</Button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <p className="text-sm text-muted-foreground mb-4">
              {bookmarkedQuestions.length} bookmarked question{bookmarkedQuestions.length !== 1 ? 's' : ''}
            </p>
            {bookmarkedQuestions.map((question) => {
              const bookmark = bookmarks?.find(b => b.question_id === question.id);
              return (
                <div
                  key={question.id}
                  className="bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => setSelectedQuestionId(question.id)}
                      className="flex-1 text-left"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-mono text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                          {question.id}
                        </span>
                        {bookmark?.note && (
                          <span className="flex items-center gap-1 text-xs text-accent">
                            <MessageSquare className="w-3 h-3" />
                            Has note
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-foreground line-clamp-2">
                        {question.question}
                      </p>
                    </button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => removeBookmark.mutate(question.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}
