# Golden Rewards

Golden Rewards is a responsive, dark advertising information website built with Next.js and TypeScript. Its five user navigation destinations are Home, Earn, Team, Wallet, and Me.

**Live website:** [golden-rewards.vercel.app](https://golden-rewards.vercel.app/)

The GitHub Pages project URL redirects to the live Vercel application.

## Run locally

Install the dependencies and start the development server:

```bash
npm install
npm run dev
```

The fixed five-item bottom navigation links to Home, Earn, Team, Wallet, and Me. Privacy, Terms, and Contact are linked from Me. This project has no account authentication, database, referral tracking, or admin dashboard.

## Advertising and rewards

The Earn page supports standard Google AdSense display placements when configured with an approved publisher client and slot. AdSense selects and serves the ads; publishers do not upload individual ads. Configure `NEXT_PUBLIC_ADSENSE_ENABLED=true`, `NEXT_PUBLIC_ADSENSE_CLIENT_ID`, and `NEXT_PUBLIC_ADSENSE_SLOT_ID` only after approval and required consent/privacy setup.

**Standard AdSense views and clicks cannot be rewarded.** This project has no watch-ad reward, crediting, balance, withdrawal, or referral-tracking backend. Do not treat ad activity as earnings.

## Before launch

- Replace the pre-launch legal/contact drafts with accurate operator, jurisdiction, retention, hosting, and data-processing details.
- Deploy to a domain you control and configure HTTPS.
- Enable AdSense only after site approval and the required consent-management setup for your users’ locations.
- Do not reward standard AdSense ad views or clicks. Do not present ad activity as earnings.
