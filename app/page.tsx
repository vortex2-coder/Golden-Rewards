import Link from "next/link";
import { Suspense } from "react";
import { getCurrentUser } from "../lib/supabase/server";

export default function Home() {
  return (
    <Suspense fallback={<main className="app-page"><div className="empty-state-card">Loading your account…</div></main>}>
      <HomeContent />
    </Suspense>
  );
}

async function HomeContent() {
  const auth = await getCurrentUser();
  const accountId = auth.user?.id.slice(0, 12).toUpperCase() ?? null;

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
          <strong>{accountId ?? "Sign in to view"}</strong>
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
            <strong>{auth.user ? "Connected" : "Guest"}</strong>
            <small>{auth.configured ? "Managed by Supabase" : "Account service needs configuration"}</small>
          </article>
          <article className="summary-card">
            <span>Reward activity</span>
            <strong>Not available</strong>
            <small>AdSense activity is not a reward ledger</small>
          </article>
        </div>
      </section>

      {!auth.user && (
        <section className="account-callout">
          <div>
            <span className="eyebrow">GOLDEN REWARDS ACCOUNT</span>
            <h2>Sign in or create an account</h2>
            <p>{auth.error ?? "Use your account to manage your profile and referral link."}</p>
          </div>
          <div className="button-row">
            <Link className="button button--gold" href="/register">Create account</Link>
            <Link className="button button--outline" href="/login">Sign in</Link>
          </div>
        </section>
      )}

      <aside className="notice-card">
        <strong>Ad views are not rewarded</strong>
        <p>Google AdSense standard ads must not be presented as watch-to-earn tasks. Ad clicks are never required or rewarded.</p>
        <Link href="/earn">View advertising information <span aria-hidden="true">→</span></Link>
      </aside>
    </main>
  );
}
