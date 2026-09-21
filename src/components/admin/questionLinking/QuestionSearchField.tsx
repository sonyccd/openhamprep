import Box from "@mui/material/Box";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import { Search } from "lucide-react";

interface QuestionSearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

/** The search box over a question list. */
export function QuestionSearchField({ value, onChange, placeholder }: QuestionSearchFieldProps) {
  return (
    <TextField
      type="search"
      size="small"
      fullWidth
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      slotProps={{
        htmlInput: { "aria-label": "Search questions" },
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <Box component={Search} aria-hidden="true" sx={{ width: 16, height: 16, color: "text.secondary" }} />
            </InputAdornment>
          ),
        },
      }}
    />
  );
}
