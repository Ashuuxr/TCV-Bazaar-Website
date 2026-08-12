
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
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF NOT public.has_billing_access(auth.uid())
     AND NOT public.has_role(auth.uid(),'admin'::app_role) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT prefix, format, seq_padding, reset_yearly INTO s FROM public.invoice_settings WHERE id='main';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'invoice_settings missing';
  END IF;

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

CREATE OR REPLACE FUNCTION public.preview_next_invoice_number()
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  s record;
  v_fy text;
  v_seq int;
  fmt text;
  padded text;
BEGIN
  SELECT prefix, format, seq_padding, reset_yearly INTO s FROM public.invoice_settings WHERE id='main';
  IF NOT FOUND THEN RETURN ''; END IF;
  v_fy := CASE WHEN s.reset_yearly THEN public.current_fy() ELSE 'ALL' END;
  SELECT COALESCE(next_seq, 1) INTO v_seq FROM public.invoice_counters WHERE fy = v_fy;
  IF v_seq IS NULL THEN v_seq := 1; END IF;
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
