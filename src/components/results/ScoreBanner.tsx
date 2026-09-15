import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import { Trophy, XCircle } from "lucide-react";
import { MotionBox } from "@/components/ohp/MotionBox";
import { tokenAlpha } from "@/theme/muiTheme";
import type { ReactNode } from "react";

interface ScoreBannerBaseProps {
  passed: boolean;
  correctCount: number;
  totalQuestions: number;
  percentage: number;
  /** Above the verdict — the date, on the historic view. */
  meta?: ReactNode;
  /** Below the metrics — the passing-score note, on the fresh view. */
  footnote?: ReactNode;
}

/**
 * A discriminated union rather than an optional `children`, because the
 * compact layout is a single row with nowhere to put it.
 *
 * `children?: never` makes passing it with size="compact" a compile error
 * instead of content that silently disappears — meta and footnote render in
 * both layouts, so nothing else about the API hints that children would not.
 */
type ScoreBannerProps = ScoreBannerBaseProps &
  (
    | {
        /** The just-finished exam: stacked, centred, with room for a message. */
        size?: "large";
        /** Between the verdict and the metrics. Large layout only. */
        children?: ReactNode;
      }
    | {
        /** A historic result: one row, no room for a message. */
        size: "compact";
        children?: never;
      }
  );

/** Correct / Incorrect / Score, at whichever scale the caller wants. */
function Metric({ value, label, size }: { value: string | number; label: string; size: "large" | "compact" }) {
  return (
    <Box sx={{ textAlign: "center" }}>
      <Typography
        component="p"
        sx={{
          fontSize: size === "large" ? { xs: "2.25rem", sm: "3rem" } : "1.875rem",
          fontFamily: "monospace",
          fontWeight: 700,
          color: "text.primary",
        }}
      >
        {value}
      </Typography>
      <Typography
        component="p"
        sx={{ fontSize: size === "large" ? "0.875rem" : "0.75rem", color: "text.secondary" }}
      >
        {label}
      </Typography>
    </Box>
  );
}

/**
 * The pass/fail banner and the three numbers under it.
 *
 * TestResults and TestResultReview rendered the same thing at two scales with
 * two arrangements, so the shape is shared and the layout is a prop rather than
 * two copies drifting apart.
 */
export function ScoreBanner({
  passed,
  correctCount,
  totalQuestions,
  percentage,
  size = "large",
  meta,
  footnote,
  children,
}: ScoreBannerProps) {
  const token = passed ? "success" : "error";
  const large = size === "large";

  return (
    <MotionBox
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      sx={{
        p: large ? 4 : 3,
        borderRadius: "16px",
        border: "2px solid",
        mb: large ? 4 : 2,
        flexShrink: 0,
        textAlign: large ? "center" : "left",
        borderColor: (t) => tokenAlpha(t.vars.palette[token].main, 30),
        bgcolor: (t) => tokenAlpha(t.vars.palette[token].main, 10),
      }}
    >
      {meta}

      {large ? (
        <>
          <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
            <Box
              component={passed ? Trophy : XCircle}
              aria-hidden="true"
              sx={{ width: 64, height: 64, color: `${token}.main` }}
            />
          </Box>
          <Typography
            component="h1"
            sx={{
              fontSize: { xs: "1.875rem", sm: "2.25rem" },
              fontFamily: "monospace",
              fontWeight: 700,
              mb: 1,
              color: `${token}.main`,
            }}
          >
            {passed ? "PASSED!" : "NOT PASSED"}
          </Typography>
          {children}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: { xs: 2, sm: 4 },
              mt: 3,
            }}
          >
            <Metric value={correctCount} label="Correct" size={size} />
            <Divider orientation="vertical" flexItem sx={{ height: 64 }} />
            <Metric value={totalQuestions - correctCount} label="Incorrect" size={size} />
            <Divider orientation="vertical" flexItem sx={{ height: 64 }} />
            <Metric value={`${percentage}%`} label="Score" size={size} />
          </Box>
        </>
      ) : (
        <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              component={passed ? Trophy : XCircle}
              aria-hidden="true"
              sx={{ width: 40, height: 40, color: `${token}.main` }}
            />
            <Typography
              component="h1"
              sx={{
                fontSize: "1.5rem",
                fontFamily: "monospace",
                fontWeight: 700,
                color: `${token}.main`,
              }}
            >
              {passed ? "PASSED" : "FAILED"}
            </Typography>
          </Box>
          <Divider orientation="vertical" flexItem sx={{ height: 48 }} />
          <Box sx={{ display: "flex", alignItems: "center", gap: 3, flex: 1 }}>
            <Metric value={correctCount} label="Correct" size={size} />
            <Metric value={totalQuestions - correctCount} label="Incorrect" size={size} />
            <Metric value={`${percentage}%`} label="Score" size={size} />
          </Box>
        </Box>
      )}

      {footnote}
    </MotionBox>
  );
}
