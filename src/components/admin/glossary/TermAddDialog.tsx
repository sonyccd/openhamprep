import { Icon } from "@/components/ohp/Icon";
import { useEffect, useId, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { Plus } from "lucide-react";
import { TermFields } from "./TermFields";
import { EMPTY_TERM_DRAFT, isTermDraftValid, type TermDraft } from "./termDraft";

interface TermAddDialogProps {
  open: boolean;
  onClose: () => void;
  isPending: boolean;
  onSubmit: (draft: TermDraft) => void;
}

/**
 * The draft resets when the dialog opens, not when it closes.
 *
 * A successful save closes this from the caller by flipping `open`, which
 * never runs a close handler, and the component stays mounted — so a reset
 * hung off close misses the commonest path and the next Add reopens on the
 * last entry (#302, and #288 before it). Resetting on open also leaves a
 * failed save alone, since the dialog stays open.
 */
export function TermAddDialog({ open, onClose, isPending, onSubmit }: TermAddDialogProps) {
  const id = useId();
  const [draft, setDraft] = useState<TermDraft>(EMPTY_TERM_DRAFT);

  useEffect(() => {
    if (open) {
      setDraft(EMPTY_TERM_DRAFT);
    }
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth aria-labelledby={`${id}-title`}>
      <DialogTitle id={`${id}-title`}>Add New Term</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <TermFields value={draft} onChange={setDraft} />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={() => onSubmit(draft)}
          disabled={isPending || !isTermDraftValid(draft)}
          startIcon={
            isPending ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <Icon icon={Plus} size={16} />
            )
          }
        >
          Add Term
        </Button>
      </DialogActions>
    </Dialog>
  );
}
