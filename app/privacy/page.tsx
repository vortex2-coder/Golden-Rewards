import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy policy",
  description:
    "Privacy information and pre-launch items to confirm for Golden Rewards.",
};

export default function PrivacyPage() {
  return (
    <main className="public-page legal-page">
      <header className="public-page__heading">
        <span className="eyebrow">PRIVACY</span>
        <h1>Privacy policy</h1>
        <p>Pre-launch draft — complete and verify this policy before publishing.</p>
      </header>
      <aside className="legal-draft">
        <strong>Owner action required</strong>
        <p>
          Add the site operator’s name and contact details, hosting provider,
          actual data-retention practices, applicable jurisdiction, consent
          platform, and data-processing vendors before this becomes a final
          policy.
        </p>
      </aside>
      <div className="guide-prose">
        <section>
          <h2>Account information</h2>
          <p>
            When registration is enabled, Golden Rewards processes the name,
            username, email address, country, phone number, password
            credentials, verification status, and referral attribution needed
            to create and secure an account. Passwords are handled by the
            authentication provider and are not stored as plain text by this
            application. Profile access is restricted by account-level
            database policies. The operator must confirm its retention,
            deletion, and data-request procedures before launch.
          </p>
        </section>
        <section>
          <h2>Technical information</h2>
          <p>
            The hosting provider may process technical request information
            needed to deliver and secure the website. Confirm the selected
            host’s logs, purposes, and retention periods and describe them
            accurately here before launch.
          </p>
        </section>
        <section>
          <h2>Cookies and advertising</h2>
          <p>
            Golden Rewards may load standard Google AdSense advertisements
            when an approved publisher account, ad placement, and required
            consent setup are configured. Google and third-party vendors may
            use cookies or similar technologies for advertising, including
            personalized ads where permitted. Do not enable ad delivery until
            the correct consent messaging and privacy choices are in place
            for the site’s users and locations.
          </p>
          <p>
            Google’s current information about advertising cookies and
            publisher privacy disclosures is available in its{" "}
            <a href="https://support.google.com/adsense/answer/1348695?hl=en" target="_blank" rel="noreferrer">
              AdSense required content guidance
            </a>
            . Users can review Google’s{" "}
            <a href="https://www.google.com/settings/ads" target="_blank" rel="noreferrer">
              Ads Settings
            </a>{" "}
            and the{" "}
            <a href="https://www.aboutads.info/choices/" target="_blank" rel="noreferrer">
              industry opt-out page
            </a>
            .
          </p>
        </section>
        <section>
          <h2>Your choices and questions</h2>
          <p>
            Add the rights, choices, and contact process that apply to the
            site operator and the countries where the website is available.
            Publish a real contact address and retention schedule before
            inviting account registrations.
          </p>
        </section>
      </div>
    </main>
  );
}
