import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of use",
  description:
    "Draft terms for using Golden Rewards.",
};

export default function TermsPage() {
  return (
    <main className="public-page legal-page">
      <header className="public-page__heading">
        <span className="eyebrow">TERMS</span>
        <h1>Terms of use</h1>
        <p>Pre-launch draft — complete and review these terms before publishing.</p>
      </header>
      <aside className="legal-draft">
        <strong>Owner action required</strong>
        <p>
          Confirm the operator’s legal name, contact details, applicable
          jurisdiction, and any local consumer-protection requirements. This
          draft is not legal advice.
        </p>
      </aside>
      <div className="guide-prose">
        <section>
          <h2>Accounts and referrals</h2>
          <p>
            Account registration requires a verified email address and
            accurate profile information. Keep your password confidential and
            notify the operator if you believe your account has been
            compromised. Referral invitations are recorded for attribution;
            no referral reward is payable unless the operator publishes
            qualifying rules.
          </p>
        </section>
        <section>
          <h2>Advertising and rewards</h2>
          <p>
            Golden Rewards may display standard Google AdSense advertisements.
            Users must not be paid, rewarded, or otherwise incentivized to
            view, click, or interact with standard publisher ads. Ad views
            and clicks do not create an account balance or payment claim.
            The project does not currently operate a funded earnings ledger,
            withdrawal service, or referral reward program.
          </p>
        </section>
        <section>
          <h2>Changes and contact</h2>
          <p>
            The operator should publish how these terms may change and how
            users can contact them. A working contact address and final
            jurisdiction-specific terms are not yet configured.
          </p>
        </section>
      </div>
    </main>
  );
}
