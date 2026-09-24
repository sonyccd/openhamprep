import { Icon } from '@/components/ohp/Icon';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { AlertTriangle } from 'lucide-react';

interface NavigationWarningDialogProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/** Leaving a practice test in progress throws the attempt away. */
export function NavigationWarningDialog({
  open,
  onCancel,
  onConfirm,
}: NavigationWarningDialogProps) {
  // role="alertdialog" and the explicit aria-describedby are both carried over
  // by hand. Radix's AlertDialog set the role itself and registered its
  // Description automatically; MUI's Dialog does neither, and a dropped
  // describedby is invisible until someone uses a screen reader (#283).
  return (
  <Dialog
    open={open}
    onClose={onCancel}
    role="alertdialog"
    aria-labelledby="nav-warning-title"
    aria-describedby="nav-warning-description"
  >
    <DialogTitle
      id="nav-warning-title"
      sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
    >
      <Icon icon={AlertTriangle} size={20} sx={{ color: 'error.main' }} />
      Test in Progress
    </DialogTitle>
    <DialogContent>
      <DialogContentText id="nav-warning-description">
        You have a practice test in progress. If you leave now, your progress will not be saved. Are you sure you want to end the test?
      </DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button variant="outlined" onClick={onCancel}>
        Return to Test
      </Button>
      <Button variant="contained" color="error" onClick={onConfirm}>
        End Test
      </Button>
    </DialogActions>
  </Dialog>
  );
}
