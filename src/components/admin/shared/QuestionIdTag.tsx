import Box from "@mui/material/Box";
import { tokenAlpha } from "@/theme/muiTheme";

interface QuestionIdTagProps {
  name: string;
  size?: "small" | "medium";
}

/** A question's display id (T1A01), set in monospace on a primary tint. */
export function QuestionIdTag({ name, size = "medium" }: QuestionIdTagProps) {
  return (
    <Box
      component="span"
      sx={{
        fontFamily: "monospace",
        fontSize: size === "small" ? "0.75rem" : "0.875rem",
        color: "primary.main",
        bgcolor: (t) => tokenAlpha(t.vars.palette.primary.main, 10),
        px: 1,
        py: 0.25,
        borderRadius: "4px",
      }}
    >
      {name}
    </Box>
  );
}
