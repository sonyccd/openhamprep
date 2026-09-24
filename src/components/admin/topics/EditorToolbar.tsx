import { Icon } from "@/components/ohp/Icon";
import { useRef } from "react";
import type { CSSProperties } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import { visuallyHidden } from "@mui/utils";
import { FileText, ImagePlus, Save } from "lucide-react";
import { TOPIC_IMAGE_TYPES } from "@/hooks/useTopicContentEditor";

const icon = { width: 16, height: 16 } as const;

interface EditorToolbarProps {
  hasChanges: boolean;
  isSaving: boolean;
  isUploading: boolean;
  onSave: () => void;
  onImagePicked: (file: File) => void;
}

/** Heading, unsaved marker, and the Image / Save buttons. */
export function EditorToolbar({ hasChanges, isSaving, isUploading, onSave, onImagePicked }: EditorToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2, flexShrink: 0 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Icon icon={FileText} size={20} sx={{ color: "primary.main" }} />
        <Typography component="h3" sx={{ fontWeight: 600 }}>
          Content Editor
        </Typography>
        {hasChanges && <Chip component="span" size="small" color="warning" variant="outlined" label="Unsaved changes" sx={{ fontSize: "0.75rem" }} />}
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <input
          ref={fileInputRef}
          type="file"
          accept={TOPIC_IMAGE_TYPES.join(",")}
          aria-label="Choose an image to insert"
          style={visuallyHidden as CSSProperties}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onImagePicked(file);
            // So the same file can be chosen again.
            e.target.value = "";
          }}
        />
        <Button
          size="small"
          variant="outlined"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          startIcon={isUploading ? <CircularProgress size={16} color="inherit" /> : <Icon icon={ImagePlus} sx={icon} />}
        >
          Image
        </Button>
        <Button
          size="small"
          variant="contained"
          onClick={onSave}
          disabled={!hasChanges || isSaving}
          startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : <Icon icon={Save} sx={icon} />}
        >
          Save
        </Button>
      </Box>
    </Box>
  );
}
