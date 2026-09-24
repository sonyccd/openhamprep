import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import type { SxProps, Theme } from "@mui/material/styles";

interface PageContainerProps {
  children: ReactNode;
  /** Max-width tier, in px: narrow 672, standard 768, wide 1024, full 1280. */
  width?: "narrow" | "standard" | "wide" | "full";
  /** Add extra bottom padding for mobile nav (for views with bottom action buttons) */
  mobileNavPadding?: boolean;
  /** Apply the radio-wave background effect */
  radioWaveBg?: boolean;
  /** Additional sx for the outer container */
  sx?: SxProps<Theme>;
  /**
   * Additional sx for the inner content container.
   *
   * The only way to give children a flex
   * context: `sx` lands on the outer Box, and Container sits between it and
   * them as a plain block, so a child's `flex: 1` has nothing to size against.
   * TestResultReview needs this;
   * contentSx is the same thing for components past the Tailwind line.
   */
  contentSx?: SxProps<Theme>;
}

/**
 * Explicit pixel widths rather than Container's `maxWidth="md"` tier names.
 *
 * Those names resolve through theme.breakpoints.values, which #285 pinned to
 * Tailwind's — so `standard` → `md` would land on exactly the 768px it has
 * today. That is a coincidence of two tables agreeing, not a guarantee: change
 * a breakpoint for layout reasons and every page's max width moves with it.
 * These are the four values the Tailwind classes resolved to (max-w-2xl/3xl/
 * 5xl/7xl), stated once, independent of the breakpoint table.
 *
 * For the record on what the tier names would have cost against Material's
 * default breakpoints: narrow −72px, standard +132px, wide +176px, full
 * +256px.
 */
const MAX_WIDTHS = {
  narrow: 672,
  standard: 768,
  wide: 1024,
  full: 1280,
} as const;

/**
 * The page-level layout wrapper.
 *
 * radioWaveBg sets a class rather than sx because the effect is two radial
 * gradients keyed on --primary and --accent, written by hand in index.css.
 * That is the only class this emits; callers style it through sx.
 */
export const PageContainer = ({
  children,
  width = "standard",
  mobileNavPadding = false,
  radioWaveBg = false,
  sx,
  contentSx,
}: PageContainerProps) => {
  return (
    <Box
      // radio-wave-bg is a CSS class, not a MUI concept — see the note above.
      className={radioWaveBg ? "radio-wave-bg" : undefined}
      sx={[
        {
          flex: 1,
          overflowY: "auto",
          // py-8 md:py-12 px-4 md:px-8
          py: { xs: 4, md: 6 },
          px: { xs: 2, md: 4 },
          // pb-24 md:pb-8
          ...(mobileNavPadding && { pb: { xs: 12, md: 4 } }),
        },
        // Array form so a caller's sx merges rather than replacing.
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {/*
        disableGutters because the padding above is the outer Box's job.
        Container's own gutters would add to it rather than replace it.
      */}
      <Container
        disableGutters
        maxWidth={false}
        sx={[
          { maxWidth: MAX_WIDTHS[width], mx: "auto" },
          ...(Array.isArray(contentSx) ? contentSx : [contentSx]),
        ]}
      >
        {children}
      </Container>
    </Box>
  );
};
