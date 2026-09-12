import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Palette } from "lucide-react";
import { ThemeSelector } from "@/components/ThemeSelector";

export function ProfileAppearanceView() {
  return (
    <Stack spacing={1.5}>
      <Typography
        variant="body2"
        sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: 500, color: "text.secondary" }}
      >
        <Box component={Palette} aria-hidden="true" sx={{ width: 16, height: 16 }} />
        Theme
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        Choose how Open Ham Prep looks to you
      </Typography>
      <ThemeSelector />
    </Stack>
  );
}
