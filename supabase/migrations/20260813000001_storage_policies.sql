-- =========================================================
-- Migration: Storage bucket creation + RLS policies
-- File: supabase/migrations/20260813000001_storage_policies.sql
--
-- HOW TO APPLY:
--   Option A (Recommended): Run this in Supabase Dashboard
--     -> SQL Editor -> New query -> paste -> Run
--   Option B: Save as the file path above and push to GitHub,
--     then run: npx supabase db push
-- =========================================================
-- =========================================================
-- 1. Create buckets (idempotent -- DO NOTHING on conflict)
-- =========================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  -- Public buckets (anyone can download via public URL)
  ('brand-assets',        'brand-assets',        true,  52428800,  NULL),
  ('gallery',             'gallery',             true,  52428800,  NULL),
  ('page-assets',         'page-assets',         true,  52428800,  NULL),
  ('hero-videos',         'hero-videos',         true,  524288000, NULL),
  ('brochures',           'brochures',           true,  52428800,  ARRAY['application/pdf']),
  -- Private buckets (require auth or signed URL)
  ('media-library',       'media-library',       false, 52428800,  NULL),
  ('company-assets',      'company-assets',      false, 52428800,  NULL),
  ('bank-qr',             'bank-qr',             false, 10485760,  ARRAY['image/png','image/jpeg','image/jpg','image/webp']),
  ('payment-screenshots', 'payment-screenshots', false, 10485760,  ARRAY['image/png','image/jpeg','image/jpg','image/webp','image/gif'])
ON CONFLICT (id) DO NOTHING;
-- =========================================================
-- 2. Drop any stale / duplicate policies (idempotent)
-- =========================================================
DO $$
DECLARE
  policy_names text[] := ARRAY[
    'storage_brand-assets_select',  'storage_brand-assets_insert',  'storage_brand-assets_update',  'storage_brand-assets_delete',
    'storage_gallery_select',       'storage_gallery_insert',       'storage_gallery_update',       'storage_gallery_delete',
    'storage_page-assets_select',   'storage_page-assets_insert',   'storage_page-assets_update',   'storage_page-assets_delete',
    'storage_hero-videos_select',   'storage_hero-videos_insert',   'storage_hero-videos_update',   'storage_hero-videos_delete',
    'storage_brochures_select',     'storage_brochures_insert',     'storage_brochures_update',     'storage_brochures_delete',
    'storage_media-library_select', 'storage_media-library_insert', 'storage_media-library_update', 'storage_media-library_delete',
    'storage_company-assets_select','storage_company-assets_insert','storage_company-assets_update','storage_company-assets_delete',
    'storage_bank-qr_select',       'storage_bank-qr_insert',       'storage_bank-qr_update',       'storage_bank-qr_delete',
    'storage_payment-screenshots_select','storage_payment-screenshots_insert',
    'storage_payment-screenshots_update','storage_payment-screenshots_delete',
    'Admin full access storage', 'Public read storage', 'Authenticated upload'
  ];
  p text;
BEGIN
  FOREACH p IN ARRAY policy_names LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', p);
  END LOOP;
END;
$$;
-- =========================================================
-- 3. PUBLIC BUCKETS
-- brand-assets, gallery, page-assets, hero-videos, brochures
-- Anyone can read; only admins can write.
-- =========================================================
-- brand-assets
CREATE POLICY "storage_brand-assets_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'brand-assets');
CREATE POLICY "storage_brand-assets_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'brand-assets' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "storage_brand-assets_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'brand-assets' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "storage_brand-assets_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'brand-assets' AND public.has_role(auth.uid(), 'admin'));
-- gallery
CREATE POLICY "storage_gallery_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'gallery');
CREATE POLICY "storage_gallery_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'gallery' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "storage_gallery_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'gallery' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "storage_gallery_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'gallery' AND public.has_role(auth.uid(), 'admin'));
-- page-assets
CREATE POLICY "storage_page-assets_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'page-assets');
CREATE POLICY "storage_page-assets_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'page-assets' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "storage_page-assets_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'page-assets' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "storage_page-assets_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'page-assets' AND public.has_role(auth.uid(), 'admin'));
-- hero-videos
CREATE POLICY "storage_hero-videos_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'hero-videos');
CREATE POLICY "storage_hero-videos_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'hero-videos' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "storage_hero-videos_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'hero-videos' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "storage_hero-videos_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'hero-videos' AND public.has_role(auth.uid(), 'admin'));
-- brochures
CREATE POLICY "storage_brochures_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'brochures');
CREATE POLICY "storage_brochures_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'brochures' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "storage_brochures_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'brochures' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "storage_brochures_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'brochures' AND public.has_role(auth.uid(), 'admin'));
-- =========================================================
-- 4. PRIVATE BUCKETS: media-library, company-assets
-- Authenticated users can read; only admins can write.
-- =========================================================
-- media-library
CREATE POLICY "storage_media-library_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'media-library');
CREATE POLICY "storage_media-library_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'media-library' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "storage_media-library_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'media-library' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "storage_media-library_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'media-library' AND public.has_role(auth.uid(), 'admin'));
-- company-assets
CREATE POLICY "storage_company-assets_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'company-assets');
CREATE POLICY "storage_company-assets_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'company-assets' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "storage_company-assets_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'company-assets' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "storage_company-assets_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'company-assets' AND public.has_role(auth.uid(), 'admin'));
-- =========================================================
-- 5. PRIVATE BUCKET: bank-qr
-- Authenticated users can read QR codes during booking;
-- only admins can upload/manage.
-- =========================================================
CREATE POLICY "storage_bank-qr_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'bank-qr');
CREATE POLICY "storage_bank-qr_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'bank-qr' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "storage_bank-qr_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'bank-qr' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "storage_bank-qr_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'bank-qr' AND public.has_role(auth.uid(), 'admin'));
-- =========================================================
-- 6. PRIVATE BUCKET: payment-screenshots
-- Any authenticated user may upload their own payment proof.
-- Users see only their own files; admins see all.
-- Only admins can update or delete.
-- =========================================================
CREATE POLICY "storage_payment-screenshots_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'payment-screenshots'
    AND auth.uid() IS NOT NULL
  );
CREATE POLICY "storage_payment-screenshots_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'payment-screenshots'
    AND (
      public.has_role(auth.uid(), 'admin')
      OR owner = auth.uid()
    )
  );
CREATE POLICY "storage_payment-screenshots_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'payment-screenshots'
    AND public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "storage_payment-screenshots_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'payment-screenshots'
    AND public.has_role(auth.uid(), 'admin')
  );
