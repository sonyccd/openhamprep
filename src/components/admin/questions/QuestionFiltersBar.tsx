import { Search, ThumbsDown, X } from "lucide-react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

interface QuestionFiltersBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  showNegativeFeedbackOnly: boolean;
  onNegativeFeedbackChange: (checked: boolean) => void;
  filteredCount: number;
}

export function QuestionFiltersBar({
  searchTerm,
  onSearchChange,
  showNegativeFeedbackOnly,
  onNegativeFeedbackChange,
  filteredCount,
}: QuestionFiltersBarProps) {
  return (
    <Stack spacing={1.5} sx={{ mt: 2 }}>
      <TextField
        size="small"
        fullWidth
        placeholder="Search questions..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Search className="w-4 h-4" aria-hidden="true" />
              </InputAdornment>
            ),
          },
        }}
      />

      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
        <FormControlLabel
          control={
            <Checkbox
              size="small"
              checked={showNegativeFeedbackOnly}
              onChange={(e) => onNegativeFeedbackChange(e.target.checked)}
            />
          }
          label={
            <Box component="span" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <ThumbsDown className="w-3 h-3" aria-hidden="true" />
              Negative feedback
            </Box>
          }
          slotProps={{ typography: { variant: "body2", color: "text.secondary" } }}
        />

        {showNegativeFeedbackOnly && (
          <Button
            size="small"
            color="inherit"
            onClick={() => onNegativeFeedbackChange(false)}
            startIcon={<X className="w-4 h-4" aria-hidden="true" />}
          >
            Clear filter
          </Button>
        )}

        <Typography variant="body2" color="text.secondary" sx={{ ml: "auto" }}>
          {filteredCount} question{filteredCount !== 1 ? "s" : ""}
        </Typography>
      </Stack>
    </Stack>
  );
}
