import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";

interface AuthShellProps {
  children: ReactNode;
  /** The signup and reset screens use a roomier card than the main form. */
  padded?: boolean;
}

/**
 * The page chrome every auth screen sits in: full-height background, the theme
 * toggle, and the card that animates in.
 *
 * All three screens repeated this verbatim. radio-wave-bg stays a class for
 * now — it is a brand gradient defined in index.css, and it comes off Tailwind
 * with everything else in C7 rather than being half-moved here.
 */
export function AuthShell({ children, padded = false }: AuthShellProps) {
  return (
    <Box
      className="radio-wave-bg"
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
        position: "relative",
      }}
    >
      <Box sx={{ position: "absolute", top: 16, right: 16 }}>
        <ThemeToggle />
      </Box>
      <Box
        component={motion.div}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        sx={{ width: "100%", maxWidth: 448 }}
      >
        <Paper
          variant="outlined"
          sx={{ p: padded ? 4 : 3, borderRadius: 1, boxShadow: 6, bgcolor: "background.paper" }}
        >
          {children}
        </Paper>
      </Box>
    </Box>
  );
}
