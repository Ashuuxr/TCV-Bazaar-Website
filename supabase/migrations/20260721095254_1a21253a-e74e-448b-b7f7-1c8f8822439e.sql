
create or replace function public.save_site_content(_data jsonb, _reason text default null)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not public.has_role(auth.uid(), 'admin'::app_role) then
    raise exception 'Forbidden';
  end if;
  perform set_config('app.change_reason', coalesce(_reason, ''), true);
  perform set_config('app.change_source', 'save', true);
  perform set_config('app.restored_from', '', true);
  insert into public.site_content (id, data, updated_at)
    values ('main', _data, now())
    on conflict (id) do update set data = excluded.data, updated_at = excluded.updated_at;
end;
$$;

create or replace function public.restore_site_content_version(_version_id uuid, _reason text default null)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v record;
begin
  if not public.has_role(auth.uid(), 'admin'::app_role) then
    raise exception 'Forbidden';
  end if;
  select id, content_id, data into v from public.site_content_versions where id = _version_id;
  if not found then
    raise exception 'Version not found';
  end if;
  perform set_config('app.change_reason', coalesce(_reason, concat('Restored version ', v.id::text)), true);
  perform set_config('app.change_source', 'restore', true);
  perform set_config('app.restored_from', v.id::text, true);
  insert into public.site_content (id, data, updated_at)
    values (v.content_id, v.data, now())
    on conflict (id) do update set data = excluded.data, updated_at = excluded.updated_at;
end;
$$;

grant execute on function public.save_site_content(jsonb, text) to authenticated;
grant execute on function public.restore_site_content_version(uuid, text) to authenticated;
