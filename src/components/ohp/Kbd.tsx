import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";

/** The <kbd> chrome used wherever a keyboard shortcut is shown. */
const kbdSx = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: 24,
  height: 24,
  px: 1,
  fontFamily: "monospace",
  fontSize: "0.75rem",
  fontWeight: 500,
  bgcolor: "muted",
  border: "1px solid",
  borderColor: "divider",
  borderRadius: 1,
} as const;

interface KbdProps {
  children: ReactNode;
  sx?: SxProps<Theme>;
}

export function Kbd({ children, sx }: KbdProps) {
  return (
    <Box component="kbd" sx={[kbdSx, ...(Array.isArray(sx) ? sx : [sx])]}>
      {children}
    </Box>
  );
}
