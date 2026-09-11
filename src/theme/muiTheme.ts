// Keep this file small. See docs/MUI_MIGRATION_STRATEGY.md §5 and issue #254:
// if it grows past ~150 lines we have rebuilt an abstract design system on a new
// vendor. Theme only the brand surface — palette, typography, radius — and take
// Material's defaults for elevation, spacing, and motion.
import { createTheme } from "@mui/material/styles";

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
});

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
