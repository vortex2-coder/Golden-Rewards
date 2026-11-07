import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Team",
  description: "Referral features are currently unavailable on Golden Rewards.",
};

export default function TeamPage() {
  return (
    <main className="app-page public-page team-page">
      <header className="public-page__heading">
        <span className="eyebrow">TEAM · REFERRALS</span>
        <h1>Grow your team.</h1>
        <p>Referral invitations and member tracking are not currently available.</p>
      </header>
      <section className="referral-panel">
        <div className="referral-panel__heading">
          <div>
            <span className="eyebrow">INVITATIONS</span>
            <h2>Referral program unavailable</h2>
          </div>
          <span className="status-pill">Not configured</span>
        </div>
        <p>Unique invite links, signup tracking, and referral rewards require an account service, which this project does not currently use.</p>
      </section>
      <section className="team-summary">
        <div className="section-heading">
          <div>
            <span className="eyebrow">REFERRAL OVERVIEW</span>
            <h2>Signup activity</h2>
          </div>
        </div>
        <div className="empty-state-card">
          <h2>Referral activity is unavailable</h2>
          <p>No referral member counts or earnings are collected or displayed.</p>
        </div>
      </section>
      <aside className="guide-disclaimer">This page does not create referral links or store referral history.</aside>
    </main>
  );
}
