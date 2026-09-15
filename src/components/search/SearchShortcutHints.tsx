import Box from "@mui/material/Box";

const HINTS = [
  { keys: "↑↓", label: "Navigate" },
  { keys: "↵", label: "Select" },
  { keys: "Esc", label: "Close" },
] as const;

/**
 * The keyboard legend along the bottom of the palette.
 *
 * aria-hidden: the keys are already the standard combobox bindings, which a
 * screen reader announces from the role itself. Reading "up down arrow
 * navigate return select escape close" before every search would be noise.
 */
export function SearchShortcutHints() {
  return (
    <Box
      aria-hidden="true"
      sx={{
        borderTop: "1px solid",
        borderColor: "divider",
        px: 1.5,
        py: 1,
        display: "flex",
        alignItems: "center",
        gap: 2,
        fontSize: "0.75rem",
        color: "text.secondary",
      }}
    >
      {HINTS.map(({ keys, label }) => (
        <Box key={label} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Box
            component="kbd"
            sx={{
              bgcolor: "muted",
              px: 0.75,
              py: 0.25,
              borderRadius: "4px",
              fontFamily: "monospace",
            }}
          >
            {keys}
          </Box>
          {label}
        </Box>
      ))}
    </Box>
  );
}
