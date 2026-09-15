import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import { useId } from "react";
import { NO_CATEGORY, type ToolDraft } from "./toolDraft";

interface ToolCategory {
  id: string;
  name: string;
}

interface ToolFieldsProps {
  value: ToolDraft;
  onChange: (draft: ToolDraft) => void;
  categories: ToolCategory[];
}

/**
 * Title, description, URL, category and publish state.
 *
 * Shared by the add and edit dialogs, which held two copies of this behind ten
 * useState hooks between them.
 *
 * The category Select is wired with InputLabel + labelId rather than a label
 * with htmlFor. MUI renders a Select as a <div role="combobox">, and htmlFor
 * only associates with a real form control — the mistake #286 found, where the
 * label pointed at nothing and the combobox announced unnamed.
 */
export function ToolFields({ value, onChange, categories }: ToolFieldsProps) {
  const categoryLabelId = useId();
  const patch = (fields: Partial<ToolDraft>) => onChange({ ...value, ...fields });

  return (
    <Stack spacing={2}>
      <TextField
        label="Title"
        value={value.title}
        onChange={(event) => patch({ title: event.target.value })}
        slotProps={{ inputLabel: { shrink: true } }}
        fullWidth
      />
      <TextField
        label="Description"
        placeholder="Two sentence description..."
        value={value.description}
        onChange={(event) => patch({ description: event.target.value })}
        multiline
        rows={3}
        slotProps={{ inputLabel: { shrink: true } }}
        fullWidth
      />
      <TextField
        label="URL"
        placeholder="https://..."
        value={value.url}
        onChange={(event) => patch({ url: event.target.value })}
        slotProps={{ inputLabel: { shrink: true } }}
        fullWidth
      />
      <FormControl fullWidth>
        <InputLabel id={categoryLabelId}>Category</InputLabel>
        <Select
          labelId={categoryLabelId}
          label="Category"
          value={value.categoryId || NO_CATEGORY}
          onChange={(event) =>
            patch({
              categoryId: event.target.value === NO_CATEGORY ? "" : event.target.value,
            })
          }
        >
          <MenuItem value={NO_CATEGORY}>No category</MenuItem>
          {categories.map((category) => (
            <MenuItem key={category.id} value={category.id}>
              {category.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControlLabel
        control={
          <Switch
            checked={value.isPublished}
            onChange={(event) => patch({ isPublished: event.target.checked })}
          />
        }
        label="Published"
      />
    </Stack>
  );
}
