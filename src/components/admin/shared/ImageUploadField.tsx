import { Icon } from "@/components/ohp/Icon";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import { visuallyHidden } from "@mui/utils";
import { Image as ImageIcon, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { rejectImage } from "@/lib/imageUpload";
import type { ImageFileRules } from "@/lib/imageUpload";
import { tokenAlpha } from "@/theme/muiTheme";
import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog";

const icon = { width: 16, height: 16 } as const;

interface ImageUploadFieldProps {
  /** What is stored. A local preview of a picked file is shown over it while uploading. */
  storedUrl: string | null;
  imageAlt: string;
  /** The word for what is being uploaded, e.g. "Image" or "Figure". */
  noun: string;
  /** What this field takes. Drives the accept list and the rejection message. */
  rules: ImageFileRules;
  hint: string;
  isUploading: boolean;
  isRemoving: boolean;
  /** Absent when there is nothing stored to remove. */
  onRemove?: () => void;
  onFilePicked: (file: File) => void;
}

/**
 * Preview, upload/replace, and a confirmed remove — the shape shared by the
 * question figure and the ham radio tool image. What happens to the file is
 * the caller's business; this is the control around it.
 */
export function ImageUploadField({
  storedUrl,
  imageAlt,
  noun,
  rules,
  hint,
  isUploading,
  isRemoving,
  onRemove,
  onFilePicked,
}: ImageUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Revoke whatever is outstanding if this unmounts mid-upload.
  const previewRef = useRef<string | null>(null);
  previewRef.current = previewUrl;
  useEffect(() => () => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
  }, []);

  // The preview lasts exactly as long as the upload. Clearing it when
  // isUploading goes false covers failure too: a file that never landed must
  // not keep standing in for the image that is actually stored.
  useEffect(() => {
    if (isUploading || !previewUrl) return;
    URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  }, [isUploading, previewUrl]);

  const displayUrl = previewUrl ?? storedUrl;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {displayUrl && (
        <Box
          sx={{
            position: "relative",
            borderRadius: "8px",
            overflow: "hidden",
            border: "1px solid",
            borderColor: "divider",
            bgcolor: (t) => tokenAlpha(t.vars.palette.muted, 20),
          }}
        >
          <Box component="img" src={displayUrl} alt={imageAlt} sx={{ width: "100%", height: "auto", maxHeight: 200, objectFit: "contain", display: "block" }} />
          {isUploading && (
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: (t) => tokenAlpha(t.vars.palette.background.default, 80),
              }}
            >
              <CircularProgress size={24} />
            </Box>
          )}
        </Box>
      )}

      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <input
          ref={fileInputRef}
          type="file"
          accept={rules.allowedTypes.join(",")}
          aria-label={`Choose ${noun.toLowerCase()} to upload`}
          // visuallyHidden keeps the input in the tab order, unlike the
          // display:none it replaced, so it has to be disabled in its own
          // right or a second file could be picked mid-upload.
          disabled={isUploading || isRemoving}
          style={visuallyHidden as CSSProperties}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              // Validate before previewing: a rejected file must never stand
              // in, even for a frame, for the image that is actually stored.
              const rejection = rejectImage(file, rules);
              if (rejection) {
                toast.error(rejection);
              } else {
                setPreviewUrl(URL.createObjectURL(file));
                onFilePicked(file);
              }
            }
            // So the same file can be chosen again after a rejection.
            e.target.value = "";
          }}
        />

        <Button
          type="button"
          variant="outlined"
          size="small"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || isRemoving}
          startIcon={
            isUploading ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <Box component={displayUrl ? Upload : ImageIcon} aria-hidden="true" sx={icon} />
            )
          }
          sx={{ flex: 1, ...(!displayUrl && { borderStyle: "dashed" }) }}
        >
          {isUploading ? "Uploading..." : displayUrl ? `Replace ${noun}` : `Upload ${noun}`}
        </Button>

        {onRemove && (
          <Button
            type="button"
            variant="text"
            size="small"
            color="error"
            onClick={() => setConfirmingRemove(true)}
            disabled={isRemoving}
            aria-label={`Remove ${noun.toLowerCase()}`}
            sx={{ minWidth: 0, px: 1 }}
          >
            {isRemoving ? <CircularProgress size={16} color="inherit" /> : <Icon icon={Trash2} sx={icon} />}
          </Button>
        )}
      </Box>

      <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>{hint}</Typography>

      <ConfirmDeleteDialog
        open={confirmingRemove}
        title={`Remove ${noun}`}
        description={`Are you sure you want to remove this ${noun.toLowerCase()}? This action cannot be undone.`}
        confirmLabel="Remove"
        isPending={isRemoving}
        onCancel={() => setConfirmingRemove(false)}
        onConfirm={() => {
          setConfirmingRemove(false);
          onRemove?.();
        }}
      />
    </Box>
  );
}
