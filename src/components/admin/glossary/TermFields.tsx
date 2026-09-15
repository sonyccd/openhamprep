import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import type { TermDraft } from "./termDraft";

interface TermFieldsProps {
  value: TermDraft;
  onChange: (draft: TermDraft) => void;
}

/**
 * Term and definition, shared by the add and edit dialogs.
 *
 * Both fields were a <Label> with no htmlFor beside an input with no id, so
 * neither named its control. TextField's label wires the pair.
 */
export function TermFields({ value, onChange }: TermFieldsProps) {
  return (
    <Stack spacing={2}>
      <TextField
        label="Term"
        placeholder="Enter term..."
        value={value.term}
        onChange={(event) => onChange({ ...value, term: event.target.value })}
        slotProps={{ inputLabel: { shrink: true } }}
        fullWidth
      />
      <TextField
        label="Definition"
        placeholder="Enter definition..."
        value={value.definition}
        onChange={(event) => onChange({ ...value, definition: event.target.value })}
        multiline
        rows={5}
        slotProps={{ inputLabel: { shrink: true } }}
        fullWidth
      />
    </Stack>
  );
}
