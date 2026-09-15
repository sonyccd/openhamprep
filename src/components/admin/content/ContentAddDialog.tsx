import { useEffect, useId, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { Plus } from "lucide-react";
import { ContentEntityFields } from "./ContentEntityFields";
import {
  EMPTY_CONTENT_DRAFT,
  isContentDraftValid,
  type ContentDraft,
} from "./contentDraft";

interface ContentAddDialogProps {
  open: boolean;
  onClose: () => void;
  /** "Add New Topic" / "Add New Lesson". */
  title: string;
  submitLabel: string;
  isPending: boolean;
  onSubmit: (draft: ContentDraft) => void;
}

/**
 * The add dialog for both topics and lessons.
 *
 * The draft resets when the dialog *opens*, not when it closes. Closing has
 * several paths — Cancel, Escape, the backdrop, and a successful mutation, and
 * the last of those runs in the caller and only flips the `open` prop. This
 * component stays mounted throughout, so a reset hung off the close handler
 * misses that path entirely and the next Add shows the previous entry. The
 * same leak #288 found in ProfileModal.
 *
 * Resetting on open also leaves a failed save alone: the dialog stays open, so
 * the effect does not re-run and the user keeps what they typed.
 */
export function ContentAddDialog({
  open,
  onClose,
  title,
  submitLabel,
  isPending,
  onSubmit,
}: ContentAddDialogProps) {
  const id = useId();
  const [draft, setDraft] = useState<ContentDraft>(EMPTY_CONTENT_DRAFT);

  useEffect(() => {
    if (open) {
      setDraft(EMPTY_CONTENT_DRAFT);
    }
  }, [open]);



  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby={`${id}-title`}
    >
      <DialogTitle id={`${id}-title`}>{title}</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <ContentEntityFields value={draft} onChange={setDraft} />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={() => onSubmit(draft)}
          disabled={isPending || !isContentDraftValid(draft)}
          startIcon={
            isPending ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <Box component={Plus} sx={{ width: 16, height: 16 }} />
            )
          }
        >
          {submitLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
