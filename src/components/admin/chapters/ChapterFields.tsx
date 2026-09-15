import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import type { ChapterDraft } from "./chapterDraft";

interface ChapterFieldsProps {
  value: ChapterDraft;
  onChange: (draft: ChapterDraft) => void;
}

/**
 * The three fields a chapter has, shared by the add and edit dialogs.
 *
 * Those dialogs held two copies of the same form behind six useState hooks —
 * newTitle/editTitle and so on — which is the duplication worth removing here,
 * not the hand-written onChange.
 *
 * TextField's `label` also fixes an accessibility bug the old markup had: every
 * field was a shadcn <Label> with no htmlFor beside an <Input> with no id, so
 * none of them named anything. TextField wires the pair itself.
 */
export function ChapterFields({ value, onChange }: ChapterFieldsProps) {
  const set = <K extends keyof ChapterDraft>(key: K) =>
    (event: React.ChangeEvent<HTMLInputElement>) =>
      onChange({ ...value, [key]: event.target.value });

  return (
    <Stack spacing={2}>
      <TextField
        label="Chapter Number"
        type="number"
        placeholder="e.g., 1"
        value={value.chapterNumber}
        onChange={set("chapterNumber")}
        slotProps={{ htmlInput: { min: 1 }, inputLabel: { shrink: true } }}
        fullWidth
      />
      <TextField
        label="Title"
        placeholder="e.g., Welcome to Amateur Radio"
        value={value.title}
        onChange={set("title")}
        slotProps={{ inputLabel: { shrink: true } }}
        fullWidth
      />
      <TextField
        label="Description (optional)"
        placeholder="Brief description of what this chapter covers..."
        value={value.description}
        onChange={set("description")}
        multiline
        rows={3}
        slotProps={{ inputLabel: { shrink: true } }}
        fullWidth
      />
    </Stack>
  );
}
