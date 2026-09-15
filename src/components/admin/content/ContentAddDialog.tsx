import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { Plus } from "lucide-react";
import { useId } from "react";
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
 * The draft resets on close rather than on submit: the caller's mutation
 * decides whether the dialog closes, so clearing on submit would wipe the form
 * under a failed save.
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

  const handleClose = () => {
    setDraft(EMPTY_CONTENT_DRAFT);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
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
        <Button variant="outlined" onClick={handleClose}>
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
