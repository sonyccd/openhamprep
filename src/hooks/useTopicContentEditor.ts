import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { queryKeys } from "@/services/queryKeys";
import { TOPIC_CONTENT_BUCKET, topicContentUrl } from "@/lib/storageUrl";

/** Image types the topic editor will put in storage. */
export const TOPIC_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"] as const;

/** Writes a topic's markdown and refreshes every view of that topic. */
export function useSaveTopicContent(topicId: string, topicSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (content: string) => {
      const { error } = await supabase
        .from("topics")
        .update({ content, updated_at: new Date().toISOString() })
        .eq("id", topicId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.topics.detail(topicSlug) });
      queryClient.invalidateQueries({ queryKey: queryKeys.topics.admin() });
      queryClient.invalidateQueries({ queryKey: queryKeys.topics.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.topics.adminDetail(topicId) });
    },
  });
}

/** Puts an image in the topic-content bucket and resolves to its public URL. */
export function useUploadTopicImage() {
  return useMutation({
    mutationFn: async (file: File) => {
      if (!(TOPIC_IMAGE_TYPES as readonly string[]).includes(file.type)) {
        throw new Error(`Invalid file type: ${file.type}. Allowed types: JPEG, PNG, GIF, WebP, SVG`);
      }
      const ext = file.name.split(".").pop();
      const path = `topic-images/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from(TOPIC_CONTENT_BUCKET)
        .upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw new Error("Failed to upload image: " + error.message);
      return topicContentUrl(path);
    },
  });
}
