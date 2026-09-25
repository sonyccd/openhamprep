import { Icon } from "@/components/ohp/Icon";
import { useId } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { Save, Trash2 } from "lucide-react";
import { tokenAlpha } from "@/theme/muiTheme";
import { EditHistoryViewer, type EditHistoryEntry } from "../EditHistoryViewer";
import { LicenseTypeCheckboxes } from "../shared/LicenseTypeCheckboxes";

export interface TopicSettings {
  title: string;
  slug: string;
  description: string;
  licenseTypes: string[];
  isPublished: boolean;
  displayOrder: number;
}

interface TopicSettingsTabProps {
  value: TopicSettings;
  onChange: (next: TopicSettings) => void;
  onGenerateSlug: () => void;
  editHistory: EditHistoryEntry[];
  hasChanges: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  onSave: () => void;
  onDelete: () => void;
}

/** A section heading plus its body, the layout this tab is built from. */
function Section({
  title,
  titleId,
  danger,
  children,
}: {
  title: string;
  titleId?: string;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Stack spacing={2}>
      <Typography
        component="h3"
        id={titleId}
        sx={{ fontWeight: 600, ...(danger && { color: "error.main" }) }}
      >
        {title}
      </Typography>
      {children}
    </Stack>
  );
}

/**
 * The topic's settings.
 *
 * Kept separate from LessonSettingsTab despite the identical field set: this
 * one is sectioned with headings and dividers where that one uses Cards, so
 * unifying them would be a redesign rather than a port. The licence checkboxes
 * are shared, since those really are the same.
 */
export function TopicSettingsTab({
  value,
  onChange,
  onGenerateSlug,
  editHistory,
  hasChanges,
  isSaving,
  isDeleting,
  onSave,
  onDelete,
}: TopicSettingsTabProps) {
  const licenseHeadingId = useId();
  const patch = (fields: Partial<TopicSettings>) => onChange({ ...value, ...fields });

  return (
    <Stack spacing={3} sx={{ maxWidth: 672 }}>
      <Section title="Basic Information">
        <TextField
          label="Title"
          placeholder="Topic title"
          value={value.title}
          onChange={(event) => patch({ title: event.target.value })}
          slotProps={{ inputLabel: { shrink: true } }}
          fullWidth
        />
        <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
          <TextField
            label="Slug (URL-friendly)"
            placeholder="topic-slug"
            value={value.slug}
            onChange={(event) => patch({ slug: event.target.value })}
            slotProps={{ inputLabel: { shrink: true } }}
            fullWidth
          />
          <Button type="button" variant="outlined" onClick={onGenerateSlug} sx={{ mt: 1 }}>
            Generate
          </Button>
        </Box>
        <TextField
          label="Description"
          placeholder="Brief description for the topic card..."
          value={value.description}
          onChange={(event) => patch({ description: event.target.value })}
          multiline
          rows={3}
          slotProps={{ inputLabel: { shrink: true } }}
          fullWidth
        />
      </Section>

      <Divider />

      <Section title="Visibility">
        <FormControlLabel
          control={
            <Switch
              checked={value.isPublished}
              onChange={(event) => patch({ isPublished: event.target.checked })}
            />
          }
          label={
            <Box>
              <Typography>Published</Typography>
              <Typography sx={{ fontSize: "0.875rem", color: "text.secondary" }}>
                {value.isPublished
                  ? "This topic is visible to all users"
                  : "This topic is only visible to admins"}
              </Typography>
            </Box>
          }
        />
      </Section>

      <Divider />

      {/* The heading names the checkbox group, so there is no second legend. */}
      <Section title="License Types" titleId={licenseHeadingId}>
        <Typography sx={{ fontSize: "0.875rem", color: "text.secondary" }}>
          Select which license classes this topic applies to
        </Typography>
        <LicenseTypeCheckboxes
          labelledBy={licenseHeadingId}
          value={value.licenseTypes}
          onChange={(licenseTypes) => patch({ licenseTypes })}
        />
      </Section>

      <Divider />

      <Section title="Display Order">
        <Box>
          <TextField
            label="Order"
            type="number"
            value={value.displayOrder}
            onChange={(event) => patch({ displayOrder: parseInt(event.target.value) || 0 })}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ width: 128 }}
          />
          <Typography sx={{ fontSize: "0.875rem", color: "text.secondary", mt: 0.5 }}>
            Lower numbers appear first in the topic list
          </Typography>
        </Box>
      </Section>

      <Divider />

      <Section title="Edit History">
        <EditHistoryViewer history={editHistory} />
      </Section>

      <Divider />

      <Section title="Danger Zone" danger>
        <Box
          sx={{
            border: "1px solid",
            borderColor: (t) => tokenAlpha(t.vars.palette.error.main, 30),
            bgcolor: (t) => tokenAlpha(t.vars.palette.error.main, 5),
            borderRadius: "8px",
            p: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Box>
            <Typography sx={{ fontWeight: 500 }}>Delete this topic</Typography>
            <Typography sx={{ fontSize: "0.875rem", color: "text.secondary" }}>
              This will permanently remove the topic, all linked resources, and user
              progress data.
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="error"
            onClick={onDelete}
            disabled={isDeleting}
            startIcon={<Icon icon={Trash2} size={16} />}
            sx={{ flexShrink: 0 }}
          >
            Delete Topic
          </Button>
        </Box>
      </Section>

      <Box sx={{ display: "flex", justifyContent: "flex-end", pt: 2 }}>
        <Button
          variant="contained"
          onClick={onSave}
          disabled={!hasChanges || isSaving}
          startIcon={
            isSaving ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <Icon icon={Save} size={16} />
            )
          }
        >
          Save Settings
        </Button>
      </Box>
    </Stack>
  );
}
