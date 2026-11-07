create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  referral_code text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
  referred_by uuid references public.profiles (id) on delete set null,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  constraint profiles_not_self_referred check (referred_by is null or referred_by <> id)
);

insert into public.profiles (id, display_name)
select
  users.id,
  left(coalesce(users.raw_user_meta_data ->> 'display_name', ''), 40)
from auth.users users
on conflict (id) do nothing;

alter table public.profiles enable row level security;

revoke all on public.profiles from anon, authenticated;
grant select (id, display_name, referral_code, referred_by, is_admin, created_at)
  on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;

create policy "Users can read their own profile"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

create policy "Users can update their own display name"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_referrer uuid;
begin
  if new.raw_user_meta_data ->> 'referral_code' is not null then
    select id into selected_referrer
    from public.profiles
    where referral_code = upper(new.raw_user_meta_data ->> 'referral_code')
      and id <> new.id;
  end if;

  insert into public.profiles (id, display_name, referred_by)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'display_name', ''), 40),
    selected_referrer
  );

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.get_referral_summary()
returns table (invited bigint, confirmed bigint, pending bigint)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  return query
    select count(*)::bigint,
      count(*) filter (where users.email_confirmed_at is not null)::bigint,
      count(*) filter (where users.email_confirmed_at is null)::bigint
    from public.profiles referrals
    join auth.users users on users.id = referrals.id
    where referrals.referred_by = auth.uid();
end;
$$;

revoke all on function public.get_referral_summary() from public, anon;
grant execute on function public.get_referral_summary() to authenticated;

create or replace function public.admin_registered_user_count()
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  user_count bigint;
begin
  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and is_admin = true
  ) then
    raise exception 'Admin access required';
  end if;

  select count(*)::bigint into user_count from public.profiles;
  return user_count;
end;
$$;

revoke all on function public.admin_registered_user_count() from public, anon;
grant execute on function public.admin_registered_user_count() to authenticated;

comment on column public.profiles.is_admin is
  'Set only by a trusted project owner through the Supabase SQL editor or service role.';
