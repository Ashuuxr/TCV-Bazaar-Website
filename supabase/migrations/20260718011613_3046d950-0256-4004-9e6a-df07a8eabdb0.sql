
-- payment-screenshots: users manage their own folder, admins read all
CREATE POLICY "payment-screenshots: users read own"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'payment-screenshots' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "payment-screenshots: users upload own"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'payment-screenshots' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "payment-screenshots: users delete own"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'payment-screenshots' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "payment-screenshots: admins read all"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'payment-screenshots' AND public.has_role(auth.uid(), 'admin'));

-- booking-pdfs: same pattern
CREATE POLICY "booking-pdfs: users read own"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'booking-pdfs' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "booking-pdfs: users upload own"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'booking-pdfs' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "booking-pdfs: admins manage all"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'booking-pdfs' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'booking-pdfs' AND public.has_role(auth.uid(), 'admin'));
