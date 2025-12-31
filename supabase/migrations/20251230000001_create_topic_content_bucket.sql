-- Create storage bucket for topic content (markdown articles, thumbnails, uploaded resources)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'topic-content',
  'topic-content',
  true,
  26214400, -- 25 MB in bytes (matches TopicResourceManager MAX_FILE_SIZE)
  ARRAY[
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'application/pdf',
    'text/markdown',
    'text/plain',
    'video/mp4',
    'video/webm',
    'video/ogg'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Policy: Anyone can view topic content (public read)
CREATE POLICY "Public can view topic content"
ON storage.objects FOR SELECT
USING (bucket_id = 'topic-content');

-- Policy: Only admins can upload topic content
CREATE POLICY "Admins can upload topic content"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'topic-content' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Policy: Only admins can update topic content
CREATE POLICY "Admins can update topic content"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'topic-content' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Policy: Only admins can delete topic content
CREATE POLICY "Admins can delete topic content"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'topic-content' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);
