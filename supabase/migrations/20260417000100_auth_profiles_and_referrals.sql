create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text not null check (char_length(first_name) between 1 and 80),
  last_name text not null check (char_length(last_name) between 1 and 80),
  username text not null check (username ~ '^[A-Za-z0-9_]{3,30}$'),
  email text not null,
  country text not null,
  country_iso_code text not null check (country_iso_code ~ '^[A-Z]{2}$'),
  country_dial_code text not null check (country_dial_code ~ '^\+[1-9][0-9]{0,3}$'),
  phone_number text not null,
  phone_number_e164 text not null check (phone_number_e164 ~ '^\+[1-9][0-9]{6,14}$'),
  referral_code text not null unique,
  referred_by_user_id uuid references public.profiles (id) on delete set null,
  email_confirmed_at timestamptz,
  account_status text not null default 'active'
    check (account_status in ('active', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (id is distinct from referred_by_user_id)
);

create unique index if not exists profiles_username_lower_unique
  on public.profiles (lower(username));
create unique index if not exists profiles_email_lower_unique
  on public.profiles (lower(email));
create unique index if not exists profiles_phone_e164_unique
  on public.profiles (phone_number_e164);
create index if not exists profiles_referred_by_user_id_idx
  on public.profiles (referred_by_user_id);

alter table public.profiles enable row level security;
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (first_name, last_name) on public.profiles to authenticated;
grant select on public.profiles to service_role;

drop policy if exists "Members can read their own profile" on public.profiles;
create policy "Members can read their own profile"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "Members can update their own profile" on public.profiles;
create policy "Members can update their own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create or replace function public.protect_profile_identity()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('postgres', 'service_role') then
    new.updated_at = now();
    return new;
  end if;

  if new.id is distinct from old.id
    or new.username is distinct from old.username
    or new.country is distinct from old.country
    or new.country_iso_code is distinct from old.country_iso_code
    or new.country_dial_code is distinct from old.country_dial_code
    or new.phone_number is distinct from old.phone_number
    or new.phone_number_e164 is distinct from old.phone_number_e164
    or new.referral_code is distinct from old.referral_code
    or new.referred_by_user_id is distinct from old.referred_by_user_id
    or new.account_status is distinct from old.account_status
    or new.created_at is distinct from old.created_at then
    raise exception 'Profile identity and referral attribution are immutable';
  end if;

  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists protect_profile_identity on public.profiles;
create trigger protect_profile_identity
  before update on public.profiles
  for each row execute function public.protect_profile_identity();

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_username text := lower(btrim(new.raw_user_meta_data ->> 'username'));
  new_first_name text := btrim(new.raw_user_meta_data ->> 'first_name');
  new_last_name text := btrim(new.raw_user_meta_data ->> 'last_name');
  new_phone_e164 text := btrim(new.raw_user_meta_data ->> 'phone_number_e164');
  new_country_iso text := upper(btrim(new.raw_user_meta_data ->> 'country_iso_code'));
  referral_reference text := nullif(btrim(new.raw_user_meta_data ->> 'referral_reference'), '');
  referrer_id uuid;
  generated_referral_code text;
begin
  if new.email is null
    or coalesce(new_username, '') !~ '^[a-z0-9_]{3,30}$'
    or coalesce(new_first_name, '') !~ '^[[:alpha:]]+([[:space:]''-][[:alpha:]]+)*$'
    or coalesce(new_last_name, '') !~ '^[[:alpha:]]+([[:space:]''-][[:alpha:]]+)*$'
    or coalesce(new_phone_e164, '') !~ '^\+[1-9][0-9]{6,14}$'
    or coalesce(new_country_iso, '') !~ '^[A-Z]{2}$' then
    raise exception 'Invalid profile registration data';
  end if;

  if referral_reference is not null then
    select p.id
      into referrer_id
      from public.profiles as p
      where lower(p.referral_code) = lower(referral_reference)
         or lower(p.username) = lower(referral_reference)
      order by (lower(p.referral_code) = lower(referral_reference)) desc
      limit 1;

    if referrer_id is null
      or referrer_id = new.id
      or exists (
        select 1
        from public.profiles as referrer
        where referrer.id = referrer_id
          and (
            lower(referrer.email) = lower(new.email)
            or referrer.phone_number_e164 = new_phone_e164
          )
      ) then
      raise exception 'Invalid referral attribution';
    end if;
  end if;

  loop
    generated_referral_code :=
      'GR' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 20));
    exit when not exists (
      select 1 from public.profiles where referral_code = generated_referral_code
    );
  end loop;

  insert into public.profiles (
    id,
    first_name,
    last_name,
    username,
    email,
    country,
    country_iso_code,
    country_dial_code,
    phone_number,
    phone_number_e164,
    referral_code,
    referred_by_user_id,
    email_confirmed_at
  )
  values (
    new.id,
    new_first_name,
    new_last_name,
    new_username,
    lower(new.email),
    btrim(new.raw_user_meta_data ->> 'country'),
    new_country_iso,
    btrim(new.raw_user_meta_data ->> 'country_dial_code'),
    btrim(new.raw_user_meta_data ->> 'phone_number'),
    new_phone_e164,
    generated_referral_code,
    referrer_id,
    new.email_confirmed_at
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

create or replace function public.sync_auth_user_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
    set email = lower(new.email),
        email_confirmed_at = new.email_confirmed_at,
        updated_at = now()
    where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
  after update of email, email_confirmed_at on auth.users
  for each row execute function public.sync_auth_user_profile();

create or replace function public.is_username_available(requested_username text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select requested_username ~ '^[A-Za-z0-9_]{3,30}$'
    and not exists (
      select 1
      from public.profiles as p
      where lower(p.username) = lower(requested_username)
    );
$$;

create or replace function public.resolve_referral(referral_reference text)
returns table (username text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.username
  from public.profiles as p
  where lower(p.referral_code) = lower(btrim(referral_reference))
     or lower(p.username) = lower(btrim(referral_reference))
  order by (lower(p.referral_code) = lower(btrim(referral_reference))) desc
  limit 1;
$$;

create or replace function public.get_referral_summary()
returns table (
  total_invited bigint,
  successful_referrals bigint,
  pending_referrals bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    count(*) as total_invited,
    count(*) filter (where p.email_confirmed_at is not null) as successful_referrals,
    count(*) filter (where p.email_confirmed_at is null) as pending_referrals
  from public.profiles as p
  where p.referred_by_user_id = (select auth.uid());
$$;

create or replace function public.get_referral_history()
returns table (
  username text,
  created_at timestamptz,
  email_confirmed boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    p.username,
    p.created_at,
    p.email_confirmed_at is not null as email_confirmed
  from public.profiles as p
  where p.referred_by_user_id = (select auth.uid())
  order by p.created_at desc
  limit 100;
$$;

revoke all on function public.protect_profile_identity() from public, anon, authenticated;
revoke all on function public.handle_new_auth_user() from public, anon, authenticated;
revoke all on function public.sync_auth_user_profile() from public, anon, authenticated;
revoke all on function public.is_username_available(text) from public;
revoke all on function public.resolve_referral(text) from public;
revoke all on function public.get_referral_summary() from public;
revoke all on function public.get_referral_history() from public;
grant execute on function public.is_username_available(text) to anon, authenticated;
grant execute on function public.resolve_referral(text) to anon, authenticated;
grant execute on function public.get_referral_summary() to authenticated;
grant execute on function public.get_referral_history() to authenticated;
