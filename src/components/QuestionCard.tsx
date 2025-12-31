import { useState } from "react";
import { Question } from "@/hooks/useQuestions";
import { useBookmarks } from "@/hooks/useBookmarks";
import { useAuth } from "@/hooks/useAuth";
import { useExplanationFeedback } from "@/hooks/useExplanationFeedback";
import { cn, getSafeUrl } from "@/lib/utils";
import { motion } from "framer-motion";
import { Bookmark, BookmarkCheck, MessageSquare, ThumbsUp, ThumbsDown, ExternalLink, Users, Link } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calculator } from "@/components/Calculator";
import { LinkPreview } from "@/components/LinkPreview";
import { GlossaryHighlightedText } from "@/components/GlossaryHighlightedText";
import { MarkdownText } from "@/components/MarkdownText";
import { FigureImage } from "@/components/FigureImage";
import type { LinkData } from "@/hooks/useQuestions";

/**
 * Constructs a Discourse auth URL that logs the user in via OIDC
 * and redirects them to the specified forum topic after authentication.
 *
 * @param forumUrl - The full forum topic URL (e.g., https://forum.openhamprep.com/t/topic/123)
 * @returns The OIDC auth URL with origin parameter for post-auth redirect
 */
function getForumAuthUrl(forumUrl: string): string | null {
  // First validate the URL is safe (http/https only)
  const safeUrl = getSafeUrl(forumUrl);
  if (!safeUrl) return null;

  try {
    const url = new URL(safeUrl);
    // Extract the path (e.g., /t/topic-slug/123) to use as the origin parameter
    const origin = url.pathname + url.search + url.hash;
    return `https://forum.openhamprep.com/auth/oidc?origin=${encodeURIComponent(origin)}`;
  } catch {
    // URL parsing failed - return null for safety
    return null;
  }
}

interface QuestionCardProps {
  question: Question;
  selectedAnswer: string | null;
  onSelectAnswer: (answer: 'A' | 'B' | 'C' | 'D') => void;
  showResult?: boolean;
  questionNumber?: number;
  totalQuestions?: number;
  enableGlossaryHighlight?: boolean; // Enable glossary term highlighting (disabled during practice tests)
  hideLinks?: boolean; // Hide links during active practice test (show only on review)
}

