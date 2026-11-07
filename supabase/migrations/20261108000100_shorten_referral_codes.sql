create table if not exists public.referral_code_aliases (
  code text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create unique index if not exists referral_code_aliases_code_lower_unique
  on public.referral_code_aliases (lower(code));

alter table public.referral_code_aliases enable row level security;
revoke all on public.referral_code_aliases from public, anon, authenticated;

insert into public.referral_code_aliases (code, user_id)
select p.referral_code, p.id
from public.profiles as p
on conflict do nothing;

create or replace function public.generate_referral_code()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  alphabet constant text := '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  value bigint;
  candidate_code text;
  i integer;
  random_uuid uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended('public.profiles.referral_code', 0));

  loop
    random_uuid := gen_random_uuid();
    value := (
      get_byte(uuid_send(random_uuid), 0)::bigint * 1099511627776
      + get_byte(uuid_send(random_uuid), 1)::bigint * 4294967296
      + get_byte(uuid_send(random_uuid), 2)::bigint * 16777216
      + get_byte(uuid_send(random_uuid), 3)::bigint * 65536
      + get_byte(uuid_send(random_uuid), 4)::bigint * 256
      + get_byte(uuid_send(random_uuid), 5)::bigint
    ) % 60466176;
    candidate_code := '';

    for i in 1..5 loop
      candidate_code := substr(alphabet, (value % 36)::integer + 1, 1) || candidate_code;
      value := value / 36;
    end loop;

    exit when not exists (
      select 1
      from public.profiles as p
      where lower(p.referral_code) = lower(candidate_code)
    ) and not exists (
      select 1
      from public.referral_code_aliases as a
      where lower(a.code) = lower(candidate_code)
    );
  end loop;

  return candidate_code;
end;
$$;

revoke all on function public.generate_referral_code() from public, anon, authenticated;

do $$
declare
  profile_id uuid;
begin
  for profile_id in select id from public.profiles order by created_at, id loop
    update public.profiles
      set referral_code = public.generate_referral_code()
      where id = profile_id;
  end loop;
end;
$$;

alter table public.profiles
  drop constraint if exists profiles_referral_code_format;

alter table public.profiles
  add constraint profiles_referral_code_format
  check (referral_code ~ '^[A-Z0-9]{5}$') not valid;

alter table public.profiles
  validate constraint profiles_referral_code_format;

create unique index if not exists profiles_referral_code_lower_unique
  on public.profiles (lower(referral_code));

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
      left join public.referral_code_aliases as a
        on a.user_id = p.id
        and lower(a.code) = lower(referral_reference)
      where lower(p.referral_code) = lower(referral_reference)
         or lower(p.username) = lower(referral_reference)
         or a.user_id is not null
      order by
        (lower(p.referral_code) = lower(referral_reference)) desc,
        (a.user_id is not null) desc
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

  generated_referral_code := public.generate_referral_code();

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

create or replace function public.resolve_referral(referral_reference text)
returns table (username text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.username
  from public.profiles as p
  left join public.referral_code_aliases as a
    on a.user_id = p.id
    and lower(a.code) = lower(btrim(referral_reference))
  where lower(p.referral_code) = lower(btrim(referral_reference))
     or lower(p.username) = lower(btrim(referral_reference))
     or a.user_id is not null
  order by
    (lower(p.referral_code) = lower(btrim(referral_reference))) desc,
    (a.user_id is not null) desc
  limit 1;
$$;

revoke all on function public.resolve_referral(text) from public;
grant execute on function public.resolve_referral(text) to anon, authenticated;
