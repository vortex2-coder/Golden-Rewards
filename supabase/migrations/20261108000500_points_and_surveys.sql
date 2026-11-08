create table if not exists public.points_settings (
  setting_key text primary key check (setting_key = 'global'),
  enabled boolean not null default false,
  max_points_per_day integer not null default 0 check (max_points_per_day >= 0),
  max_rewarded_ads_per_day integer not null default 0 check (max_rewarded_ads_per_day >= 0),
  survey_unlock_points integer not null default 0 check (survey_unlock_points >= 0),
  survey_access_hours integer not null default 0 check (survey_access_hours >= 0),
  updated_at timestamptz not null default now()
);

insert into public.points_settings (setting_key)
values ('global')
on conflict (setting_key) do nothing;

create table if not exists public.points_campaigns (
  id uuid primary key default gen_random_uuid(),
  partner_name text not null check (char_length(partner_name) between 2 and 80),
  title text not null check (char_length(title) between 3 and 120),
  description text not null default '' check (char_length(description) <= 500),
  destination_url text not null check (destination_url ~ '^https://'),
  tracking_parameter text not null default 'subid'
    check (tracking_parameter ~ '^[A-Za-z][A-Za-z0-9_]{0,39}$'),
  points_reward integer not null check (points_reward > 0),
  allowed_countries text[] not null default '{}'
    check (array_position(allowed_countries, null) is null),
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists points_campaigns_active_created_idx
  on public.points_campaigns (is_active, created_at desc);

create table if not exists public.points_clicks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  campaign_id uuid not null references public.points_campaigns (id) on delete restrict,
  partner_name text not null,
  points_reward integer not null check (points_reward > 0),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days'),
  completed_at timestamptz
);

create index if not exists points_clicks_user_created_idx
  on public.points_clicks (user_id, created_at desc);

create table if not exists public.points_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  points_delta integer not null check (points_delta <> 0),
  reason text not null check (reason in ('campaign_reward', 'survey_unlock')),
  click_id uuid unique references public.points_clicks (id) on delete restrict,
  provider_event_id text unique,
  provider_transaction_id text,
  partner_name text,
  created_at timestamptz not null default now(),
  check (
    (reason = 'campaign_reward' and points_delta > 0
      and click_id is not null and provider_event_id is not null
      and provider_transaction_id is not null and partner_name is not null)
    or
    (reason = 'survey_unlock' and points_delta < 0
      and click_id is null and provider_event_id is null
      and provider_transaction_id is null and partner_name is null)
  ),
  unique (partner_name, provider_transaction_id)
);

create index if not exists points_ledger_user_created_idx
  on public.points_ledger (user_id, created_at desc);

create or replace function public.reject_immutable_ledger_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'Wallet ledger entries are immutable';
end;
$$;

drop trigger if exists points_ledger_immutable on public.points_ledger;
create trigger points_ledger_immutable
  before update or delete on public.points_ledger
  for each row execute function public.reject_immutable_ledger_change();

create table if not exists public.survey_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 2 and 80),
  min_cash_usd numeric(12, 2) not null default 0 check (min_cash_usd >= 0),
  max_cash_usd numeric(12, 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (max_cash_usd is null or max_cash_usd > min_cash_usd)
);

