import type { Metadata } from "next";
import AdSenseSlot from "../components/AdSenseSlot";

export const metadata: Metadata = {
  title: "Earn",
  description:
    "Advertising on Golden Rewards. Standard Google AdSense ads are not compensated user activities.",
};

export default function EarnPage() {
  return (
    <main className="app-page public-page earn-page">
      <header className="public-page__heading">
        <span className="eyebrow">EARN</span>
        <h1>Discover earning opportunities.</h1>
        <p>
          Explore verified opportunities when they become available. Standard
          display ads are never paid watch tasks.
        </p>
      </header>
      <section className="earn-status-card" aria-labelledby="earning-status-title">
        <div className="earn-status-card__heading">
          <div className="earn-status-card__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M12 3v18M17 7.5c0-1.7-2.2-3-5-3s-5 1.3-5 3 2.2 3 5 3 5 1.3 5 3-2.2 3-5 3-5-1.3-5-3" /></svg>
          </div>
          <div>
            <span className="eyebrow">OPPORTUNITIES</span>
            <h2 id="earning-status-title">No verified tasks available</h2>
          </div>
        </div>
        <p>Rewarded tasks will appear here only when a partner can verify completion. No activity is credited automatically.</p>
        <div className="earn-progress">
          <div><span>Task completion</span><strong>0 available</strong></div>
          <span className="earn-progress__track" aria-label="No tasks available"><span /></span>
        </div>
      </section>

      <div className="summary-grid">
        <article className="summary-card">
          <span>Daily opportunities</span>
          <strong>Not available</strong>
          <small>No verified earning tasks are configured</small>
        </article>
        <article className="summary-card">
          <span>Completed tasks</span>
          <strong>Not tracked</strong>
          <small>No task completion ledger is connected</small>
        </article>
      </div>

      <section className="ad-section earn-ad-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">SPONSORED CONTENT</span>
            <h2>Display advertisement</h2>
          </div>
          <span className="status-pill">Not rewarded</span>
        </div>
        <AdSenseSlot />
        <p className="supporting-copy">AdSense selects the ads displayed here. Viewing or clicking them does not create an earning record.</p>
      </section>
      <section className="wallet-section earn-history">
        <div className="section-heading">
          <div>
            <span className="eyebrow">ACTIVITY</span>
            <h2>Completed tasks</h2>
          </div>
          <span className="status-pill">No history</span>
        </div>
        <div className="empty-state-card">
          <h3>No completed tasks yet</h3>
          <p>Only confirmed completions from a supported rewards partner can appear in your activity.</p>
        </div>
      </section>
    </main>
  );
}
