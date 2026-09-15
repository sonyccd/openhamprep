import { useId } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { EditHistoryViewer, type EditHistoryEntry } from "../EditHistoryViewer";
import { LicenseTypeCheckboxes } from "../shared/LicenseTypeCheckboxes";

export interface LessonSettings {
  title: string;
  slug: string;
  description: string;
  licenseTypes: string[];
  isPublished: boolean;
  displayOrder: number;
}

interface LessonSettingsTabProps {
  value: LessonSettings;
  onChange: (next: LessonSettings) => void;
  onGenerateSlug: () => void;
  editHistory: EditHistoryEntry[];
}

/**
 * The lesson's settings, as its own card stack.
 *
 * Not shared with TopicEditor's settings tab despite the identical field set:
 * that one is sectioned with headings and separators, this one with Cards, and
 * unifying them would be a redesign rather than a port. The pieces that are
 * genuinely identical — the licence checkboxes — are shared.
 */
export function LessonSettingsTab({
  value,
  onChange,
  onGenerateSlug,
  editHistory,
}: LessonSettingsTabProps) {
  const licenseHeadingId = useId();
  const patch = (fields: Partial<LessonSettings>) => onChange({ ...value, ...fields });

  return (
    <Stack spacing={3}>
      <Card variant="outlined">
        <CardHeader title="Basic Information" />
        <CardContent>
          <Stack spacing={2}>
            <TextField
              label="Title"
              placeholder="Lesson title..."
              value={value.title}
              onChange={(event) => patch({ title: event.target.value })}
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
            />
            <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
              <TextField
                label="Slug (URL-friendly)"
                placeholder="lesson-slug"
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
              placeholder="Brief description of this lesson..."
              value={value.description}
              onChange={(event) => patch({ description: event.target.value })}
              multiline
              rows={3}
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
            />
            <TextField
              label="Display Order"
              type="number"
              value={value.displayOrder}
              onChange={(event) => patch({ displayOrder: parseInt(event.target.value) || 0 })}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ width: 120 }}
            />
          </Stack>
        </CardContent>
      </Card>

      <Card variant="outlined">
        {/*
          The Card heading names the group rather than a second visible legend,
          so labelledBy points at it — without one or the other the fieldset
          has no accessible name at all.
        */}
        <CardHeader title="License Types" slotProps={{ title: { id: licenseHeadingId } }} />
        <CardContent>
          <LicenseTypeCheckboxes
            labelledBy={licenseHeadingId}
            value={value.licenseTypes}
            onChange={(licenseTypes) => patch({ licenseTypes })}
          />
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardHeader title="Visibility" />
        <CardContent>
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
                    ? "This lesson is visible to users"
                    : "This lesson is hidden (draft)"}
                </Typography>
              </Box>
            }
          />
        </CardContent>
      </Card>

      {editHistory.length > 0 && (
        <Card variant="outlined">
          <CardHeader title="Edit History" />
          <CardContent>
            <EditHistoryViewer history={editHistory} />
          </CardContent>
        </Card>
      )}
    </Stack>
  );
}
