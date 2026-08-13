-- log_user_audit performs its own admin-role check. Authenticated callers
-- need EXECUTE because the application invokes it with the signed-in session;
-- anonymous callers remain blocked.
revoke execute on function public.log_user_audit(uuid, text, text, public.app_role, public.app_role, jsonb) from public, anon;
grant execute on function public.log_user_audit(uuid, text, text, public.app_role, public.app_role, jsonb) to authenticated, service_role;
