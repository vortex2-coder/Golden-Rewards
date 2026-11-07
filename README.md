# Golden Rewards

Golden Rewards is a responsive Next.js application with five member destinations: Home, Earn, Team, Wallet, and Me. It uses a premium dark-and-gold interface and Supabase Auth for account registration and sign-in.

## Run locally

```bash
npm install
npm run dev
```

Without Supabase environment variables, account forms display setup guidance and protected account pages remain unavailable. This repository does not include credentials for a Supabase project.

## Supabase setup

1. Create a Supabase project and copy `.env.example` to `.env.local`.
2. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SECRET_KEY` from the project. Set `NEXT_PUBLIC_SITE_URL` to the local or production site origin.
3. Keep `SUPABASE_SECRET_KEY` server-only. Never prefix it with `NEXT_PUBLIC_` or expose it in browser code.
4. Run the migrations in order in the Supabase SQL Editor: `supabase/migrations/20260417000100_auth_profiles_and_referrals.sql`, then `supabase/migrations/20260417000200_grant_service_role_profile_read.sql`.
5. In Supabase Auth URL Configuration, set the site URL and allow the local and production callback URLs ending in `/auth/callback`.
6. Configure email confirmation and password recovery email templates to redirect through `/auth/callback`. Verify the sender and delivery settings before inviting real users.
7. Add the same public and server-only environment variables to the production hosting environment and redeploy.

The migrations create the profile table, case-insensitive username and email uniqueness rules, E.164 phone uniqueness, immutable referral attribution, account status, profile RLS, and narrowly scoped referral/username RPCs. The follow-up grant allows the server-side service-role client to read profiles for username-to-email login resolution and duplicate phone checks. Referral lookups return only a username and referral code; referral history does not expose email addresses or phone numbers.

The signup flow validates names, username, email, country/phone number, optional referral, password confirmation, and terms acceptance on the server. Phone validation uses the full ISO country-name dataset and libphonenumber-js; phone numbers are stored in E.164 format. The database trigger generates each member's unique referral code and resolves the submitted invitation reference to the referrer's user ID. Email verification returns through the auth callback before the member can enter protected pages.

## Verification limitations

Local lint and production-build checks pass, and the base profile/referral migration has been applied to the configured Supabase project. The follow-up service-role grant still needs to be applied before username login and server-side duplicate-phone checks can work. Actual email delivery, signup, username/email login, phone uniqueness, referrals, password recovery, suspension, and RLS behavior have not yet been end-to-end tested. Do not treat local build checks as live database verification.

## Advertising and rewards

Standard AdSense views and clicks cannot be rewarded. The Earn page does not credit AdSense activity. A verified incentivized-ad partner, reward ledger, withdrawal service, and published referral qualification rules are not configured, so balances and referral earnings are not fabricated.

## Before launch

- Replace the pre-launch privacy and terms drafts with accurate operator, jurisdiction, retention, support, and data-processing details.
- Configure and verify Supabase Auth email templates, site URLs, sender settings, and production environment variables.
- Add an approved consent-management setup before enabling AdSense.
- Do not reward standard AdSense ad views or clicks.
