-- Create storage bucket for question figure images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'question-figures',
  'question-figures',
  true,
  2097152, -- 2 MB in bytes
  ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Policy: Anyone can view question figures (public read)
CREATE POLICY "Public can view question figures"
ON storage.objects FOR SELECT
USING (bucket_id = 'question-figures');

-- Policy: Only admins can upload question figures
CREATE POLICY "Admins can upload question figures"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'question-figures' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Policy: Only admins can update question figures
CREATE POLICY "Admins can update question figures"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'question-figures' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Policy: Only admins can delete question figures
CREATE POLICY "Admins can delete question figures"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'question-figures' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);
