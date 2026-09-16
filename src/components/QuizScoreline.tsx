import Box from "@mui/material/Box";
import { visuallyHidden } from "@mui/utils";

interface QuizScorelineProps {
  correct: number;
  incorrect: number;
  /** "inline" is the compact header form; "large" the stat-tile form. */
  size?: "inline" | "large";
}

/**
 * The running correct / incorrect tally shown while practising.
 *
 * Three modes rendered this by hand. In all of them the two numbers were bare
 * — "3 / 1" — with which was which carried by colour alone, so a screen
 * reader heard two numbers and a slash. Each count now has a hidden label,
 * and the pair is a single group so it is read as one thing.
 */
export function QuizScoreline({ correct, incorrect, size = "inline" }: QuizScorelineProps) {
  const large = size === "large";
  const count = {
    fontFamily: "monospace",
    fontWeight: large ? 700 : 500,
    fontSize: large ? "1.5rem" : "0.875rem",
  };

  return (
    <Box
      role="group"
      aria-label="Score"
      sx={{ display: "flex", alignItems: "center", gap: large ? 3 : 1.5 }}
    >
      <Box component="span" sx={{ ...count, color: "success.main" }}>
        {correct}
        <Box component="span" sx={visuallyHidden}>
          {" "}
          correct
        </Box>
      </Box>
      {!large && (
        <Box component="span" aria-hidden="true" sx={{ ...count, opacity: 0.4 }}>
          /
        </Box>
      )}
      <Box component="span" sx={{ ...count, color: "error.main" }}>
        {incorrect}
        <Box component="span" sx={visuallyHidden}>
          {" "}
          incorrect
        </Box>
      </Box>
    </Box>
  );
}