export function QuestionCard({
  question,
  selectedAnswer,
  onSelectAnswer,
  showResult = false,
  questionNumber,
  totalQuestions,
  hideLinks = false,
  enableGlossaryHighlight = false,
}: QuestionCardProps) {
  const options = ['A', 'B', 'C', 'D'] as const;
  const { user } = useAuth();
  const { isBookmarked, addBookmark, removeBookmark, getBookmarkNote, updateNote } = useBookmarks();
  const { userFeedback, submitFeedback, removeFeedback } = useExplanationFeedback(question.id);
  const [noteText, setNoteText] = useState('');
  const [isNoteOpen, setIsNoteOpen] = useState(false);

  const bookmarked = isBookmarked(question.id);
  const existingNote = getBookmarkNote(question.id);

  const handleFeedback = (isHelpful: boolean) => {
    if (userFeedback?.is_helpful === isHelpful) {
      // Toggle off if clicking the same button
      removeFeedback.mutate(question.id);
    } else {
      submitFeedback.mutate({ question_id: question.id, is_helpful: isHelpful });
    }
  };

  const handleBookmarkClick = () => {
    if (bookmarked) {
      removeBookmark.mutate(question.id);
    } else {
      addBookmark.mutate({ questionId: question.id });
    }
  };

  const handleSaveNote = () => {
    if (!bookmarked) {
      addBookmark.mutate({ questionId: question.id, note: noteText });
    } else {
      updateNote.mutate({ questionId: question.id, note: noteText });
    }
    setIsNoteOpen(false);
  };

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/questions/${question.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const getOptionStyles = (option: typeof options[number]) => {
    if (!showResult) {
      return selectedAnswer === option
        ? "border-primary bg-primary/10 text-foreground"
        : "border-border hover:border-primary/50 hover:bg-secondary/50";
    }

    if (option === question.correctAnswer) {
      return "border-success bg-success/10 text-success";
    }

    if (selectedAnswer === option && option !== question.correctAnswer) {
      return "border-destructive bg-destructive/10 text-destructive";
    }

    return "border-border opacity-50";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-3xl mx-auto"
    >
      <div className="bg-card border border-border rounded-xl p-6 md:p-8 shadow-xl">
        {/* Question Header */}
        <div className="flex items-center justify-between mb-4">
          <span className="font-mono text-sm text-muted-foreground bg-secondary px-3 py-1 rounded-md">
            {question.displayName}
          </span>
          <div className="flex items-center gap-2">
            <Calculator />
            {questionNumber && totalQuestions && (
              <span className="font-mono text-sm text-primary">
                {questionNumber} / {totalQuestions}
              </span>
            )}
            {user && (
              <div className="flex items-center gap-1">
                <Popover open={isNoteOpen} onOpenChange={(open) => {
                  setIsNoteOpen(open);
                  if (open) {
                    setNoteText(existingNote || '');
                  }
                }}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className={cn(
                            "h-8 w-8",
                            existingNote && "text-accent"
                          )}
                          aria-label={existingNote ? "Edit note" : "Add note"}
                        >
                          <MessageSquare className="w-4 h-4" aria-hidden="true" />
                        </Button>
                      </PopoverTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{existingNote ? "Edit note" : "Add note"}</p>
                    </TooltipContent>
                  </Tooltip>
                  <PopoverContent className="w-80 bg-card border-border" align="end">
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-foreground">Add a note</p>
                      <Textarea
                        placeholder="Write your notes about this question..."
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        className="min-h-[100px] resize-none"
                      />
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setIsNoteOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          size="sm"
                          onClick={handleSaveNote}
                        >
                          Save Note
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-8 w-8",
                        bookmarked && "text-primary"
                      )}
                      onClick={handleBookmarkClick}
                      aria-label={bookmarked ? "Remove bookmark" : "Add bookmark"}
                      aria-pressed={bookmarked}
                    >
                      {bookmarked ? (
                        <BookmarkCheck className="w-4 h-4" aria-hidden="true" />
                      ) : (
                        <Bookmark className="w-4 h-4" aria-hidden="true" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{bookmarked ? "Remove bookmark" : "Bookmark this question"}</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={handleCopyLink}
                      aria-label="Copy shareable link"
                    >
                      <Link className="w-4 h-4" aria-hidden="true" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Copy shareable link</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            )}
          </div>
        </div>

        {/* Question Text */}
        <div className="min-h-[4.5rem] mb-6">
          <h2 className="text-lg md:text-xl font-semibold text-foreground leading-relaxed">
            {enableGlossaryHighlight ? (
              <GlossaryHighlightedText text={question.question} />
            ) : (
              question.question
            )}
          </h2>
        </div>

        {/* Question Figure */}
        <FigureImage
          figureUrl={question.figureUrl}
          questionId={question.id}
        />

        {/* Options */}
        <div className="space-y-3">
          {options.map((option) => (
            <button
              key={option}
              onClick={() => !showResult && onSelectAnswer(option)}
              disabled={showResult}
              className={cn(
                "w-full text-left p-4 rounded-lg border-2 transition-all duration-200",
                "flex items-start gap-4",
                getOptionStyles(option),
                !showResult && "cursor-pointer"
              )}
            >
              <span
                className={cn(
                  "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold text-sm",
                  selectedAnswer === option && !showResult
                    ? "bg-primary text-primary-foreground"
                    : showResult && option === question.correctAnswer
                    ? "bg-success text-success-foreground"
                    : showResult && selectedAnswer === option && option !== question.correctAnswer
                    ? "bg-destructive text-destructive-foreground"
                    : "bg-secondary text-secondary-foreground"
                )}
              >
                {option}
              </span>
              <span className="flex-1 pt-1">{question.options[option]}</span>
            </button>
          ))}
        </div>

        {/* Result Indicator */}
        {showResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              "mt-6 p-4 rounded-lg text-center font-semibold",
              selectedAnswer === question.correctAnswer
                ? "bg-success/10 text-success border border-success/30"
                : "bg-destructive/10 text-destructive border border-destructive/30"
            )}
          >
            {selectedAnswer === question.correctAnswer ? (
              <span>✓ Correct!</span>
            ) : (
              <span>
                ✗ Incorrect. The correct answer is {question.correctAnswer}:{" "}
                {question.options[question.correctAnswer]}
              </span>
            )}
          </motion.div>
        )}

        {/* Explanation and Links - shown after answering */}
        {showResult && !hideLinks && (question.explanation || (question.links && question.links.length > 0)) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Explanation */}
              {question.explanation && (
                <div className={cn(
                  "p-4 rounded-lg bg-secondary/50 border border-border",
                  (!question.links || question.links.length === 0) && "md:col-span-2"
                )}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-foreground">Explanation</h3>
                    {user && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground mr-1">Helpful?</span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className={cn(
                                "h-7 w-7",
                                userFeedback?.is_helpful === true && "text-success bg-success/10"
                              )}
                              onClick={() => handleFeedback(true)}
                              aria-label="Mark explanation as helpful"
                              aria-pressed={userFeedback?.is_helpful === true}
                            >
                              <ThumbsUp className="w-4 h-4" aria-hidden="true" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Helpful</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className={cn(
                                "h-7 w-7",
                                userFeedback?.is_helpful === false && "text-destructive bg-destructive/10"
                              )}
                              onClick={() => handleFeedback(false)}
                              aria-label="Mark explanation as not helpful"
                              aria-pressed={userFeedback?.is_helpful === false}
                            >
                              <ThumbsDown className="w-4 h-4" aria-hidden="true" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Not helpful</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    )}
                  </div>
                  <MarkdownText text={question.explanation} />
                </div>
              )}
              
              {/* Links */}
              {question.links && question.links.length > 0 && (
                <div className={cn(!question.explanation && "md:col-span-2")}>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Learn more:</h3>
                  <div className="space-y-3">
                    {question.links.map((link, index) => (
                      <LinkPreview key={index} link={link} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Discuss in Forum Button */}
            {(() => {
              const authUrl = question.forumUrl ? getForumAuthUrl(question.forumUrl) : null;
              return authUrl ? (
                <div className="mt-4 pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto gap-2"
                    asChild
                  >
                    <a
                      href={authUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Users className="w-4 h-4" aria-hidden="true" />
                      Discuss with Other Hams
                      <ExternalLink className="w-3 h-3 ml-1" aria-hidden="true" />
                    </a>
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Join the community discussion, share study tips, or suggest improvements to this explanation.
                  </p>
                </div>
              ) : null;
            })()}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
