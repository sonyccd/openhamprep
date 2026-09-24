import { Icon } from "@/components/ohp/Icon";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import { ArrowLeft, Eye, EyeOff, Save, Trash2 } from "lucide-react";

interface LessonEditorHeaderProps {
  title: string;
  slug: string;
  isPublished: boolean;
  isSaving: boolean;
  hasChanges: boolean;
  onBack: () => void;
  onTogglePublish: () => void;
  onDelete: () => void;
  onSave: () => void;
}

export function LessonEditorHeader({
  title,
  slug,
  isPublished,
  isSaving,
  hasChanges,
  onBack,
  onTogglePublish,
  onDelete,
  onSave,
}: LessonEditorHeaderProps) {
  return (
    <Box
      sx={{
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        pb: 2,
        borderBottom: "1px solid",
        borderColor: "divider",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        {/* The old back button was an unnamed icon. */}
        <IconButton aria-label="Back to lessons" onClick={onBack}>
          <Icon icon={ArrowLeft} size={16} />
        </IconButton>
        <Box>
          <Typography component="h2" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
          <Typography sx={{ fontSize: "0.875rem", color: "text.secondary" }}>
            /lessons/{slug}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Button
          variant="outlined"
          size="small"
          onClick={onTogglePublish}
          disabled={isSaving}
          startIcon={
            <Box component={isPublished ? EyeOff : Eye} sx={{ width: 16, height: 16 }} />
          }
        >
          {isPublished ? "Unpublish" : "Publish"}
        </Button>

        <Button
          variant="contained"
          color="error"
          size="small"
          onClick={onDelete}
          startIcon={<Icon icon={Trash2} size={16} />}
        >
          Delete
        </Button>

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
          Save
        </Button>
      </Box>
    </Box>
  );
}
