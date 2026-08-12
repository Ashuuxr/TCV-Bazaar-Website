
-- Allow issue_invoice_number to be called by service_role (createBooking runs as anon via service role)
CREATE OR REPLACE FUNCTION public.issue_invoice_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  s record;
  v_fy text;
  v_seq int;
  fmt text;
  padded text;
BEGIN
  -- If called by an authenticated user, require billing/admin. If called with no auth
  -- (service_role path) permit — createBooking runs under service_role for public visitors.
  IF auth.uid() IS NOT NULL THEN
    IF NOT public.has_billing_access(auth.uid())
       AND NOT public.has_role(auth.uid(),'admin'::app_role) THEN
      RAISE EXCEPTION 'Forbidden';
    END IF;
  END IF;

  SELECT prefix, format, seq_padding, reset_yearly INTO s FROM public.invoice_settings WHERE id='main';
  IF NOT FOUND THEN RAISE EXCEPTION 'invoice_settings missing'; END IF;

  v_fy := CASE WHEN s.reset_yearly THEN public.current_fy() ELSE 'ALL' END;

  INSERT INTO public.invoice_counters (fy, next_seq) VALUES (v_fy, 1)
    ON CONFLICT (fy) DO NOTHING;

  UPDATE public.invoice_counters
    SET next_seq = next_seq + 1
    WHERE fy = v_fy
    RETURNING next_seq - 1 INTO v_seq;

  padded := lpad(v_seq::text, s.seq_padding, '0');
  fmt := s.format;
  fmt := replace(fmt, '{PREFIX}', s.prefix);
  fmt := replace(fmt, '{FY}', v_fy);
  fmt := replace(fmt, '{SEQ}', padded);
  fmt := replace(fmt, '{YEAR}', to_char(now() AT TIME ZONE 'Asia/Kolkata', 'YYYY'));
  fmt := replace(fmt, '{MONTH}', to_char(now() AT TIME ZONE 'Asia/Kolkata', 'MM'));
  RETURN fmt;
END;
$$;
GRANT EXECUTE ON FUNCTION public.issue_invoice_number() TO service_role;

-- Also allow anon to read invoice_settings (prefix/format only, no secrets)
DROP POLICY IF EXISTS "Signed-in can view invoice settings" ON public.invoice_settings;
CREATE POLICY "Anyone can view invoice settings" ON public.invoice_settings FOR SELECT USING (true);
GRANT SELECT ON public.invoice_settings TO anon;
