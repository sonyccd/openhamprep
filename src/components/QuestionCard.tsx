import { useRef, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Question } from "@/hooks/useQuestions";
import { useBookmarks } from "@/hooks/useBookmarks";
import { useAuth } from "@/hooks/useAuth";
import { useExplanationFeedback } from "@/hooks/useExplanationFeedback";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Popover from "@mui/material/Popover";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import { visuallyHidden } from "@mui/utils";
import { tokenAlpha } from "@/theme/muiTheme";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Bookmark, BookmarkCheck, MessageSquare, ThumbsUp, ThumbsDown, Link } from "lucide-react";
import { toast } from "sonner";
import { GetMoreHelp } from "@/components/GetMoreHelp";
import { Calculator } from "@/components/Calculator";
import { LinkPreview } from "@/components/LinkPreview";
import { GlossaryHighlightedText } from "@/components/GlossaryHighlightedText";
import { MarkdownText } from "@/components/MarkdownText";
import { FigureImage } from "@/components/FigureImage";
import type { LinkData } from "@/hooks/useQuestions";

interface QuestionCardProps {
  question: Question;
  selectedAnswer: string | null;
  onSelectAnswer: (answer: 'A' | 'B' | 'C' | 'D') => void;
  showResult?: boolean;
  enableGlossaryHighlight?: boolean; // Enable glossary term highlighting (disabled during practice tests)
  hideLinks?: boolean; // Hide links during active practice test (show only on review)
  onTopicClick?: (slug: string) => void; // Navigate to topic when clicked
}

