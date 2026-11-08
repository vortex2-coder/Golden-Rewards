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
4. Run the migrations in order in the Supabase SQL Editor: `supabase/migrations/20260417000100_auth_profiles_and_referrals.sql`, `supabase/migrations/20260417000200_grant_service_role_profile_read.sql`, then `supabase/migrations/20261108000100_shorten_referral_codes.sql`.
5. In Supabase Auth URL Configuration, set the site URL and allow the local and production callback URLs ending in `/auth/callback`.
6. Email confirmation is disabled for this deployment at the owner's request. Custom SMTP is configured in Supabase Auth using Gmail SMTP (`smtp.gmail.com`, port `587`). Gmail personal accounts are not designed for transactional email, may have delivery/rate limits, and Supabase warns that deliverability may be impacted.
7. Add the same public and server-only environment variables to the production hosting environment and redeploy.

## Admin overview

The private `/admin` route uses the existing Supabase account login; it has no separate password or default credentials. An administrator is identified by the server-managed Supabase Auth `app_metadata.role = admin` claim. Only grant this role using a trusted Supabase server-side admin operation; never accept role changes from user-editable metadata or browser input. The matching email must already have an active Golden Rewards account. Sign in at `/login`, then open `/admin`. The route checks the authenticated account on the server and returns not found to other users. Do not expose the Supabase secret key or use a shared password.

The current admin page is overview-only: it shows real profile counts and recent signups using the server-side Supabase service key. It does not manage accounts, rewards, or withdrawals; those functions are not configured.

The migrations create the profile table, case-insensitive username and email uniqueness rules, E.164 phone uniqueness, immutable referral attribution, account status, profile RLS, and narrowly scoped referral/username RPCs. The follow-up grant allows the server-side service-role client to read profiles for username-to-email login resolution and duplicate phone checks. The short-referral-code migration changes each member's code to five uppercase letters/digits and retains the prior code as a private lookup alias so previously shared links continue working. Referral lookups return only a username; referral history does not expose email addresses or phone numbers.

The signup flow validates names, username, email, country/phone number, optional referral, password confirmation, and terms acceptance on the server. Phone validation uses the full ISO country-name dataset and libphonenumber-js; phone numbers are stored in E.164 format. The database trigger generates each member's unique referral code and resolves the submitted invitation reference to the referrer's user ID. Email addresses are not verified during registration.

Referral counts represent registered accounts only. Because email confirmation is disabled, the app does not label referrals as email-verified; unfinished signup attempts are not stored as pending referrals.

## Verification limitations

Local lint and production-build checks pass, all profile/referral migrations and the service-role profile-read grant have been applied to the configured Supabase project, and the public username/referral endpoints have been smoke-tested. Custom SMTP settings are saved in Supabase; successful delivery has not yet been confirmed with a test email. Actual signup, username/email login, phone uniqueness, referrals, password recovery, suspension, and RLS behavior have not yet been end-to-end tested. Email confirmation is disabled. Do not treat local build checks as live database verification.

## Advertising and rewards

Standard AdSense views and clicks cannot be rewarded. The Earn page does not credit AdSense activity. A verified incentivized-ad partner, reward ledger, withdrawal service, and published referral qualification rules are not configured, so balances and referral earnings are not fabricated.

## Before launch

- Before launch, publish the operator's legal name and working support/privacy contact, confirm the actual data-retention and consent arrangements, and have the terms and privacy disclosures reviewed for the countries served.
- Email confirmation remains disabled by product-owner choice. Enable it only if the product owner changes that decision.
- Add an approved consent-management setup before enabling AdSense.
- Do not reward standard AdSense ad views or clicks.
