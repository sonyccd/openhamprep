import { useState } from "react";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";

interface AcknowledgeDialogProps {
  open: boolean;
  onClose: () => void;
  onAcknowledge: (note?: string) => void;
  isAcknowledging: boolean;
}

/** Confirms an acknowledgment and takes an optional note to go with it. */
export function AcknowledgeDialog({ open, onClose, onAcknowledge, isAcknowledging }: AcknowledgeDialogProps) {
  const [note, setNote] = useState("");

  const handleAcknowledge = () => {
    onAcknowledge(note || undefined);
    setNote("");
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="ack-dialog-title"
      aria-describedby="ack-dialog-description"
    >
      <DialogTitle id="ack-dialog-title">Acknowledge Alert</DialogTitle>
      <DialogContent>
        <DialogContentText id="ack-dialog-description" sx={{ mb: 2 }}>
          Acknowledging this alert indicates you've seen it and are aware of the issue. Optionally
          add a note about your action or plan.
        </DialogContentText>
        <TextField
          label="Note"
          placeholder="Optional note (e.g., 'Investigating', 'Known issue', 'Escalated to team')"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          multiline
          rows={3}
          fullWidth
        />
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleAcknowledge}
          disabled={isAcknowledging}
          startIcon={isAcknowledging ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          Acknowledge
        </Button>
      </DialogActions>
    </Dialog>
  );
}
