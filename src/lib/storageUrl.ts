import { supabase } from '@/integrations/supabase/client';

/**
 * Public URL for a file in the topic-content bucket.
 *
 * getPublicUrl is a synchronous string builder — no request — but it still
 * belongs behind a helper rather than in a component: the bucket name was
 * repeated in the admin resource hook and the reader-side panel.
 */
export const topicContentUrl = (storagePath: string) =>
  supabase.storage.from('topic-content').getPublicUrl(storagePath).data.publicUrl;
