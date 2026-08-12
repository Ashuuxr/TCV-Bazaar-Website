
-- Public read of hero videos (so signed-URL callers can also fetch directly)
DROP POLICY IF EXISTS "Hero videos are publicly readable" ON storage.objects;
CREATE POLICY "Hero videos are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'hero-videos');

DROP POLICY IF EXISTS "Admins can upload hero videos" ON storage.objects;
CREATE POLICY "Admins can upload hero videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'hero-videos' AND public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update hero videos" ON storage.objects;
CREATE POLICY "Admins can update hero videos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'hero-videos' AND public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (bucket_id = 'hero-videos' AND public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can delete hero videos" ON storage.objects;
CREATE POLICY "Admins can delete hero videos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'hero-videos' AND public.has_role(auth.uid(), 'admin'::app_role));

-- Clear any base64 blob currently stored in site_content.hero
UPDATE public.site_content
SET data = jsonb_set(
  jsonb_set(
    jsonb_set(
      COALESCE(data, '{}'::jsonb),
      '{hero,videoDataUrl}', '""'::jsonb, true
    ),
    '{hero,enabled}', 'true'::jsonb, true
  ),
  '{hero,visible}', 'true'::jsonb, true
)
WHERE id = 'main';
