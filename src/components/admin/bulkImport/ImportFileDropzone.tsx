import type { ChangeEvent, CSSProperties, RefObject } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import FormLabel from "@mui/material/FormLabel";
import { visuallyHidden } from "@mui/utils";
import { Upload } from "lucide-react";

interface ImportFileDropzoneProps {
  /** Passed straight to the input, e.g. ".csv,.json". */
  accept: string;
  /** The control's visible text, and so its accessible name. */
  prompt: string;
  disabled: boolean;
  isProcessing: boolean;
  onFileSelect: (event: ChangeEvent<HTMLInputElement>) => void;
  /** The owner clears `.value` after each parse so the same file re-triggers. */
  inputRef: RefObject<HTMLInputElement>;
}

/**
 * The file picker, as MUI documents it: a Button rendered as a <label> wrapping
 * a visually hidden file input.
 *
 * The old markup hid the input with `display: none` and had a separate Button
 * call `.click()` on it. That works with a mouse but leaves the input out of
 * the accessibility tree entirely, and the "Select File" text above it was a
 * <Label> with no htmlFor — so it named nothing. Here the label wraps the
 * input, which makes the button text the input's accessible name.
 *
 * `role={undefined}` and `tabIndex={-1}` come from the same MUI demo: the input
 * is the control, so the label must not also announce as a button or take a
 * second tab stop.
 */
export function ImportFileDropzone({
  accept,
  prompt,
  disabled,
  isProcessing,
  onFileSelect,
  inputRef,
}: ImportFileDropzoneProps) {
  return (
    <Box>
      <FormLabel component="p" sx={{ fontSize: "0.875rem", fontWeight: 500 }}>
        Select File
      </FormLabel>
      <Button
        component="label"
        role={undefined}
        tabIndex={-1}
        variant="outlined"
        disabled={disabled}
        fullWidth
        sx={{ mt: 1, height: 80, borderStyle: "dashed" }}
      >
        {isProcessing ? (
          <CircularProgress size={20} color="inherit" aria-label="Reading file" />
        ) : (
          <Box
            sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}
          >
            <Box component={Upload} aria-hidden="true" sx={{ width: 20, height: 20 }} />
            <span>{prompt}</span>
          </Box>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={onFileSelect}
          disabled={disabled}
          style={visuallyHidden as CSSProperties}
        />
      </Button>
    </Box>
  );
}
