import { Icon } from "@/components/ohp/Icon";
import { useRef, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Popover from "@mui/material/Popover";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { Bookmark, BookmarkCheck, MessageSquare, Link } from "lucide-react";
import { toast } from "sonner";
import { Calculator } from "@/components/Calculator";
import { useAuth } from "@/hooks/useAuth";
import { useBookmarks } from "@/hooks/useBookmarks";
import type { Question } from "@/hooks/useQuestions";

/** top-4 right-4, and the cluster only comes to full strength on hover. */
const clusterSx = {
  position: "absolute",
  top: 16,
  right: 16,
  display: "flex",
  alignItems: "center",
  gap: 0.5,
  opacity: 0.4,
  transition: "opacity 200ms",
  "&:hover": { opacity: 1 },
} as const;

const iconSx = { width: 28, height: 28 } as const;

/**
 * The floating cluster in the card's top-right: calculator, note, bookmark,
 * copy link.
 *
 * Signed-in and guest render different clusters — the guest one swaps the
 * bookmark action for the explainer popover — so both live here rather than
 * being threaded through the card with flags.
 */
export function QuestionCardActions({ question }: { question: Question }) {
  const { user } = useAuth();
  const { isBookmarked, addBookmark, removeBookmark, getBookmarkNote, updateNote } = useBookmarks();
  const [noteText, setNoteText] = useState("");
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [showGuestBookmarkPopover, setShowGuestBookmarkPopover] = useState(false);
  // MUI's Popover needs an explicit anchor where Radix's derived one from its
  // trigger, so the buttons hold refs.
  const noteAnchorRef = useRef<HTMLButtonElement>(null);
  const guestAnchorRef = useRef<HTMLButtonElement>(null);

  const bookmarked = isBookmarked(question.id);
  const existingNote = getBookmarkNote(question.id);

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

  if (!user) {
    return (
      <Box sx={clusterSx}>
        <Calculator key={question.id} />
        <Tooltip title="Bookmark this question">
          <IconButton
            ref={guestAnchorRef}
            onClick={() => setShowGuestBookmarkPopover(true)}
            aria-label="Bookmark this question"
            sx={iconSx}
          >
            <Icon icon={Bookmark} size={14} />
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
      </Box>
    );
  }

  return (
    <Box sx={clusterSx}>
      <Calculator key={question.id} />
      <Tooltip title={existingNote ? "Edit note" : "Add note"}>
        <IconButton
          ref={noteAnchorRef}
          onClick={() => {
            setNoteText(existingNote || "");
            setIsNoteOpen(true);
          }}
          aria-label={existingNote ? "Edit note" : "Add note"}
          sx={{ ...iconSx, ...(existingNote && { color: "accent", opacity: 1 }) }}
        >
          <Icon icon={MessageSquare} size={14} />
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
        independent on/off toggle. #274 was about the answer options, where four
        toggles described one choice among four.
      */}
      <Tooltip title={bookmarked ? "Remove bookmark" : "Add bookmark"}>
        <IconButton
          onClick={handleBookmarkClick}
          aria-label={bookmarked ? "Remove bookmark" : "Add bookmark"}
          aria-pressed={bookmarked}
          sx={{ ...iconSx, ...(bookmarked && { color: "primary.main", opacity: 1 }) }}
        >
          <Box
            component={bookmarked ? BookmarkCheck : Bookmark}
            aria-hidden="true"
            sx={{ width: 14, height: 14 }}
          />
        </IconButton>
      </Tooltip>
      <Tooltip title="Copy shareable link">
        <IconButton onClick={handleCopyLink} aria-label="Copy shareable link" sx={iconSx}>
          <Icon icon={Link} size={14} />
        </IconButton>
      </Tooltip>
    </Box>
  );
}
