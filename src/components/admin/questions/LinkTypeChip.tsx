import Chip from "@mui/material/Chip";
import { LINK_TYPE_CONFIG, type LinkType } from "@/lib/resourceTypes";
import { tokenAlpha } from "@/theme/muiTheme";

interface LinkTypeChipProps {
  type: LinkType;
}

/** What kind of resource a link is, tinted to match how it reads elsewhere. */
export function LinkTypeChip({ type }: LinkTypeChipProps) {
  const config = LINK_TYPE_CONFIG[type];
  const tint = config?.tintToken;

  return (
    <Chip
      label={type}
      size="small"
      sx={{
        color: config?.token ?? "text.secondary",
        bgcolor: tint ? (t) => tokenAlpha(t.vars.palette[tint].main, 10) : "secondary.main",
      }}
    />
  );
}
