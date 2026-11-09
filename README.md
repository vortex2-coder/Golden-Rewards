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
4. Run every SQL migration in `supabase/migrations/` in filename order in the Supabase SQL Editor. Apply `20261109000200_referral_welcome_credits.sql` after the referral-rewards migration to enable and display both referral credits.
5. In Supabase Auth URL Configuration, set the site URL and allow the local and production callback URLs ending in `/auth/callback`.
6. Email confirmation is disabled for this deployment at the owner's request. Custom SMTP is configured in Supabase Auth using Gmail SMTP (`smtp.gmail.com`, port `587`). Gmail personal accounts are not designed for transactional email, may have delivery/rate limits, and Supabase warns that deliverability may be impacted.
7. Add the same public and server-only environment variables to the production hosting environment and redeploy.

## Admin area

The private `/admin` area uses the existing Supabase account login; it has no separate password or default credentials. An administrator is identified by the server-managed Supabase Auth `app_metadata.role = admin` claim. The owner account `fidelsteven2@gmail.com` has this role in the configured Supabase project. Only grant this role using a trusted Supabase server-side admin operation; never accept role changes from user-editable metadata or browser input. Sign in at `/login`; administrator sign-ins are redirected to `/admin`, while ordinary members go to `/`. The admin area checks the authenticated account on the server and returns not found to other users. It provides three sections: Home, Users, and Ad Configuration. The user list is paginated. Do not expose the Supabase secret key or use a shared password.

The admin home shows the total number of registered profiles and recent signups using the server-side Supabase service key. In Ad Configuration, the admin can set one standard Google AdSense display unit for the Earn page with its publisher ID and numeric ad slot ID. Apply the AdSense settings migration before using this feature. The AdSense publisher script is emitted directly in the root document head; keep its publisher ID aligned with the AdSense account and complete site verification in AdSense after deploying. AdSense IDs are public identifiers, not secrets. Ads stay disabled until explicitly enabled in the admin form. Rewarded views, clicks, or interactions are not allowed; configure the approved consent setup before enabling ads. Referral credits are recorded automatically; the admin area does not manage referral rewards or withdrawals.

The migrations create the profile table, case-insensitive username and email uniqueness rules, E.164 phone uniqueness, immutable referral attribution, account status, profile RLS, and narrowly scoped referral/username RPCs. The follow-up grant allows the server-side service-role client to read profiles for username-to-email login resolution and duplicate phone checks. The short-referral-code migration changes each member's code to five uppercase letters/digits and retains the prior code as a private lookup alias so previously shared links continue working. Referral lookups return only a username; referral history does not expose email addresses or phone numbers.

The signup flow validates names, username, email, country/phone number, optional referral, password confirmation, and terms acceptance on the server. Phone validation uses the full ISO country-name dataset and libphonenumber-js; phone numbers are stored in E.164 format. The database trigger generates each member's unique referral code and resolves the submitted invitation reference to the referrer's user ID. Email addresses are not verified during registration.

Referral counts represent successfully registered accounts only; unfinished signup attempts are not stored as pending referrals. After a successful referral registration, both the new member and their inviter receive a one-time $10.00 USD credit recorded in their cash wallets. Wallet withdrawals are not enabled until a payout provider is connected.

## Verification limitations

Local lint and production-build checks pass, all profile/referral migrations and the service-role profile-read grant have been applied to the configured Supabase project, and the public username/referral endpoints have been smoke-tested. Custom SMTP settings are saved in Supabase; successful delivery has not yet been confirmed with a test email. Actual signup, username/email login, phone uniqueness, referrals, password recovery, suspension, and RLS behavior have not yet been end-to-end tested. Email confirmation is disabled. Do not treat local build checks as live database verification.

## Advertising and rewards

Standard AdSense views and clicks cannot be rewarded. The Earn page does not credit AdSense activity. Partner-task rewards require partner verification. Referral registrations credit both the new member and inviter $10.00 USD each after successful account creation; withdrawals are not enabled until a payout service is connected.

## Before launch

- Before launch, publish the operator's legal name and working support/privacy contact, confirm the actual data-retention and consent arrangements, and have the terms and privacy disclosures reviewed for the countries served.
- Email confirmation remains disabled by product-owner choice. Enable it only if the product owner changes that decision.
- Add an approved consent-management setup before enabling AdSense.
- Do not reward standard AdSense ad views or clicks.