export function QuestionCard({
  question,
  selectedAnswer,
  onSelectAnswer,
  showResult = false,
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
  const [showGuestBookmarkPopover, setShowGuestBookmarkPopover] = useState(false);
  const noteAnchorRef = useRef<HTMLButtonElement>(null);
  const guestAnchorRef = useRef<HTMLButtonElement>(null);

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

  /** The row's border, fill and text for each of the four states. */
  const getOptionSx = (option: (typeof options)[number]) => {
    if (!showResult) {
      return selectedAnswer === option
        ? {
            borderColor: "primary.main",
            bgcolor: (t) => tokenAlpha(t.vars.palette.primary.main, 10),
          }
        : {
            borderColor: "divider",
            "&:hover": {
              borderColor: (t) => tokenAlpha(t.vars.palette.primary.main, 50),
              bgcolor: (t) => tokenAlpha(t.vars.palette.secondary.main, 50),
            },
          };
    }

    if (option === question.correctAnswer) {
      return {
        borderColor: "success.main",
        bgcolor: (t) => tokenAlpha(t.vars.palette.success.main, 10),
        color: "success.main",
      };
    }

    if (selectedAnswer === option && option !== question.correctAnswer) {
      return {
        borderColor: "error.main",
        bgcolor: (t) => tokenAlpha(t.vars.palette.error.main, 10),
        color: "error.main",
      };
    }

    return { borderColor: "divider", opacity: 0.5 };
  };

  /** The circled letter, which doubles as the selection indicator. */
  const getBadgeSx = (option: (typeof options)[number]) => {
    if (selectedAnswer === option && !showResult) {
      return { bgcolor: "primary.main", color: "primary.contrastText" };
    }
    if (showResult && option === question.correctAnswer) {
      return { bgcolor: "success.main", color: "success.contrastText" };
    }
    if (showResult && selectedAnswer === option && option !== question.correctAnswer) {
      return { bgcolor: "error.main", color: "error.contrastText" };
    }
    return { bgcolor: "secondary.main", color: "secondary.contrastText" };
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
        </div>

        {/* Floating Action Buttons */}
        {user && (
          <div className="absolute top-4 right-4 flex items-center gap-1 opacity-40 hover:opacity-100 transition-opacity duration-200">
            <Calculator key={question.id} />
            {/*
              MUI's Popover needs an explicit anchor where Radix's derived one
              from its trigger, so the button holds a ref.
            */}
            <Tooltip title={existingNote ? "Edit note" : "Add note"}>
              <IconButton
                ref={noteAnchorRef}
                onClick={() => {
                  setNoteText(existingNote || '');
                  setIsNoteOpen(true);
                }}
                aria-label={existingNote ? "Edit note" : "Add note"}
                sx={{
                  width: 28,
                  height: 28,
                  ...(existingNote && { color: "accent", opacity: 1 }),
                }}
              >
                <Box component={MessageSquare} aria-hidden="true" sx={{ width: 14, height: 14 }} />
              </IconButton>
            </Tooltip>
            <Popover
              open={isNoteOpen}
              anchorEl={noteAnchorRef.current}
              onClose={() => setIsNoteOpen(false)}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
              slotProps={{ paper: { sx: { width: 320, p: 2 } } }}
            >
              <Stack spacing={1.5}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Add a note
                </Typography>
                <TextField
                  label="Note"
                  placeholder="Write your notes about this question..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  multiline
                  minRows={4}
                  fullWidth
                  size="small"
                />
                <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
                  <Button variant="outlined" size="small" onClick={() => setIsNoteOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="contained" size="small" onClick={handleSaveNote}>
                    Save Note
                  </Button>
                </Box>
              </Stack>
            </Popover>
            {/*
              aria-pressed is right here and stays: a bookmark genuinely is an
              independent on/off toggle. #274 was about the answer options,
              where four toggles described one choice among four.
            */}
            <Tooltip title={bookmarked ? "Remove bookmark" : "Add bookmark"}>
              <IconButton
                onClick={handleBookmarkClick}
                aria-label={bookmarked ? "Remove bookmark" : "Add bookmark"}
                aria-pressed={bookmarked}
                sx={{ width: 28, height: 28, ...(bookmarked && { color: "primary.main", opacity: 1 }) }}
              >
                <Box
                  component={bookmarked ? BookmarkCheck : Bookmark}
                  aria-hidden="true"
                  sx={{ width: 14, height: 14 }}
                />
              </IconButton>
            </Tooltip>
            <Tooltip title="Copy shareable link">
              <IconButton
                onClick={handleCopyLink}
                aria-label="Copy shareable link"
                sx={{ width: 28, height: 28 }}
              >
                <Box component={Link} aria-hidden="true" sx={{ width: 14, height: 14 }} />
              </IconButton>
            </Tooltip>
          </div>
        )}

        {/* Floating actions for guests */}
        {!user && (
          <div className="absolute top-4 right-4 flex items-center gap-1 opacity-40 hover:opacity-100 transition-opacity duration-200">
            <Calculator key={question.id} />
            <Tooltip title="Bookmark this question">
              <IconButton
                ref={guestAnchorRef}
                onClick={() => setShowGuestBookmarkPopover(true)}
                aria-label="Bookmark this question"
                sx={{ width: 28, height: 28 }}
              >
                <Box component={Bookmark} aria-hidden="true" sx={{ width: 14, height: 14 }} />
              </IconButton>
            </Tooltip>
            <Popover
              open={showGuestBookmarkPopover}
              anchorEl={guestAnchorRef.current}
              onClose={() => setShowGuestBookmarkPopover(false)}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
              slotProps={{ paper: { sx: { width: 256, p: 2 } } }}
            >
              <Typography variant="body2" sx={{ mb: 1 }}>
                Bookmarks need an account to persist — they'd disappear when you close the tab.
              </Typography>
              <Typography
                component={RouterLink}
                to="/auth?returnTo=/dashboard"
                variant="body2"
                sx={{
                  fontWeight: 500,
                  color: "primary.main",
                  textDecoration: "none",
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                Create free account
              </Typography>
            </Popover>
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

        {/*
          A real radiogroup of native <input type="radio">, per #274. These were
          four independent <button>s with aria-pressed, which describes four
          toggles rather than one choice among four — and gave four tab stops
          with no arrow-key movement.

          The inputs are visually hidden rather than shown, which is option 2 in
          #274: the platform supplies arrow keys, a single tab stop landing on
          the checked option, and grouping by name, while the row keeps exactly
          the appearance it had. The circled letter stays the visible selection
          indicator, so no radio dot competes with it.

          Focus has to be drawn on the row instead, since the input carrying it
          is invisible — hence :focus-within.
        */}
        <RadioGroup
          name={`question-${question.id}`}
          aria-label="Answer options"
          value={selectedAnswer ?? ""}
          onChange={(event) => onSelectAnswer(event.target.value as (typeof options)[number])}
          sx={{ gap: 2 }}
        >
          {options.map((option) => (
            <FormControlLabel
              key={option}
              value={option}
              disabled={showResult}
              control={<Radio sx={visuallyHidden} />}
              sx={{
                m: 0,
                p: 2.5,
                borderRadius: 3,
                border: "1px solid",
                alignItems: "flex-start",
                transition: "all 200ms",
                cursor: showResult ? "default" : "pointer",
                "&:focus-within": {
                  outline: "2px solid",
                  outlineColor: "primary.main",
                  outlineOffset: 2,
                },
                "&.Mui-disabled": { cursor: "default" },
                ...getOptionSx(option),
              }}
              label={
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, width: "100%" }}>
                  <Box
                    component="span"
                    sx={{
                      flexShrink: 0,
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "monospace",
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      ...getBadgeSx(option),
                    }}
                  >
                    {option}
                  </Box>
                  <Box component="span" sx={{ flex: 1, pt: 0.75, lineHeight: 1.6 }}>
                    {question.options[option]}
                  </Box>
                </Box>
              }
            />
          ))}
        </RadioGroup>

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
                        {/* A genuine toggle, so aria-pressed stays — see the
                            bookmark button above. */}
                        <Tooltip title="Helpful">
                          <IconButton
                            onClick={() => handleFeedback(true)}
                            aria-label="Mark explanation as helpful"
                            aria-pressed={userFeedback?.is_helpful === true}
                            sx={{
                              width: 28,
                              height: 28,
                              ...(userFeedback?.is_helpful === true && {
                                color: "success.main",
                                bgcolor: (t) => tokenAlpha(t.vars.palette.success.main, 10),
                              }),
                            }}
                          >
                            <Box component={ThumbsUp} aria-hidden="true" sx={{ width: 16, height: 16 }} />
                          </IconButton>
                        </Tooltip>
                        {/* A genuine toggle, so aria-pressed stays — see the
                            bookmark button above. */}
                        <Tooltip title="Not helpful">
                          <IconButton
                            onClick={() => handleFeedback(false)}
                            aria-label="Mark explanation as not helpful"
                            aria-pressed={userFeedback?.is_helpful === false}
                            sx={{
                              width: 28,
                              height: 28,
                              ...(userFeedback?.is_helpful === false && {
                                color: "error.main",
                                bgcolor: (t) => tokenAlpha(t.vars.palette.error.main, 10),
                              }),
                            }}
                          >
                            <Box component={ThumbsDown} aria-hidden="true" sx={{ width: 16, height: 16 }} />
                          </IconButton>
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

            <GetMoreHelp
              question={question}
              selectedAnswer={selectedAnswer}
              onTopicClick={onTopicClick}
            />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
