-- Remove legacy duplicate storage policies after the consolidated storage policy migration.
-- The consolidated storage_* policies are the canonical policy set.
DO $$
DECLARE p record;
BEGIN
  FOR p IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname ~ '^(brand-assets|gallery|page-assets|hero-videos|brochures|media-library|company-assets|bank-qr|payment-screenshots):'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', p.policyname);
  END LOOP;
END $$;
