-- rls_auto_enable is an internal event-trigger helper, not an API endpoint.
-- Keep the event trigger itself intact but remove exposed REST RPC execution.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
grant execute on function public.rls_auto_enable() to postgres, service_role;
