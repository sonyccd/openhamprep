import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { useId } from "react";

interface ConfirmDeleteDialogProps {
  open: boolean;
  title: string;
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Destructive confirmation, with the labelling carried by hand.
 *
 * Radix's AlertDialog set role="alertdialog" itself and registered its
 * Description automatically; MUI's Dialog does neither, and a dropped
 * describedby is invisible until someone uses a screen reader (#283).
 */
export function ConfirmDeleteDialog({
  open,
  title,
  description,
  onCancel,
  onConfirm,
}: ConfirmDeleteDialogProps) {
  const id = useId();

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      role="alertdialog"
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-description`}
    >
      <DialogTitle id={`${id}-title`}>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText id={`${id}-description`}>{description}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="contained" color="error" onClick={onConfirm}>
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}
