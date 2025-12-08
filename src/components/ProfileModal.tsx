import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User, KeyRound, Palette, Trash2, AlertTriangle } from "lucide-react";

interface ProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userInfo: {
    displayName: string | null;
    email: string | null;
  };
  userId: string;
  onProfileUpdate: () => void;
}

export function ProfileModal({ 
  open, 
  onOpenChange, 
  userInfo, 
  userId,
  onProfileUpdate 
}: ProfileModalProps) {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState(userInfo.displayName || "");
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

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

      toast.success("Display name updated successfully");
      onProfileUpdate();
    } catch (error: any) {
      toast.error(error.message || "Failed to update display name");
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleResetPassword = async () => {
    if (!userInfo.email) {
      toast.error("No email associated with this account");
      return;
    }

    setIsResettingPassword(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(userInfo.email, {
        redirectTo: `${window.location.origin}/auth?type=recovery`,
      });

      if (error) throw error;

      toast.success("Password reset email sent! Check your inbox.");
    } catch (error: any) {
      toast.error(error.message || "Failed to send password reset email");
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
      // Delete all user data from related tables
      await supabase.from("question_attempts").delete().eq("user_id", userId);
      await supabase.from("practice_test_results").delete().eq("user_id", userId);
      await supabase.from("bookmarked_questions").delete().eq("user_id", userId);
      await supabase.from("profiles").delete().eq("id", userId);

      // Sign out and redirect
      await supabase.auth.signOut();
      
      toast.success("Account and all data deleted successfully");
      onOpenChange(false);
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete account");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Profile Settings
          </DialogTitle>
          <DialogDescription>
            Manage your account settings and preferences
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Display Name Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <User className="w-4 h-4 text-muted-foreground" />
              Display Name
            </div>
            <div className="flex gap-2">
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your display name"
                className="flex-1"
              />
              <Button 
                onClick={handleUpdateDisplayName}
                disabled={isUpdatingName || displayName === userInfo.displayName}
                size="sm"
              >
                {isUpdatingName ? "Saving..." : "Save"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {userInfo.email}
            </p>
          </div>

          <Separator />

          {/* Password Reset Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <KeyRound className="w-4 h-4 text-muted-foreground" />
              Password
            </div>
            <Button
              variant="outline"
              onClick={handleResetPassword}
              disabled={isResettingPassword}
              className="w-full justify-start"
            >
              {isResettingPassword ? "Sending..." : "Send Password Reset Email"}
            </Button>
            <p className="text-xs text-muted-foreground">
              A password reset link will be sent to your email
            </p>
          </div>

          <Separator />

          {/* Theme Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Palette className="w-4 h-4 text-muted-foreground" />
              Theme
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Toggle dark/light mode</span>
              <ThemeToggle />
            </div>
          </div>

          <Separator />

          {/* Delete Account Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-destructive">
              <Trash2 className="w-4 h-4" />
              Danger Zone
            </div>
            
            {!showDeleteConfirm ? (
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full border-destructive text-destructive bg-background hover:bg-destructive hover:text-destructive-foreground"
              >
                Delete Account
              </Button>
            ) : (
              <div className="space-y-3 p-4 border border-destructive/50 rounded-lg bg-destructive/5">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-destructive">
                      This action cannot be undone
                    </p>
                    <p className="text-xs text-muted-foreground">
                      All your data including practice history, bookmarks, and test results will be permanently deleted.
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="delete-confirm" className="text-sm">
                    Type <span className="font-mono font-bold">DELETE</span> to confirm
                  </Label>
                  <Input
                    id="delete-confirm"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="DELETE"
                    className="font-mono"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteConfirmText("");
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirmText !== "DELETE" || isDeleting}
                    className="flex-1"
                  >
                    {isDeleting ? "Deleting..." : "Delete Forever"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
