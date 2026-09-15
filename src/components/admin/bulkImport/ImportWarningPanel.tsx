import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";
import { AlertTriangle } from "lucide-react";
import { tokenAlpha } from "@/theme/muiTheme";

interface ImportWarningPanelProps {
  /** Rendered beside the icon; without it the icon leads the body directly. */
  heading?: string;
  children: ReactNode;
  sx?: SxProps<Theme>;
}

/**
 * The tinted warning block the questions importer uses twice — once listing
 * parse warnings above the 1-based confirmation, once restating that
 * confirmation on the conflicts screen.
 *
 * Deliberately not MUI's `Alert`: Alert supplies its own severity icon, colour
 * ramp and padding, and swapping it in changes how both blocks look. Gate 1
 * says the port must not move pixels, so this keeps the original's layout with
 * the palette read through theme tokens.
 */
export function ImportWarningPanel({ heading, children, sx }: ImportWarningPanelProps) {
  return (
    <Box
      sx={[
        {
          p: 1.5,
          borderRadius: "8px",
          border: "1px solid",
          borderColor: (t) => tokenAlpha(t.vars.palette.warning.main, 30),
          bgcolor: (t) => tokenAlpha(t.vars.palette.warning.main, 10),
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {heading ? (
        <>
          <Typography
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "warning.main",
              mb: 1,
            }}
          >
            <Box component={AlertTriangle} aria-hidden="true" sx={{ width: 16, height: 16 }} />
            {heading}
          </Typography>
          {children}
        </>
      ) : (
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            gap: 1,
            fontSize: "0.75rem",
            color: "warning.main",
          }}
        >
          <Box
            component={AlertTriangle}
            aria-hidden="true"
            sx={{ width: 16, height: 16, mt: 0.25, flexShrink: 0 }}
          />
          <span>{children}</span>
        </Box>
      )}
    </Box>
  );
}
