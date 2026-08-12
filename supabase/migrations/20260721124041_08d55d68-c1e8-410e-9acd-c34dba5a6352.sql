
-- 1) log_user_audit: internal admin guard
CREATE OR REPLACE FUNCTION public.log_user_audit(
  _target_id uuid,
  _target_email text,
  _action text,
  _from_role app_role DEFAULT NULL::app_role,
  _to_role app_role DEFAULT NULL::app_role,
  _metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _actor_email text;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  SELECT email INTO _actor_email FROM auth.users WHERE id = auth.uid();
  INSERT INTO public.user_audit_log
    (actor_id, actor_email, target_id, target_email, action, from_role, to_role, metadata)
  VALUES
    (auth.uid(), _actor_email, _target_id, _target_email, _action, _from_role, _to_role, COALESCE(_metadata,'{}'::jsonb));
END;
$function$;

-- 2) stalls: hide sensitive columns from anon (column-level grants)
REVOKE SELECT ON public.stalls FROM anon;
GRANT SELECT (
  id, event_id, label, zone, x, y, w, h, pkg_id, status, active,
  price_override, color, sort_order, created_at, updated_at
) ON public.stalls TO anon;

-- 3) tracking_integrations: remove public read + realtime broadcast
DROP POLICY IF EXISTS "public read enabled tracking" ON public.tracking_integrations;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'tracking_integrations'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.tracking_integrations';
  END IF;
END $$;

REVOKE SELECT, INSERT, UPDATE, DELETE ON public.tracking_integrations FROM anon;
