
CREATE POLICY "Billing users can upload company assets"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'company-assets' AND public.has_billing_access(auth.uid()));

CREATE POLICY "Billing users can update company assets"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'company-assets' AND public.has_billing_access(auth.uid()))
  WITH CHECK (bucket_id = 'company-assets' AND public.has_billing_access(auth.uid()));

CREATE POLICY "Billing users can delete company assets"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'company-assets' AND public.has_billing_access(auth.uid()));

CREATE POLICY "Anyone signed-in can read company assets"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'company-assets');
