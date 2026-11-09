create table if not exists public.referral_earnings (
  id uuid primary key default gen_random_uuid(),
  referrer_user_id uuid not null references public.profiles (id) on delete cascade,
  referred_user_id uuid not null unique references public.profiles (id) on delete cascade,
  amount_usd numeric(12, 2) not null default 10.00 check (amount_usd = 10.00),
  created_at timestamptz not null default now()
);

create index if not exists referral_earnings_referrer_created_idx
  on public.referral_earnings (referrer_user_id, created_at desc);

alter table public.referral_earnings enable row level security;
revoke all on public.referral_earnings from public, anon, authenticated;
grant select on public.referral_earnings to service_role;

create or replace function public.record_successful_referral_earning()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.referred_by_user_id is not null
    and new.email_confirmed_at is not null
    and (tg_op = 'INSERT' or old.email_confirmed_at is null) then
    insert into public.referral_earnings (
      referrer_user_id,
      referred_user_id,
      amount_usd
    )
    values (
      new.referred_by_user_id,
      new.id,
      10.00
    )
    on conflict (referred_user_id) do nothing;
  end if;

  return new;
end;
$$;

revoke all on function public.record_successful_referral_earning() from public, anon, authenticated;

drop trigger if exists record_successful_referral_earning on public.profiles;
create trigger record_successful_referral_earning
  after insert or update of email_confirmed_at on public.profiles
  for each row execute function public.record_successful_referral_earning();

insert into public.referral_earnings (referrer_user_id, referred_user_id, amount_usd)
select referred_by_user_id, id, 10.00
from public.profiles
where referred_by_user_id is not null
  and email_confirmed_at is not null
on conflict (referred_user_id) do nothing;

create or replace function public.get_my_referral_summary()
returns table (
  total_invited bigint,
  successful_referrals bigint,
  pending_referrals bigint,
  earned_usd numeric
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    count(*) as total_invited,
    count(*) filter (where p.email_confirmed_at is not null) as successful_referrals,
    count(*) filter (where p.email_confirmed_at is null) as pending_referrals,
    coalesce(sum(e.amount_usd), 0) as earned_usd
  from public.profiles as p
  left join public.referral_earnings as e on e.referred_user_id = p.id
  where p.referred_by_user_id = (select auth.uid());
$$;

create or replace function public.get_my_referral_history()
returns table (
  username text,
  created_at timestamptz,
  email_confirmed boolean,
  earned_usd numeric
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    p.username,
    p.created_at,
    p.email_confirmed_at is not null as email_confirmed,
    coalesce(e.amount_usd, 0) as earned_usd
  from public.profiles as p
  left join public.referral_earnings as e on e.referred_user_id = p.id
  where p.referred_by_user_id = (select auth.uid())
  order by p.created_at desc
  limit 100;
$$;

revoke all on function public.get_my_referral_summary() from public, anon;
revoke all on function public.get_my_referral_history() from public, anon;
grant execute on function public.get_my_referral_summary() to authenticated;
grant execute on function public.get_my_referral_history() to authenticated;
