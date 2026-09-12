import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ChevronLeft } from "lucide-react";
import { AccessibilitySettings } from "@/components/AccessibilitySettings";
import { ProfileMainView } from "@/components/profile/ProfileMainView";
import { ProfileAccountView } from "@/components/profile/ProfileAccountView";
import { ProfileAppearanceView } from "@/components/profile/ProfileAppearanceView";
import type { ProfileUserInfo, SettingsView } from "@/components/profile/types";
import { useProfileAccount } from "@/hooks/useProfileAccount";

interface ProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userInfo: ProfileUserInfo;
  userId: string;
  onProfileUpdate: () => void;
  onSignOut?: () => void;
}

export function ProfileModal({
  open,
  onOpenChange,
  userInfo,
  userId,
  onProfileUpdate,
  onSignOut,
}: ProfileModalProps) {
  const [currentView, setCurrentView] = useState<SettingsView>("main");

  const account = useProfileAccount({
    userId,
    userInfo,
    onProfileUpdate,
    onClose: () => onOpenChange(false),
  });

  // Reset delete confirmation when navigating away from account view
  useEffect(() => {
    if (currentView !== "account") {
      account.resetDeleteConfirm();
    }
    // Keyed on the view deliberately: including the hook's returned functions
    // would re-run this on every render of the modal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentView]);

  const handleBack = () => {
    setCurrentView("main");
    account.resetEdits();
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setCurrentView("main");
      account.resetEdits();
    }
    onOpenChange(newOpen);
  };

  // Menu item component
  const viewTitles: Record<SettingsView, string> = {
    main: "Settings",
    account: "Account",
    appearance: "Appearance",
    accessibility: "Accessibility",
  };

  return (
    /* aria-describedby wired by hand — MUI's DialogContentText registers
       nothing, unlike Radix's DialogDescription. Only the main view has a
       description, so the attribute is conditional. */
    <Dialog
      open={open}
      onClose={() => handleOpenChange(false)}
      maxWidth="xs"
      fullWidth
      aria-describedby={currentView === "main" ? "profile-modal-description" : undefined}
    >
      <Box sx={{ p: 2, pb: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {currentView !== "main" && (
            <IconButton
              aria-label="Back"
              onClick={handleBack}
              sx={{ width: 32, height: 32, flexShrink: 0, ml: -0.5 }}
            >
              <Box component={ChevronLeft} sx={{ width: 16, height: 16 }} />
            </IconButton>
          )}
          <DialogTitle sx={{ p: 0, fontSize: "1.125rem", fontWeight: 600 }}>
            {viewTitles[currentView]}
          </DialogTitle>
        </Box>
        {currentView === "main" && (
          <DialogContentText id="profile-modal-description" variant="body2" sx={{ pt: 0.5 }}>
            Manage your profile and preferences
          </DialogContentText>
        )}
      </Box>

      <DialogContent sx={{ p: 2, pt: 1, maxHeight: "70vh" }}>
        {currentView === "main" && (
          <ProfileMainView
            userInfo={userInfo}
            onNavigate={setCurrentView}
            onSignOut={
              onSignOut
                ? () => {
                    onOpenChange(false);
                    onSignOut();
                  }
                : undefined
            }
          />
        )}

        {currentView === "account" && (
          <ProfileAccountView
            userInfo={userInfo}
            displayName={account.displayName}
            onDisplayNameChange={account.setDisplayName}
            isEditingName={account.isEditingName}
            onEditName={() => account.setIsEditingName(true)}
            onSaveName={account.handleUpdateDisplayName}
            onCancelName={() => {
              account.setIsEditingName(false);
              account.setDisplayName(userInfo.displayName || "");
            }}
            isUpdatingName={account.isUpdatingName}
            forumUsername={account.forumUsername}
            onForumUsernameChange={account.setForumUsername}
            isEditingForumUsername={account.isEditingForumUsername}
            onEditForumUsername={() => account.setIsEditingForumUsername(true)}
            onSaveForumUsername={account.handleUpdateForumUsername}
            onCancelForumUsername={() => {
              account.setIsEditingForumUsername(false);
              account.setForumUsername(userInfo.forumUsername || "");
            }}
            isUpdatingForumUsername={account.isUpdatingForumUsername}
            newEmail={account.newEmail}
            onNewEmailChange={account.setNewEmail}
            onUpdateEmail={account.handleUpdateEmail}
            isUpdatingEmail={account.isUpdatingEmail}
            onResetPassword={account.handleResetPassword}
            isResettingPassword={account.isResettingPassword}
            showDeleteConfirm={account.showDeleteConfirm}
            onShowDeleteConfirm={account.setShowDeleteConfirm}
            deleteConfirmText={account.deleteConfirmText}
            onDeleteConfirmTextChange={account.setDeleteConfirmText}
            onDeleteAccount={account.handleDeleteAccount}
            isDeleting={account.isDeleting}
          />
        )}

        {currentView === "appearance" && <ProfileAppearanceView />}

        {currentView === "accessibility" && (
          <Stack spacing={2}>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Customize the app for your needs
            </Typography>
            <AccessibilitySettings />
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
}
