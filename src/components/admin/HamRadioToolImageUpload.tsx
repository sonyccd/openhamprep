import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { describeStorageError, storageNameFor } from "@/lib/imageUpload";
import { ImageUploadField } from "./shared/ImageUploadField";

interface HamRadioToolImageUploadProps {
  toolId: string;
  currentStoragePath: string | null;
  onUpload: (storagePath: string) => void;
  onRemove: () => void;
}

const BUCKET = "ham-radio-tools";
const RULES = {
  allowedTypes: ["image/png", "image/jpeg", "image/gif", "image/webp"],
  maxBytes: 2 * 1024 * 1024,
  typesLabel: "PNG, JPEG, GIF, or WebP",
} as const;


export function HamRadioToolImageUpload({ toolId, currentStoragePath, onUpload, onRemove }: HamRadioToolImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const currentImageUrl = currentStoragePath
    ? supabase.storage.from(BUCKET).getPublicUrl(currentStoragePath).data.publicUrl
    : null;

  const handleFilePicked = async (file: File) => {
    setIsUploading(true);
    try {
      const storagePath = storageNameFor(toolId, file.type);

      const { error } = await supabase.storage.from(BUCKET).upload(storagePath, file, { cacheControl: "3600", upsert: true });
      if (error) throw error;

      // Only now: upsert covered the same name, but a different extension
      // leaves the old object behind. Deleting it before the upload would
      // lose the image outright if the upload then failed.
      if (currentStoragePath && currentStoragePath !== storagePath) {
        await supabase.storage.from(BUCKET).remove([currentStoragePath]);
      }

      onUpload(storagePath);
      toast.success("Image uploaded successfully");
    } catch (error: unknown) {
      toast.error("Failed to upload image: " + describeStorageError(error));
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!currentStoragePath) return;
    setIsRemoving(true);
    try {
      const { error } = await supabase.storage.from(BUCKET).remove([currentStoragePath]);
      if (error) throw error;
      onRemove();
      toast.success("Image removed successfully");
    } catch (error: unknown) {
      toast.error("Failed to remove image: " + describeStorageError(error));
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <ImageUploadField
      storedUrl={currentImageUrl}
      imageAlt="Tool image"
      noun="Image"
      rules={RULES}
      hint="Supported: PNG, JPEG, GIF, WebP. Max size: 2 MB."
      isUploading={isUploading}
      isRemoving={isRemoving}
      onFilePicked={handleFilePicked}
      onRemove={currentStoragePath ? handleRemove : undefined}
    />
  );
}
