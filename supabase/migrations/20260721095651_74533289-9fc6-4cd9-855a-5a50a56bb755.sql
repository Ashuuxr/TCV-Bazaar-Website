DROP POLICY IF EXISTS "Public reads enabled banks" ON public.banks;
REVOKE SELECT ON public.banks FROM anon;