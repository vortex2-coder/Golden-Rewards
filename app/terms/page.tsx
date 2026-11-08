import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms and Conditions",
  description: "Terms for using the Golden Rewards website and account services.",
};

export default function TermsPage() {
  return (
    <main className="public-page legal-page">
      <header className="public-page__heading">
        <span className="eyebrow">TERMS</span>
        <h1>Terms and Conditions</h1>
        <p>Effective 8 November 2026</p>
      </header>
      <aside className="legal-draft">
        <strong>Contact details are not yet published</strong>
        <p>
          The site operator has not provided a working support email or legal
          business name. See the <Link href="/contact">Contact page</Link> for
          the current contact status.
        </p>
      </aside>
      <div className="guide-prose">
        <section>
          <h2>1. About these terms</h2>
          <p>
            These Terms and Conditions apply when you visit or use Golden
            Rewards, including its account, referral, advertising and wallet
            pages. By creating an account or using the site, you agree to
            these terms. Do not use the site if you do not agree.
          </p>
        </section>
        <section>
          <h2>2. Eligibility and your account</h2>
          <ul>
            <li>You must be at least 18 years old to register or participate.</li>
            <li>
              Provide accurate, current information and update it if it changes.
              Each person may have one account unless the operator gives
              written permission otherwise.
            </li>
            <li>
              Keep your password and account access secure. You are responsible
              for activity through your account and should report suspected
              unauthorised access through the Contact page.
            </li>
            <li>
              The operator may take reasonable steps to check account or
              payment details where needed to protect the service or prevent
              abuse.
            </li>
          </ul>
        </section>
        <section>
          <h2>3. Activities and rewards</h2>
          <p>
            The site currently supports accounts and referral registration
            tracking. A rewards ledger, approved incentivised-ad partner,
            withdrawal service and referral payment rules are not configured.
            The site does not currently promise or pay earnings.
          </p>
          <p>
            Standard Google AdSense advertisements, if displayed, are not
            rewarded activities. Do not click or interact with ads to earn a
            reward. If eligible offers or campaigns are introduced later, the
            activity instructions, eligibility, reward amount and approval
            conditions will be shown before participation. A reward is not
            earned merely by starting an activity; it must be properly tracked
            and approved under its published rules.
          </p>
        </section>
        <section>
          <h2>4. Referrals</h2>
          <p>
            Your account may have a unique referral code and invitation link.
            The current referral feature records registrations attributed to
            that invitation; it does not currently pay referral earnings.
            Registration alone does not qualify for a reward unless qualifying
            rules are published on the site.
          </p>
          <p>
            Do not refer yourself, create duplicate or fake accounts, automate
            registrations, or otherwise manipulate referrals. The operator
            may disqualify invalid referrals and reverse rewards if a reward
            programme is introduced and abuse is established.
          </p>
        </section>
        <section>
          <h2>5. Wallet and withdrawals</h2>
          <p>
            The wallet and withdrawal service are not currently connected to a
            rewards ledger or payment provider. No balance shown as unavailable
            or unconfigured is a promise of payment. If withdrawals become
            available, the site will publish the supported methods, minimum
            amount, fees, verification requirements and expected processing
            information before you submit a request. Pending rewards, if
            introduced, may be adjusted when a provider rejects or reverses an
            activity.
          </p>
        </section>
        <section>
          <h2>6. Prohibited use and account action</h2>
          <p>You must not:</p>
          <ul>
            <li>Use bots, scripts or other automation to generate activity.</li>
            <li>Provide false information or impersonate another person.</li>
            <li>Exploit errors, interfere with site security, or access another account or private information.</li>
            <li>Manipulate referrals, advertising activity, rewards or payment records.</li>
            <li>Use the site for unlawful purposes or in breach of a campaign provider’s rules.</li>
          </ul>
          <p>
            The operator may review suspicious activity and temporarily limit
            access where reasonably necessary to protect users or the service.
            If a serious breach is confirmed, the operator may remove affected
            activity, suspend or close an account, and take lawful further
            action. Where reasonably possible and lawful, the operator will
            explain a restriction and how to contact them.
          </p>
        </section>
        <section>
          <h2>7. Third-party services and availability</h2>
          <p>
            The site relies on third-party services for hosting, account
            security and, if enabled, advertising. Those services may have
            separate terms and privacy policies. The operator does not control
            their availability, content, tracking or decisions.
          </p>
          <p>
            The site may be interrupted for maintenance, technical issues,
            network problems or third-party failures. Features, campaigns and
            these terms may change. Material changes will be posted on the site
            or communicated by another reasonable method. Changes will not
            remove rewards that have already been approved and become payable.
          </p>
        </section>
        <section>
          <h2>8. Liability</h2>
          <p>
            To the extent permitted by law, the operator is not liable for
            indirect or unforeseeable loss caused by temporary interruptions,
            third-party failures or misuse of the site. Nothing in these terms
            excludes a liability or consumer right that cannot legally be
            excluded or limited.
          </p>
        </section>
        <section>
          <h2>9. Privacy and complaints</h2>
          <p>
            Our <Link href="/privacy">Privacy Policy</Link> explains how
            personal information is handled. For a concern about your account,
            referral or the site, use the <Link href="/contact">Contact page</Link>.
            Include your username and relevant activity reference, but never
            send your password.
          </p>
        </section>
        <section>
          <h2>10. Governing law</h2>
          <p>
            These terms are intended to be governed by the laws of Kenya,
            subject to mandatory consumer protections and any other laws that
            apply to you. Your non-waivable rights under applicable law remain
            unaffected.
          </p>
        </section>
      </div>
    </main>
  );
}
