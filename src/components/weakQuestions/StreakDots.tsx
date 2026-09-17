import Box from "@mui/material/Box";

interface StreakDotsProps {
  filled: number;
  total: number;
  /** Dot diameter in px — 8 in the list, 12 in the practice header. */
  size?: number;
}

/**
 * The row of dots showing how many correct-in-a-row a question has.
 *
 * Rendered twice before, at two sizes; only the list copy had an accessible
 * name, so in the header the dots were bare divs and the count beside them
 * did the talking. Both now carry the name as an image.
 */
export function StreakDots({ filled, total, size = 8 }: StreakDotsProps) {
  // Spans throughout: one of the two call sites is inside a <button>.
  return (
    <Box
      component="span"
      role="img"
      aria-label={`${filled} of ${total} correct in a row`}
      sx={{ display: "flex", alignItems: "center", gap: size >= 12 ? 1 : 0.5 }}
    >
      {Array.from({ length: total }, (_, i) => (
        <Box
          key={i}
          component="span"
          aria-hidden="true"
          sx={{
            display: "block",
            width: size,
            height: size,
            borderRadius: "50%",
            transition: "background-color 150ms",
            bgcolor: i < filled ? "success.main" : "muted",
          }}
        />
      ))}
    </Box>
  );
}
