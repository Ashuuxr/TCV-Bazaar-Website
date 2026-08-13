-- Supabase requires a predicate for destructive deletes. The predicate below
-- still matches every analytics event and cannot touch any other table.
create or replace function public.reset_analytics_events()
returns bigint
language plpgsql
security invoker
set search_path = public
as $$
declare
  deleted_count bigint;
begin
  if not public.has_role(auth.uid(), 'admin'::public.app_role) then
    raise exception 'Forbidden: admin role required';
  end if;

  delete from public.analytics_events
  where id is not null;
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

revoke all on function public.reset_analytics_events() from public, anon;
grant execute on function public.reset_analytics_events() to authenticated, service_role;
