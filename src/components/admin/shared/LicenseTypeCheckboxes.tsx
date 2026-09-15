import Checkbox from "@mui/material/Checkbox";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormGroup from "@mui/material/FormGroup";
import FormLabel from "@mui/material/FormLabel";

export const LICENSE_OPTIONS = [
  { value: "technician", label: "Technician" },
  { value: "general", label: "General" },
  { value: "extra", label: "Extra" },
] as const;

interface LicenseTypeCheckboxesProps {
  value: string[];
  onChange: (next: string[]) => void;
  /** Rendered as the group's name. Omit where a heading already says it. */
  label?: string;
  /**
   * Names the group from an existing heading instead of a second visible one.
   *
   * Without either, the fieldset has no accessible name — measured: a group
   * rendered with neither prop reports "(none)". Each checkbox is still
   * labelled, but someone arriving mid-group hears no "License Types".
   */
  labelledBy?: string;
}

/**
 * Which licence classes a topic or lesson applies to.
 *
 * The same three checkboxes and the same toggle logic appeared in four places;
 * this is the one copy. FormControl + FormLabel + FormGroup is what actually
 * names the group — the old markup put a bare <Label> above the checkboxes,
 * which named nothing.
 */
export function LicenseTypeCheckboxes({
  value,
  onChange,
  label,
  labelledBy,
}: LicenseTypeCheckboxesProps) {
  const toggle = (type: string) =>
    onChange(value.includes(type) ? value.filter((t) => t !== type) : [...value, type]);

  return (
    <FormControl component="fieldset" variant="standard" aria-labelledby={labelledBy}>
      {label && <FormLabel component="legend">{label}</FormLabel>}
      <FormGroup row sx={{ gap: 2, ...(label && { mt: 1 }) }}>
        {LICENSE_OPTIONS.map((option) => (
          <FormControlLabel
            key={option.value}
            control={
              <Checkbox
                checked={value.includes(option.value)}
                onChange={() => toggle(option.value)}
              />
            }
            label={option.label}
          />
        ))}
      </FormGroup>
    </FormControl>
  );
}
