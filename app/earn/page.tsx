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
        <h1>Advertising, clearly explained.</h1>
        <p>
          Golden Rewards may display standard advertisements. Viewing or
          clicking those ads does not earn points, money, or account credit.
        </p>
      </header>
      <section className="availability-card" aria-labelledby="earning-status-title">
        <div className="availability-card__icon" aria-hidden="true">i</div>
        <div>
          <span className="eyebrow">ADVERTISING MODEL</span>
          <h2 id="earning-status-title">Standard display advertising</h2>
          <p>AdSense chooses the ads shown in configured placements. Golden Rewards does not upload individual ads or pay users to view or click them.</p>
        </div>
      </section>
      <section className="ad-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">ADVERTISEMENT</span>
            <h2>Sponsored placement</h2>
          </div>
          <span className="status-pill">Not a task</span>
        </div>
        <AdSenseSlot />
      </section>
      <div className="summary-grid">
        <article className="summary-card">
          <span>Paid watch tasks</span>
          <strong>Not available</strong>
          <small>AdSense views cannot be rewarded</small>
        </article>
        <article className="summary-card">
          <span>Reward progress</span>
          <strong>Not tracked</strong>
          <small>Ad views do not create an earning record</small>
        </article>
      </div>
      <section className="empty-state-card">
        <span className="eyebrow">COMPLETED AD ACTIVITY</span>
        <h2>No rewarded activity</h2>
        <p>Standard display ads do not have a reward completion callback and are not credited to a user wallet.</p>
      </section>
    </main>
  );
}
