import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import { X } from "lucide-react";
import { tokenAlpha } from "@/theme/muiTheme";

interface FigureLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  figureUrl: string;
  questionId: string;
}

/**
 * The figure at full size over a dimmed page.
 *
 * Deliberately not a papered Dialog: the image is the surface, so the paper
 * is transparent and unelevated and the backdrop does the dimming.
 */
export function FigureLightbox({ isOpen, onClose, figureUrl, questionId }: FigureLightboxProps) {
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      aria-label={`Figure for question ${questionId}`}
      slotProps={{
        backdrop: { sx: { bgcolor: (t) => tokenAlpha(t.vars.palette.background.default, 95) } },
        paper: {
          elevation: 0,
          sx: {
            bgcolor: "transparent",
            backgroundImage: "none",
            overflow: "visible",
            m: 0,
            maxWidth: "90vw",
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          },
        },
      }}
    >
      <Box
        component="img"
        src={figureUrl}
        alt={`Figure for question ${questionId}`}
        sx={{ maxWidth: "90vw", maxHeight: "85vh", objectFit: "contain", borderRadius: "8px" }}
      />
      <Typography sx={{ mt: 1.5, fontSize: "0.875rem", color: "text.secondary", fontFamily: "monospace" }}>
        {questionId}
      </Typography>
      <IconButton
        onClick={onClose}
        aria-label="Close"
        sx={{
          position: "absolute",
          top: { xs: -8, md: 8 },
          right: { xs: -8, md: 8 },
          bgcolor: (t) => tokenAlpha(t.vars.palette.background.default, 90),
          opacity: 0.9,
          "&:hover": { opacity: 1, bgcolor: (t) => tokenAlpha(t.vars.palette.background.default, 90) },
        }}
      >
        <Box component={X} aria-hidden="true" sx={{ width: 20, height: 20 }} />
      </IconButton>
    </Dialog>
  );
}
