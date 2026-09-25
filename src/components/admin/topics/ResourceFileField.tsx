import { Icon } from "@/components/ohp/Icon";
import type { ChangeEvent, CSSProperties, RefObject } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormLabel from "@mui/material/FormLabel";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import { visuallyHidden } from "@mui/utils";
import { File as FileIcon, Upload, X } from "lucide-react";
import { tokenAlpha } from "@/theme/muiTheme";
import { ALLOWED_FILE_TYPES, formatFileSize } from "./resourceDraft";

interface ResourceFileFieldProps {
  /** The resource type, which decides what the picker will accept. */
  type: string;
  file: File | null;
  onFileSelect: (event: ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
  inputRef: RefObject<HTMLInputElement>;
}

/**
 * The upload slot: a drop target until a file is chosen, then that file with a
 * control to take it back out.
 *
 * Uses MUI's documented file-upload pattern — a Button rendered as a <label>
 * wrapping a visually hidden input — so the button text names the input. The
 * old markup hid the input with `display: none` and had a separate button call
 * .click() on it, which put the control outside the accessibility tree, and
 * the "Upload File" label above it pointed at nothing.
 */
export function ResourceFileField({
  type,
  file,
  onFileSelect,
  onClear,
  inputRef,
}: ResourceFileFieldProps) {
  return (
    <Box>
      <FormLabel component="p" sx={{ fontSize: "0.875rem", fontWeight: 500 }}>
        Upload File (max 25MB)
      </FormLabel>

      {file ? (
        <Box
          sx={{
            mt: 1,
            display: "flex",
            alignItems: "center",
            gap: 1,
            p: 1.5,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: "8px",
            bgcolor: (t) => tokenAlpha(t.vars.palette.secondary.main, 30),
          }}
        >
          <Icon icon={FileIcon} size={20} sx={{ color: "text.secondary", flexShrink: 0 }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography noWrap sx={{ fontSize: "0.875rem", fontWeight: 500 }}>
              {file.name}
            </Typography>
            <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
              {formatFileSize(file.size)}
            </Typography>
          </Box>
          <IconButton
            aria-label="Clear selected file"
            onClick={onClear}
            sx={{ width: 32, height: 32, flexShrink: 0 }}
          >
            <Icon icon={X} size={16} />
          </IconButton>
        </Box>
      ) : (
        <Button
          component="label"
          role={undefined}
          tabIndex={-1}
          variant="outlined"
          fullWidth
          sx={{ mt: 1, height: 96, borderStyle: "dashed" }}
        >
          <Box
            sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}
          >
            <Icon icon={Upload} size={24} sx={{ color: "text.secondary" }} />
            <Box component="span" sx={{ fontSize: "0.875rem", color: "text.secondary" }}>
              Click to upload a file
            </Box>
          </Box>
          <input
            ref={inputRef}
            type="file"
            onChange={onFileSelect}
            accept={ALLOWED_FILE_TYPES[type]?.join(",")}
            style={visuallyHidden as CSSProperties}
          />
        </Button>
      )}
    </Box>
  );
}
