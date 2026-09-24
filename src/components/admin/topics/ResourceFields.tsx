import { Icon } from "@/components/ohp/Icon";
import { useId, type ReactNode } from "react";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { getResourceTypeOptions } from "@/lib/resourceTypes";
import type { ResourceDraft } from "./resourceDraft";

const RESOURCE_TYPES = getResourceTypeOptions();

interface ResourceFieldsProps {
  value: ResourceDraft;
  onChange: (draft: ResourceDraft) => void;
  /** Overrides the URL label when an upload will stand in for it. */
  urlLabel?: string;
  /** The upload control, which only the add form offers. */
  children?: ReactNode;
}

/**
 * Type, title, URL and description — the form behind both resource dialogs.
 *
 * The add and edit dialogs held byte-identical copies of these four fields
 * behind eight useState hooks between them. Every <Label> in both had no
 * htmlFor and every <Input> no id, so none of them named a control; TextField
 * wires each pair, and the Select gets an InputLabel with a matching labelId
 * (MUI renders a div[role=combobox], which htmlFor cannot address).
 */
export function ResourceFields({ value, onChange, urlLabel, children }: ResourceFieldsProps) {
  const labelId = useId();
  const patch = (fields: Partial<ResourceDraft>) => onChange({ ...value, ...fields });

  return (
    <Stack spacing={2}>
      <FormControl fullWidth>
        <InputLabel id={labelId}>Type</InputLabel>
        <Select
          labelId={labelId}
          label="Type"
          value={value.type}
          onChange={(event) => patch({ type: event.target.value })}
        >
          {RESOURCE_TYPES.map((type) => (
            <MenuItem key={type.value} value={type.value}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Icon icon={type.icon} size={16} sx={{ color: type.token }} />
                {type.label}
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <TextField
        label="Title"
        placeholder="Resource title..."
        value={value.title}
        onChange={(event) => patch({ title: event.target.value })}
        slotProps={{ inputLabel: { shrink: true } }}
        fullWidth
      />

      {children}

      <TextField
        label={urlLabel ?? "URL"}
        placeholder="https://..."
        value={value.url}
        onChange={(event) => patch({ url: event.target.value })}
        slotProps={{ inputLabel: { shrink: true } }}
        fullWidth
      />

      <TextField
        label="Description (optional)"
        placeholder="Brief description..."
        value={value.description}
        onChange={(event) => patch({ description: event.target.value })}
        multiline
        rows={2}
        slotProps={{ inputLabel: { shrink: true } }}
        fullWidth
      />
    </Stack>
  );
}
