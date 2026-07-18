-- Settings table for persisting admin configuration (e.g. WhatsApp group link).

create table if not exists public.app_settings (
  key   text primary key,
  value text not null
);

alter table public.app_settings enable row level security;

-- Only authenticated admins can read/write settings
create policy "Admins can read settings"
  on public.app_settings for select
  to authenticated
  using (true);

create policy "Admins can insert settings"
  on public.app_settings for insert
  to authenticated
  with check (true);

create policy "Admins can update settings"
  on public.app_settings for update
  to authenticated
  using (true);

create policy "Admins can delete settings"
  on public.app_settings for delete
  to authenticated
  using (true);

-- Seed default WhatsApp group link
insert into public.app_settings (key, value)
values ('whatsapp_group_link', 'https://chat.whatsapp.com/JX7TIQXGIZ60bnwEl7DTEW')
on conflict (key) do nothing;
