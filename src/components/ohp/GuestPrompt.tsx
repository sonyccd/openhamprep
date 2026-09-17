import type { SxProps, Theme } from "@mui/material/styles";
import { Link } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

interface GuestPromptProps {
  /**
   * What an account enables, technically — never why the user "should" sign
   * up. See the copy rule in CLAUDE.md and the guest-mode spec.
   */
  message: string;
  /** Renders a text button beside the link that hides the prompt. */
  dismissLabel?: string;
  onDismiss?: () => void;
  sx?: SxProps<Theme>;
}

/**
 * The save-moment prompt shown to guests where an account would let something
 * persist.
 *
 * An Alert, but severity="info" with the icon off and an outlined surface,
 * which keeps the understated look the guest-mode spec asks for. role="status"
 * rather than Alert's default "alert": it appears alongside content rather
 * than interrupting it, and must never read as gating what is behind it.
 *
 * The sign-in link returns to the dashboard rather than to the calling screen
 * because topic and lesson detail are view state in the dashboard router, not
 * URLs (#294); there is nothing to deep-link back to yet.
 */
export function GuestPrompt({ message, dismissLabel, onDismiss, sx }: GuestPromptProps) {
  return (
    <Alert
      severity="info"
      variant="outlined"
      icon={false}
      role="status"
      sx={[
        { borderColor: "divider", bgcolor: "background.paper" },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Typography sx={{ fontSize: "0.875rem", color: "text.secondary", mb: 1.5 }}>
        {message}
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box
          component={Link}
          to="/auth?returnTo=/dashboard"
          sx={{
            fontSize: "0.875rem",
            fontWeight: 500,
            color: "primary.main",
            textDecoration: "none",
            "&:hover": { textDecoration: "underline" },
          }}
        >
          Create free account
        </Box>
        {dismissLabel && onDismiss && (
          <Button
            variant="text"
            size="small"
            onClick={onDismiss}
            sx={{ fontSize: "0.875rem", color: "text.secondary", minWidth: 0, p: 0 }}
          >
            {dismissLabel}
          </Button>
        )}
      </Box>
    </Alert>
  );
}
