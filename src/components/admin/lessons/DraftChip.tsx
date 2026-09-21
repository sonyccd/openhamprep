import Chip from "@mui/material/Chip";

/** Marks a topic that is not yet published. */
export function DraftChip() {
  return <Chip size="small" variant="outlined" label="Draft" color="warning" sx={{ flexShrink: 0 }} />;
}
