
-- 1. Extend stalls
alter table public.stalls
  add column if not exists active boolean not null default true,
  add column if not exists price_override integer null,
  add column if not exists notes text null,
  add column if not exists color text null,
  add column if not exists sort_order integer not null default 0;

-- 2. Add 'blocked' status
alter type public.stall_status add value if not exists 'blocked';

-- 3. Update / insert packages
update public.packages set name = 'Table Space', tag = 'Compact', size = 'Open Row' where id = 'tabler';
update public.packages set name = 'Brand Spot', tag = 'Visibility' where id = 'branding';

insert into public.packages (id, event_id, name, price, size, tag, popular, enabled, sort_order, features)
select 'open_air', (select id from public.events where is_active limit 1),
       'Open Air Stall', 12000, 'Open Air', 'Outdoor', false, true, 60, array['Open-air premium spot', '2 Tables + 2 Chairs', 'Electric point']::text[]
where not exists (select 1 from public.packages where id = 'open_air');

insert into public.packages (id, event_id, name, price, size, tag, popular, enabled, sort_order, features)
select 'custom', (select id from public.events where is_active limit 1),
       'Custom Package', 0, 'Custom', 'Custom', false, false, 99, array['Fully customisable — set price per stall via override']::text[]
where not exists (select 1 from public.packages where id = 'custom');

-- 4. Wipe existing stalls (no active bookings reference these seed stalls in dev)
delete from public.stalls;

-- 5. Seed new layout (canvas 100 x 140)
do $$
declare
  ev uuid;
  left_data jsonb := '[
    {"lbl":"42","pkg":"branding","zone":"Left A"},
    {"lbl":"41","pkg":"standard","zone":"Left A"},
    {"lbl":"40","pkg":"standard","zone":"Left A"},
    {"lbl":"2","pkg":"standard","zone":"Left A"},
    {"lbl":"4","pkg":"standard","zone":"Left A"},
    {"lbl":"6","pkg":"standard","zone":"Left A"},
    {"lbl":"8","pkg":"standard","zone":"Left A"},
    {"lbl":"10","pkg":"standard","zone":"Left A"},
    {"lbl":"12","pkg":"standard","zone":"Left A"},
    {"lbl":"16","pkg":"standard","zone":"Left B"},
    {"lbl":"18","pkg":"standard","zone":"Left B"},
    {"lbl":"20","pkg":"standard","zone":"Left B"},
    {"lbl":"22","pkg":"sharing","zone":"Left C"},
    {"lbl":"24","pkg":"sharing","zone":"Left C"},
    {"lbl":"26","pkg":"sharing","zone":"Left C"},
    {"lbl":"28","pkg":"sharing","zone":"Left C"},
    {"lbl":"30","pkg":"tabler","zone":"Left D"},
    {"lbl":"38","pkg":"branding","zone":"Left D"},
    {"lbl":"32","pkg":"branding","zone":"Left D"},
    {"lbl":"34","pkg":"branding","zone":"Left D"},
    {"lbl":"36","pkg":"branding","zone":"Left D"}
  ]'::jsonb;
  right_data jsonb := '[
    {"lbl":"37","pkg":"branding","zone":"Right A"},
    {"lbl":"38","pkg":"branding","zone":"Right A"},
    {"lbl":"39","pkg":"branding","zone":"Right A"},
    {"lbl":"1","pkg":"standard","zone":"Right A"},
    {"lbl":"3","pkg":"standard","zone":"Right A"},
    {"lbl":"5","pkg":"standard","zone":"Right A"},
    {"lbl":"7","pkg":"standard","zone":"Right A"},
    {"lbl":"9","pkg":"standard","zone":"Right A"},
    {"lbl":"11","pkg":"standard","zone":"Right A"},
    {"lbl":"13","pkg":"standard","zone":"Right B"},
    {"lbl":"15","pkg":"standard","zone":"Right B"},
    {"lbl":"17","pkg":"standard","zone":"Right B"},
    {"lbl":"29","pkg":"sharing","zone":"Right B"},
    {"lbl":"19","pkg":"sharing","zone":"Right C","gap":true},
    {"lbl":"21","pkg":"sharing","zone":"Right C"},
    {"lbl":"23","pkg":"sharing","zone":"Right C"},
    {"lbl":"Open Air","pkg":"open_air","zone":"Right C"},
    {"lbl":"27","pkg":"tabler","zone":"Right D"},
    {"lbl":"31","pkg":"branding","zone":"Right D"},
    {"lbl":"33","pkg":"branding","zone":"Right D"},
    {"lbl":"35","pkg":"branding","zone":"Right D"}
  ]'::jsonb;
  item jsonb;
  i int;
  yy numeric;
  extra_gap numeric;
begin
  select id into ev from public.events where is_active limit 1;

  -- Left column: x=12, w=20, h=5, gap=0.8
  for i in 0..(jsonb_array_length(left_data)-1) loop
    item := left_data -> i;
    yy := 10 + i * 5.8;
    insert into public.stalls (id, event_id, label, zone, x, y, w, h, pkg_id, status, active, sort_order)
    values (
      'L' || lpad((i+1)::text, 2, '0'),
      ev,
      item->>'lbl',
      item->>'zone',
      12, yy, 20, 5,
      item->>'pkg',
      'available',
      true,
      i+1
    );
  end loop;

  -- Right column: x=60, w=20, h=5. Row 14 gets an extra 4 unit gap (entry break).
  extra_gap := 0;
  for i in 0..(jsonb_array_length(right_data)-1) loop
    item := right_data -> i;
    if (item ? 'gap') and (item->>'gap')::boolean then
      extra_gap := 4;
    end if;
    yy := 10 + i * 5.8 + extra_gap;
    insert into public.stalls (id, event_id, label, zone, x, y, w, h, pkg_id, status, active, sort_order, color)
    values (
      'R' || lpad((i+1)::text, 2, '0'),
      ev,
      item->>'lbl',
      item->>'zone',
      60, yy, 20, 5,
      item->>'pkg',
      'available',
      true,
      100 + i + 1,
      case when item->>'pkg' = 'open_air' then '#14b8a6' else null end
    );
  end loop;
end $$;
