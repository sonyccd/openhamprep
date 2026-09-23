import Link from "@mui/material/Link";
import { visuallyHidden } from "@mui/utils";

/**
 * Lets a keyboard user jump past the navigation to the main content.
 *
 * Hidden until focused, rather than absent: it has to be the first thing in
 * the tab order, so it is in the DOM from the start and only its presentation
 * changes. `visuallyHidden` clips it; focus restores it to a real box.
 */
export function SkipLink() {
  return (
    <Link
      href="#main-content"
      sx={{
        ...visuallyHidden,
        "&:focus": {
          // Undo the clip, then place it over the top-left of the page.
          clip: "auto",
          clipPath: "none",
          overflow: "visible",
          height: "auto",
          width: "auto",
          margin: 0,
          position: "absolute",
          top: 16,
          left: 16,
          zIndex: (t) => t.zIndex.tooltip,
          px: 2,
          py: 1,
          borderRadius: "6px",
          bgcolor: "primary.main",
          color: "primary.contrastText",
          textDecoration: "none",
          outline: "2px solid",
          outlineColor: "primary.main",
          outlineOffset: 2,
        },
      }}
    >
      Skip to main content
    </Link>
  );
}
