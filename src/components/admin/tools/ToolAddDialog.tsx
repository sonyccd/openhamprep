import { useEffect, useId, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Typography from "@mui/material/Typography";
import { Plus } from "lucide-react";
import { ToolFields } from "./ToolFields";
import { EMPTY_TOOL_DRAFT, isToolDraftValid, type ToolDraft } from "./toolDraft";

interface ToolAddDialogProps {
  open: boolean;
  onClose: () => void;
  categories: { id: string; name: string }[];
  isPending: boolean;
  onSubmit: (draft: ToolDraft) => void;
}

/**
 * The draft resets on open, not on close — a successful save closes this from
 * the caller by flipping `open`, so a close-handler reset never runs and the
 * next Add reopens on the last entry (#302). Resetting on open also leaves a
 * failed save alone, since the dialog stays open.
 */
export function ToolAddDialog({
  open,
  onClose,
  categories,
  isPending,
  onSubmit,
}: ToolAddDialogProps) {
  const id = useId();
  const [draft, setDraft] = useState<ToolDraft>(EMPTY_TOOL_DRAFT);

  useEffect(() => {
    if (open) {
      setDraft(EMPTY_TOOL_DRAFT);
    }
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth aria-labelledby={`${id}-title`}>
      <DialogTitle id={`${id}-title`}>Add New Tool</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <ToolFields value={draft} onChange={setDraft} categories={categories} />
          {/*
            Add-only. The edit dialog has a real upload control; here there is
            no tool id to attach an image to yet, so the hint stands in for it.
          */}
          <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", mt: 2 }}>
            You can add an image after creating the tool.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={() => onSubmit(draft)}
          disabled={isPending || !isToolDraftValid(draft)}
          startIcon={
            isPending ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <Box component={Plus} sx={{ width: 16, height: 16 }} />
            )
          }
        >
          Add Tool
        </Button>
      </DialogActions>
    </Dialog>
  );
}
