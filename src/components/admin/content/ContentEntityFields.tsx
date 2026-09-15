import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormGroup from "@mui/material/FormGroup";
import FormLabel from "@mui/material/FormLabel";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import { LICENSE_OPTIONS, generateSlug, type ContentDraft } from "./contentDraft";

interface ContentEntityFieldsProps {
  value: ContentDraft;
  onChange: (draft: ContentDraft) => void;
}

/**
 * Title, slug, description, licence types and publish state.
 *
 * Shared by AdminTopics and AdminLessons, which held byte-identical copies of
 * this form behind ten useState hooks between them — same fields, same slug
 * generation, same defaults.
 *
 * Three things the old markup got wrong, all fixed by using the components
 * properly rather than by extra attributes:
 *
 *   - Every <Label> had no htmlFor and every <Input> no id, so none of them
 *     named a control. TextField's label wires the pair.
 *   - The publish Switch sat beside a <Label> that pointed at nothing, so it
 *     announced as an unlabelled switch. FormControlLabel associates them.
 *   - "License Types" labelled nothing either — it was a bare <Label> above
 *     three checkboxes. FormControl + FormLabel + FormGroup makes it the
 *     group's name.
 */
export function ContentEntityFields({ value, onChange }: ContentEntityFieldsProps) {
  const patch = (fields: Partial<ContentDraft>) => onChange({ ...value, ...fields });

  const toggleLicense = (type: string) =>
    patch({
      licenseTypes: value.licenseTypes.includes(type)
        ? value.licenseTypes.filter((t) => t !== type)
        : [...value.licenseTypes, type],
    });

  return (
    <Stack spacing={2}>
      <TextField
        label="Title"
        placeholder="Enter title..."
        value={value.title}
        onChange={(event) =>
          patch({
            title: event.target.value,
            // Only autofill the slug while the user has not written one.
            ...(value.slug ? {} : { slug: generateSlug(event.target.value) }),
          })
        }
        slotProps={{ inputLabel: { shrink: true } }}
        fullWidth
      />

      <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
        <TextField
          label="Slug (URL-friendly)"
          placeholder="content-slug"
          value={value.slug}
          onChange={(event) => patch({ slug: event.target.value })}
          slotProps={{ inputLabel: { shrink: true } }}
          fullWidth
        />
        <Button
          type="button"
          variant="outlined"
          onClick={() => patch({ slug: generateSlug(value.title) })}
          sx={{ mt: 1, flexShrink: 0 }}
        >
          Generate
        </Button>
      </Box>

      <TextField
        label="Description"
        placeholder="Brief description..."
        value={value.description}
        onChange={(event) => patch({ description: event.target.value })}
        multiline
        rows={3}
        slotProps={{ inputLabel: { shrink: true } }}
        fullWidth
      />

      <FormControl component="fieldset" variant="standard">
        <FormLabel component="legend">License Types</FormLabel>
        <FormGroup row sx={{ gap: 2, mt: 1 }}>
          {LICENSE_OPTIONS.map((option) => (
            <FormControlLabel
              key={option.value}
              control={
                <Checkbox
                  checked={value.licenseTypes.includes(option.value)}
                  onChange={() => toggleLicense(option.value)}
                />
              }
              label={option.label}
            />
          ))}
        </FormGroup>
      </FormControl>

      <FormControlLabel
        control={
          <Switch
            checked={value.isPublished}
            onChange={(event) => patch({ isPublished: event.target.checked })}
          />
        }
        label="Publish immediately"
      />
    </Stack>
  );
}
