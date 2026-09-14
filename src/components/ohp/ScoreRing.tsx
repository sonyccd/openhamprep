import Box from "@mui/material/Box";
import type { Theme } from "@mui/material/styles";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * A stroke colour, as a theme callback.
 *
 * Not a palette path string: `sx` does not resolve tokens for `stroke` the way
 * it does for `color` or `bgcolor`. Measured — `sx={{ stroke: 'success.main' }}`
 * emits `stroke:success.main` verbatim, which is not a colour, so the arc falls
 * back to black with no error anywhere. Callers hand over the resolved value.
 */
type StrokeColor = (theme: Theme) => string;

interface ScoreRingProps {
  /** 0-100. Clamped. */
  value: number;
  size?: number;
  strokeWidth?: number;
  /** The arc colour, e.g. `(t) => t.vars.palette.success.main`. */
  color?: StrokeColor;
  /** The track behind it. */
  trackColor?: StrokeColor;
  /** Rendered dead centre — the score, a tick, whatever. */
  children?: ReactNode;
  animate?: boolean;
}

/**
 * The readiness ring: an SVG arc with content in the middle.
 *
 * Not MUI's CircularProgress, which is a fixed-look indicator with no slot for
 * centre content — the whole point here is the score sitting inside the arc.
 * This is the Tier C case the strategy doc describes: keep the custom
 * component, port its API.
 *
 * Replaces ui/circular-progress.tsx, whose colours came in as Tailwind class
 * names (`progressClassName="stroke-success"`). Those are palette tokens now,
 * so a caller cannot pass a class that silently lands on the wrong element —
 * which is exactly what LessonDetailPage does with the old component today,
 * passing `className="text-success"` that reaches the wrapper and never the
 * stroke. That caller still uses the old component; it moves when it is ported.
 */
export function ScoreRing({
  value,
  size = 120,
  strokeWidth = 8,
  color = (t) => t.vars.palette.primary.main,
  trackColor = (t) => t.vars.palette.secondary.main,
  children,
  animate = true,
}: ScoreRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference;

  const arcProps = {
    cx: size / 2,
    cy: size / 2,
    r: radius,
    fill: "none",
    strokeWidth,
    strokeLinecap: "round" as const,
  };

  return (
    <Box sx={{ position: "relative", width: size, height: size }}>
      <Box
        component="svg"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden="true"
        sx={{ transform: "rotate(-90deg)" }}
      >
        <Box
          component="circle"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          sx={{ fill: "none", stroke: trackColor }}
        />
        {animate ? (
          <Box
            component={motion.circle}
            {...arcProps}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            style={{ strokeDasharray: circumference }}
            sx={{ stroke: color }}
          />
        ) : (
          <Box
            component="circle"
            {...arcProps}
            style={{ strokeDasharray: circumference, strokeDashoffset: offset }}
            sx={{ stroke: color }}
          />
        )}
      </Box>
      {children && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {children}
        </Box>
      )}
    </Box>
  );
}
