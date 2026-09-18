import { supabase } from '@/integrations/supabase/client';

/** The one bucket topic files live in. Uploads and reads both name it from here. */
export const TOPIC_CONTENT_BUCKET = 'topic-content';

/**
 * Public URL for a file in the topic-content bucket.
 *
 * A deliberate, narrow exception to CLAUDE.md's "never call supabase from a
 * component" rule: getPublicUrl is a synchronous string builder with no
 * request behind it, so there is nothing for a TanStack hook to cache or
 * gate. It lives in lib rather than a component so the bucket name and the
 * call have exactly one home.
 */
export const topicContentUrl = (storagePath: string) =>
  supabase.storage.from(TOPIC_CONTENT_BUCKET).getPublicUrl(storagePath).data.publicUrl;
