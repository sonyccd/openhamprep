import { tokenAlpha } from "@/theme/muiTheme";
import type { Theme } from "@mui/material/styles";

/**
 * The dashboard's tint scheme, in one place.
 *
 * Notifications, the streak card and the focus areas all built the same thing
 * out of Tailwind classes: a 5% fill inside a 30% border, with a 10% icon tile
 * on top. Three hand-written copies keyed on three different variant unions.
 * Deriving them from one token keeps the panels in step and means a new variant
 * is a palette key rather than another switch arm.
 *
 * `null` is the untinted case — the plain card surface the "muted" variants use.
 */
export type TintToken = "primary" | "warning" | "success" | "error" | null;

/** A tinted panel: rounded-xl, p-4, a faint fill and a visible border. */
export const tintedPanelSx = (token: TintToken) => ({
  borderRadius: 1, // rounded-xl, and shape.borderRadius is 12
  p: 2,
  border: "1px solid",
  transition: "background-color 200ms, border-color 200ms",
  ...(token
    ? {
        bgcolor: (t: Theme) => tokenAlpha(t.vars.palette[token].main, 5),
        borderColor: (t: Theme) => tokenAlpha(t.vars.palette[token].main, 30),
      }
    : {
        bgcolor: "background.paper",
        borderColor: "divider",
      }),
});

/**
 * The square icon tile inside a panel: a 10% fill behind a coloured glyph.
 *
 * `neutralBg` is explicit because the two callers genuinely disagreed before
 * the consolidation: notifications' muted variant tiled in `muted`, while the
 * next-steps default tiled in `secondary`. They are close enough to look like
 * a typo and distinct enough to be a pixel diff (index.css: 38 20% 94% against
 * 38 30% 92%), so neither is hardcoded here.
 */
export const iconTileSx = (token: TintToken, neutralBg = "muted") => ({
  p: 1,
  borderRadius: "8px", // rounded-lg
  flexShrink: 0,
  display: "flex",
  ...(token
    ? { bgcolor: (t: Theme) => tokenAlpha(t.vars.palette[token].main, 10) }
    : { bgcolor: neutralBg }),
});

/** The glyph colour that goes with a tile. */
export const tintColor = (token: TintToken) => (token ? `${token}.main` : "text.secondary");
