import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/services/queryKeys';
import type { TopicResource } from '@/hooks/useTopics';
import type { ResourceDraft } from './resourceDraft';

const BUCKET = 'topic-content';

/**
 * Add, edit and delete for a topic's resources.
 *
 * The mutations were inlined in TopicResourceManager, against the repo's rule
 * that mutations live in hooks. `resources` is passed in because two of them
 * read it: the add picks the next display_order from it, and the delete looks
 * up the storage path to remove alongside the row.
 */
export function useTopicResources(topicId: string, resources: TopicResource[]) {
  const queryClient = useQueryClient();

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.topics.admin() });
    queryClient.invalidateQueries({ queryKey: queryKeys.topics.detailRoot });
    // The admin editor renders this list from its own query, which neither of
    // the above is a prefix of. Without this the row is written, the success
    // toast shows, and the list on screen does not move — it reads as a save
    // that silently did not take.
    queryClient.invalidateQueries({ queryKey: queryKeys.topics.adminDetail(topicId) });
  };

  const addResource = useMutation({
    mutationFn: async ({ draft, file }: { draft: ResourceDraft; file: File | null }) => {
      const maxOrder = resources.reduce((max, r) => Math.max(max, r.display_order || 0), 0);

      let storagePath: string | null = null;

      if (file) {
        const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const filePath = `resources/${topicId}/${fileName}`;

        const { error: uploadError } = await supabase.storage.from(BUCKET).upload(filePath, file);
        if (uploadError) throw uploadError;
        storagePath = filePath;
      }

      const { error } = await supabase.from('topic_resources').insert({
        topic_id: topicId,
        resource_type: draft.type,
        title: draft.title.trim(),
        url: draft.url.trim() || null,
        storage_path: storagePath,
        description: draft.description.trim() || null,
        display_order: maxOrder + 1,
      });

      if (error) {
        // Take the orphaned upload back out, but never let a cleanup failure
        // mask why the insert failed.
        if (storagePath) {
          try {
            await supabase.storage.from(BUCKET).remove([storagePath]);
          } catch (cleanupError) {
            console.error('Failed to clean up uploaded file:', cleanupError);
          }
        }
        throw error;
      }
    },
    onSuccess: () => {
      refresh();
      toast.success('Resource added successfully');
    },
    onError: (error) => toast.error('Failed to add resource: ' + error.message),
  });

  const updateResource = useMutation({
    mutationFn: async ({ id, draft }: { id: string; draft: ResourceDraft }) => {
      const { error } = await supabase
        .from('topic_resources')
        .update({
          resource_type: draft.type,
          title: draft.title.trim(),
          url: draft.url.trim() || null,
          description: draft.description.trim() || null,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      refresh();
      toast.success('Resource updated successfully');
    },
    onError: (error) => toast.error('Failed to update resource: ' + error.message),
  });

  const deleteResource = useMutation({
    mutationFn: async (id: string) => {
      const resourceToDelete = resources.find((r) => r.id === id);

      if (resourceToDelete?.storage_path) {
        await supabase.storage.from(BUCKET).remove([resourceToDelete.storage_path]);
      }

      const { error } = await supabase.from('topic_resources').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      refresh();
      toast.success('Resource deleted successfully');
    },
    onError: (error) => toast.error('Failed to delete resource: ' + error.message),
  });

  const publicUrl = (storagePath: string) =>
    supabase.storage.from(BUCKET).getPublicUrl(storagePath).data.publicUrl;

  return { addResource, updateResource, deleteResource, publicUrl };
}
