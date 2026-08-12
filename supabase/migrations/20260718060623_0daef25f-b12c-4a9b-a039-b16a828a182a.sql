
-- 1) Drop public read on stalls (public snapshot now goes through a server function that omits customer_name).
DROP POLICY IF EXISTS "Public reads stalls" ON public.stalls;

-- 2) Replace overly-permissive customer UPDATE policy on bookings.
--    Add a trigger that blocks non-admin changes to financial / status columns.
DROP POLICY IF EXISTS "Users update own pending bookings" ON public.bookings;
CREATE POLICY "Users update own pending bookings"
ON public.bookings
FOR UPDATE
TO authenticated
USING (auth.uid() = customer_id AND status = 'pending'::booking_status)
WITH CHECK (auth.uid() = customer_id AND status = 'pending'::booking_status);

CREATE OR REPLACE FUNCTION public.bookings_guard_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admins and service_role bypass this guard.
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  -- Reset privileged columns to their old values for non-admin callers.
  NEW.status         := OLD.status;
  NEW.pay_status     := OLD.pay_status;
  NEW.total          := OLD.total;
  NEW.subtotal       := OLD.subtotal;
  NEW.gst_amount     := OLD.gst_amount;
  NEW.gst_rate       := OLD.gst_rate;
  NEW.amount_paid    := OLD.amount_paid;
  NEW.balance        := OLD.balance;
  NEW.package_id     := OLD.package_id;
  NEW.stall_id       := OLD.stall_id;
  NEW.customer_id    := OLD.customer_id;
  NEW.invoice_number := OLD.invoice_number;
  NEW.pay_type       := OLD.pay_type;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bookings_guard_privileged_columns ON public.bookings;
CREATE TRIGGER bookings_guard_privileged_columns
BEFORE UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.bookings_guard_privileged_columns();

-- 3) Switch has_role to SECURITY INVOKER; user_roles already allows users to read their own rows.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;
