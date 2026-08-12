
-- RLS predicates (must remain executable by signed-in users)
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.has_any_role(uuid, public.app_role[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_any_role(uuid, public.app_role[]) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.has_billing_access(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_billing_access(uuid) TO authenticated, service_role;

-- Admin-gated RPCs (internally check has_role) — lock to authenticated only
REVOKE ALL ON FUNCTION public.save_site_content(jsonb, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_site_content(jsonb, text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.restore_site_content_version(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.restore_site_content_version(uuid, text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.delete_stall_safe(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_stall_safe(text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.current_fy() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_fy() TO authenticated, service_role;

-- Service-role-only helpers: remove PUBLIC just in case, keep service_role
REVOKE ALL ON FUNCTION public.count_active_super_admins() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.count_active_super_admins() TO service_role;

REVOKE ALL ON FUNCTION public.is_last_super_admin(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_last_super_admin(uuid) TO service_role;

REVOKE ALL ON FUNCTION public.log_user_audit(uuid, text, text, public.app_role, public.app_role, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_user_audit(uuid, text, text, public.app_role, public.app_role, jsonb) TO service_role;

REVOKE ALL ON FUNCTION public.issue_invoice_number() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.issue_invoice_number() TO service_role;

REVOKE ALL ON FUNCTION public.preview_next_invoice_number() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.preview_next_invoice_number() TO service_role;

REVOKE ALL ON FUNCTION public.reset_invoice_series(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reset_invoice_series(text) TO service_role;

-- Trigger-only functions: strip PUBLIC (they run in trigger context, no direct callers)
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.snapshot_site_content() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.protect_last_super_admin() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.protect_last_super_admin_status() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.bookings_guard_privileged_columns() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;
