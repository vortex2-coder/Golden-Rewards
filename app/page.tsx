import Link from "next/link";

export default function Home() {
  return (
    <main className="app-page home-page">
      <section
        className="rewards-card"
        aria-label="Available USD balance. Unavailable because no rewards ledger is configured."
      >
        <div className="rewards-card__top">
          <span>GOLDEN REWARDS</span>
          <span className="rewards-card__chip" aria-hidden="true" />
        </div>
        <div>
          <strong className="rewards-card__balance">$—</strong>
        </div>
        <div className="rewards-card__footer">
          <span>ACCOUNT IDENTIFIER</span>
          <strong>Unavailable</strong>
        </div>
      </section>

      <div className="home-action-row">
        <button
          className="button home-cashout"
          type="button"
          disabled
          aria-describedby="cashout-unavailable"
        >
          Cash Out
        </button>
        <span className="home-action-row__note" id="cashout-unavailable">
          Withdrawals are not configured
        </span>
      </div>

      <section className="bonus-card">
        <div className="bonus-card__top">
          <div className="bonus-card__identity">
            <span className="bonus-card__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M3 10h18v11H3zM2 6h20v4H2zM12 6v15M12 6c-4.5 0-5.5-1.5-5.5-3S10 1.5 12 6Zm0 0c4.5 0 5.5-1.5 5.5-3S14 1.5 12 6Z" />
              </svg>
            </span>
            <div>
              <h2>Daily Bonus</h2>
              <p>Not configured</p>
            </div>
          </div>
          <button className="button button--gold bonus-card__claim" type="button" disabled>
            Claim
          </button>
        </div>
        <div className="bonus-card__progress">
          <span className="bonus-card__progress-track" aria-hidden="true">
            <span />
          </span>
          <span className="bonus-card__progress-label">Progress not tracked</span>
        </div>
        <p>Daily bonuses are unavailable until a verified rewards program is configured.</p>
      </section>

      <section className="home-summary">
        <div className="section-heading">
          <div>
            <span className="eyebrow">YOUR OVERVIEW</span>
            <h2>Account activity</h2>
          </div>
        </div>
        <div className="summary-grid">
          <article className="summary-card">
            <span>Account</span>
            <strong>Guest</strong>
            <small>Personal accounts are not available</small>
          </article>
          <article className="summary-card">
            <span>Reward activity</span>
            <strong>Not available</strong>
            <small>AdSense activity is not a reward ledger</small>
          </article>
        </div>
      </section>

      <aside className="notice-card">
        <strong>Ad views are not rewarded</strong>
        <p>Google AdSense standard ads must not be presented as watch-to-earn tasks. Ad clicks are never required or rewarded.</p>
        <Link href="/earn">View advertising information <span aria-hidden="true">→</span></Link>
      </aside>
    </main>
  );
}
