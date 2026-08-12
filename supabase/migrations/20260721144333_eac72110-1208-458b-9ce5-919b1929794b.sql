
-- Tighten invoice_counters SELECT to billing/admin staff
DROP POLICY IF EXISTS "Signed-in can view counters" ON public.invoice_counters;
REVOKE SELECT ON public.invoice_counters FROM authenticated;
GRANT SELECT ON public.invoice_counters TO authenticated;
CREATE POLICY "Staff can view counters" ON public.invoice_counters
  FOR SELECT TO authenticated
  USING (public.has_billing_access(auth.uid()) OR public.has_role(auth.uid(), 'admin'::app_role));

-- Revoke EXECUTE on internal SECURITY DEFINER helpers from authenticated
REVOKE EXECUTE ON FUNCTION public.count_active_super_admins() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_last_super_admin(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_user_audit(uuid, text, text, app_role, app_role, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.restore_site_content_version(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.count_active_super_admins() TO service_role;
GRANT EXECUTE ON FUNCTION public.is_last_super_admin(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.log_user_audit(uuid, text, text, app_role, app_role, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.restore_site_content_version(uuid, text) TO service_role;
