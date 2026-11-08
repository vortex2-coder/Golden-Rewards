import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Golden Rewards collects, uses and protects personal information.",
};

export default function PrivacyPage() {
  return (
    <main className="public-page legal-page">
      <header className="public-page__heading">
        <span className="eyebrow">PRIVACY</span>
        <h1>Privacy Policy</h1>
        <p>Effective 8 November 2026</p>
      </header>
      <aside className="legal-draft">
        <strong>Operator and privacy contact details are not yet published</strong>
        <p>
          The legal name of the site operator and a working privacy email
          address have not been provided. Check the <Link href="/contact">Contact page</Link>{" "}
          for the current contact status.
        </p>
      </aside>
      <div className="guide-prose">
        <section>
          <h2>1. About this policy</h2>
          <p>
            This policy explains how Golden Rewards handles personal
            information when you visit the site or create an account. It is
            intended to describe the current service and to reflect applicable
            privacy laws, including Kenya’s Data Protection Act, 2019, where
            applicable. The site operator is responsible for deciding how and
            why personal information is processed.
          </p>
        </section>
        <section>
          <h2>2. Information handled</h2>
          <ul>
            <li>
              <strong>Account details:</strong> first and last name, username,
              email address, country, phone number and account status.
            </li>
            <li>
              <strong>Sign-in and security:</strong> password credentials and
              authentication records handled by Supabase Auth. Your password
              is not stored in plain text by the Golden Rewards application.
              Account registration currently does not require email
              confirmation.
            </li>
            <li>
              <strong>Referral details:</strong> your referral code and, if
              used, the referral code or username associated with your
              registration. A member who referred you can see your username
              and registration date in referral history.
            </li>
            <li>
              <strong>Technical details:</strong> information such as IP
              address, browser or device details, and request or security logs
              may be processed by the hosting and authentication providers to
              deliver and protect the site.
            </li>
            <li>
              <strong>Cookies:</strong> necessary sign-in/session cookies and a
              preference cookie may be used for account access and site
              functionality.
            </li>
          </ul>
          <p>
            The site does not currently have a rewards ledger, withdrawal
            service, payment-method collection, or offer-completion tracking
            configured. It therefore does not currently record earnings or
            withdrawal transactions.
          </p>
        </section>
        <section>
          <h2>3. How information is used</h2>
          <p>Information may be used to:</p>
          <ul>
            <li>Create and manage accounts, sign users in, and support password recovery.</li>
            <li>Maintain profiles and record referral registrations.</li>
            <li>Protect the site, detect misuse and investigate security issues.</li>
            <li>Respond to support requests and comply with legal obligations.</li>
            <li>Maintain, troubleshoot and improve the service.</li>
          </ul>
          <p>
            Where applicable law requires a legal basis, processing may be
            necessary to provide the account services you request, meet a
            legal obligation, pursue legitimate security and service interests,
            or rely on consent where consent is required.
          </p>
        </section>
        <section>
          <h2>4. Service providers and advertising</h2>
          <p>
            Golden Rewards uses Supabase for authentication and database
            services and Vercel for website hosting. These providers process
            information as needed to provide their services. Account email
            addresses may also be processed by the configured email delivery
            provider when sending account or security messages.
          </p>
          <p>
            The site can load Google AdSense advertisements if the operator
            enables and configures them. If enabled, Google and its partners
            may receive technical information and use cookies or similar
            technologies for advertising, subject to their own privacy
            policies. Standard AdSense views and clicks are not rewards. The
            site does not currently have a consent-management tool connected;
            advertising should not be enabled until any consent requirements
            for the relevant users and locations are addressed.
          </p>
          <p>
            We do not sell personal information. We may disclose information
            to service providers, professional advisers, authorities where
            legally required, or a successor operator in a lawful business
            transfer.
          </p>
        </section>
        <section>
          <h2>5. International processing and retention</h2>
          <p>
            Our service providers may store or process information in
            countries outside your own. Where required, the operator should
            use safeguards required by applicable data-protection law for
            international transfers.
          </p>
          <p>
            Information is retained for as long as reasonably needed to
            provide and secure the account, keep referral and service records,
            handle disputes, and meet legal obligations. The operator has not
            published a fixed retention schedule. Information may be retained
            longer where law requires it or where it is needed to resolve a
            claim.
          </p>
        </section>
        <section>
          <h2>6. Security</h2>
          <p>
            The service uses provider security controls and database access
            policies intended to protect account information. No online
            service can guarantee complete security. Use a unique password
            and contact the operator if you suspect unauthorised access.
          </p>
        </section>
        <section>
          <h2>7. Your choices and rights</h2>
          <p>
            Depending on applicable law, you may be entitled to request
            information about processing, access or correction of your
            information, deletion or restriction, object to certain
            processing, request portability, withdraw consent, or complain to
            the relevant data-protection authority. We may need to verify your
            identity before responding. To make a request, use the{" "}
            <Link href="/contact">Contact page</Link>. A self-service account
            deletion feature is not currently available.
          </p>
        </section>
        <section>
          <h2>8. Children</h2>
          <p>
            Golden Rewards is intended for people aged 18 and over. The
            service is not designed for children, and anyone under 18 must not
            create an account. If the operator learns that an account belongs
            to a child, it may restrict the account and take appropriate steps
            regarding the information.
          </p>
        </section>
        <section>
          <h2>9. Changes and contact</h2>
          <p>
            This policy may be updated when the service or applicable
            requirements change. The latest version and effective date will
            appear on this page. For privacy questions or requests, use the{" "}
            <Link href="/contact">Contact page</Link>. A working privacy email
            address has not yet been published.
          </p>
        </section>
      </div>
    </main>
  );
}
