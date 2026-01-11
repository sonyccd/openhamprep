import { useState } from "react";
import { Question } from "@/hooks/useQuestions";
import { useBookmarks } from "@/hooks/useBookmarks";
import { useAuth } from "@/hooks/useAuth";
import { useExplanationFeedback } from "@/hooks/useExplanationFeedback";
import { cn, getSafeUrl } from "@/lib/utils";
import { motion } from "framer-motion";
import { Bookmark, BookmarkCheck, MessageSquare, ThumbsUp, ThumbsDown, ExternalLink, Users, Link, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  onTopicClick?: (slug: string) => void; // Navigate to topic when clicked
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
  onTopicClick,
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
      <div className="relative bg-card border border-border rounded-2xl p-8 md:p-10 lg:p-12 shadow-lg">
        {/* Question Header - Simplified */}
        <div className="flex items-center justify-between mb-8">
          <span className="font-mono text-sm text-muted-foreground/80 tracking-wide">
            {question.displayName}
          </span>
          {questionNumber && totalQuestions && (
            <span className="font-mono text-sm text-muted-foreground">
              {questionNumber} / {totalQuestions}
            </span>
          )}
        </div>

        {/* Floating Action Buttons */}
        {user && (
          <div className="absolute top-4 right-4 flex items-center gap-1 opacity-40 hover:opacity-100 transition-opacity duration-200">
            <Calculator key={question.id} />
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
                        "h-7 w-7",
                        existingNote && "text-accent opacity-100"
                      )}
                      aria-label={existingNote ? "Edit note" : "Add note"}
                    >
                      <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
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
                    "h-7 w-7",
                    bookmarked && "text-primary opacity-100"
                  )}
                  onClick={handleBookmarkClick}
                  aria-label={bookmarked ? "Remove bookmark" : "Add bookmark"}
                  aria-pressed={bookmarked}
                >
                  {bookmarked ? (
                    <BookmarkCheck className="w-3.5 h-3.5" aria-hidden="true" />
                  ) : (
                    <Bookmark className="w-3.5 h-3.5" aria-hidden="true" />
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
                  className="h-7 w-7"
                  onClick={handleCopyLink}
                  aria-label="Copy shareable link"
                >
                  <Link className="w-3.5 h-3.5" aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Copy shareable link</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Calculator for non-logged-in users */}
        {!user && (
          <div className="absolute top-4 right-4 opacity-40 hover:opacity-100 transition-opacity duration-200">
            <Calculator key={question.id} />
          </div>
        )}

        {/* Question Text */}
        <div className="min-h-[5rem] mb-10">
          <h2 className="text-lg md:text-xl lg:text-2xl font-medium text-foreground leading-relaxed tracking-tight">
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
        <div className="space-y-4">
          {options.map((option) => (
            <button
              key={option}
              onClick={() => !showResult && onSelectAnswer(option)}
              disabled={showResult}
              className={cn(
                "w-full text-left p-5 rounded-xl border transition-all duration-200",
                "flex items-start gap-4",
                getOptionStyles(option),
                !showResult && "cursor-pointer"
              )}
            >
              <span
                className={cn(
                  "flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-mono font-semibold text-sm",
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
              <span className="flex-1 pt-1.5 text-base leading-relaxed">{question.options[option]}</span>
            </button>
          ))}
        </div>

        {/* Result Indicator - Elegant inline pill */}
        {showResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 flex items-center justify-center"
          >
            <div
              className={cn(
                "inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium",
                selectedAnswer === question.correctAnswer
                  ? "bg-success/10 text-success"
                  : "bg-destructive/10 text-destructive"
              )}
            >
              {selectedAnswer === question.correctAnswer ? (
                <span>Correct</span>
              ) : (
                <span>
                  The answer is {question.correctAnswer}: {question.options[question.correctAnswer]}
                </span>
              )}
            </div>
          </motion.div>
        )}

        {/* Explanation and Links - shown after answering */}
        {showResult && !hideLinks && (question.explanation || (question.links && question.links.length > 0)) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-10 pt-8 border-t border-border/50"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Explanation */}
              {question.explanation && (
                <div className={cn(
                  "p-6 rounded-xl bg-muted/30",
                  (!question.links || question.links.length === 0) && "md:col-span-2"
                )}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-foreground/80">Explanation</h3>
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
                  <div className="text-sm leading-relaxed text-muted-foreground">
                    <MarkdownText text={question.explanation} />
                  </div>
                </div>
              )}

              {/* Links */}
              {question.links && question.links.length > 0 && (
                <div className={cn(!question.explanation && "md:col-span-2")}>
                  <h3 className="text-sm font-medium text-muted-foreground/80 mb-3">Learn more:</h3>
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
                <div className="mt-8">
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

            {/* Related Topics */}
            {question.topics && question.topics.length > 0 && (
              <div className="mt-8">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-4 h-4 text-muted-foreground/80" aria-hidden="true" />
                  <span className="text-sm font-medium text-foreground/80">Study this topic:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {question.topics.map((topic) => (
                    <Badge
                      key={topic.id}
                      variant="secondary"
                      className={cn(
                        "text-sm py-1.5 px-3",
                        onTopicClick && "cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                      )}
                      onClick={() => onTopicClick?.(topic.slug)}
                    >
                      <BookOpen className="w-3 h-3 mr-1.5" aria-hidden="true" />
                      {topic.title}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
