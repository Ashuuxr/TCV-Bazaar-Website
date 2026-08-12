-- Restore safe-column SELECT grants on public.stalls
-- Public/authenticated can read layout columns; PII columns
-- (customer_name, notes, held_by, held_until) remain restricted to service_role.

GRANT SELECT (
  id, event_id, label, zone, x, y, w, h,
  pkg_id, status, active, price_override, color, sort_order,
  created_at, updated_at
) ON public.stalls TO anon, authenticated;

-- Reaffirm write grants (idempotent). Admin RLS policy still gates who can write.
GRANT INSERT, UPDATE, DELETE ON public.stalls TO authenticated;
GRANT ALL ON public.stalls TO service_role;