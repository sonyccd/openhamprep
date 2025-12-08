import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ThemeSelector } from "@/components/ThemeSelector";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User, KeyRound, Palette, Trash2, AlertTriangle, Mail } from "lucide-react";
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
  const [isEditingName, setIsEditingName] = useState(false);
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
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
      const {
        error
      } = await supabase.from("profiles").update({
        display_name: displayName.trim()
      }).eq("id", userId);
      if (error) throw error;
      toast.success("Display name updated successfully");
      onProfileUpdate();
    } catch (error: any) {
      toast.error(error.message || "Failed to update display name");
    } finally {
      setIsUpdatingName(false);
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
      const {
        error
      } = await supabase.auth.updateUser({
        email: newEmail.trim()
      });
      if (error) throw error;
      toast.success("Verification email sent! Check your new email inbox to confirm the change.");
      setNewEmail("");
    } catch (error: any) {
      toast.error(error.message || "Failed to update email");
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
      const {
        error
      } = await supabase.auth.resetPasswordForEmail(userInfo.email, {
        redirectTo: `${window.location.origin}/auth?type=recovery`
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
      // Call edge function to delete the user from auth.users
      // This will cascade delete to profiles and all related data
      const { data, error } = await supabase.functions.invoke('delete-user');

      if (error) {
        console.error('Delete user error:', error);
        throw new Error(error.message || 'Failed to delete account');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      // Sign out and redirect
      await supabase.auth.signOut();
      toast.success("Account and all data deleted successfully");
      onOpenChange(false);
      navigate("/");
    } catch (error: any) {
      console.error('Account deletion failed:', error);
      toast.error(error.message || "Failed to delete account");
    } finally {
      setIsDeleting(false);
    }
  };
  return <Dialog open={open} onOpenChange={onOpenChange}>
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
            {isEditingName ? <div className="flex gap-2">
                <Input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Enter your display name" className="flex-1" autoFocus />
                <Button onClick={async () => {
              await handleUpdateDisplayName();
              setIsEditingName(false);
            }} disabled={isUpdatingName || displayName === userInfo.displayName} size="sm">
                  {isUpdatingName ? "Saving..." : "Save"}
                </Button>
                <Button variant="outline" onClick={() => {
              setDisplayName(userInfo.displayName || "");
              setIsEditingName(false);
            }} size="sm">
                  Cancel
                </Button>
              </div> : <div className="flex items-center justify-between">
                <span className="text-sm">{userInfo.displayName || "Not set"}</span>
                <Button variant="outline" onClick={() => setIsEditingName(true)} size="sm">
                  Edit
                </Button>
              </div>}
            
          </div>

          <Separator />

          {/* Email Change Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Mail className="w-4 h-4 text-muted-foreground" />
              Email Address
            </div>
            <p className="text-xs text-muted-foreground">
              Current: {userInfo.email}
            </p>
            <div className="flex gap-2">
              <Input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="Enter new email address" className="flex-1" />
              <Button onClick={handleUpdateEmail} disabled={isUpdatingEmail || !newEmail.trim()} size="sm">
                {isUpdatingEmail ? "Sending..." : "Change"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              A verification link will be sent to confirm the new email
            </p>
          </div>

          <Separator />

          {/* Password Reset Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <KeyRound className="w-4 h-4 text-muted-foreground" />
              Password
            </div>
            <Button variant="outline" onClick={handleResetPassword} disabled={isResettingPassword} className="w-full justify-start">
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
            <ThemeSelector />
          </div>

          <Separator />

          {/* Delete Account Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-destructive">
              <Trash2 className="w-4 h-4" />
              Danger Zone
            </div>
            
            {!showDeleteConfirm ? <Button variant="outline" onClick={() => setShowDeleteConfirm(true)} className="w-full border-destructive text-destructive bg-background hover:bg-destructive hover:text-destructive-foreground">
                Delete Account
              </Button> : <div className="space-y-3 p-4 border border-destructive/50 rounded-lg bg-destructive/5">
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
                  <Input id="delete-confirm" value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)} placeholder="DELETE" className="font-mono" />
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => {
                setShowDeleteConfirm(false);
                setDeleteConfirmText("");
              }} className="flex-1">
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleDeleteAccount} disabled={deleteConfirmText !== "DELETE" || isDeleting} className="flex-1">
                    {isDeleting ? "Deleting..." : "Delete Forever"}
                  </Button>
                </div>
              </div>}
          </div>
        </div>
      </DialogContent>
    </Dialog>;
}