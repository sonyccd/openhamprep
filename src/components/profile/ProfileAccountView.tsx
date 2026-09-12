import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { KeyRound, Mail, MessageSquare, Trash2, User } from "lucide-react";
import { ProfileEditableField } from "./ProfileEditableField";
import { ProfileDangerZone } from "./ProfileDangerZone";
import { tokenAlpha } from "@/theme/muiTheme";
import { sectionHeading, type ProfileUserInfo } from "./types";

interface ProfileAccountViewProps {
  userInfo: ProfileUserInfo;
  displayName: string;
  onDisplayNameChange: (value: string) => void;
  isEditingName: boolean;
  onEditName: () => void;
  onSaveName: () => void;
  onCancelName: () => void;
  isUpdatingName: boolean;
  forumUsername: string;
  onForumUsernameChange: (value: string) => void;
  isEditingForumUsername: boolean;
  onEditForumUsername: () => void;
  onSaveForumUsername: () => void;
  onCancelForumUsername: () => void;
  isUpdatingForumUsername: boolean;
  newEmail: string;
  onNewEmailChange: (value: string) => void;
  onUpdateEmail: () => void;
  isUpdatingEmail: boolean;
  onResetPassword: () => void;
  isResettingPassword: boolean;
  showDeleteConfirm: boolean;
  onShowDeleteConfirm: (show: boolean) => void;
  deleteConfirmText: string;
  onDeleteConfirmTextChange: (value: string) => void;
  onDeleteAccount: () => void;
  isDeleting: boolean;
}

export function ProfileAccountView({
  userInfo,
  displayName,
  onDisplayNameChange,
  isEditingName,
  onEditName,
  onSaveName,
  onCancelName,
  isUpdatingName,
  forumUsername,
  onForumUsernameChange,
  isEditingForumUsername,
  onEditForumUsername,
  onSaveForumUsername,
  onCancelForumUsername,
  isUpdatingForumUsername,
  newEmail,
  onNewEmailChange,
  onUpdateEmail,
  isUpdatingEmail,
  onResetPassword,
  isResettingPassword,
  showDeleteConfirm,
  onShowDeleteConfirm,
  deleteConfirmText,
  onDeleteConfirmTextChange,
  onDeleteAccount,
  isDeleting,
}: ProfileAccountViewProps) {
  return (
    <Stack spacing={3}>
      <ProfileEditableField
        icon={User}
        label="Display Name"
        value={displayName}
        displayValue={userInfo.displayName || ""}
        onChange={onDisplayNameChange}
        isEditing={isEditingName}
        onEdit={onEditName}
        onSave={onSaveName}
        onCancel={onCancelName}
        isSaving={isUpdatingName}
        placeholder="Enter your name"
      />

      <ProfileEditableField
        icon={MessageSquare}
        label="Community Username"
        value={forumUsername}
        displayValue={userInfo.forumUsername || ""}
        onChange={onForumUsernameChange}
        isEditing={isEditingForumUsername}
        onEdit={onEditForumUsername}
        onSave={onSaveForumUsername}
        onCancel={onCancelForumUsername}
        isSaving={isUpdatingForumUsername}
        placeholder="Enter username"
        helperText="Visible on the Open Ham Prep community"
      />

      <Stack spacing={1}>
        <Typography variant="body2" sx={sectionHeading}>
          <Box component={Mail} aria-hidden="true" sx={{ width: 16, height: 16 }} />
          Email Address
        </Typography>
        <Box
          sx={{
            p: 1.5,
            borderRadius: 2,
            bgcolor: (theme) => tokenAlpha(theme.vars.palette.secondary.main, 40),
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {userInfo.email}
          </Typography>
        </Box>
        <Stack spacing={1.5} sx={{ pt: 1 }}>
          {/* A real label. This input had no accessible name before the port. */}
          <TextField
            label="New email address"
            type="email"
            value={newEmail}
            onChange={(e) => onNewEmailChange(e.target.value)}
            placeholder="Enter new email"
            fullWidth
            size="small"
          />
          <Button
            variant="outlined"
            onClick={onUpdateEmail}
            disabled={isUpdatingEmail || !newEmail.trim()}
            fullWidth
            startIcon={
              isUpdatingEmail ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <Box component={Mail} sx={{ width: 16, height: 16 }} />
              )
            }
          >
            Change Email
          </Button>
        </Stack>
      </Stack>

      <Stack spacing={1}>
        <Typography variant="body2" sx={sectionHeading}>
          <Box component={KeyRound} aria-hidden="true" sx={{ width: 16, height: 16 }} />
          Password
        </Typography>
        <Button
          variant="outlined"
          onClick={onResetPassword}
          disabled={isResettingPassword}
          fullWidth
          startIcon={
            isResettingPassword ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <Box component={KeyRound} sx={{ width: 16, height: 16 }} />
            )
          }
        >
          Send Reset Link
        </Button>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          We'll send a password reset link to your email
        </Typography>
      </Stack>

      <ProfileDangerZone
        showDeleteConfirm={showDeleteConfirm}
        onShowDeleteConfirm={onShowDeleteConfirm}
        deleteConfirmText={deleteConfirmText}
        onDeleteConfirmTextChange={onDeleteConfirmTextChange}
        onDeleteAccount={onDeleteAccount}
        isDeleting={isDeleting}
      />
    </Stack>
  );
}
