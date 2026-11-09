alter table public.referral_earnings
  add column if not exists referred_amount_usd numeric(12, 2) not null default 10.00
  check (referred_amount_usd = 10.00);

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
      amount_usd,
      referred_amount_usd
    )
    values (
      new.referred_by_user_id,
      new.id,
      10.00,
      10.00
    )
    on conflict (referred_user_id) do nothing;
  end if;

  return new;
end;
$$;

create or replace function public.get_my_referral_cash_history()
returns table (
  id uuid,
  description text,
  amount_usd numeric,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select credits.id, credits.description, credits.amount_usd, credits.created_at
  from (
    select
      e.id,
      'Referral bonus'::text as description,
      e.amount_usd,
      e.created_at
    from public.referral_earnings as e
    where e.referrer_user_id = (select auth.uid())

    union all

    select
      e.id,
      'Welcome referral bonus'::text as description,
      e.referred_amount_usd as amount_usd,
      e.created_at
    from public.referral_earnings as e
    where e.referred_user_id = (select auth.uid())
  ) as credits
  order by credits.created_at desc
  limit 100;
$$;

revoke all on function public.get_my_referral_cash_history() from public, anon;
grant execute on function public.get_my_referral_cash_history() to authenticated;

create or replace function public.get_my_points_summary()
returns table (
  points_balance bigint,
  points_earned_today bigint,
  ads_completed_today bigint,
  unlock_cost integer,
  access_hours integer,
  access_until timestamptz,
  cash_balance_usd numeric,
  survey_category text
)
language sql
stable
security definer
set search_path = ''
as $$
  with my_cash as (
    select
      coalesce((
        select sum(case when l.status = 'approved' then l.amount_usd else -l.amount_usd end)
        from public.reward_ledger as l
        where l.user_id = (select auth.uid())
      ), 0)
      + coalesce((
        select sum(s.amount_usd)
        from public.survey_cash_ledger as s
        where s.user_id = (select auth.uid())
      ), 0)
      + coalesce((
        select sum(referral_credits.amount_usd)
        from (
          select e.amount_usd
          from public.referral_earnings as e
          where e.referrer_user_id = (select auth.uid())
          union all
          select e.referred_amount_usd as amount_usd
          from public.referral_earnings as e
          where e.referred_user_id = (select auth.uid())
        ) as referral_credits
      ), 0) as balance
  ),
  my_points as (
    select
      coalesce(sum(l.points_delta), 0) as balance,
      coalesce(sum(l.points_delta) filter (
        where l.points_delta > 0
          and l.created_at >= pg_catalog.date_trunc('day', pg_catalog.now())
      ), 0) as earned_today,
      count(*) filter (
        where l.reason = 'campaign_reward'
          and l.created_at >= pg_catalog.date_trunc('day', pg_catalog.now())
      ) as ads_today
    from public.points_ledger as l
    where l.user_id = (select auth.uid())
  )
  select
    my_points.balance,
    my_points.earned_today,
    my_points.ads_today,
    coalesce(settings.survey_unlock_points, 0),
    coalesce(settings.survey_access_hours, 0),
    access.expires_at,
    my_cash.balance,
    category.name
  from my_points
  cross join my_cash
  left join public.points_settings as settings on settings.setting_key = 'global'
  left join public.survey_access as access on access.user_id = (select auth.uid())
  left join lateral (
    select c.name
    from public.survey_categories as c
    where c.min_cash_usd <= my_cash.balance
      and (c.max_cash_usd is null or my_cash.balance < c.max_cash_usd)
    order by c.min_cash_usd desc
    limit 1
  ) as category on true;
$$;

revoke all on function public.get_my_points_summary() from public, anon;
grant execute on function public.get_my_points_summary() to authenticated;
