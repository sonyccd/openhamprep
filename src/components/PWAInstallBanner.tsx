import { Icon } from "@/components/ohp/Icon";
import { useEffect, useRef } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Slide from "@mui/material/Slide";
import type { SlideProps } from "@mui/material/Slide";
import Snackbar from "@mui/material/Snackbar";
import type { SnackbarCloseReason } from "@mui/material/Snackbar";
import Typography from "@mui/material/Typography";
import { Download, X } from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { tokenAlpha } from "@/theme/muiTheme";
import { IOSInstallDialog } from "./pwa/IOSInstallDialog";

/** Slide's props are not part of the Snackbar transition slot's type; bind here. */
const SlideUp = (props: SlideProps) => <Slide {...props} direction="up" />;

/**
 * Offers to install the app once the browser says it can.
 *
 * The banner is a Snackbar holding an alertdialog: anchored above the mobile
 * nav, slid in, dismissed by Escape. It is not modal — the page stays usable
 * behind it — but focus moves into it on arrival so a keyboard user hears
 * the offer, and goes back to where it was once the banner is dismissed.
 */
export function PWAInstallBanner() {
  const { showPrompt, isIOS, triggerInstall, dismissPrompt } = usePWAInstall();
  const bannerRef = useRef<HTMLDivElement>(null);

  // Dismissing does not unmount this component (App renders it always), so
  // the restore has to run when showPrompt turns off, not on unmount.
  useEffect(() => {
    if (!showPrompt || isIOS) return;

    const previous = document.activeElement;
    // Let the slide begin before focus lands, so the browser does not scroll
    // to a banner that is still off screen.
    const timer = setTimeout(() => bannerRef.current?.focus(), 100);

    return () => {
      clearTimeout(timer);
      // Only give focus back if the banner still had it; a user who moved on
      // to a form field before dismissing keeps their place.
      const focusIsLoose =
        document.activeElement === document.body || document.activeElement === null;
      if (focusIsLoose && previous instanceof HTMLElement && previous.isConnected) {
        previous.focus();
      }
    };
  }, [showPrompt, isIOS]);

  if (!showPrompt) return null;

  if (isIOS) {
    return <IOSInstallDialog onDismiss={dismissPrompt} />;
  }

  const handleClose = (_event: unknown, reason?: SnackbarCloseReason) => {
    // Clicking elsewhere on the page must not dismiss an offer the user has
    // not answered; only Escape and the buttons do.
    if (reason === "clickaway") return;
    dismissPrompt();
  };

  return (
    <Snackbar
      open
      onClose={handleClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      slots={{ transition: SlideUp }}
      sx={{
        // Clear the mobile bottom nav; full width on phones, a card on wider
        // screens. bottom and right are given per breakpoint because Snackbar
        // sets its own sm values in a media query, which would otherwise win
        // over a plain value here.
        // Below the drawer and any dialog, as the z-40 banner was.
        zIndex: (t) => t.zIndex.fab,
        bottom: { xs: 80, sm: 80 },
        right: { xs: 16, sm: 16 },
        left: { xs: 16, sm: "auto" },
        maxWidth: { sm: 384 },
      }}
    >
      <Paper
        ref={bannerRef}
        tabIndex={-1}
        role="alertdialog"
        aria-labelledby="pwa-install-title"
        aria-describedby="pwa-install-description"
        aria-modal="false"
        variant="outlined"
        sx={{
          width: "100%",
          p: 2,
          borderRadius: "8px",
          boxShadow: 6,
          outline: "none",
          "&:focus-visible": {
            outline: "2px solid",
            outlineColor: "primary.main",
            outlineOffset: 2,
          },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
          <Box
            sx={{
              flexShrink: 0,
              width: 40,
              height: 40,
              borderRadius: "8px",
              bgcolor: (t) => tokenAlpha(t.vars.palette.primary.main, 10),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon icon={Download} size={20} sx={{ color: "primary.main" }} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography component="h3" id="pwa-install-title" sx={{ fontWeight: 500, fontSize: "0.875rem" }}>
              Install Open Ham Prep
            </Typography>
            <Typography id="pwa-install-description" sx={{ fontSize: "0.875rem", color: "text.secondary", mt: 0.25 }}>
              Quick access from your home screen
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={dismissPrompt}
            aria-label="Dismiss install prompt"
            sx={{ flexShrink: 0, color: "text.secondary", "&:hover": { color: "text.primary" } }}
          >
            <Icon icon={X} size={16} />
          </IconButton>
        </Box>
        <Box sx={{ display: "flex", gap: 1, mt: 1.5, justifyContent: "flex-end" }}>
          <Button variant="text" color="inherit" size="small" onClick={dismissPrompt}>
            Not now
          </Button>
          <Button variant="contained" size="small" onClick={triggerInstall}>
            Install
          </Button>
        </Box>
      </Paper>
    </Snackbar>
  );
}
