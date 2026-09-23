import { useState } from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import { ImageOff, Maximize2 } from "lucide-react";
import { FigureLightbox } from "@/components/FigureLightbox";
import { tokenAlpha } from "@/theme/muiTheme";

interface FigureImageProps {
  figureUrl: string | null | undefined;
  questionId: string;
}

/**
 * A question's figure, opening full size when picked.
 *
 * The whole thumbnail is the control — one button, not a clickable div with
 * a second button inside it, which is what this was. The expand mark is
 * decoration that appears on hover or focus of that one control.
 */
export function FigureImage({ figureUrl, questionId }: FigureImageProps) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (!figureUrl) return null;

  if (imageError) {
    return (
      <Box
        sx={{
          mb: 3,
          p: 2,
          borderRadius: "8px",
          border: "1px dashed",
          borderColor: "divider",
          bgcolor: (t) => tokenAlpha(t.vars.palette.muted, 30),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 1,
          color: "text.secondary",
        }}
      >
        <Box component={ImageOff} aria-hidden="true" sx={{ width: 20, height: 20 }} />
        <Typography component="span" sx={{ fontSize: "0.875rem" }}>
          Figure failed to load
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ mb: 3 }}>
        <ButtonBase
          onClick={() => setIsLightboxOpen(true)}
          aria-label={`View figure for question ${questionId} in full size`}
          sx={{
            display: "block",
            position: "relative",
            width: "100%",
            borderRadius: "8px",
            overflow: "hidden",
            border: "1px solid",
            borderColor: "divider",
            bgcolor: (t) => tokenAlpha(t.vars.palette.muted, 20),
            transition: "all 200ms",
            "&:hover": { borderColor: (t) => tokenAlpha(t.vars.palette.primary.main, 50), boxShadow: 2 },
            // The expand mark follows the one control's own hover and focus.
            "&:hover .FigureImage-expand, &.Mui-focusVisible .FigureImage-expand": { opacity: 1 },
          }}
        >
          {isLoading && (
            <Box
              data-testid="figure-loading"
              sx={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: (t) => tokenAlpha(t.vars.palette.muted, 50),
              }}
            >
              <CircularProgress size={24} />
            </Box>
          )}
          <Box
            component="img"
            src={figureUrl}
            alt={`Figure for question ${questionId}`}
            loading="lazy"
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setImageError(true);
            }}
            sx={{
              display: "block",
              width: "100%",
              height: "auto",
              objectFit: "contain",
              maxHeight: { xs: 200, md: 300 },
              ...(isLoading && { opacity: 0 }),
            }}
          />
          <Box
            className="FigureImage-expand"
            aria-hidden="true"
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              p: 1,
              borderRadius: "6px",
              display: "flex",
              bgcolor: (t) => tokenAlpha(t.vars.palette.background.default, 80),
              backdropFilter: "blur(4px)",
              border: "1px solid",
              borderColor: "divider",
              opacity: 0,
              transition: "opacity 200ms",
            }}
          >
            <Box component={Maximize2} aria-hidden="true" sx={{ width: 16, height: 16 }} />
          </Box>
        </ButtonBase>
      </Box>

      <FigureLightbox
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        figureUrl={figureUrl}
        questionId={questionId}
      />
    </>
  );
}
