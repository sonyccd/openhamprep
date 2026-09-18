import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Book, Plus } from "lucide-react";
import { ChapterFields } from "./ChapterFields";
import {
  EMPTY_CHAPTER_DRAFT,
  isChapterDraftValid,
  type ChapterDraft,
} from "./chapterDraft";

interface ChapterAddDialogProps {
  open: boolean;
  onClose: () => void;
  /** The licence the new chapter belongs to, shown so it cannot be a surprise. */
  licenseLabel: string;
  isPending: boolean;
  onSubmit: (draft: ChapterDraft, onSuccess: () => void) => void;
}

export function ChapterAddDialog({
  open,
  onClose,
  licenseLabel,
  isPending,
  onSubmit,
}: ChapterAddDialogProps) {
  const [draft, setDraft] = useState<ChapterDraft>(EMPTY_CHAPTER_DRAFT);

  const handleClose = () => {
    setDraft(EMPTY_CHAPTER_DRAFT);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="add-chapter-title"
    >
      <DialogTitle
        id="add-chapter-title"
        sx={{ display: "flex", alignItems: "center", gap: 1 }}
      >
        <Box component={Book} aria-hidden="true" sx={{ width: 20, height: 20 }} />
        Add New Chapter
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              fontSize: "0.875rem",
              color: "text.secondary",
            }}
          >
            <Typography component="span" sx={{ fontSize: "0.875rem" }}>
              Adding chapter for:
            </Typography>
            <Chip color="secondary" label={licenseLabel} size="small" />
          </Box>
          <ChapterFields value={draft} onChange={setDraft} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={() => onSubmit(draft, handleClose)}
          disabled={isPending || !isChapterDraftValid(draft)}
          startIcon={
            isPending ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <Box component={Plus} sx={{ width: 16, height: 16 }} />
            )
          }
        >
          Add Chapter
        </Button>
      </DialogActions>
    </Dialog>
  );
}
