import { Icon } from "@/components/ohp/Icon";
import { useEffect, useId, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import { Trash2 } from "lucide-react";
import { EditHistoryViewer } from "../EditHistoryViewer";
import { ConfirmDeleteDialog } from "../shared/ConfirmDeleteDialog";
import { TermFields } from "./TermFields";
import {
  EMPTY_TERM_DRAFT,
  isTermDraftValid,
  type GlossaryTerm,
  type TermDraft,
} from "./termDraft";


interface TermEditDialogProps {
  term: GlossaryTerm | null;
  onClose: () => void;
  isPending: boolean;
  onSubmit: (draft: TermDraft) => void;
  onDelete: (id: string) => void;
}

export function TermEditDialog({
  term,
  onClose,
  isPending,
  onSubmit,
  onDelete,
}: TermEditDialogProps) {
  const id = useId();
  const [draft, setDraft] = useState<TermDraft>(EMPTY_TERM_DRAFT);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // Refill from whichever term was opened.
  useEffect(() => {
    if (term) {
      setDraft({ term: term.term, definition: term.definition });
    }
  }, [term]);

  return (
    <Dialog
      open={Boolean(term)}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby={`${id}-title`}
    >
      <DialogTitle id={`${id}-title`}>Edit Term</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TermFields value={draft} onChange={setDraft} />

          <Divider />

          <EditHistoryViewer history={term?.edit_history || []} />

          <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
            <Button
              variant="text"
              color="error"
              onClick={() => setConfirmingDelete(true)}
              startIcon={<Icon icon={Trash2} size={16} />}
            >
              Delete Term
            </Button>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button variant="outlined" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={() => onSubmit(draft)}
                disabled={isPending || !isTermDraftValid(draft)}
                startIcon={isPending ? <CircularProgress size={16} color="inherit" /> : undefined}
              >
                Save Changes
              </Button>
            </Box>
          </Box>
        </Stack>
      </DialogContent>

      <ConfirmDeleteDialog
        open={confirmingDelete}
        title="Delete Term"
        description={`Are you sure you want to delete "${term?.term}"? This action cannot be undone.`}
        onCancel={() => setConfirmingDelete(false)}
        onConfirm={() => {
          setConfirmingDelete(false);
          if (term) onDelete(term.id);
        }}
      />
    </Dialog>
  );
}
