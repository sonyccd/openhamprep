import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { TOPIC_CONTENT_BUCKET } from "@/lib/storageUrl";
import { queryKeys } from "@/services/queryKeys";
import { useAuth } from "@/hooks/useAuth";
import type { Topic } from "@/hooks/useTopics";
import type { EditHistoryEntry } from "../EditHistoryViewer";
import type { TopicSettings } from "./TopicSettingsTab";

const toSlug = (text: string) => text.trim().toLowerCase().replace(/\s+/g, "-");

interface UseTopicEditorOptions {
  topic: Topic;
  settings: TopicSettings;
  onSaved: () => void;
  onDeleted: () => void;
}

/**
 * The topic's fresh copy plus its save and delete mutations.
 *
 * Lifted out of TopicEditor for the reason the other admin screens were
 * (#303, #304, #305): CLAUDE.md asks for mutation logic to live in hooks, and
 * the component was well over the line budget with it inline.
 */
export function useTopicEditor({ topic, settings, onSaved, onDeleted }: UseTopicEditorOptions) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: freshTopic } = useQuery({
    queryKey: queryKeys.topics.adminDetail(topic.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("topics")
        .select("*, resources:topic_resources(*)")
        .eq("id", topic.id)
        .single();

      if (error) throw error;
      return data as Topic;
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.topics.admin() });
    queryClient.invalidateQueries({ queryKey: queryKeys.topics.adminDetail(topic.id) });
    queryClient.invalidateQueries({ queryKey: queryKeys.topics.all() });
  };

  const updateSettingsMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");

      const changes: Record<string, { from: unknown; to: unknown }> = {};
      if (topic.title !== settings.title.trim()) {
        changes.title = { from: topic.title, to: settings.title.trim() };
      }
      if (topic.slug !== settings.slug.trim()) {
        changes.slug = { from: topic.slug, to: settings.slug.trim() };
      }
      if (topic.description !== settings.description.trim()) {
        changes.description = { from: topic.description, to: settings.description.trim() };
      }
      if (JSON.stringify(topic.license_types) !== JSON.stringify(settings.licenseTypes)) {
        changes.license_types = { from: topic.license_types, to: settings.licenseTypes };
      }
      if (topic.is_published !== settings.isPublished) {
        changes.is_published = { from: topic.is_published, to: settings.isPublished };
      }
      if (topic.display_order !== settings.displayOrder) {
        changes.display_order = { from: topic.display_order, to: settings.displayOrder };
      }

      const historyEntry: EditHistoryEntry = {
        user_id: user.id,
        user_email: user.email || "Unknown",
        action: "updated",
        changes,
        timestamp: new Date().toISOString(),
      };

      const existingHistory = (topic.edit_history as EditHistoryEntry[]) || [];
      const slug = toSlug(settings.slug);

      const { error } = await supabase
        .from("topics")
        .update({
          title: settings.title.trim(),
          slug,
          description: settings.description.trim() || null,
          license_types: settings.licenseTypes,
          is_published: settings.isPublished,
          display_order: settings.displayOrder,
          content_path: `articles/${slug}.md`,
          edit_history: JSON.parse(JSON.stringify([...existingHistory, historyEntry])),
        })
        .eq("id", topic.id);

      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      onSaved();
      toast.success("Settings saved successfully");
    },
    onError: (error) => {
      toast.error("Failed to save settings: " + error.message);
    },
  });

  const deleteTopicMutation = useMutation({
    mutationFn: async () => {
      // First, delete the markdown content from storage if it exists
      const contentPath = freshTopic?.content_path || topic.content_path;
      if (contentPath) {
        const { error: storageError } = await supabase.storage
          .from(TOPIC_CONTENT_BUCKET)
          .remove([contentPath]);

        // Log but don't fail if storage deletion fails (file may not exist)
        if (storageError) {
          console.warn("Failed to delete topic content from storage:", storageError.message);
        }
      }

      // Then delete the database record (cascades to related tables)
      const { error } = await supabase.from("topics").delete().eq("id", topic.id);

      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Topic deleted successfully");
      onDeleted(); // Navigate back to the list
    },
    onError: (error) => {
      toast.error("Failed to delete topic: " + error.message);
    },
  });

  return { freshTopic, updateSettingsMutation, deleteTopicMutation };
}
