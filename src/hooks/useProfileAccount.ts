import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { validateForumUsername } from "@/lib/validation";
import type { ProfileUserInfo } from "@/components/profile/types";

interface UseProfileAccountOptions {
  userId: string;
  userInfo: ProfileUserInfo;
  onProfileUpdate: () => void;
  onClose: () => void;
}

/**
 * The account tab's form state and every write it performs.
 *
 * State and handlers move together on purpose. A hook holding only the async
 * calls would need the component's setters threaded in — eight parameters to
 * save a few lines — whereas the field values exist *for* these writes, so
 * they belong in the same place. What is left in ProfileModal is the dialog
 * shell and its view routing.
 */
export function useProfileAccount({
  userId,
  userInfo,
  onProfileUpdate,
  onClose,
}: UseProfileAccountOptions) {
  const navigate = useNavigate();

  // Form states
  const [displayName, setDisplayName] = useState(userInfo.displayName || "");
  const [forumUsername, setForumUsername] = useState(
    userInfo.forumUsername || ""
  );
  const [newEmail, setNewEmail] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Loading states
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [isUpdatingForumUsername, setIsUpdatingForumUsername] = useState(false);
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit states
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingForumUsername, setIsEditingForumUsername] = useState(false);

  const handleUpdateDisplayName = async () => {
    if (!displayName.trim()) {
      toast.error("Display name cannot be empty");
      return;
    }
    setIsUpdatingName(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: displayName.trim() })
        .eq("id", userId);
      if (error) throw error;
      toast.success("Display name updated");
      setIsEditingName(false);
      onProfileUpdate();
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update display name"
      );
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleUpdateForumUsername = async () => {
    const validation = validateForumUsername(forumUsername);
    if (!validation.valid) {
      toast.error(validation.error || "Invalid forum username");
      return;
    }
    setIsUpdatingForumUsername(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ forum_username: forumUsername.trim() })
        .eq("id", userId);
      if (error) {
        if (error.code === "23505") {
          throw new Error("This username is already taken");
        }
        throw error;
      }
      toast.success("Forum username updated");
      setIsEditingForumUsername(false);
      onProfileUpdate();
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update forum username"
      );
    } finally {
      setIsUpdatingForumUsername(false);
    }
  };

  const handleUpdateEmail = async () => {
    if (!newEmail.trim()) {
      toast.error("Email cannot be empty");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail.trim())) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (newEmail.trim().toLowerCase() === userInfo.email?.toLowerCase()) {
      toast.error("New email must be different from current email");
      return;
    }
    setIsUpdatingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail.trim(),
      });
      if (error) throw error;
      toast.success("Verification email sent!");
      setNewEmail("");
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update email"
      );
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const handleResetPassword = async () => {
    if (!userInfo.email) {
      toast.error("No email associated with this account");
      return;
    }
    setIsResettingPassword(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        userInfo.email,
        {
          redirectTo: `${window.location.origin}/auth?type=recovery`,
        }
      );
      if (error) throw error;
      toast.success("Password reset email sent!");
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to send password reset email"
      );
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      toast.error("Please type DELETE to confirm");
      return;
    }
    setIsDeleting(true);
    try {
      try {
        const discourseResponse = await supabase.functions.invoke(
          "delete-discourse-user",
          {
            body: { deletePosts: false },
          }
        );
        if (discourseResponse.error) {
          console.error("Discourse deletion error:", discourseResponse.error);
        }
      } catch (discourseError) {
        console.error("Failed to delete Discourse account:", discourseError);
      }

      const { data, error } = await supabase.rpc("delete_own_account");

      if (error) {
        console.error("Delete user error:", error);
        throw new Error(error.message || "Failed to delete account");
      }

      if (data && !data.success) {
        throw new Error(data.error || "Failed to delete account");
      }

      await supabase.auth.signOut();
      toast.success("Account deleted successfully");
      onClose();
      navigate("/");
    } catch (error: unknown) {
      console.error("Account deletion failed:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete account"
      );
    } finally {
      setIsDeleting(false);
    }
  };


  const resetDeleteConfirm = () => {
    setShowDeleteConfirm(false);
    setDeleteConfirmText("");
  };

  /**
   * Discard every unsaved edit. Called when the modal closes and when stepping
   * back to the menu.
   *
   * newEmail and deleteConfirmText are in here because the modal is never
   * unmounted — DashboardSidebar only toggles its `open` prop — so anything
   * left in state is still there on reopen. deleteConfirmText is also cleared
   * by the view-change effect, but relying on that meant a field's lifetime
   * depended on which view happened to be active, which is how newEmail got
   * missed in the first place. Reset everything here and let the effect be
   * belt-and-braces.
   */
  const resetEdits = () => {
    setIsEditingName(false);
    setIsEditingForumUsername(false);
    setDisplayName(userInfo.displayName || "");
    setForumUsername(userInfo.forumUsername || "");
    setNewEmail("");
    setDeleteConfirmText("");
    setShowDeleteConfirm(false);
  };

  return {
    displayName,
    setDisplayName,
    forumUsername,
    setForumUsername,
    newEmail,
    setNewEmail,
    deleteConfirmText,
    setDeleteConfirmText,
    showDeleteConfirm,
    setShowDeleteConfirm,
    isUpdatingName,
    isUpdatingForumUsername,
    isUpdatingEmail,
    isResettingPassword,
    isDeleting,
    isEditingName,
    setIsEditingName,
    isEditingForumUsername,
    setIsEditingForumUsername,
    handleUpdateDisplayName,
    handleUpdateForumUsername,
    handleUpdateEmail,
    handleResetPassword,
    handleDeleteAccount,
    resetDeleteConfirm,
    resetEdits,
  };
}
