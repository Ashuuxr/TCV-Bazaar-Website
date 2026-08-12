
create or replace function public.delete_stall_safe(_stall_id text)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not public.has_role(auth.uid(), 'admin'::app_role) then
    raise exception 'Forbidden';
  end if;
  if exists (
    select 1 from public.bookings
    where stall_id = _stall_id and status in ('pending','approved')
  ) then
    raise exception 'Cannot delete: stall has active bookings';
  end if;
  delete from public.stalls where id = _stall_id;
end;
$$;

grant execute on function public.delete_stall_safe(text) to authenticated;
