
-- Helper: billing access (super_admin / admin / finance)
CREATE OR REPLACE FUNCTION public.has_billing_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('super_admin'::app_role, 'admin'::app_role, 'finance'::app_role)
  )
$$;

-- 1. company_profile (single row, id='main')
CREATE TABLE IF NOT EXISTS public.company_profile (
  id text PRIMARY KEY DEFAULT 'main',
  legal_name text NOT NULL DEFAULT '',
  business_name text NOT NULL DEFAULT '',
  address_line1 text NOT NULL DEFAULT '',
  address_line2 text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  state text NOT NULL DEFAULT '',
  state_code text NOT NULL DEFAULT '',
  pincode text NOT NULL DEFAULT '',
  country text NOT NULL DEFAULT 'India',
  gstin text NOT NULL DEFAULT '',
  pan text NOT NULL DEFAULT '',
  cin text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  mobile text NOT NULL DEFAULT '',
  website text NOT NULL DEFAULT '',
  logo_url text NOT NULL DEFAULT '',
  signature_url text NOT NULL DEFAULT '',
  stamp_url text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);
GRANT SELECT ON public.company_profile TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON public.company_profile TO authenticated;
GRANT ALL ON public.company_profile TO service_role;
ALTER TABLE public.company_profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view company profile" ON public.company_profile FOR SELECT USING (true);
CREATE POLICY "Billing users can insert company profile" ON public.company_profile
  FOR INSERT TO authenticated WITH CHECK (public.has_billing_access(auth.uid()));
CREATE POLICY "Billing users can update company profile" ON public.company_profile
  FOR UPDATE TO authenticated USING (public.has_billing_access(auth.uid()))
  WITH CHECK (public.has_billing_access(auth.uid()));
CREATE POLICY "Billing users can delete company profile" ON public.company_profile
  FOR DELETE TO authenticated USING (public.has_billing_access(auth.uid()));

CREATE TRIGGER trg_company_profile_touch BEFORE UPDATE ON public.company_profile
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.company_profile (id, legal_name, business_name, country)
VALUES ('main', 'TCV Bazaar', 'TCV Bazaar', 'India')
ON CONFLICT (id) DO NOTHING;

-- 2. gst_settings
CREATE TABLE IF NOT EXISTS public.gst_settings (
  id text PRIMARY KEY DEFAULT 'main',
  gst_enabled boolean NOT NULL DEFAULT true,
  default_rate numeric(5,2) NOT NULL DEFAULT 18.00,
  tax_mode text NOT NULL DEFAULT 'cgst_sgst' CHECK (tax_mode IN ('cgst_sgst','igst')),
  home_state_code text NOT NULL DEFAULT '',
  auto_calculate boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  CHECK (default_rate IN (0, 5, 12, 18, 28))
);
GRANT SELECT ON public.gst_settings TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON public.gst_settings TO authenticated;
GRANT ALL ON public.gst_settings TO service_role;
ALTER TABLE public.gst_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view GST settings" ON public.gst_settings FOR SELECT USING (true);
CREATE POLICY "Billing users can insert GST settings" ON public.gst_settings
  FOR INSERT TO authenticated WITH CHECK (public.has_billing_access(auth.uid()));
CREATE POLICY "Billing users can update GST settings" ON public.gst_settings
  FOR UPDATE TO authenticated USING (public.has_billing_access(auth.uid()))
  WITH CHECK (public.has_billing_access(auth.uid()));
CREATE POLICY "Billing users can delete GST settings" ON public.gst_settings
  FOR DELETE TO authenticated USING (public.has_billing_access(auth.uid()));

CREATE TRIGGER trg_gst_settings_touch BEFORE UPDATE ON public.gst_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.gst_settings (id) VALUES ('main') ON CONFLICT (id) DO NOTHING;

-- 3. invoice_settings
CREATE TABLE IF NOT EXISTS public.invoice_settings (
  id text PRIMARY KEY DEFAULT 'main',
  prefix text NOT NULL DEFAULT 'TCV',
  format text NOT NULL DEFAULT '{PREFIX}/{FY}/{SEQ}',
  seq_padding int NOT NULL DEFAULT 4 CHECK (seq_padding BETWEEN 1 AND 10),
  reset_yearly boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);
GRANT SELECT ON public.invoice_settings TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.invoice_settings TO authenticated;
GRANT ALL ON public.invoice_settings TO service_role;
ALTER TABLE public.invoice_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in can view invoice settings" ON public.invoice_settings
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Billing users can insert invoice settings" ON public.invoice_settings
  FOR INSERT TO authenticated WITH CHECK (public.has_billing_access(auth.uid()));
CREATE POLICY "Billing users can update invoice settings" ON public.invoice_settings
  FOR UPDATE TO authenticated USING (public.has_billing_access(auth.uid()))
  WITH CHECK (public.has_billing_access(auth.uid()));
CREATE POLICY "Billing users can delete invoice settings" ON public.invoice_settings
  FOR DELETE TO authenticated USING (public.has_billing_access(auth.uid()));

