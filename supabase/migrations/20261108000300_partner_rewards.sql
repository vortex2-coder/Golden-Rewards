create table if not exists public.earning_tasks (
  id uuid primary key default gen_random_uuid(),
  partner_name text not null check (char_length(partner_name) between 2 and 80),
  title text not null check (char_length(title) between 3 and 120),
  description text not null default '' check (char_length(description) <= 500),
  destination_url text not null check (destination_url ~ '^https://'),
  reward_usd numeric(12, 2) not null check (reward_usd > 0),
  tracking_parameter text not null default 'subid'
    check (tracking_parameter ~ '^[A-Za-z][A-Za-z0-9_]{0,39}$'),
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists earning_tasks_active_created_idx
  on public.earning_tasks (is_active, created_at desc);

alter table public.earning_tasks enable row level security;
revoke all on public.earning_tasks from public, anon, authenticated;
grant select, insert, update on public.earning_tasks to service_role;

create table if not exists public.reward_clicks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  task_id uuid not null references public.earning_tasks (id) on delete restrict,
  partner_name text not null,
  reward_usd numeric(12, 2) not null check (reward_usd > 0),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days'),
  completed_at timestamptz
);

create index if not exists reward_clicks_user_created_idx
  on public.reward_clicks (user_id, created_at desc);

alter table public.reward_clicks enable row level security;
revoke all on public.reward_clicks from public, anon, authenticated;
grant select, insert, update on public.reward_clicks to service_role;

create table if not exists public.reward_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  task_id uuid references public.earning_tasks (id) on delete set null,
  click_id uuid not null unique references public.reward_clicks (id) on delete restrict,
  partner_name text not null check (char_length(partner_name) between 2 and 80),
  provider_event_id text not null unique check (char_length(provider_event_id) between 1 and 160),
  provider_transaction_id text not null check (char_length(provider_transaction_id) between 1 and 160),
  amount_usd numeric(12, 2) not null check (amount_usd > 0),
  status text not null default 'approved' check (status in ('approved', 'reversed')),
  created_at timestamptz not null default now(),
  unique (partner_name, provider_transaction_id)
);

create index if not exists reward_ledger_user_status_created_idx
  on public.reward_ledger (user_id, status, created_at desc);

alter table public.reward_ledger enable row level security;
revoke all on public.reward_ledger from public, anon;
grant select on public.reward_ledger to authenticated;
grant select, insert, update on public.reward_ledger to service_role;

drop policy if exists "Members can read their own reward history" on public.reward_ledger;
create policy "Members can read their own reward history"
  on public.reward_ledger for select to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.get_my_reward_summary()
returns table (approved_usd numeric, reversed_usd numeric, completed_tasks bigint)
language sql
stable
set search_path = ''
as $$
  select
    coalesce(sum(l.amount_usd) filter (where l.status = 'approved'), 0),
    coalesce(sum(l.amount_usd) filter (where l.status = 'reversed'), 0),
    count(*) filter (where l.status = 'approved')
  from public.reward_ledger as l
  where l.user_id = (select auth.uid());
$$;

revoke all on function public.get_my_reward_summary() from public, anon;
grant execute on function public.get_my_reward_summary() to authenticated;

create or replace function public.get_reward_totals_for_users(p_user_ids uuid[])
returns table (user_id uuid, approved_usd numeric)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if p_user_ids is null or pg_catalog.cardinality(p_user_ids) > 100 then
    raise exception 'Invalid user list';
  end if;

  return query
    select requested.user_id,
           coalesce(sum(l.amount_usd) filter (where l.status = 'approved'), 0)
    from pg_catalog.unnest(p_user_ids) as requested(user_id)
    left join public.reward_ledger as l on l.user_id = requested.user_id
    group by requested.user_id;
end;
$$;

revoke all on function public.get_reward_totals_for_users(uuid[])
  from public, anon, authenticated;
grant execute on function public.get_reward_totals_for_users(uuid[])
  to service_role;

create or replace function public.process_partner_reward(
  p_click_id uuid,
  p_provider_event_id text,
  p_provider_transaction_id text,
  p_partner_name text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  click_record record;
  inserted_count integer;
begin
  if p_provider_event_id is null
    or char_length(p_provider_event_id) not between 1 and 160
    or p_provider_transaction_id is null
    or char_length(p_provider_transaction_id) not between 1 and 160
    or p_partner_name is null
    or char_length(p_partner_name) not between 2 and 80 then
    raise exception 'Invalid partner reward event';
  end if;

  if exists (
    select 1
    from public.reward_ledger as l
    where l.provider_event_id = p_provider_event_id
       or (l.partner_name = p_partner_name
           and l.provider_transaction_id = p_provider_transaction_id)
  ) then
    return false;
  end if;

  select c.id, c.user_id, c.task_id, c.partner_name, c.expires_at,
         c.completed_at, c.reward_usd
    into click_record
    from public.reward_clicks as c
    where c.id = p_click_id
    for update of c;

  if not found or click_record.expires_at < pg_catalog.now() then
    raise exception 'Reward click is missing or expired';
  end if;
  if click_record.completed_at is not null then
    return false;
  end if;
  if lower(click_record.partner_name) <> lower(p_partner_name) then
    raise exception 'Partner does not match the tracked task';
  end if;

  insert into public.reward_ledger (
    user_id,
    task_id,
    click_id,
    partner_name,
    provider_event_id,
    provider_transaction_id,
    amount_usd
  )
  values (
    click_record.user_id,
    click_record.task_id,
    click_record.id,
    click_record.partner_name,
    p_provider_event_id,
    p_provider_transaction_id,
    click_record.reward_usd
  )
  on conflict do nothing;

  get diagnostics inserted_count = row_count;
  if inserted_count = 0 then
    return false;
  end if;

  update public.reward_clicks
    set completed_at = pg_catalog.now()
    where id = click_record.id;

  return true;
end;
$$;

revoke all on function public.process_partner_reward(uuid, text, text, text)
  from public, anon, authenticated;
grant execute on function public.process_partner_reward(uuid, text, text, text)
  to service_role;
