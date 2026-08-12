
-- Ensure RLS is on (no-op if already enabled)
ALTER TABLE public.stalls ENABLE ROW LEVEL SECURITY;

-- Safe column set for public/authenticated reads (PII columns intentionally excluded)
GRANT SELECT (
  id, event_id, label, zone, x, y, w, h, pkg_id, status,
  active, price_override, color, sort_order, created_at, updated_at
) ON public.stalls TO anon, authenticated;

-- Admin writes go through RLS "Admins manage stalls"
GRANT INSERT, UPDATE, DELETE ON public.stalls TO authenticated;

-- supabaseAdmin path (privileged server functions) needs full access
GRANT ALL ON public.stalls TO service_role;

-- Reaffirm existing policies (idempotent, no behaviour change)
DROP POLICY IF EXISTS "Admins manage stalls" ON public.stalls;
CREATE POLICY "Admins manage stalls"
  ON public.stalls
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Public can read active stalls" ON public.stalls;
CREATE POLICY "Public can read active stalls"
  ON public.stalls
  AS PERMISSIVE
  FOR SELECT
  TO anon, authenticated
  USING (active = true);
