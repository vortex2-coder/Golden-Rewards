create or replace function public.get_referral_history()
returns table (joined_at timestamptz, email_confirmed boolean)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  return query
    select referrals.created_at, (users.email_confirmed_at is not null)
    from public.profiles referrals
    join auth.users users on users.id = referrals.id
    where referrals.referred_by = auth.uid()
    order by referrals.created_at desc;
end;
$$;

revoke all on function public.get_referral_history() from public, anon;
grant execute on function public.get_referral_history() to authenticated;