create table if not exists public.surveys (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.survey_categories (id) on delete restrict,
  title text not null check (char_length(title) between 3 and 120),
  description text not null default '' check (char_length(description) <= 1000),
  questions jsonb not null
    check (jsonb_typeof(questions) = 'array'
      and jsonb_array_length(questions) between 1 and 30),
  reward_usd numeric(12, 2) not null check (reward_usd > 0),
  is_published boolean not null default false,
  created_by uuid not null references auth.users (id) on delete restrict,
  updated_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists surveys_published_category_idx
  on public.surveys (is_published, category_id, created_at desc);

create table if not exists public.survey_access (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  unlocked_at timestamptz not null,
  expires_at timestamptz not null,
  points_spent integer not null check (points_spent > 0)
);

create table if not exists public.survey_submissions (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references public.surveys (id) on delete restrict,
  user_id uuid not null references public.profiles (id) on delete cascade,
  answers jsonb not null
    check (jsonb_typeof(answers) = 'array'
      and jsonb_array_length(answers) between 1 and 30),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  reviewer_id uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  review_note text not null default '' check (char_length(review_note) <= 500),
  created_at timestamptz not null default now(),
  unique (survey_id, user_id)
);

create index if not exists survey_submissions_status_created_idx
  on public.survey_submissions (status, created_at desc);

create table if not exists public.survey_cash_ledger (
  id uuid primary key default gen_random_uuid(),
  response_id uuid not null unique references public.survey_submissions (id) on delete restrict,
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount_usd numeric(12, 2) not null check (amount_usd > 0),
  created_at timestamptz not null default now()
);

create index if not exists survey_cash_ledger_user_created_idx
  on public.survey_cash_ledger (user_id, created_at desc);

create table if not exists public.admin_audit_log (
  id bigint generated always as identity primary key,
  actor_user_id uuid not null references auth.users (id) on delete restrict,
  event_type text not null check (char_length(event_type) between 3 and 80),
  entity_type text not null check (char_length(entity_type) between 2 and 80),
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

drop trigger if exists survey_cash_ledger_immutable on public.survey_cash_ledger;
create trigger survey_cash_ledger_immutable
  before update or delete on public.survey_cash_ledger
  for each row execute function public.reject_immutable_ledger_change();

drop trigger if exists admin_audit_log_immutable on public.admin_audit_log;
create trigger admin_audit_log_immutable
  before update or delete on public.admin_audit_log
  for each row execute function public.reject_immutable_ledger_change();

create index if not exists admin_audit_log_created_idx
  on public.admin_audit_log (created_at desc);

alter table public.points_settings enable row level security;
alter table public.points_campaigns enable row level security;
alter table public.points_clicks enable row level security;
alter table public.points_ledger enable row level security;
alter table public.survey_categories enable row level security;
alter table public.surveys enable row level security;
alter table public.survey_access enable row level security;
alter table public.survey_submissions enable row level security;
alter table public.survey_cash_ledger enable row level security;
alter table public.admin_audit_log enable row level security;

revoke all on public.points_settings, public.points_campaigns, public.points_clicks,
  public.points_ledger, public.survey_categories, public.surveys, public.survey_access,
  public.survey_submissions, public.survey_cash_ledger, public.admin_audit_log
  from public, anon, authenticated;
grant select on public.points_ledger, public.survey_submissions,
  public.survey_cash_ledger to authenticated;
grant select, insert, update on public.points_settings, public.points_campaigns,
  public.points_clicks, public.points_ledger, public.survey_categories, public.surveys,
  public.survey_access, public.survey_submissions, public.survey_cash_ledger,
  public.admin_audit_log to service_role;
revoke update, delete on public.points_ledger, public.survey_cash_ledger from service_role;
revoke update, delete on public.admin_audit_log from service_role;
grant usage, select on sequence public.admin_audit_log_id_seq to service_role;

drop policy if exists "Members can read their own points ledger" on public.points_ledger;
create policy "Members can read their own points ledger"
  on public.points_ledger for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Members can read their own survey submissions" on public.survey_submissions;
create policy "Members can read their own survey submissions"
  on public.survey_submissions for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Members can read their own survey cash ledger" on public.survey_cash_ledger;
create policy "Members can read their own survey cash ledger"
  on public.survey_cash_ledger for select to authenticated
  using ((select auth.uid()) = user_id);

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

create or replace function public.unlock_my_surveys()
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  user_balance bigint;
  configured_cost integer;
  configured_hours integer;
  existing_expiry timestamptz;
  new_expiry timestamptz;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;

  perform 1 from public.profiles where id = v_user_id for update;
  select settings.survey_unlock_points, settings.survey_access_hours
    into configured_cost, configured_hours
    from public.points_settings as settings
    where settings.setting_key = 'global' and settings.enabled = true;
  if not found or configured_cost <= 0 or configured_hours <= 0 then
    raise exception 'Survey access is not configured';
  end if;

  select access.expires_at into existing_expiry
    from public.survey_access as access
    where access.user_id = v_user_id
    for update;
  if existing_expiry is not null and existing_expiry > pg_catalog.now() then
    return existing_expiry;
  end if;

  select coalesce(sum(points_delta), 0) into user_balance
    from public.points_ledger where user_id = v_user_id;
  if user_balance < configured_cost then raise exception 'Not enough Golden Points'; end if;

  new_expiry := pg_catalog.now() + pg_catalog.make_interval(hours => configured_hours);
  insert into public.points_ledger (user_id, points_delta, reason)
    values (v_user_id, -configured_cost, 'survey_unlock');
  insert into public.survey_access (user_id, unlocked_at, expires_at, points_spent)
    values (v_user_id, pg_catalog.now(), new_expiry, configured_cost)
    on conflict (user_id) do update
      set unlocked_at = excluded.unlocked_at,
          expires_at = excluded.expires_at,
          points_spent = excluded.points_spent;
  return new_expiry;
end;
$$;

revoke all on function public.unlock_my_surveys() from public, anon;
grant execute on function public.unlock_my_surveys() to authenticated;

create or replace function public.get_available_surveys()
returns table (
  id uuid,
  title text,
  description text,
  questions jsonb,
  reward_usd numeric,
  category_name text
)
language sql
stable
security definer
set search_path = ''
as $$
  with cash as (
    select
      p.id,
      coalesce((
        select sum(case when l.status = 'approved' then l.amount_usd else -l.amount_usd end)
        from public.reward_ledger as l where l.user_id = p.id
      ), 0) + coalesce((
        select sum(sc.amount_usd) from public.survey_cash_ledger as sc where sc.user_id = p.id
      ), 0) as balance
    from public.profiles as p
    where p.id = (select auth.uid()) and p.account_status = 'active'
  )
  select s.id, s.title, s.description, s.questions, s.reward_usd, c.name
  from public.surveys as s
  join public.survey_access as access
    on access.user_id = (select auth.uid()) and access.expires_at > pg_catalog.now()
  join cash on true
  left join public.survey_categories as c on c.id = s.category_id
  where s.is_published
    and (s.category_id is null or exists (
      select 1 from public.survey_categories as eligible
      where eligible.id = s.category_id
        and eligible.min_cash_usd <= cash.balance
        and (eligible.max_cash_usd is null or cash.balance < eligible.max_cash_usd)
    ))
    and not exists (
      select 1 from public.survey_submissions as response
      where response.survey_id = s.id and response.user_id = (select auth.uid())
    )
  order by s.created_at desc;
$$;

revoke all on function public.get_available_surveys() from public, anon;
grant execute on function public.get_available_surveys() to authenticated;

create or replace function public.submit_survey_response(p_survey_id uuid, p_answers jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  expected_questions integer;
  submission_id uuid;
begin
  if v_user_id is null or p_answers is null
    or pg_catalog.jsonb_typeof(p_answers) <> 'array'
    or pg_catalog.jsonb_array_length(p_answers) not between 1 and 30 then
    raise exception 'Invalid survey response';
  end if;
  if exists (
    select 1 from pg_catalog.jsonb_array_elements(p_answers) as answer(value)
    where pg_catalog.jsonb_typeof(answer.value) <> 'string'
      or pg_catalog.char_length(answer.value #>> '{}') > 2000
  ) then raise exception 'Invalid survey answer'; end if;

  select pg_catalog.jsonb_array_length(s.questions)
    into expected_questions
    from public.surveys as s
    join public.survey_access as access
      on access.user_id = v_user_id and access.expires_at > pg_catalog.now()
    where s.id = p_survey_id and s.is_published;
  if not found or expected_questions <> pg_catalog.jsonb_array_length(p_answers) then
    raise exception 'Survey unavailable or response does not match the questions';
  end if;
  if not exists (
    select 1
    from public.surveys as s
    join public.profiles as p on p.id = v_user_id and p.account_status = 'active'
    where s.id = p_survey_id and s.is_published
      and (
        s.category_id is null
        or exists (
          select 1
          from public.survey_categories as c
          where c.id = s.category_id
            and c.min_cash_usd <= (
              coalesce((
                select sum(case when l.status = 'approved' then l.amount_usd else -l.amount_usd end)
                from public.reward_ledger as l where l.user_id = v_user_id
              ), 0)
              + coalesce((
                select sum(sc.amount_usd) from public.survey_cash_ledger as sc where sc.user_id = v_user_id
              ), 0)
            )
            and (c.max_cash_usd is null or (
              coalesce((
                select sum(case when l.status = 'approved' then l.amount_usd else -l.amount_usd end)
                from public.reward_ledger as l where l.user_id = v_user_id
              ), 0)
              + coalesce((
                select sum(sc.amount_usd) from public.survey_cash_ledger as sc where sc.user_id = v_user_id
              ), 0)
            ) < c.max_cash_usd)
        )
      )
  ) then raise exception 'Survey is not available for your Cash Balance category'; end if;

  insert into public.survey_submissions (survey_id, user_id, answers)
    values (p_survey_id, v_user_id, p_answers)
    returning id into submission_id;
  return submission_id;
end;
$$;

revoke all on function public.submit_survey_response(uuid, jsonb) from public, anon;
grant execute on function public.submit_survey_response(uuid, jsonb) to authenticated;

create or replace function public.save_cash_survey_category(
  p_actor_id uuid,
  p_category_id uuid,
  p_name text,
  p_min_cash_usd numeric,
  p_max_cash_usd numeric
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  saved_id uuid;
begin
  if p_actor_id is null or p_name is null
    or pg_catalog.char_length(pg_catalog.btrim(p_name)) not between 2 and 80
    or p_min_cash_usd is null or p_min_cash_usd < 0
    or (p_max_cash_usd is not null and p_max_cash_usd <= p_min_cash_usd) then
    raise exception 'Invalid survey category';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(9080123);
  if exists (
    select 1 from public.survey_categories as c
    where (p_category_id is null or c.id <> p_category_id)
      and pg_catalog.numrange(c.min_cash_usd, c.max_cash_usd, '[)')
          && pg_catalog.numrange(p_min_cash_usd, p_max_cash_usd, '[)')
  ) then raise exception 'Cash balance ranges cannot overlap'; end if;

  if p_category_id is null then
    insert into public.survey_categories (name, min_cash_usd, max_cash_usd)
      values (pg_catalog.btrim(p_name), p_min_cash_usd, p_max_cash_usd)
      returning id into saved_id;
  else
    update public.survey_categories
      set name = pg_catalog.btrim(p_name),
          min_cash_usd = p_min_cash_usd,
          max_cash_usd = p_max_cash_usd,
          updated_at = pg_catalog.now()
      where id = p_category_id
      returning id into saved_id;
    if not found then raise exception 'Survey category not found'; end if;
  end if;

  insert into public.admin_audit_log (actor_user_id, event_type, entity_type, entity_id, details)
    values (
      p_actor_id,
      case when p_category_id is null then 'survey_category_created' else 'survey_category_updated' end,
      'survey_category',
      saved_id::text,
      pg_catalog.jsonb_build_object('name', pg_catalog.btrim(p_name), 'minimum_usd', p_min_cash_usd, 'maximum_usd', p_max_cash_usd)
    );
  return saved_id;
end;
$$;

revoke all on function public.save_cash_survey_category(uuid, uuid, text, numeric, numeric)
  from public, anon, authenticated;
grant execute on function public.save_cash_survey_category(uuid, uuid, text, numeric, numeric)
  to service_role;

create or replace function public.process_points_partner_reward(
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
  configured record;
  earned_today bigint;
  ads_today bigint;
  inserted_count integer;
begin
  if p_provider_event_id is null
    or pg_catalog.char_length(p_provider_event_id) not between 1 and 160
    or p_provider_transaction_id is null
    or pg_catalog.char_length(p_provider_transaction_id) not between 1 and 160
    or p_partner_name is null
    or pg_catalog.char_length(p_partner_name) not between 2 and 80 then
    raise exception 'Invalid partner event';
  end if;

  if exists (
    select 1 from public.points_ledger as l
    where l.provider_event_id = p_provider_event_id
      or (l.partner_name = p_partner_name and l.provider_transaction_id = p_provider_transaction_id)
  ) then return false; end if;

  select c.id, c.user_id, c.partner_name, c.points_reward, c.expires_at, c.completed_at
    into click_record from public.points_clicks as c
    where c.id = p_click_id for update of c;
  if not found or click_record.expires_at < pg_catalog.now() then
    raise exception 'Reward click is missing or expired';
  end if;
  if click_record.completed_at is not null then return false; end if;
  if pg_catalog.lower(click_record.partner_name) <> pg_catalog.lower(p_partner_name) then
    raise exception 'Partner does not match the tracked campaign';
  end if;

  select s.enabled, s.max_points_per_day, s.max_rewarded_ads_per_day
    into configured from public.points_settings as s where s.setting_key = 'global';
  if not found or not configured.enabled
    or configured.max_points_per_day <= 0
    or configured.max_rewarded_ads_per_day <= 0 then
    raise exception 'Points campaigns or daily limits are not configured';
  end if;

  perform 1 from public.profiles where id = click_record.user_id for update;
  select
    coalesce(sum(l.points_delta) filter (
      where l.points_delta > 0 and l.created_at >= pg_catalog.date_trunc('day', pg_catalog.now())
    ), 0),
    count(*) filter (
      where l.reason = 'campaign_reward' and l.created_at >= pg_catalog.date_trunc('day', pg_catalog.now())
    )
    into earned_today, ads_today
    from public.points_ledger as l where l.user_id = click_record.user_id;

  if configured.max_points_per_day > 0
    and earned_today + click_record.points_reward > configured.max_points_per_day then
    raise exception 'Daily points limit reached';
  end if;
  if configured.max_rewarded_ads_per_day > 0
    and ads_today >= configured.max_rewarded_ads_per_day then
    raise exception 'Daily rewarded activity limit reached';
  end if;

  insert into public.points_ledger (
    user_id, points_delta, reason, click_id, provider_event_id,
    provider_transaction_id, partner_name
  )
  values (
    click_record.user_id, click_record.points_reward, 'campaign_reward',
    click_record.id, p_provider_event_id, p_provider_transaction_id,
    click_record.partner_name
  )
  on conflict do nothing;
  get diagnostics inserted_count = row_count;
  if inserted_count = 0 then return false; end if;

  update public.points_clicks set completed_at = pg_catalog.now() where id = click_record.id;
  return true;
end;
$$;

revoke all on function public.process_points_partner_reward(uuid, text, text, text)
  from public, anon, authenticated;
grant execute on function public.process_points_partner_reward(uuid, text, text, text)
  to service_role;

create or replace function public.review_survey_submission(
  p_actor_id uuid,
  p_submission_id uuid,
  p_decision text,
  p_note text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  response_record record;
begin
  if p_actor_id is null or p_decision not in ('approved', 'rejected')
    or pg_catalog.char_length(coalesce(p_note, '')) > 500 then
    raise exception 'Invalid survey review decision';
  end if;

  select r.id, r.user_id, r.survey_id, r.status, s.reward_usd, s.title
    into response_record
    from public.survey_submissions as r
    join public.surveys as s on s.id = r.survey_id
    where r.id = p_submission_id for update of r;
  if not found or response_record.status <> 'pending' then
    raise exception 'Submission is missing or already reviewed';
  end if;

  update public.survey_submissions
    set status = p_decision, reviewer_id = p_actor_id,
        reviewed_at = pg_catalog.now(), review_note = coalesce(p_note, '')
    where id = p_submission_id;
  if p_decision = 'approved' then
    insert into public.survey_cash_ledger (response_id, user_id, amount_usd)
      values (response_record.id, response_record.user_id, response_record.reward_usd);
  end if;

  insert into public.admin_audit_log (actor_user_id, event_type, entity_type, entity_id, details)
    values (
      p_actor_id,
      case when p_decision = 'approved' then 'survey_submission_approved' else 'survey_submission_rejected' end,
      'survey_submission',
      response_record.id::text,
      pg_catalog.jsonb_build_object('survey_id', response_record.survey_id, 'survey_title', response_record.title, 'note', coalesce(p_note, ''))
    );
end;
$$;

revoke all on function public.review_survey_submission(uuid, uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.review_survey_submission(uuid, uuid, text, text)
  to service_role;

create or replace function public.save_points_settings(
  p_actor_id uuid,
  p_enabled boolean,
  p_max_points_per_day integer,
  p_max_rewarded_ads_per_day integer,
  p_survey_unlock_points integer,
  p_survey_access_hours integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_actor_id is null or p_max_points_per_day <= 0
    or p_max_rewarded_ads_per_day <= 0
    or p_survey_unlock_points <= 0 or p_survey_access_hours <= 0 then
    raise exception 'All point limits and survey access settings must be positive';
  end if;

  insert into public.points_settings (
    setting_key, enabled, max_points_per_day, max_rewarded_ads_per_day,
    survey_unlock_points, survey_access_hours, updated_at
  )
  values (
    'global', p_enabled, p_max_points_per_day, p_max_rewarded_ads_per_day,
    p_survey_unlock_points, p_survey_access_hours, pg_catalog.now()
  )
  on conflict (setting_key) do update
    set enabled = excluded.enabled,
        max_points_per_day = excluded.max_points_per_day,
        max_rewarded_ads_per_day = excluded.max_rewarded_ads_per_day,
        survey_unlock_points = excluded.survey_unlock_points,
        survey_access_hours = excluded.survey_access_hours,
        updated_at = excluded.updated_at;

  insert into public.admin_audit_log (actor_user_id, event_type, entity_type, entity_id, details)
    values (
      p_actor_id, 'points_settings_updated', 'points_settings', 'global',
      pg_catalog.jsonb_build_object(
        'enabled', p_enabled,
        'max_points_per_day', p_max_points_per_day,
        'max_rewarded_ads_per_day', p_max_rewarded_ads_per_day,
        'survey_unlock_points', p_survey_unlock_points,
        'survey_access_hours', p_survey_access_hours
      )
    );
end;
$$;

revoke all on function public.save_points_settings(uuid, boolean, integer, integer, integer, integer)
  from public, anon, authenticated;
grant execute on function public.save_points_settings(uuid, boolean, integer, integer, integer, integer)
  to service_role;

create or replace function public.save_points_campaign(
  p_actor_id uuid,
  p_campaign_id uuid,
  p_partner_name text,
  p_title text,
  p_description text,
  p_destination_url text,
  p_tracking_parameter text,
  p_points_reward integer,
  p_allowed_countries text[],
  p_is_active boolean
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  saved_id uuid;
begin
  if p_actor_id is null
    or pg_catalog.char_length(pg_catalog.btrim(p_partner_name)) not between 2 and 80
    or pg_catalog.char_length(pg_catalog.btrim(p_title)) not between 3 and 120
    or pg_catalog.char_length(coalesce(p_description, '')) > 500
    or p_destination_url !~ '^https://'
    or p_tracking_parameter !~ '^[A-Za-z][A-Za-z0-9_]{0,39}$'
    or p_points_reward <= 0 or p_allowed_countries is null
    or array_position(p_allowed_countries, null) is not null then
    raise exception 'Invalid points campaign';
  end if;
  if p_is_active and not exists (
    select 1 from public.points_settings
    where setting_key = 'global' and enabled
  ) then raise exception 'Enable and configure points settings before activating campaigns'; end if;

  if p_campaign_id is null then
    insert into public.points_campaigns (
      partner_name, title, description, destination_url, tracking_parameter,
      points_reward, allowed_countries, is_active
    )
    values (
      pg_catalog.btrim(p_partner_name), pg_catalog.btrim(p_title), coalesce(p_description, ''),
      p_destination_url, p_tracking_parameter, p_points_reward, p_allowed_countries, p_is_active
    )
    returning id into saved_id;
  else
    update public.points_campaigns set
      partner_name = pg_catalog.btrim(p_partner_name),
      title = pg_catalog.btrim(p_title),
      description = coalesce(p_description, ''),
      destination_url = p_destination_url,
      tracking_parameter = p_tracking_parameter,
      points_reward = p_points_reward,
      allowed_countries = p_allowed_countries,
      is_active = p_is_active,
      updated_at = pg_catalog.now()
    where id = p_campaign_id
    returning id into saved_id;
    if not found then raise exception 'Points campaign not found'; end if;
  end if;

  insert into public.admin_audit_log (actor_user_id, event_type, entity_type, entity_id, details)
    values (
      p_actor_id,
      case when p_campaign_id is null then 'points_campaign_created' else 'points_campaign_updated' end,
      'points_campaign',
      saved_id::text,
      pg_catalog.jsonb_build_object(
        'partner_name', p_partner_name,
        'title', p_title,
        'points_reward', p_points_reward,
        'allowed_countries', p_allowed_countries,
        'is_active', p_is_active
      )
    );
  return saved_id;
end;
$$;

revoke all on function public.save_points_campaign(uuid, uuid, text, text, text, text, text, integer, text[], boolean)
  from public, anon, authenticated;
grant execute on function public.save_points_campaign(uuid, uuid, text, text, text, text, text, integer, text[], boolean)
  to service_role;

create or replace function public.save_admin_survey(
  p_actor_id uuid,
  p_survey_id uuid,
  p_category_id uuid,
  p_title text,
  p_description text,
  p_questions jsonb,
  p_reward_usd numeric,
  p_is_published boolean
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  saved_id uuid;
begin
  if p_actor_id is null
    or pg_catalog.char_length(pg_catalog.btrim(p_title)) not between 3 and 120
    or pg_catalog.char_length(coalesce(p_description, '')) > 1000
    or p_questions is null or pg_catalog.jsonb_typeof(p_questions) <> 'array'
    or pg_catalog.jsonb_array_length(p_questions) not between 1 and 30
    or p_reward_usd is null or p_reward_usd <= 0
    or exists (
      select 1 from pg_catalog.jsonb_array_elements(p_questions) as q(value)
      where pg_catalog.jsonb_typeof(q.value) <> 'string'
        or pg_catalog.char_length(pg_catalog.btrim(q.value #>> '{}')) not between 3 and 500
    ) then raise exception 'Invalid survey'; end if;

  if p_survey_id is null then
    insert into public.surveys (
      category_id, title, description, questions, reward_usd,
      is_published, created_by, updated_by
    )
    values (
      p_category_id, pg_catalog.btrim(p_title), coalesce(p_description, ''),
      p_questions, p_reward_usd, p_is_published, p_actor_id, p_actor_id
    )
    returning id into saved_id;
  else
    update public.surveys set
      category_id = p_category_id,
      title = pg_catalog.btrim(p_title),
      description = coalesce(p_description, ''),
      questions = p_questions,
      reward_usd = p_reward_usd,
      is_published = p_is_published,
      updated_by = p_actor_id,
      updated_at = pg_catalog.now()
    where id = p_survey_id
    returning id into saved_id;
    if not found then raise exception 'Survey not found'; end if;
  end if;

  insert into public.admin_audit_log (actor_user_id, event_type, entity_type, entity_id, details)
    values (
      p_actor_id,
      case when p_survey_id is null then 'survey_created' else 'survey_updated' end,
      'survey',
      saved_id::text,
      pg_catalog.jsonb_build_object(
        'title', p_title,
        'category_id', p_category_id,
        'reward_usd', p_reward_usd,
        'is_published', p_is_published
      )
    );
  return saved_id;
end;
$$;

revoke all on function public.save_admin_survey(uuid, uuid, uuid, text, text, jsonb, numeric, boolean)
  from public, anon, authenticated;
grant execute on function public.save_admin_survey(uuid, uuid, uuid, text, text, jsonb, numeric, boolean)
  to service_role;

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
      coalesce((
        select sum(case when l.status = 'approved' then l.amount_usd else -l.amount_usd end)
        from public.reward_ledger as l where l.user_id = requested.user_id
      ), 0) + coalesce((
        select sum(s.amount_usd)
        from public.survey_cash_ledger as s where s.user_id = requested.user_id
      ), 0)
    from pg_catalog.unnest(p_user_ids) as requested(user_id);
end;
$$;

revoke all on function public.get_reward_totals_for_users(uuid[])
  from public, anon, authenticated;
grant execute on function public.get_reward_totals_for_users(uuid[])
  to service_role;

create or replace function public.get_my_reward_summary()
returns table (approved_usd numeric, reversed_usd numeric, completed_tasks bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select
    coalesce(sum(l.amount_usd) filter (where l.status = 'approved'), 0)
      - coalesce(sum(l.amount_usd) filter (where l.status = 'reversed'), 0)
      + coalesce((
        select sum(s.amount_usd)
        from public.survey_cash_ledger as s
        where s.user_id = (select auth.uid())
      ), 0),
    coalesce(sum(l.amount_usd) filter (where l.status = 'reversed'), 0),
    count(*) filter (where l.status = 'approved')
  from public.reward_ledger as l
  where l.user_id = (select auth.uid());
$$;

revoke all on function public.get_my_reward_summary() from public, anon;
grant execute on function public.get_my_reward_summary() to authenticated;
