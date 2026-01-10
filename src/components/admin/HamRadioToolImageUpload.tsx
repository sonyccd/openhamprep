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

interface HamRadioToolImageUploadProps {
  toolId: string;
  currentStoragePath: string | null;
  onUpload: (storagePath: string) => void;
  onRemove: () => void;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];

// Map MIME types to file extensions for more reliable extension detection
const MIME_TO_EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
};

export function HamRadioToolImageUpload({
  toolId,
  currentStoragePath,
  onUpload,
  onRemove
}: HamRadioToolImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get public URL from storage path
  const getPublicUrl = (storagePath: string) => {
    const { data } = supabase.storage
      .from('ham-radio-tools')
      .getPublicUrl(storagePath);
    return data.publicUrl;
  };

  const currentImageUrl = currentStoragePath ? getPublicUrl(currentStoragePath) : null;

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Invalid file type. Please upload PNG, JPEG, GIF, or WebP.");
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
      // Generate filename based on tool ID, deriving extension from MIME type
      const fileExt = MIME_TO_EXT[file.type] || 'png';
      const storagePath = `${toolId}.${fileExt}`;

      // Delete existing file only if it has a different name (different extension)
      // The upsert: true option handles overwriting files with the same name
      if (currentStoragePath && currentStoragePath !== storagePath) {
        await supabase.storage.from('ham-radio-tools').remove([currentStoragePath]);
      }

      // Upload new file (upsert handles overwrite if same path)
      const { error: uploadError } = await supabase.storage
        .from('ham-radio-tools')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      onUpload(storagePath);
      setPreviewUrl(null);
      toast.success("Image uploaded successfully");
    } catch (error: unknown) {
      toast.error("Failed to upload image: " + (error instanceof Error ? error.message : String(error)));
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
    if (!currentStoragePath) return;

    setIsRemoving(true);
    try {
      // Delete from storage
      const { error } = await supabase.storage
        .from('ham-radio-tools')
        .remove([currentStoragePath]);

      if (error) throw error;

      onRemove();
      toast.success("Image removed successfully");
    } catch (error: unknown) {
      toast.error("Failed to remove image: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsRemoving(false);
    }
  };

  const displayUrl = previewUrl || currentImageUrl;

  return (
    <div className="space-y-3">
      {/* Current/Preview Image */}
      {displayUrl && (
        <div className="relative rounded-lg overflow-hidden border border-border bg-muted/20">
          <img
            src={displayUrl}
            alt="Tool image"
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
          accept="image/png,image/jpeg,image/gif,image/webp"
          onChange={handleFileSelect}
          className="hidden"
          id={`tool-image-upload-${toolId}`}
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
              Replace Image
            </>
          ) : (
            <>
              <ImageIcon className="w-4 h-4 mr-2" />
              Upload Image
            </>
          )}
        </Button>

        {currentStoragePath && !previewUrl && (
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
                <AlertDialogTitle>Remove Image</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to remove this image? This action cannot be undone.
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
        Supported: PNG, JPEG, GIF, WebP. Max size: 2 MB.
      </p>
    </div>
  );
}
