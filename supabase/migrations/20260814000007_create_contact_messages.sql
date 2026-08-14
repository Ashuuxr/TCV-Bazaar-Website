-- Persist public contact-form submissions and expose them only to admins.
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 120),
  phone text not null check (char_length(btrim(phone)) between 3 and 40),
  email text null check (email is null or char_length(email) <= 254),
  message text not null check (char_length(btrim(message)) between 1 and 5000),
  read_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

grant insert on public.contact_messages to anon, authenticated;
grant select, update, delete on public.contact_messages to authenticated;
grant all on public.contact_messages to service_role;

create policy "Anyone can submit contact messages"
  on public.contact_messages for insert
  to anon, authenticated
  with check (true);

create policy "Admins can read contact messages"
  on public.contact_messages for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role));

create policy "Admins can update contact messages"
  on public.contact_messages for update
  to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role))
  with check (public.has_role(auth.uid(), 'admin'::public.app_role));

create policy "Admins can delete contact messages"
  on public.contact_messages for delete
  to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role));

create index if not exists contact_messages_created_at_idx
  on public.contact_messages (created_at desc);
create index if not exists contact_messages_unread_idx
  on public.contact_messages (created_at desc)
  where read_at is null;

create trigger contact_messages_touch
  before update on public.contact_messages
  for each row execute function public.touch_updated_at();
