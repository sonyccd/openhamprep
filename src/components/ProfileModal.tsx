import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeSelector } from "@/components/ThemeSelector";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  User,
  KeyRound,
  Palette,
  Trash2,
  AlertTriangle,
  Mail,
  MessageSquare,
  ChevronRight,
  Check,
  Loader2,
  LogOut,
} from "lucide-react";
import { validateForumUsername } from "@/lib/validation";
import { cn } from "@/lib/utils";

interface ProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userInfo: {
    displayName: string | null;
    email: string | null;
    forumUsername: string | null;
  };
  userId: string;
  onProfileUpdate: () => void;
  onSignOut?: () => void;
}

type SettingsView = "main" | "account" | "appearance" | "danger";

export function ProfileModal({
  open,
  onOpenChange,
  userInfo,
  userId,
  onProfileUpdate,
  onSignOut,
}: ProfileModalProps) {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<SettingsView>("main");

  // Form states
  const [displayName, setDisplayName] = useState(userInfo.displayName || "");
  const [forumUsername, setForumUsername] = useState(
    userInfo.forumUsername || ""
  );
  const [newEmail, setNewEmail] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

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
      onOpenChange(false);
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

  const handleBack = () => {
    setCurrentView("main");
    // Reset edit states when going back
    setIsEditingName(false);
    setIsEditingForumUsername(false);
    setDisplayName(userInfo.displayName || "");
    setForumUsername(userInfo.forumUsername || "");
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset to main view when closing
      setCurrentView("main");
      setIsEditingName(false);
      setIsEditingForumUsername(false);
      setDisplayName(userInfo.displayName || "");
      setForumUsername(userInfo.forumUsername || "");
      setNewEmail("");
      setDeleteConfirmText("");
    }
    onOpenChange(newOpen);
  };

  // Menu item component
  const MenuItem = ({
    icon: Icon,
    label,
    description,
    onClick,
    variant = "default",
  }: {
    icon: React.ElementType;
    label: string;
    description?: string;
    onClick: () => void;
    variant?: "default" | "danger";
  }) => (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 p-4 rounded-xl transition-all text-left",
        "hover:bg-secondary/60 active:scale-[0.98]",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        variant === "danger" &&
          "hover:bg-destructive/10 text-destructive hover:text-destructive"
      )}
    >
      <div
        className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
          variant === "default" && "bg-primary/10 text-primary",
          variant === "danger" && "bg-destructive/10 text-destructive"
        )}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm">{label}</div>
        {description && (
          <div className="text-xs text-muted-foreground truncate">
            {description}
          </div>
        )}
      </div>
      <ChevronRight
        className={cn(
          "w-5 h-5 text-muted-foreground shrink-0",
          variant === "danger" && "text-destructive/50"
        )}
      />
    </button>
  );

  // Editable field component
  const EditableField = ({
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
  }: {
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
  }) => (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Icon className="w-4 h-4" />
        {label}
      </div>
      {isEditing ? (
        <div className="space-y-3">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            autoFocus
            className="h-11"
          />
          <div className="flex gap-2">
            <Button
              onClick={onSave}
              disabled={isSaving}
              size="sm"
              className="flex-1 h-10"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Save
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={onCancel}
              size="sm"
              className="flex-1 h-10"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <button
          onClick={onEdit}
          className="w-full flex items-center justify-between p-3 rounded-lg bg-secondary/40 hover:bg-secondary/60 transition-colors text-left"
        >
          <span className="text-sm font-medium truncate">
            {displayValue || (
              <span className="text-muted-foreground">Not set</span>
            )}
          </span>
          <span className="text-xs text-primary font-medium shrink-0 ml-2">
            Edit
          </span>
        </button>
      )}
      {helperText && !isEditing && (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      )}
    </div>
  );

  // Main menu view
  const MainView = () => (
    <div className="space-y-2">
      {/* User info header */}
      <div className="flex items-center gap-4 p-4 mb-2">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center ring-2 ring-primary/20">
          <User className="w-7 h-7 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-base truncate">
            {userInfo.displayName || "User"}
          </div>
          <div className="text-sm text-muted-foreground truncate">
            {userInfo.email}
          </div>
        </div>
      </div>

      {/* Menu items */}
      <div className="space-y-1">
        <MenuItem
          icon={User}
          label="Account"
          description="Name, email, password"
          onClick={() => setCurrentView("account")}
        />
        <MenuItem
          icon={Palette}
          label="Appearance"
          description="Theme preferences"
          onClick={() => setCurrentView("appearance")}
        />
        <MenuItem
          icon={Trash2}
          label="Delete Account"
          onClick={() => setCurrentView("danger")}
          variant="danger"
        />
      </div>

      {/* Sign Out button */}
      {onSignOut && (
        <div className="pt-4 mt-4 border-t border-border">
          <Button
            variant="ghost"
            onClick={() => {
              onOpenChange(false);
              onSignOut();
            }}
            className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-base font-medium">Sign Out</span>
          </Button>
        </div>
      )}
    </div>
  );

  // Account settings view
  const AccountView = () => (
    <div className="space-y-6">
      <EditableField
        icon={User}
        label="Display Name"
        value={displayName}
        displayValue={userInfo.displayName || ""}
        onChange={setDisplayName}
        isEditing={isEditingName}
        onEdit={() => setIsEditingName(true)}
        onSave={handleUpdateDisplayName}
        onCancel={() => {
          setIsEditingName(false);
          setDisplayName(userInfo.displayName || "");
        }}
        isSaving={isUpdatingName}
        placeholder="Enter your name"
      />

      <EditableField
        icon={MessageSquare}
        label="Forum Username"
        value={forumUsername}
        displayValue={userInfo.forumUsername || ""}
        onChange={setForumUsername}
        isEditing={isEditingForumUsername}
        onEdit={() => setIsEditingForumUsername(true)}
        onSave={handleUpdateForumUsername}
        onCancel={() => {
          setIsEditingForumUsername(false);
          setForumUsername(userInfo.forumUsername || "");
        }}
        isSaving={isUpdatingForumUsername}
        placeholder="Enter username"
        helperText="Visible on the Open Ham Prep forum"
      />

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Mail className="w-4 h-4" />
          Email Address
        </div>
        <div className="p-3 rounded-lg bg-secondary/40">
          <span className="text-sm font-medium">{userInfo.email}</span>
        </div>
        <div className="space-y-3 pt-2">
          <Input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="Enter new email"
            className="h-11"
          />
          <Button
            onClick={handleUpdateEmail}
            disabled={isUpdatingEmail || !newEmail.trim()}
            size="sm"
            variant="outline"
            className="w-full h-10"
          >
            {isUpdatingEmail ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Mail className="w-4 h-4 mr-2" />
            )}
            Change Email
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <KeyRound className="w-4 h-4" />
          Password
        </div>
        <Button
          variant="outline"
          onClick={handleResetPassword}
          disabled={isResettingPassword}
          className="w-full h-10"
        >
          {isResettingPassword ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <KeyRound className="w-4 h-4 mr-2" />
          )}
          Send Reset Link
        </Button>
        <p className="text-xs text-muted-foreground">
          We'll send a password reset link to your email
        </p>
      </div>
    </div>
  );

  // Appearance settings view
  const AppearanceView = () => (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Palette className="w-4 h-4" />
          Theme
        </div>
        <p className="text-sm text-muted-foreground">
          Choose how Open Ham Prep looks to you
        </p>
        <ThemeSelector />
      </div>
    </div>
  );

  // Danger zone view - extracted as inline JSX to avoid focus loss from function recreation
  const dangerViewContent = (
    <div className="space-y-4">
      <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-destructive text-sm">
              Delete your account permanently
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              All your data including practice history, bookmarks, test results,
              and forum account will be permanently deleted. This cannot be
              undone.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="delete-confirm" className="text-sm font-medium">
              Type <span className="font-mono font-bold text-destructive">DELETE</span> to confirm
            </Label>
            <Input
              id="delete-confirm"
              value={deleteConfirmText}
              onChange={(e) =>
                setDeleteConfirmText(e.target.value.toUpperCase())
              }
              placeholder="DELETE"
              className="font-mono h-11 uppercase"
            />
          </div>

          <Button
            variant="destructive"
            onClick={handleDeleteAccount}
            disabled={deleteConfirmText !== "DELETE" || isDeleting}
            className="w-full h-11"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account Forever
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );

  const viewTitles: Record<SettingsView, string> = {
    main: "Settings",
    account: "Account",
    appearance: "Appearance",
    danger: "Delete Account",
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px] p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-4 pb-0 space-y-0">
          <div className="flex items-center gap-2">
            {currentView !== "main" && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="h-8 w-8 shrink-0 -ml-1"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
              </Button>
            )}
            <DialogTitle className="text-lg font-semibold">
              {viewTitles[currentView]}
            </DialogTitle>
          </div>
          {currentView === "main" && (
            <DialogDescription className="text-sm pt-1">
              Manage your profile and preferences
            </DialogDescription>
          )}
        </DialogHeader>

        {/* Content with smooth height transitions */}
        <div className="p-4 pt-2 max-h-[70vh] overflow-y-auto overscroll-contain">
          {currentView === "main" && <MainView />}
          {currentView === "account" && <AccountView />}
          {currentView === "appearance" && <AppearanceView />}
          {currentView === "danger" && dangerViewContent}
        </div>
      </DialogContent>
    </Dialog>
  );
}
