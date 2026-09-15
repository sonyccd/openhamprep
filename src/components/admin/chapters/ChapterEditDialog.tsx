import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import { Pencil, Trash2 } from "lucide-react";
import { ChapterQuestionManager } from "../ChapterQuestionManager";
import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog";
import { ChapterFields } from "./ChapterFields";
import {
  EMPTY_CHAPTER_DRAFT,
  isChapterDraftValid,
  type ChapterDraft,
} from "./chapterDraft";
import type { ArrlChapterWithCount } from "@/types/chapters";

interface ChapterEditDialogProps {
  chapter: ArrlChapterWithCount | null;
  onClose: () => void;
  isPending: boolean;
  onSubmit: (draft: ChapterDraft, onSuccess: () => void) => void;
  onDelete: (id: string) => void;
}

export function ChapterEditDialog({
  chapter,
  onClose,
  isPending,
  onSubmit,
  onDelete,
}: ChapterEditDialogProps) {
  const [tab, setTab] = useState(0);
  const [draft, setDraft] = useState<ChapterDraft>(EMPTY_CHAPTER_DRAFT);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // Refill from whichever chapter was opened, and start on Details each time.
  useEffect(() => {
    if (chapter) {
      setDraft({
        chapterNumber: chapter.chapterNumber.toString(),
        title: chapter.title,
        description: chapter.description || "",
      });
      setTab(0);
    }
  }, [chapter]);

  return (
    <Dialog
      open={Boolean(chapter)}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="edit-chapter-title"
      slotProps={{ paper: { sx: { maxHeight: "85vh" } } }}
    >
      <DialogTitle
        id="edit-chapter-title"
        sx={{ display: "flex", alignItems: "center", gap: 1 }}
      >
        <Box component={Pencil} aria-hidden="true" sx={{ width: 20, height: 20 }} />
        Edit Chapter {chapter?.chapterNumber}: {chapter?.title}
      </DialogTitle>

      <Tabs
        value={tab}
        onChange={(_event, next) => setTab(next)}
        aria-label="Chapter sections"
        sx={{ px: 3, borderBottom: "1px solid", borderColor: "divider", flexShrink: 0 }}
      >
        <Tab label="Details" id="chapter-tab-0" aria-controls="chapter-panel-0" />
        <Tab
          label={
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              Questions
              {chapter && <Chip label={chapter.questionCount} size="small" />}
            </Box>
          }
          id="chapter-tab-1"
          aria-controls="chapter-panel-1"
        />
      </Tabs>

      <DialogContent sx={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
        <Box
          role="tabpanel"
          hidden={tab !== 0}
          id="chapter-panel-0"
          aria-labelledby="chapter-tab-0"
        >
          {tab === 0 && (
            <Stack spacing={2} sx={{ pt: 1 }}>
              <ChapterFields value={draft} onChange={setDraft} />
              <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, pt: 2 }}>
                <Button
                  variant="text"
                  color="error"
                  onClick={() => setConfirmingDelete(true)}
                  startIcon={<Box component={Trash2} sx={{ width: 16, height: 16 }} />}
                >
                  Delete
                </Button>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button variant="outlined" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => onSubmit(draft, onClose)}
                    disabled={isPending || !isChapterDraftValid(draft)}
                    startIcon={
                      isPending ? <CircularProgress size={16} color="inherit" /> : undefined
                    }
                  >
                    Save Changes
                  </Button>
                </Box>
              </Box>
            </Stack>
          )}
        </Box>

        <Box
          role="tabpanel"
          hidden={tab !== 1}
          id="chapter-panel-1"
          aria-labelledby="chapter-tab-1"
          sx={{ flex: 1, minHeight: 0, overflowY: "auto" }}
        >
          {tab === 1 && chapter && (
            <ChapterQuestionManager
              chapterId={chapter.id}
              licenseType={chapter.licenseType}
            />
          )}
        </Box>
      </DialogContent>

      <ConfirmDeleteDialog
        open={confirmingDelete}
        title="Delete Chapter"
        description={`Are you sure you want to delete Chapter ${chapter?.chapterNumber}: ${chapter?.title}? Questions linked to this chapter will have their chapter reference removed.`}
        onCancel={() => setConfirmingDelete(false)}
        onConfirm={() => {
          setConfirmingDelete(false);
          if (chapter) {
            onDelete(chapter.id);
            onClose();
          }
        }}
      />
    </Dialog>
  );
}