CREATE TRIGGER trg_invoice_settings_touch BEFORE UPDATE ON public.invoice_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.invoice_settings (id) VALUES ('main') ON CONFLICT (id) DO NOTHING;

-- 4. invoice_counters (per FY)
CREATE TABLE IF NOT EXISTS public.invoice_counters (
  fy text PRIMARY KEY,
  next_seq int NOT NULL DEFAULT 1
);
GRANT SELECT ON public.invoice_counters TO authenticated;
GRANT ALL ON public.invoice_counters TO service_role;
ALTER TABLE public.invoice_counters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in can view counters" ON public.invoice_counters
  FOR SELECT TO authenticated USING (true);

-- 5. Compute current Indian FY string like "2025-26"
CREATE OR REPLACE FUNCTION public.current_fy()
RETURNS text
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN EXTRACT(MONTH FROM now() AT TIME ZONE 'Asia/Kolkata') >= 4
      THEN to_char(now() AT TIME ZONE 'Asia/Kolkata', 'YYYY') || '-' ||
           to_char((now() AT TIME ZONE 'Asia/Kolkata') + interval '1 year', 'YY')
    ELSE to_char((now() AT TIME ZONE 'Asia/Kolkata') - interval '1 year', 'YYYY') || '-' ||
         to_char(now() AT TIME ZONE 'Asia/Kolkata', 'YY')
  END;
$$;

-- 6. Atomic invoice number issuance
CREATE OR REPLACE FUNCTION public.issue_invoice_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  s record;
  fy text;
  seq int;
  fmt text;
  padded text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF NOT public.has_billing_access(auth.uid())
     AND NOT public.has_role(auth.uid(),'admin'::app_role) THEN
    -- Admin trigger already allows admin; permit both billing + admin to issue.
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT prefix, format, seq_padding, reset_yearly INTO s FROM public.invoice_settings WHERE id='main';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'invoice_settings missing';
  END IF;

  fy := CASE WHEN s.reset_yearly THEN public.current_fy() ELSE 'ALL' END;

  INSERT INTO public.invoice_counters (fy, next_seq) VALUES (fy, 1)
    ON CONFLICT (fy) DO NOTHING;

  UPDATE public.invoice_counters
    SET next_seq = next_seq + 1
    WHERE fy = fy
    RETURNING next_seq - 1 INTO seq;

  padded := lpad(seq::text, s.seq_padding, '0');
  fmt := s.format;
  fmt := replace(fmt, '{PREFIX}', s.prefix);
  fmt := replace(fmt, '{FY}', fy);
  fmt := replace(fmt, '{SEQ}', padded);
  fmt := replace(fmt, '{YEAR}', to_char(now() AT TIME ZONE 'Asia/Kolkata', 'YYYY'));
  fmt := replace(fmt, '{MONTH}', to_char(now() AT TIME ZONE 'Asia/Kolkata', 'MM'));
  RETURN fmt;
END;
$$;

REVOKE ALL ON FUNCTION public.issue_invoice_number() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.issue_invoice_number() TO authenticated;

-- 7. Preview next invoice number without incrementing
CREATE OR REPLACE FUNCTION public.preview_next_invoice_number()
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  s record;
  fy text;
  seq int;
  fmt text;
  padded text;
BEGIN
  SELECT prefix, format, seq_padding, reset_yearly INTO s FROM public.invoice_settings WHERE id='main';
  IF NOT FOUND THEN RETURN ''; END IF;
  fy := CASE WHEN s.reset_yearly THEN public.current_fy() ELSE 'ALL' END;
  SELECT COALESCE(next_seq, 1) INTO seq FROM public.invoice_counters WHERE fy = fy;
  IF seq IS NULL THEN seq := 1; END IF;
  padded := lpad(seq::text, s.seq_padding, '0');
  fmt := s.format;
  fmt := replace(fmt, '{PREFIX}', s.prefix);
  fmt := replace(fmt, '{FY}', fy);
  fmt := replace(fmt, '{SEQ}', padded);
  fmt := replace(fmt, '{YEAR}', to_char(now() AT TIME ZONE 'Asia/Kolkata', 'YYYY'));
  fmt := replace(fmt, '{MONTH}', to_char(now() AT TIME ZONE 'Asia/Kolkata', 'MM'));
  RETURN fmt;
END;
$$;
REVOKE ALL ON FUNCTION public.preview_next_invoice_number() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.preview_next_invoice_number() TO authenticated;

-- 8. Reset invoice series for a given FY (or current)
CREATE OR REPLACE FUNCTION public.reset_invoice_series(_fy text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_fy text;
BEGIN
  IF NOT public.has_billing_access(auth.uid()) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  target_fy := COALESCE(_fy, public.current_fy());
  INSERT INTO public.invoice_counters (fy, next_seq) VALUES (target_fy, 1)
    ON CONFLICT (fy) DO UPDATE SET next_seq = 1;
END;
$$;
REVOKE ALL ON FUNCTION public.reset_invoice_series(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reset_invoice_series(text) TO authenticated;
