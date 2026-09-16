import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import { CheckCircle } from "lucide-react";

interface QuizProgressProps {
  asked: number;
  total: number;
  /** "bar" is the bare rule; "labelled" adds the asked/total count beside it. */
  variant?: "bar" | "labelled";
  /** Rule thickness in px — the modes differ by a pixel or two. */
  height?: number;
}

/**
 * How far through the question set the session is.
 *
 * Both modes built this as a div with an animated inner width, which is a
 * hand-rolled progress bar with no role — nothing reported the value. It is
 * LinearProgress, which carries role="progressbar" and aria-valuenow, named
 * with what it measures. The completion tick is decorative; the value already
 * says 100.
 */
export function QuizProgress({ asked, total, variant = "bar", height = 6 }: QuizProgressProps) {
  const value = total > 0 ? Math.round((asked / total) * 100) : 0;
  const complete = total > 0 && asked === total;

  const bar = (
    <LinearProgress
      variant="determinate"
      value={value}
      aria-label="Questions answered"
      aria-valuetext={`${asked} of ${total}`}
      sx={{ height, borderRadius: "9999px", flex: 1, bgcolor: "secondary.main" }}
    />
  );

  if (variant === "bar") return bar;

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
      {bar}
      <Box
        component="span"
        sx={{ fontSize: "0.75rem", color: "text.secondary", fontFamily: "monospace" }}
      >
        {asked}/{total}
      </Box>
      {complete && (
        <Box
          component={CheckCircle}
          aria-hidden="true"
          sx={{ width: 16, height: 16, color: "success.main" }}
        />
      )}
    </Box>
  );
}
