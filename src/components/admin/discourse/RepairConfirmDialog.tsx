import { useId } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { Wrench } from "lucide-react";

interface RepairConfirmDialogProps {
  open: boolean;
  missingUrls: number;
  missingStatuses: number;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Confirms a repair, saying how much it will touch. Labelled by hand, as
 * ConfirmDeleteDialog is: MUI's Dialog registers neither role nor description.
 */
export function RepairConfirmDialog({ open, missingUrls, missingStatuses, onCancel, onConfirm }: RepairConfirmDialogProps) {
  const id = useId();

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      role="alertdialog"
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-description`}
    >
      <DialogTitle id={`${id}-title`}>Repair Discourse Sync?</DialogTitle>
      <DialogContent>
        <DialogContentText id={`${id}-description`} component="div">
          <p>
            This will update the database to fix missing forum URLs by matching existing Discourse
            topics to questions. It will also mark questions with existing forum URLs as synced.
          </p>
          <p>
            <strong>{missingUrls}</strong> missing URLs will be repaired and{" "}
            <strong>{missingStatuses}</strong> sync statuses will be updated.
          </p>
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={onConfirm}
          startIcon={<Box component={Wrench} aria-hidden="true" sx={{ width: 16, height: 16 }} />}
        >
          Repair
        </Button>
      </DialogActions>
    </Dialog>
  );
}
