import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemText from "@mui/material/ListItemText";
import { Download, Plus, Share } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface IOSInstallDialogProps {
  onDismiss: () => void;
}

/** A named Safari control, with its icon, inline in a step's sentence. */
function Control({ label, icon: Icon }: { label: string; icon: LucideIcon }) {
  return (
    <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, fontWeight: 500 }}>
      {label}
      <Box component={Icon} aria-hidden="true" sx={{ width: 16, height: 16 }} />
    </Box>
  );
}

const STEPS = [
  <>
    Tap the <Control label="Share" icon={Share} /> button in Safari
  </>,
  <>
    Scroll down and tap <Control label="Add to Home Screen" icon={Plus} />
  </>,
  <>
    Tap <Box component="span" sx={{ fontWeight: 500 }}>Add</Box> to confirm
  </>,
];

/**
 * Safari has no install prompt to trigger, so the iOS path walks the user
 * through Share → Add to Home Screen instead.
 */
export function IOSInstallDialog({ onDismiss }: IOSInstallDialogProps) {
  return (
    <Dialog
      open
      onClose={onDismiss}
      maxWidth="sm"
      fullWidth
      aria-labelledby="ios-install-title"
      aria-describedby="ios-install-description"
    >
      <DialogTitle id="ios-install-title" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Box component={Download} aria-hidden="true" sx={{ width: 20, height: 20, color: "primary.main" }} />
        Install Open Ham Prep
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="ios-install-description">
          Add this app to your home screen for quick access
        </DialogContentText>

        <List component="ol" aria-label="Installation steps" sx={{ py: 2 }}>
          {STEPS.map((step, i) => (
            <ListItem key={i} disableGutters alignItems="flex-start" sx={{ gap: 1.5 }}>
              <ListItemAvatar sx={{ minWidth: 0 }}>
                <Avatar
                  aria-hidden="true"
                  sx={{ width: 32, height: 32, bgcolor: "muted", color: "text.primary", fontSize: "0.875rem", fontWeight: 500 }}
                >
                  {i + 1}
                </Avatar>
              </ListItemAvatar>
              <ListItemText primary={step} slotProps={{ primary: { sx: { fontSize: "0.875rem" } } }} />
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button variant="text" color="inherit" onClick={onDismiss}>
          Got it
        </Button>
      </DialogActions>
    </Dialog>
  );
}
