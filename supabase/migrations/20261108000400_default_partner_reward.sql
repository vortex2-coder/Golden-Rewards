create table if not exists public.reward_settings (
  setting_key text primary key check (setting_key = 'global'),
  default_reward_usd numeric(12, 2)
    check (default_reward_usd is null or default_reward_usd > 0),
  updated_at timestamptz not null default now()
);

insert into public.reward_settings (setting_key, default_reward_usd)
values ('global', null)
on conflict (setting_key) do nothing;

alter table public.reward_settings enable row level security;
revoke all on public.reward_settings from public, anon, authenticated;
grant select, insert, update on public.reward_settings to service_role;

create or replace function public.save_admin_ad_and_reward_settings(
  p_enabled boolean,
  p_client_id text,
  p_slot_id text,
  p_reward_usd numeric
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_client_id is null or (p_client_id <> '' and p_client_id !~ '^ca-pub-[0-9]{16}$') then
    raise exception 'Invalid AdSense publisher ID';
  end if;
  if p_slot_id is null or (p_slot_id <> '' and p_slot_id !~ '^[0-9]{1,20}$') then
    raise exception 'Invalid AdSense slot ID';
  end if;
  if p_enabled and (p_client_id = '' or p_slot_id = '') then
    raise exception 'Publisher and slot IDs are required when ads are enabled';
  end if;
  if p_reward_usd is null or p_reward_usd <= 0 or p_reward_usd > 99999999.99 then
    raise exception 'Invalid default reward amount';
  end if;

  insert into public.adsense_settings (
    setting_key,
    enabled,
    client_id,
    slot_id,
    updated_at
  )
  values (
    'global',
    p_enabled,
    p_client_id,
    p_slot_id,
    pg_catalog.now()
  )
  on conflict (setting_key) do update
    set enabled = excluded.enabled,
        client_id = excluded.client_id,
        slot_id = excluded.slot_id,
        updated_at = excluded.updated_at;

  insert into public.reward_settings (
    setting_key,
    default_reward_usd,
    updated_at
  )
  values ('global', p_reward_usd, pg_catalog.now())
  on conflict (setting_key) do update
    set default_reward_usd = excluded.default_reward_usd,
        updated_at = excluded.updated_at;
end;
$$;

revoke all on function public.save_admin_ad_and_reward_settings(boolean, text, text, numeric)
  from public, anon, authenticated;
grant execute on function public.save_admin_ad_and_reward_settings(boolean, text, text, numeric)
  to service_role;
