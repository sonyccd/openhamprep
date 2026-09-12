import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { Check } from "lucide-react";
import { tokenAlpha } from "@/theme/muiTheme";

/**
 * A profile field that toggles between a read-only row and an editable input.
 *
 * Defined at module scope, not inside ProfileModal's render. See
 * ProfileMenuItem for why that mattered — this is the component whose input was
 * being remounted on every keystroke.
 *
 * `autoFocus` is gone with it. It was compensating for the remount by
 * re-focusing the replacement node each time; now that the node survives, focus
 * moves once when editing starts and stays put.
 */
interface ProfileEditableFieldProps {
  label: string;
  value: string;
  displayValue: string;
  onChange: (value: string) => void;
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
  placeholder: string;
  helperText?: string;
  icon: React.ElementType;
}

export function ProfileEditableField({
  label,
  value,
  displayValue,
  onChange,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  isSaving,
  placeholder,
  helperText,
  icon: Icon,
}: ProfileEditableFieldProps) {
  return (
    <Stack spacing={1}>
      {!isEditing && (
        <Typography
          variant="body2"
          sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: 500, color: "text.secondary" }}
        >
          <Box component={Icon} aria-hidden="true" sx={{ width: 16, height: 16 }} />
          {label}
        </Typography>
      )}

      {isEditing ? (
        <Stack spacing={1.5}>
          {/*
            TextField's own label, rather than the heading above. The Radix
            version paired the input with a <div> that was not a <label> and had
            no htmlFor, so the field had no accessible name at all — probed
            before the port and it came back "(NONE)". The visible heading is
            hidden while editing so the text is not announced twice.
          */}
          <TextField
            label={label}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            fullWidth
            size="small"
          />
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              onClick={onSave}
              disabled={isSaving}
              variant="contained"
              sx={{ flex: 1 }}
              startIcon={
                isSaving ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <Box component={Check} sx={{ width: 16, height: 16 }} />
                )
              }
            >
              Save
            </Button>
            <Button variant="outlined" onClick={onCancel} sx={{ flex: 1 }}>
              Cancel
            </Button>
          </Box>
        </Stack>
      ) : (
        <ButtonBase
          onClick={onEdit}
          /*
            No aria-label, matching the original. The name comes from the
            content — the current value plus "Edit" — so it says what is
            visible. An aria-label reading "Edit Display Name" would have been
            clearer about the action but would have hidden the value and put a
            hand-written string where rendered text belongs, which is the drift
            problem this migration keeps removing.
          */
          sx={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            p: 1.5,
            borderRadius: 2,
            textAlign: "left",
            bgcolor: (theme) => tokenAlpha(theme.vars.palette.secondary.main, 40),
            "&:hover": {
              bgcolor: (theme) => tokenAlpha(theme.vars.palette.secondary.main, 60),
            },
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontWeight: 500,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              ...(!displayValue && { color: "text.secondary" }),
            }}
          >
            {displayValue || "Not set"}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: "primary.main", fontWeight: 500, flexShrink: 0, ml: 1 }}
          >
            Edit
          </Typography>
        </ButtonBase>
      )}

      {helperText && !isEditing && (
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          {helperText}
        </Typography>
      )}
    </Stack>
  );
}
