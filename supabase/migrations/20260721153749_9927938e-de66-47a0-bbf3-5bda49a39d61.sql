
-- Admin-only write, service-role signs public read URLs
DO $$
DECLARE b text;
BEGIN
  FOR b IN SELECT unnest(ARRAY['brand-assets','gallery','media-library','page-assets','bank-qr']) LOOP
    EXECUTE format($f$
      DROP POLICY IF EXISTS "admin_write_%1$s" ON storage.objects;
      CREATE POLICY "admin_write_%1$s" ON storage.objects FOR ALL TO authenticated
        USING (bucket_id = %2$L AND public.has_role(auth.uid(),'admin'::app_role))
        WITH CHECK (bucket_id = %2$L AND public.has_role(auth.uid(),'admin'::app_role));
    $f$, b, b);
  END LOOP;
END$$;
