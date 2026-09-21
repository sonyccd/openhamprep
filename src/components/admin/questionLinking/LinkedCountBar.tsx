import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import { tokenAlpha } from "@/theme/muiTheme";

interface LinkedCountBarProps {
  linked: number;
  matching: number;
}

/** How many questions are linked, and how many the current filter shows. */
export function LinkedCountBar({ linked, matching }: LinkedCountBarProps) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2, fontSize: "0.875rem" }}>
      <Chip
        size="small"
        label={`${linked} linked`}
        sx={{ bgcolor: (t) => tokenAlpha(t.vars.palette.primary.main, 20), color: "primary.main" }}
      />
      <Box component="span" sx={{ color: "text.secondary" }}>
        {matching} questions match filter
      </Box>
    </Box>
  );
}
