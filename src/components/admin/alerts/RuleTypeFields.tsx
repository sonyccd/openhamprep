import Box from "@mui/material/Box";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { tokenAlpha } from "@/theme/muiTheme";
import type { RuleFormData } from "./alertRuleConfig";
import type { ValidationErrors } from "./useRuleForm";

interface RuleTypeFieldsProps {
  formData: RuleFormData;
  errors: ValidationErrors;
  updateField: <K extends keyof RuleFormData>(field: K, value: RuleFormData[K]) => void;
}

/** Tinted well holding whichever fields the chosen rule type needs. */
const Well = ({ children }: { children: React.ReactNode }) => (
  <Stack
    spacing={2}
    sx={{
      p: 1.5,
      borderRadius: "8px",
      bgcolor: (t) => tokenAlpha(t.vars.palette.muted, 50),
    }}
  >
    {children}
  </Stack>
);

/** A whole number, floored at 1 — these all count things. */
const countField = (
  value: number,
  onChange: (value: number) => void,
  error: string | undefined,
  label: string,
  helperText?: string
) => ({
  label,
  type: "number" as const,
  value,
  onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
    onChange(parseInt(event.target.value) || 1),
  error: Boolean(error),
  // The message replaces the hint while it stands, which is what MUI's
  // helperText slot does and what gets announced — the old markup put the
  // error in a loose <p> that named nothing and was never read out.
  helperText: error ?? helperText,
  slotProps: { inputLabel: { shrink: true }, htmlInput: { min: 1 } },
  fullWidth: true,
});

export function RuleTypeFields({ formData, errors, updateField }: RuleTypeFieldsProps) {
  if (formData.rule_type === "error_rate") {
    return (
      <Well>
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
          <TextField
            {...countField(
              formData.threshold,
              (v) => updateField("threshold", v),
              errors.threshold,
              "Error Threshold"
            )}
          />
          <TextField
            {...countField(
              formData.window_minutes,
              (v) => updateField("window_minutes", v),
              errors.window_minutes,
              "Time Window (minutes)"
            )}
          />
        </Box>
        <TextField
          label="Error Pattern Filter (optional)"
          placeholder="database|connection (regex)"
          value={formData.error_pattern}
          onChange={(event) => updateField("error_pattern", event.target.value)}
          // The pattern error only belongs to this field when it has content;
          // an empty optional filter is not what failed validation.
          error={Boolean(errors.pattern && formData.error_pattern)}
          helperText={
            (formData.error_pattern && errors.pattern) ||
            "Only count errors matching this pattern (regex supported)"
          }
          slotProps={{ inputLabel: { shrink: true } }}
          fullWidth
        />
      </Well>
    );
  }

  if (formData.rule_type === "error_pattern") {
    return (
      <Well>
        <TextField
          label="Pattern to Match"
          placeholder="timeout|timed out|deadline exceeded"
          value={formData.pattern}
          onChange={(event) => updateField("pattern", event.target.value)}
          error={Boolean(errors.pattern)}
          helperText={errors.pattern ?? "Regex pattern to search for in error messages"}
          slotProps={{ inputLabel: { shrink: true } }}
          required
          fullWidth
        />
        <FormControlLabel
          control={
            <Switch
              checked={formData.case_sensitive}
              onChange={(event) => updateField("case_sensitive", event.target.checked)}
            />
          }
          label="Case sensitive"
        />
      </Well>
    );
  }

  return (
    <Well>
      <TextField
        {...countField(
          formData.consecutive_failures,
          (v) => updateField("consecutive_failures", v),
          errors.consecutive_failures,
          "Consecutive Failures",
          "Alert when a function fails this many times in a row"
        )}
      />
    </Well>
  );
}
