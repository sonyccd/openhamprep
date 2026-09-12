import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { AlertTriangle, Trash2 } from "lucide-react";
import { tokenAlpha } from "@/theme/muiTheme";
import { sectionHeading } from "./types";

interface ProfileDangerZoneProps {
  showDeleteConfirm: boolean;
  onShowDeleteConfirm: (show: boolean) => void;
  deleteConfirmText: string;
  onDeleteConfirmTextChange: (value: string) => void;
  onDeleteAccount: () => void;
  isDeleting: boolean;
}

/** Account deletion, kept separate so the account view stays readable. */
export function ProfileDangerZone({
  showDeleteConfirm,
  onShowDeleteConfirm,
  deleteConfirmText,
  onDeleteConfirmTextChange,
  onDeleteAccount,
  isDeleting,
}: ProfileDangerZoneProps) {
  return (
    <Box sx={{ pt: 2, mt: 1, borderTop: "1px solid", borderColor: "divider" }}>
      <Stack spacing={1}>
        <Typography variant="body2" sx={sectionHeading}>
          <Box component={Trash2} aria-hidden="true" sx={{ width: 16, height: 16 }} />
          Danger Zone
        </Typography>

        {!showDeleteConfirm ? (
          <>
            <Button
              variant="outlined"
              color="error"
              onClick={() => onShowDeleteConfirm(true)}
              fullWidth
              startIcon={<Box component={Trash2} sx={{ width: 16, height: 16 }} />}
            >
              Delete Account
            </Button>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              This action cannot be undone
            </Typography>
          </>
        ) : (
          <Stack
            spacing={2}
            sx={{
              p: 2,
              borderRadius: 3,
              border: "1px solid",
              borderColor: (theme) => tokenAlpha(theme.vars.palette.error.main, 20),
              bgcolor: (theme) => tokenAlpha(theme.vars.palette.error.main, 5),
            }}
          >
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  color: "error.main",
                  bgcolor: (theme) => tokenAlpha(theme.vars.palette.error.main, 10),
                }}
              >
                <Box component={AlertTriangle} aria-hidden="true" sx={{ width: 20, height: 20 }} />
              </Box>
              <Stack spacing={0.5}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: "error.main" }}>
                  Delete your account permanently
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary", lineHeight: 1.6 }}>
                  All your data including practice history, bookmarks, test results, and forum
                  account will be permanently deleted. This cannot be undone.
                </Typography>
              </Stack>
            </Box>

            <Stack spacing={1.5}>
              {/*
                The only field that was correctly labelled before — it had a
                real <Label htmlFor>. TextField keeps that association and
                carries the emphasis in helperText, since a label cannot hold
                markup.
              */}
              <TextField
                label="Type DELETE to confirm"
                value={deleteConfirmText}
                onChange={(e) => onDeleteConfirmTextChange(e.target.value.toUpperCase())}
                placeholder="DELETE"
                fullWidth
                size="small"
                slotProps={{ htmlInput: { style: { fontFamily: "monospace", textTransform: "uppercase" } } }}
              />

              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  variant="outlined"
                  onClick={() => {
                    onShowDeleteConfirm(false);
                    onDeleteConfirmTextChange("");
                  }}
                  sx={{ flex: 1 }}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  onClick={onDeleteAccount}
                  disabled={deleteConfirmText !== "DELETE" || isDeleting}
                  sx={{ flex: 1 }}
                  startIcon={
                    isDeleting ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <Box component={Trash2} sx={{ width: 16, height: 16 }} />
                    )
                  }
                >
                  {isDeleting ? "Deleting..." : "Delete Forever"}
                </Button>
              </Box>
            </Stack>
          </Stack>
        )}
      </Stack>
    </Box>
  );
}
