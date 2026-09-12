import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  // resolvedTheme, not theme. "system" is the default (App.tsx), and in that
  // state `theme` is the string "system" while the page renders light or dark
  // according to the OS — so reading `theme` made this button describe and do
  // the wrong thing for anyone who had never picked a theme explicitly. It is
  // undefined until next-themes mounts, which reads as light, matching what the
  // unmounted markup showed before.
  const isDark = resolvedTheme === "dark";
  const label = isDark ? "Switch to light theme" : "Switch to dark theme";

  // Both icons render and one rotates away, as before. Driven from the same
  // isDark that names the button rather than from a dark-mode CSS selector, so
  // the icon and the label cannot disagree — which is the bug above in a
  // different form.
  const icon = {
    width: 16,
    height: 16,
    transition: "transform 200ms",
  } as const;

  return (
    <Tooltip title={label}>
      <IconButton
        onClick={() => setTheme(isDark ? "light" : "dark")}
        aria-label={label}
        sx={{
          width: 36,
          height: 36,
          color: "text.secondary",
          // Restores the hover this button had as a shadcn ghost button
          // (hover:bg-muted hover:text-foreground). MUI's own IconButton hover
          // is alpha(action.active, 0.04) — a faint overlay, and no text
          // change at all — so without this the button stopped responding the
          // way every other control in the app does.
          //
          // secondary.main rather than an exact --muted match: the palette has
          // no slot for --muted (see #284), and secondary is the nearest
          // mapped surface token, ~2% lightness away. Picking a literal here
          // would duplicate a token, and reaching for hsl(var(--muted)) would
          // tie this file to a stylesheet that C7 deletes.
          "&:hover": { backgroundColor: "secondary.main", color: "text.primary" },
        }}
      >
        <Box
          component={Sun}
          aria-hidden="true"
          sx={{ ...icon, transform: isDark ? "rotate(-90deg) scale(0)" : "none" }}
        />
        <Box
          component={Moon}
          aria-hidden="true"
          sx={{
            ...icon,
            position: "absolute",
            transform: isDark ? "none" : "rotate(90deg) scale(0)",
          }}
        />
      </IconButton>
    </Tooltip>
  );
}
