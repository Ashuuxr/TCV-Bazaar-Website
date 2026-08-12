
create table if not exists public.site_content_versions (
  id uuid primary key default gen_random_uuid(),
  content_id text not null,
  data jsonb not null,
  changed_modules text[] not null default '{}',
  author_id uuid,
  author_email text,
  reason text,
  source text not null default 'save',
  restored_from_version_id uuid references public.site_content_versions(id) on delete set null,
  created_at timestamptz not null default now()
);

grant select, insert, delete on public.site_content_versions to authenticated;
grant all on public.site_content_versions to service_role;

alter table public.site_content_versions enable row level security;

create policy "Admins read versions" on public.site_content_versions
  for select to authenticated
  using (public.has_role(auth.uid(), 'admin'::app_role));

create policy "Admins insert versions" on public.site_content_versions
  for insert to authenticated
  with check (public.has_role(auth.uid(), 'admin'::app_role));

create policy "Admins delete versions" on public.site_content_versions
  for delete to authenticated
  using (public.has_role(auth.uid(), 'admin'::app_role));

create index if not exists site_content_versions_content_created_idx
  on public.site_content_versions (content_id, created_at desc);
create index if not exists site_content_versions_modules_idx
  on public.site_content_versions using gin (changed_modules);

create or replace function public.snapshot_site_content()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  prev jsonb;
  changed text[] := '{}';
  k text;
  uid uuid := auth.uid();
  email text;
  reason_txt text := nullif(current_setting('app.change_reason', true), '');
  source_txt text := coalesce(nullif(current_setting('app.change_source', true), ''), 'save');
  restored_from uuid := nullif(current_setting('app.restored_from', true), '')::uuid;
begin
  if TG_OP = 'UPDATE' then
    prev := OLD.data;
  else
    prev := '{}'::jsonb;
  end if;

  for k in
    select distinct key from (
      select jsonb_object_keys(coalesce(prev, '{}'::jsonb)) as key
      union
      select jsonb_object_keys(coalesce(NEW.data, '{}'::jsonb)) as key
    ) s
  loop
    if coalesce(prev -> k, 'null'::jsonb) is distinct from coalesce(NEW.data -> k, 'null'::jsonb) then
      changed := array_append(changed, k);
    end if;
  end loop;

  if uid is not null then
    select u.email into email from auth.users u where u.id = uid;
  end if;

  insert into public.site_content_versions
    (content_id, data, changed_modules, author_id, author_email, reason, source, restored_from_version_id)
  values
    (NEW.id, NEW.data, changed, uid, email, reason_txt, source_txt, restored_from);

  return NEW;
end;
$$;

drop trigger if exists trg_snapshot_site_content on public.site_content;
create trigger trg_snapshot_site_content
  after insert or update on public.site_content
  for each row execute function public.snapshot_site_content();

insert into public.site_content_versions (content_id, data, changed_modules, source)
select id, data, array(select jsonb_object_keys(data)), 'auto'
from public.site_content
where not exists (
  select 1 from public.site_content_versions v where v.content_id = site_content.id
);
