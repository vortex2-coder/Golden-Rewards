import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Me",
  description: "Golden Rewards profile, account settings, and support.",
};

export default function MePage() {
  return (
    <main className="app-page public-page me-page">
      <header className="public-page__heading">
        <span className="eyebrow">ME · ACCOUNT</span>
        <h1>Your profile.</h1>
        <p>This site does not provide personal accounts or profile storage.</p>
      </header>
      <section className="profile-panel">
        <div className="profile-avatar" aria-hidden="true">
          G
        </div>
        <div className="profile-panel__identity">
          <strong>Guest</strong>
          <span>Personal accounts are not available</span>
        </div>
        <span className="status-pill">Guest</span>
      </section>
      <section className="account-details">
        <div className="account-detail"><span>EMAIL ADDRESS</span><strong>Not collected</strong></div>
        <div className="account-detail"><span>ACCOUNT ID</span><strong>Not assigned</strong></div>
        <div className="account-detail"><span>ACCOUNT STATUS</span><strong>No account service</strong></div>
      </section>
      <section className="settings-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">PREFERENCES</span>
            <h2>Settings &amp; support</h2>
          </div>
        </div>
        <div className="settings-list">
          <div className="settings-row">
            <span><strong>Language</strong><small>English is currently the available language</small></span>
            <span className="settings-row__value">EN</span>
          </div>
          <div className="settings-row">
            <span><strong>Profile &amp; security</strong><small>Unavailable without an account service</small></span>
            <span className="settings-row__value">—</span>
          </div>
          <Link className="settings-row" href="/contact">
            <span><strong>Help &amp; support</strong><small>Contact information and site status</small></span>
            <span className="settings-row__arrow" aria-hidden="true">↗</span>
          </Link>
          <Link className="settings-row" href="/privacy">
            <span><strong>Privacy policy</strong><small>Account and advertising data information</small></span>
            <span className="settings-row__arrow" aria-hidden="true">↗</span>
          </Link>
          <Link className="settings-row" href="/terms">
            <span><strong>Terms &amp; conditions</strong><small>Golden Rewards terms of use</small></span>
            <span className="settings-row__arrow" aria-hidden="true">↗</span>
          </Link>
        </div>
      </section>
      <aside className="guide-disclaimer">
        Golden Rewards displays standard advertisements only. AdSense views and clicks do not create user rewards or payouts.
      </aside>
    </main>
  );
}
