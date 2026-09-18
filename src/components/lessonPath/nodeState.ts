import type { Theme } from "@mui/material/styles";
import { tokenAlpha } from "@/theme/muiTheme";

export type NodeState = "completed" | "current" | "locked" | "upcoming";

/**
 * The palette key a state draws on. Locked and upcoming rows are styled on
 * neutral surfaces and have none.
 */
export const toneFor = (state: NodeState): "success" | "primary" | null =>
  state === "completed" ? "success" : state === "current" ? "primary" : null;

/** The soft glow behind an active node. */
export const glow = (t: Theme, key: "success" | "primary", px: number, pct: number) =>
  `0 0 ${px}px ${tokenAlpha(t.vars.palette[key].main, pct)}`;
