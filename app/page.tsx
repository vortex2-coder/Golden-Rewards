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
      <h1 className="home-page__title">Your rewards at a glance</h1>
      <section className="rewards-card" aria-label="Rewards account status">
        <div className="rewards-card__top">
          <span>GOLDEN REWARDS</span>
          <span className="rewards-card__mark" aria-hidden="true">G</span>
        </div>
        <div>
          <span className="rewards-card__label">Available rewards</span>
          <strong className="rewards-card__balance">—</strong>
          <span className="rewards-card__status">
            AdSense display ads do not generate user rewards
          </span>
        </div>
        <div className="rewards-card__footer">
          <span>ACCOUNT IDENTIFIER</span>
          <strong>{accountId ?? "Sign in to view"}</strong>
        </div>
        <span className="rewards-card__chip" aria-hidden="true" />
      </section>

      <div className="home-action-row">
        <button className="button button--muted" type="button" disabled>
          Cash out unavailable
        </button>
        <span className="home-action-row__note">No rewards or withdrawals are configured</span>
      </div>

      <section className="bonus-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">DAILY BONUS</span>
            <h2>Daily rewards are not enabled</h2>
          </div>
          <span className="status-pill">Unavailable</span>
        </div>
        <p>Standard AdSense ads cannot be used as paid watch tasks or bonus claims.</p>
        <div className="bonus-card__progress">
          <span>Bonus progress</span>
          <strong>Not tracked</strong>
        </div>
        <button className="button button--muted" type="button" disabled>
          Claim unavailable
        </button>
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
