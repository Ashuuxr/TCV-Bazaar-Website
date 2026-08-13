-- Real analytics events are intentionally separate from bookings, payments, customers,
-- invoices, and audit history. Resetting this table must never affect those domains.
create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null check (event_name in ('page_view', 'layout_click')),
  path text not null default '/',
  session_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

grant insert on public.analytics_events to anon, authenticated;
grant select, delete on public.analytics_events to authenticated;
grant all on public.analytics_events to service_role;

alter table public.analytics_events enable row level security;

drop policy if exists "Public can record analytics events" on public.analytics_events;
create policy "Public can record analytics events"
  on public.analytics_events for insert
  to anon, authenticated
  with check (
    length(event_name) > 0
    and length(path) between 1 and 500
    and (session_id is null or length(session_id) between 8 and 120)
  );

drop policy if exists "Admins read analytics events" on public.analytics_events;
create policy "Admins read analytics events"
  on public.analytics_events for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role));

drop policy if exists "Admins delete analytics events" on public.analytics_events;
create policy "Admins delete analytics events"
  on public.analytics_events for delete
  to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role));

create index if not exists analytics_events_created_at_idx
  on public.analytics_events (created_at desc);
create index if not exists analytics_events_name_created_at_idx
  on public.analytics_events (event_name, created_at desc);

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

  delete from public.analytics_events;
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

revoke all on function public.reset_analytics_events() from public, anon;
grant execute on function public.reset_analytics_events() to authenticated, service_role;
