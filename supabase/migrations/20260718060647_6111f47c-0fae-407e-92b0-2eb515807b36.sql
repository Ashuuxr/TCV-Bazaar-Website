
CREATE OR REPLACE FUNCTION public.bookings_guard_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
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
