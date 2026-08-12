
CREATE POLICY "Public can read active stalls"
  ON public.stalls
  FOR SELECT
  TO anon, authenticated
  USING (active = true);
