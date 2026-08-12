
DROP POLICY IF EXISTS "Anyone signed-in can read company assets" ON storage.objects;

CREATE POLICY "Billing staff can read company assets"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'company-assets'
  AND (public.has_billing_access(auth.uid()) OR public.has_role(auth.uid(), 'admin'::app_role))
);
