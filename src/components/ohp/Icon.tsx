import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ElementType } from "react";
import type { LucideIcon } from "lucide-react";

interface IconProps {
  /**
   * A lucide icon. Typed wider than LucideIcon because several components
   * pass theirs through a prop declared as ElementType.
   */
  icon: LucideIcon | ElementType;
  /** Square size in px. Omit when the size comes from `sx`. */
  size?: number;
  sx?: SxProps<Theme>;
  /** A marker class, for a parent's sx to select on. */
  className?: string;
  /**
   * Set only when the icon carries meaning nothing else conveys — a status
   * mark with no text beside it, say. Leaving it off is the common case and
   * hides the icon, because it is nearly always decoration next to a label.
   */
  label?: string;
}

/**
 * A lucide icon.
 *
 * lucide-react emits an `<svg>` with no `aria-hidden`, `role` or `focusable`,
 * so an unlabelled one is exposed as an unnamed graphic. Icons here are
 * hidden by default and named only when asked, which is the way round that
 * matches how they are used: almost always beside text that already says it.
 */
export function Icon({ icon, size, sx, className, label }: IconProps) {
  return (
    <Box
      component={icon}
      className={className}
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": "true" })}
      sx={[size !== undefined && { width: size, height: size }, ...(Array.isArray(sx) ? sx : [sx])]}
    />
  );
}
