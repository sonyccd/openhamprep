import { Icon } from "@/components/ohp/Icon";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { ListPlus } from "lucide-react";
import { tokenAlpha } from "@/theme/muiTheme";

interface BulkLinkPanelProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isPending: boolean;
}

/** Paste a comma-separated list of question ids to link them all at once. */
export function BulkLinkPanel({ value, onChange, onSubmit, isPending }: BulkLinkPanelProps) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 1,
        p: 2,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: "8px",
        bgcolor: (t) => tokenAlpha(t.vars.palette.secondary.main, 20),
      }}
    >
      <Typography component="h4" sx={{ display: "flex", alignItems: "center", gap: 1, fontSize: "0.875rem", fontWeight: 500 }}>
        <Icon icon={ListPlus} size={16} />
        Bulk Link Questions
      </Typography>
      <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
        Enter question IDs separated by commas (e.g., T1A01, T1A02, T1A03)
      </Typography>
      <TextField
        multiline
        minRows={2}
        size="small"
        placeholder="T1A01, T1A02, T1A03..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={isPending}
        slotProps={{ htmlInput: { "aria-label": "Question IDs to link" } }}
      />
      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button
          variant="contained"
          size="small"
          onClick={onSubmit}
          disabled={isPending || !value.trim()}
          startIcon={isPending ? <CircularProgress size={16} color="inherit" /> : <Icon icon={ListPlus} size={16} />}
        >
          Link Questions
        </Button>
      </Box>
    </Box>
  );
}
