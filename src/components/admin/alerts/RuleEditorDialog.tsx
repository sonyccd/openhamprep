import { useId } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import type { AlertRule, RuleType, Severity } from "@/hooks/useAlerts";
import { RULE_TYPE_CONFIG, SEVERITY_CONFIG, type RuleFormData } from "./alertRuleConfig";
import { RuleTypeFields } from "./RuleTypeFields";
import { useRuleForm } from "./useRuleForm";

interface RuleEditorDialogProps {
  rule?: AlertRule;
  open: boolean;
  onClose: () => void;
  onSave: (formData: RuleFormData) => void;
  isSaving: boolean;
}

const iconFor = (icon: typeof RULE_TYPE_CONFIG.error_rate.icon, color?: string) => (
  <Box component={icon} aria-hidden="true" sx={{ width: 16, height: 16, color }} />
);

/**
 * Create and edit for an alert rule.
 *
 * Every <Label> here previously sat beside its <Input> with a matching id, so
 * the text fields were named — but the two Selects had bare <Label>s naming
 * nothing, and each validation error was a loose <p> with no tie to the field
 * it described. MUI's TextField carries error state and message together, so
 * the message is announced with the field rather than sitting near it.
 */
export function RuleEditorDialog({
  rule,
  open,
  onClose,
  onSave,
  isSaving,
}: RuleEditorDialogProps) {
  const id = useId();
  const { formData, errors, updateField, submit } = useRuleForm({ rule, open, onSave });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-description`}
      slotProps={{ paper: { sx: { maxHeight: "90vh" } } }}
    >
      <Box component="form" onSubmit={submit}>
        <DialogTitle id={`${id}-title`}>
          {rule ? "Edit Alert Rule" : "Create Alert Rule"}
        </DialogTitle>

        <DialogContent>
          <DialogContentText id={`${id}-description`} sx={{ mb: 2 }}>
            Configure when and how alerts should be triggered.
          </DialogContentText>

          <Stack spacing={2}>
            <TextField
              label="Rule Name"
              placeholder="High Error Rate"
              value={formData.name}
              onChange={(event) => updateField("name", event.target.value)}
              error={Boolean(errors.name)}
              helperText={errors.name}
              slotProps={{ inputLabel: { shrink: true } }}
              required
              fullWidth
            />

            <TextField
              label="Description"
              placeholder="Alert when errors exceed threshold..."
              value={formData.description}
              onChange={(event) => updateField("description", event.target.value)}
              multiline
              rows={2}
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
            />

            <FormControl fullWidth>
              <InputLabel id={`${id}-rule-type`}>Rule Type</InputLabel>
              <Select
                labelId={`${id}-rule-type`}
                label="Rule Type"
                value={formData.rule_type}
                onChange={(event) => updateField("rule_type", event.target.value as RuleType)}
              >
                {Object.entries(RULE_TYPE_CONFIG).map(([value, config]) => (
                  <MenuItem key={value} value={value}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {iconFor(config.icon)}
                      {config.label} - {config.hint}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <RuleTypeFields formData={formData} errors={errors} updateField={updateField} />

            <FormControl fullWidth>
              <InputLabel id={`${id}-severity`}>Severity</InputLabel>
              <Select
                labelId={`${id}-severity`}
                label="Severity"
                value={formData.severity}
                onChange={(event) => updateField("severity", event.target.value as Severity)}
              >
                {(["info", "warning", "critical"] as Severity[]).map((value) => (
                  <MenuItem key={value} value={value}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {iconFor(
                        SEVERITY_CONFIG[value].icon,
                        `${SEVERITY_CONFIG[value].token}.main`
                      )}
                      {SEVERITY_CONFIG[value].label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Cooldown (minutes)"
              type="number"
              value={formData.cooldown_minutes}
              onChange={(event) =>
                updateField("cooldown_minutes", parseInt(event.target.value) || 1)
              }
              error={Boolean(errors.cooldown_minutes)}
              helperText={
                errors.cooldown_minutes ??
                "Minimum time between repeated alerts for the same condition"
              }
              slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: 1 } }}
              fullWidth
            />

            <TextField
              label="Target Functions (optional)"
              placeholder="calculate-readiness, sync-discourse"
              value={formData.target_functions}
              onChange={(event) => updateField("target_functions", event.target.value)}
              helperText="Comma-separated list of Edge Functions to monitor. Leave empty to monitor all."
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
            />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button type="button" variant="outlined" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSaving || !formData.name}
            startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {rule ? "Save Changes" : "Create Rule"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
