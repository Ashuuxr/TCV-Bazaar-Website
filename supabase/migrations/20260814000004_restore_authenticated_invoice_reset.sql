-- reset_invoice_series checks has_billing_access(auth.uid()) internally.
-- The application must call it with the authenticated session client so that
-- auth.uid() is available; anonymous execution remains blocked.
revoke execute on function public.reset_invoice_series(text) from public, anon;
grant execute on function public.reset_invoice_series(text) to authenticated, service_role;
