// Keep this file small. See docs/MUI_MIGRATION_STRATEGY.md §5 and issue #254:
// if it grows past ~150 lines we have rebuilt an abstract design system on a new
// vendor. Theme only the brand surface — palette, typography, radius — and take
// Material's defaults for elevation, spacing, and motion.
import { createTheme } from "@mui/material/styles";

// Two brand tokens Material has no slot for. Both are real semantic tokens in
// index.css that ported components need, so they belong in the theme rather
// than being approximated per call site — see #284.
//
// muted is the subtle surface behind thumbnails, progress tracks and hovers.
// Material's nearest equivalent, palette.action.hover, is an alpha overlay that
// several components composite rather than read, so setting it would neither
// give a solid fill nor reach IconButton.
//
// accent is a green, separate from the amber primary and from success. Nothing
// in Material's palette means "accent", so there is nothing to overload.
//
// These are added, not overridden: no Material component reads either key, so
// declaring them changes nothing that already renders.
declare module "@mui/material/styles" {
  interface Palette {
    muted: string;
    accent: string;
  }
  interface PaletteOptions {
    muted?: string;
    accent?: string;
  }
}

// Mirrors the HSL custom properties in src/index.css. Tailwind reads those vars
// directly; MUI cannot, because it needs concrete values at theme-build time to
// derive hover/active variants. Changing a token means changing both places.
const light = {
  primary: { main: "hsl(38 92% 45%)", contrastText: "hsl(0 0% 100%)" },
  secondary: { main: "hsl(38 30% 92%)", contrastText: "hsl(222 47% 15%)" },
  error: { main: "hsl(0 72% 50%)", contrastText: "hsl(0 0% 100%)" },
  warning: { main: "hsl(25 90% 50%)", contrastText: "hsl(0 0% 100%)" },
  info: { main: "hsl(210 80% 50%)", contrastText: "hsl(0 0% 100%)" },
  success: { main: "hsl(150 70% 35%)", contrastText: "hsl(0 0% 100%)" },
  background: { default: "hsl(45 25% 97%)", paper: "hsl(0 0% 100%)" },
  text: { primary: "hsl(222 47% 11%)", secondary: "hsl(222 20% 35%)" },
  divider: "hsl(38 15% 80%)",
  muted: "hsl(38 20% 94%)",
  accent: "hsl(160 60% 35%)",
};

const dark = {
  primary: { main: "hsl(45 90% 55%)", contrastText: "hsl(222 47% 8%)" },
  secondary: { main: "hsl(222 30% 18%)", contrastText: "hsl(45 30% 85%)" },
  error: { main: "hsl(0 72% 55%)", contrastText: "hsl(45 30% 92%)" },
  warning: { main: "hsl(25 90% 55%)", contrastText: "hsl(222 47% 8%)" },
  info: { main: "hsl(210 80% 55%)", contrastText: "hsl(222 47% 8%)" },
  success: { main: "hsl(150 70% 45%)", contrastText: "hsl(222 47% 8%)" },
  background: { default: "hsl(222 47% 8%)", paper: "hsl(222 40% 12%)" },
  text: { primary: "hsl(45 30% 92%)", secondary: "hsl(220 15% 65%)" },
  divider: "hsl(222 25% 20%)",
  muted: "hsl(222 25% 16%)",
  accent: "hsl(150 60% 45%)",
};

export const muiTheme = createTheme({
  // 'class' emits `.light {}` / `.dark {}`, which is exactly what next-themes
  // writes with attribute="class" in App.tsx. MUI's default is a data attribute
  // next-themes never sets, which would pin MUI to light mode forever.
  cssVariables: { colorSchemeSelector: "class" },
  colorSchemes: {
    light: { palette: light },
    dark: { palette: dark },
  },
  typography: {
    fontFamily: "'DM Sans', 'Space Grotesk', sans-serif",
    // Material shouts its buttons: createTypography.js defaults
    // button.textTransform to 'uppercase', and Button.js spreads
    // theme.typography.button. Nothing else in this app is uppercase, so an MUI
    // button sitting beside a shadcn one reads as a different product — visible
    // today in the Admin questions toolbar, where "ADD QUESTION" sits next to
    // "Export" and "Bulk Import". This is the typography slot, not a
    // styleOverride, so it stays inside the constraint at the top of this file.
    button: { textTransform: "none" },
  },
  shape: {
    borderRadius: 12, // --radius: 0.75rem
  },
  // Tailwind's breakpoints, not Material's. The two disagree by enough to move
  // layout: sm is 640 against Material's 600, md 768 against 900, lg 1024
  // against 1200. With 147 responsive utilities still in the app, a ported
  // component using Material's values would change columns at a different width
  // than the unported component beside it — a three-column grid would wait
  // until 1200px instead of 1024px, so a 1100px laptop would show two.
  //
  // Values are Tailwind's own defaults (tailwindcss/defaultTheme), with 2xl
  // pinned to 1400 by tailwind.config.ts. Asserted against both sources in the
  // tests rather than trusted here.
  breakpoints: {
    values: { xs: 0, sm: 640, md: 768, lg: 1024, xl: 1280 },
  },
});

/**
 * A palette token at partial opacity, for `sx`.
 *
 * Three ways to do this and only one of them is correct here:
 *
 *   alpha(theme.palette.accent, 0.1) reads a concrete value, but under
 *   cssVariables theme.palette holds whichever scheme was built first — so the
 *   light colour gets baked in and dark mode renders it unchanged.
 *
 *   rgba(var(--mui-palette-x-mainChannel) / 0.1) is Material's own idiom, but
 *   it only emits channel variables for its own palette colours. muted and
 *   accent get none (#284), so this works for half the tokens.
 *
 *   color-mix operates on the variable itself, so it works for every token and
 *   still switches with the colour scheme. Pass theme.vars.palette.* to it.
 *
 * @example
 *   sx={{ color: (t) => tokenAlpha(t.vars.palette.accent, 40) }}
 */
export const tokenAlpha = (token: string, percent: number) =>
  `color-mix(in srgb, ${token} ${percent}%, transparent)`;

// Divergences we are choosing to live with, so they don't get "fixed" later.
//
// Two places MUI still looks like Material rather than like this app, neither
// reachable from a palette token or a component prop:
//
//   1. DataGrid header text renders at text.primary; the shadcn table header
//      uses text-muted-foreground (ui/table.tsx, TableHead).
//   2. DataGrid draws vertical separators between column headers. shadcn tables
//      have none. disableColumnResize would hide them, but that trades away
//      column resizing on tables with long text columns — a worse deal than the
//      line itself.
//
// Both were reviewed against the B1 pilot screenshots and accepted. Closing
// them needs components.MuiDataGrid.styleOverrides, and the judgement was that
// a permanent override surface costs more than the mismatch: overrides are how
// this migration turns into a second design system maintained on a new vendor,
// which is the thing §5 of the strategy doc exists to prevent.
//
// If a future change makes the gap genuinely painful rather than merely
// visible, reopen it as a decision — don't quietly add the override.
