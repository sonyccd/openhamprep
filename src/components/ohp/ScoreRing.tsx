import Box from "@mui/material/Box";
import type { Theme } from "@mui/material/styles";
import { Gauge, gaugeClasses } from "@mui/x-charts/Gauge";
import type { ReactNode } from "react";

interface ScoreRingProps {
  /** 0-100. Clamped. */
  value: number;
  size?: number;
  /** Ring thickness in px. Converted to Gauge's inner/outer radii. */
  strokeWidth?: number;
  /** The arc colour, e.g. `(t) => t.vars.palette.success.main`. */
  color?: (theme: Theme) => string;
  /** The track behind it. */
  trackColor?: (theme: Theme) => string;
  /** Centre text. Defaults to the value as a percentage. */
  text?: string;
  /** Centre content instead of text — an icon, say. Suppresses `text`. */
  children?: ReactNode;
  /** Names the meter. Falls back to a generic name built from the value. */
  label?: string;
  /** What assistive tech reads instead of a bare percentage. */
  valueText?: string;
  animate?: boolean;
}

/**
 * The readiness ring: a full-circle gauge with the score in the middle.
 *
 * MUI X's Gauge rather than a hand-rolled SVG — it is the component meant for
 * one value in a range, and unlike Material's CircularProgress it renders
 * centre content, which is the whole point here. @mui/x-charts is MIT, the
 * same Community tier as the DataGrid; the paid arc of MUI X is
 * @mui/x-charts-pro, which this project does not use.
 *
 * ---
 *
 * The wrapper carries the accessibility, and that is not belt-and-braces.
 *
 * Gauge documents the WAI-ARIA meter pattern and does emit
 * role="meter" with aria-valuenow/min/max — on an element it also marks
 * aria-hidden="true", which removes the whole thing from the accessibility
 * tree. Measured: getByRole('meter') finds nothing on a bare <Gauge>. The
 * attribute is hardcoded in ChartsSvgLayer.js:66, applied after the prop
 * spread, so no prop overrides it.
 *
 * So the semantics live on a wrapper we control. The chart is decoration
 * underneath it; the meter is ours. Drop this wrapper and the score silently
 * stops being announced — the same class of failure as the aria-hidden SVG in
 * the component this replaced.
 */
export function ScoreRing({
  value,
  size = 120,
  strokeWidth = 8,
  color = (t) => t.vars.palette.primary.main,
  trackColor = (t) => t.vars.palette.secondary.main,
  text,
  children,
  label,
  valueText,
  animate = true,
}: ScoreRingProps) {
  const clamped = Math.min(100, Math.max(0, value));
  // Gauge takes radii where the SVG took a stroke width. The ring's outer edge
  // is the drawing area, so the inner edge is what the thickness leaves behind.
  const innerRadius = `${Math.max(0, ((size / 2 - strokeWidth) / (size / 2)) * 100)}%`;

  return (
    <Box
      role="meter"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuetext={valueText}
      aria-label={label ?? `${clamped}%`}
      sx={{ position: "relative", width: size, height: size }}
    >
      <Gauge
        width={size}
        height={size}
        value={clamped}
        startAngle={0}
        endAngle={360}
        innerRadius={innerRadius}
        outerRadius="100%"
        // The SVG version drew with strokeLinecap="round".
        cornerRadius="50%"
        skipAnimation={!animate}
        text={children ? "" : (text ?? `${clamped}%`)}
        sx={(theme) => ({
          [`& .${gaugeClasses.valueArc}`]: { fill: color(theme) },
          [`& .${gaugeClasses.referenceArc}`]: { fill: trackColor(theme) },
          [`& .${gaugeClasses.valueText}`]: {
            fontSize: size >= 120 ? "2.25rem" : "0.75rem",
            fontFamily: "monospace",
            fontWeight: 700,
            fill: color(theme),
          },
        })}
      />
      {children && (
        <Box
          // The wrapper's aria-valuetext already says this; announcing the
          // centre content too would read the score twice.
          aria-hidden="true"
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          {children}
        </Box>
      )}
    </Box>
  );
}
