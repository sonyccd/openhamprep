import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { describeStorageError, rejectImage, storageNameFor, storageNameFromUrl } from "@/lib/imageUpload";
import { ImageUploadField } from "./shared/ImageUploadField";

interface FigureUploadProps {
  questionId: string;
  currentFigureUrl: string | null;
  onUpload: (url: string) => void;
  onRemove: () => void;
}

const BUCKET = "question-figures";
const RULES = {
  allowedTypes: ["image/png", "image/jpeg", "image/gif", "image/webp", "image/svg+xml"],
  maxBytes: 2 * 1024 * 1024,
  typesLabel: "PNG, JPEG, GIF, WebP, or SVG",
} as const;


export function FigureUpload({ questionId, currentFigureUrl, onUpload, onRemove }: FigureUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFilePicked = async (file: File) => {
    const rejection = rejectImage(file, RULES);
    if (rejection) {
      toast.error(rejection);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target?.result as string);
    reader.readAsDataURL(file);

    setIsUploading(true);
    try {
      const fileName = storageNameFor(questionId, file.type);

      // A previous upload under a different extension would otherwise linger.
      if (currentFigureUrl) {
        const previous = storageNameFromUrl(currentFigureUrl);
        if (previous !== fileName) await supabase.storage.from(BUCKET).remove([previous]);
      }

      const { error } = await supabase.storage.from(BUCKET).upload(fileName, file, { cacheControl: "3600", upsert: true });
      if (error) throw error;

      const { publicUrl } = supabase.storage.from(BUCKET).getPublicUrl(fileName).data;
      // Cache-bust, or the browser keeps showing the figure this one replaced.
      onUpload(`${publicUrl}?t=${Date.now()}`);
      toast.success("Figure uploaded successfully");
    } catch (error: unknown) {
      toast.error("Failed to upload figure: " + describeStorageError(error));
    } finally {
      setPreviewUrl(null);
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!currentFigureUrl) return;
    setIsRemoving(true);
    try {
      const { error } = await supabase.storage.from(BUCKET).remove([storageNameFromUrl(currentFigureUrl)]);
      if (error) throw error;
      onRemove();
      toast.success("Figure removed successfully");
    } catch (error: unknown) {
      toast.error("Failed to remove figure: " + describeStorageError(error));
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <ImageUploadField
      displayUrl={previewUrl || currentFigureUrl}
      imageAlt={`Figure for ${questionId}`}
      noun="Figure"
      accept={RULES.allowedTypes.join(",")}
      hint="Supported: PNG, JPEG, GIF, WebP, SVG. Max size: 2 MB."
      isUploading={isUploading}
      isRemoving={isRemoving}
      onFilePicked={handleFilePicked}
      onRemove={currentFigureUrl && !previewUrl ? handleRemove : undefined}
    />
  );
}
