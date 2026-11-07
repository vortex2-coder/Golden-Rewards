# Golden Rewards

Golden Rewards is a responsive, dark account and advertising application built with Next.js, TypeScript, and Supabase. Its five user navigation destinations are Home, Earn, Team, Wallet, and Me. A separate `/admin` route is protected by a database-verified admin role.

**Live website:** [golden-rewards.vercel.app](https://golden-rewards.vercel.app/)

The GitHub Pages project URL redirects to the live Vercel application. GitHub Pages cannot run the Next.js server features required for authentication and account actions.

## Run locally

```bash
Copy `.env.example` to `.env.local`, configure the Supabase URL and anon key, and apply the SQL migrations in `supabase/migrations` in filename order. Then run:

```bash
npm install
npm run dev
```

The fixed five-item bottom navigation links to Home, Earn, Team, Wallet, and Me. Privacy, Terms, and Contact are linked from Me.

## Advertising and rewards

The Earn page supports standard Google AdSense display placements when configured with an approved publisher client and slot. AdSense selects and serves the ads; publishers do not upload individual ads. Configure `NEXT_PUBLIC_ADSENSE_ENABLED=true`, `NEXT_PUBLIC_ADSENSE_CLIENT_ID`, and `NEXT_PUBLIC_ADSENSE_SLOT_ID` only after approval and required consent/privacy setup.

**Standard AdSense views and clicks cannot be rewarded.** This project deliberately has no watch-ad reward, crediting, balance, or withdrawal flow. An approved, separate rewarded-ad provider with server-verified completion callbacks would be required before adding any incentivized activity.

Supabase Auth supports account registration and sign-in. The profile migration generates unique referral codes and records signup attribution. Referral activity is not paid. `/admin` displays the registered profile count only to users whose `profiles.is_admin` value is set by a trusted project owner. It does not claim to measure currently online users.

The referral history migration adds an authenticated, read-only summary of each user's referred signups without exposing their invitees' email addresses. The Me page allows signed-in users to update their profile name and change their password after verifying the current password.

## Admin setup

After creating and email-verifying the intended administrator account, run this statement in the Supabase SQL editor using that account’s UUID from Authentication → Users:

```sql
update public.profiles
set is_admin = true
where id = 'YOUR-ADMIN-USER-UUID';
```

The admin count is returned by a `SECURITY DEFINER` RPC that checks the caller’s database role. Do not expose a Supabase service-role key to the browser.

## Before launch

- Replace the pre-launch legal/contact drafts with accurate operator, jurisdiction, retention, hosting, and data-processing details.
- Configure and verify Supabase email confirmation, password reset, redirect URLs, and project security settings.
- Deploy to a domain you control and configure HTTPS.
- Enable AdSense only after site approval and the required consent-management setup for your users’ locations.
- Do not reward standard AdSense ad views or clicks. Do not present ad activity as earnings.
