-- Create storage bucket for ham radio tool images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ham-radio-tools',
  'ham-radio-tools',
  true,
  2097152, -- 2 MB in bytes
  ARRAY[
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Policy: Anyone can view ham radio tool images (public read)
CREATE POLICY "Public can view ham radio tool images"
ON storage.objects FOR SELECT
USING (bucket_id = 'ham-radio-tools');

-- Policy: Only admins can upload ham radio tool images
CREATE POLICY "Admins can upload ham radio tool images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'ham-radio-tools' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Policy: Only admins can update ham radio tool images
CREATE POLICY "Admins can update ham radio tool images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'ham-radio-tools' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Policy: Only admins can delete ham radio tool images
CREATE POLICY "Admins can delete ham radio tool images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'ham-radio-tools' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);
