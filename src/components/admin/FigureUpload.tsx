import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, Trash2, Loader2, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface FigureUploadProps {
  questionId: string;
  currentFigureUrl: string | null;
  onUpload: (url: string) => void;
  onRemove: () => void;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml'];

export function FigureUpload({ questionId, currentFigureUrl, onUpload, onRemove }: FigureUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Invalid file type. Please upload PNG, JPEG, GIF, WebP, or SVG.");
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error("File too large. Maximum size is 2 MB.");
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to Supabase Storage
    setIsUploading(true);
    try {
      // Generate filename based on question ID
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png';
      const fileName = `${questionId}.${fileExt}`;

      // First try to delete any existing file with same name (in case of re-upload)
      await supabase.storage.from('question-figures').remove([fileName]);

      // Upload new file
      const { error: uploadError } = await supabase.storage
        .from('question-figures')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('question-figures')
        .getPublicUrl(fileName);

      // Add cache-busting query param
      const urlWithCacheBust = `${publicUrl}?t=${Date.now()}`;

      onUpload(urlWithCacheBust);
      setPreviewUrl(null);
      toast.success("Figure uploaded successfully");
    } catch (error: unknown) {
      toast.error("Failed to upload figure: " + (error instanceof Error ? error.message : String(error)));
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = async () => {
    if (!currentFigureUrl) return;

    setIsRemoving(true);
    try {
      // Extract filename from URL
      const url = new URL(currentFigureUrl);
      const pathParts = url.pathname.split('/');
      const fileName = pathParts[pathParts.length - 1].split('?')[0]; // Remove query params

      // Delete from storage
      const { error } = await supabase.storage
        .from('question-figures')
        .remove([fileName]);

      if (error) throw error;

      onRemove();
      toast.success("Figure removed successfully");
    } catch (error: unknown) {
      toast.error("Failed to remove figure: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsRemoving(false);
    }
  };

  const displayUrl = previewUrl || currentFigureUrl;

  return (
    <div className="space-y-3">
      {/* Current/Preview Image */}
      {displayUrl && (
        <div className="relative rounded-lg overflow-hidden border border-border bg-muted/20">
          <img
            src={displayUrl}
            alt={`Figure for ${questionId}`}
            className="w-full h-auto max-h-[200px] object-contain"
          />
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}
        </div>
      )}

      {/* Upload/Action Buttons */}
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
          onChange={handleFileSelect}
          className="hidden"
          id={`figure-upload-${questionId}`}
        />

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || isRemoving}
          className={cn(
            "flex-1",
            !displayUrl && "border-dashed"
          )}
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : displayUrl ? (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Replace Figure
            </>
          ) : (
            <>
              <ImageIcon className="w-4 h-4 mr-2" />
              Upload Figure
            </>
          )}
        </Button>

        {currentFigureUrl && !previewUrl && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                disabled={isRemoving}
              >
                {isRemoving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove Figure</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to remove this figure? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleRemove}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Remove
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Supported: PNG, JPEG, GIF, WebP, SVG. Max size: 2 MB.
      </p>
    </div>
  );
}
