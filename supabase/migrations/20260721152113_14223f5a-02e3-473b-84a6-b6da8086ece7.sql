-- Restrict company_profile client-side SELECT to non-PII columns
REVOKE SELECT ON public.company_profile FROM anon, authenticated;
GRANT SELECT (id, legal_name, business_name, address_line1, address_line2, city, state, state_code, pincode, country, website, logo_url, updated_at) ON public.company_profile TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.company_profile TO authenticated;
GRANT ALL ON public.company_profile TO service_role;

-- Restrict stalls client-side SELECT to layout columns; hide customer_name / notes / held_by
REVOKE SELECT ON public.stalls FROM anon, authenticated;
GRANT SELECT (id, label, zone, x, y, w, h, pkg_id, status, active, price_override, color, sort_order) ON public.stalls TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.stalls TO authenticated;
GRANT ALL ON public.stalls TO service_role;