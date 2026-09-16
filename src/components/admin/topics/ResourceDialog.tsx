import { useId, type ReactNode } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { Plus } from "lucide-react";
import { ResourceFields } from "./ResourceFields";
import type { ResourceDraft } from "./resourceDraft";

interface ResourceDialogProps {
  open: boolean;
  onClose: () => void;
  /** "Add Resource" / "Edit Resource". */
  title: string;
  submitLabel: string;
  /** Only the add dialog leads its submit with a plus. */
  showSubmitIcon?: boolean;
  draft: ResourceDraft;
  onDraftChange: (draft: ResourceDraft) => void;
  urlLabel?: string;
  isPending: boolean;
  onSubmit: () => void;
  /** The upload slot, which only the add dialog passes. */
  children?: ReactNode;
}

/** The dialog frame shared by adding and editing a resource. */
export function ResourceDialog({
  open,
  onClose,
  title,
  submitLabel,
  showSubmitIcon = false,
  draft,
  onDraftChange,
  urlLabel,
  isPending,
  onSubmit,
  children,
}: ResourceDialogProps) {
  const id = useId();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth aria-labelledby={`${id}-title`}>
      <DialogTitle id={`${id}-title`}>{title}</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <ResourceFields value={draft} onChange={onDraftChange} urlLabel={urlLabel}>
            {children}
          </ResourceFields>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={onSubmit}
          disabled={isPending}
          startIcon={
            isPending ? (
              <CircularProgress size={16} color="inherit" />
            ) : showSubmitIcon ? (
              <Box component={Plus} sx={{ width: 16, height: 16 }} />
            ) : undefined
          }
        >
          {submitLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
