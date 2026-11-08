create table if not exists public.adsense_settings (
  setting_key text primary key default 'global'
    check (setting_key = 'global'),
  enabled boolean not null default false,
  client_id text not null default ''
    check (client_id = '' or client_id ~ '^ca-pub-[0-9]{16}$'),
  slot_id text not null default ''
    check (slot_id = '' or slot_id ~ '^[0-9]{1,20}$'),
  updated_at timestamptz not null default now()
);

alter table public.adsense_settings enable row level security;
revoke all on public.adsense_settings from public, anon, authenticated;
grant select, insert, update on public.adsense_settings to service_role;

insert into public.adsense_settings (setting_key)
values ('global')
on conflict (setting_key) do nothing;
