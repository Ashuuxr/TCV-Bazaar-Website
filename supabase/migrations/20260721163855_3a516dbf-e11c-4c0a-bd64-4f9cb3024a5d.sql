-- Repair explicit Data API/backend grants for public.stalls while preserving RLS and PII restrictions.

-- Remove broad browser-readable access first so only the safe column list below is exposed.
REVOKE ALL ON TABLE public.stalls FROM anon;
REVOKE ALL ON TABLE public.stalls FROM authenticated;

-- Backend/service role needs object privileges for server-side Stall Manager mutations.
GRANT ALL ON TABLE public.stalls TO service_role;

-- Public website and signed-in browser clients may read only safe layout/catalog fields.
GRANT SELECT (
  id,
  event_id,
  label,
  zone,
  x,
  y,
  w,
  h,
  pkg_id,
  status,
  active,
  price_override,
  color,
  sort_order
) ON TABLE public.stalls TO anon, authenticated;

-- Signed-in users need table-level mutation privileges, but RLS still gates writes to Admin/Super Admin only.
GRANT INSERT, UPDATE, DELETE ON TABLE public.stalls TO authenticated;

-- Ensure RLS remains enabled and the expected policies exist.
ALTER TABLE public.stalls ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'stalls'
      AND policyname = 'Admins manage stalls'
  ) THEN
    CREATE POLICY "Admins manage stalls"
      ON public.stalls
      FOR ALL
      TO authenticated
      USING (public.has_role(auth.uid(), 'admin'::public.app_role))
      WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'stalls'
      AND policyname = 'Public can read active stalls'
  ) THEN
    CREATE POLICY "Public can read active stalls"
      ON public.stalls
      FOR SELECT
      TO anon, authenticated
      USING (active = true);
  END IF;
END $$;

-- Keep required admin role-check RPCs callable by authenticated app requests only.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.delete_stall_safe(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_stall_safe(text) TO authenticated, service_role;