import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import ReferralShare from "../components/ReferralShare";
import { createSupabaseServerClient, getCurrentUser } from "../../lib/supabase/server";

export const metadata: Metadata = {
  title: "Team",
  description: "Share your Golden Rewards referral link and review confirmed signups.",
};

type ReferralSummary = {
  invited: number;
  confirmed: number;
  pending: number;
};

type ReferralHistoryEntry = {
  joined_at: string;
  email_confirmed: boolean;
};

export default function TeamPage() {
  return (
    <Suspense fallback={<main className="app-page"><div className="empty-state-card">Loading referral information…</div></main>}>
      <TeamContent />
    </Suspense>
  );
}

async function TeamContent() {
  const auth = await getCurrentUser();
  const supabase = auth.user ? await createSupabaseServerClient() : null;
  let referralCode: string | null = null;
  let summary: ReferralSummary | null = null;
  let history: ReferralHistoryEntry[] = [];
  let dataError: string | null = auth.error;

  if (supabase && auth.user) {
    const [
      { data: profile, error: profileError },
      { data: summaryData, error: summaryError },
      { data: historyData, error: historyError },
    ] =
      await Promise.all([
        supabase
          .from("profiles")
          .select("referral_code")
          .eq("id", auth.user.id)
          .maybeSingle(),
        supabase.rpc("get_referral_summary"),
        supabase.rpc("get_referral_history"),
      ]);

    if (profileError) {
      dataError = `Could not load your referral profile: ${profileError.message}`;
    } else {
      referralCode = profile?.referral_code ?? null;
    }

    if (summaryError) {
      dataError = `Could not load referral activity: ${summaryError.message}`;
    } else {
      summary = summaryData?.[0] ?? null;
    }

    if (historyError) {
      dataError = `Could not load referral history: ${historyError.message}`;
    } else {
      history = historyData ?? [];
    }
  }

  return (
    <main className="app-page public-page team-page">
      <header className="public-page__heading">
        <span className="eyebrow">TEAM · REFERRALS</span>
        <h1>Grow your team.</h1>
        <p>Invite friends with your personal link and follow their signup status.</p>
      </header>
      {auth.user && referralCode ? (
        <section className="referral-panel">
          <div className="referral-panel__heading">
            <div>
              <span className="eyebrow">YOUR INVITATION</span>
              <h2>Referral link</h2>
            </div>
            <span className="status-pill">Active</span>
          </div>
          <p>Signups are attributed once at registration. Referral bonuses are not enabled.</p>
          <ReferralShare referralCode={referralCode} />
          <p className="referral-code-label">Your code: <strong>{referralCode}</strong></p>
        </section>
      ) : (
        <section className="referral-panel">
          <div className="referral-panel__heading">
            <div>
              <span className="eyebrow">YOUR INVITATION</span>
              <h2>{auth.user ? "Referral code unavailable" : "Sign in to get your link"}</h2>
            </div>
            <span className="status-pill">{auth.configured ? "Account required" : "Setup required"}</span>
          </div>
          <p>{dataError ?? (auth.configured ? "Create or sign in to an account to receive a unique referral code." : "Supabase account services must be configured before referral links are available.")}</p>
          {!auth.user && (
            <div className="button-row">
              <Link className="button button--gold" href="/register">Create account</Link>
              <Link className="button button--outline" href="/login">Sign in</Link>
            </div>
          )}
        </section>
      )}
      <section className="team-summary">
        <div className="section-heading">
          <div>
            <span className="eyebrow">REFERRAL OVERVIEW</span>
            <h2>Signup activity</h2>
          </div>
        </div>
        {summary ? (
          <div className="summary-grid summary-grid--four">
            <article className="summary-card"><span>Total invited</span><strong>{summary.invited}</strong></article>
            <article className="summary-card"><span>Successful</span><strong>{summary.confirmed}</strong></article>
            <article className="summary-card"><span>Pending</span><strong>{summary.pending}</strong></article>
            <article className="summary-card"><span>Referral earnings</span><strong>Not offered</strong></article>
          </div>
        ) : (
          <div className="empty-state-card">
            <h2>{dataError ? "Referral data unavailable" : "No referral data to show"}</h2>
            <p>{dataError ?? "Sign in to view referral activity. No referral rewards are configured."}</p>
          </div>
        )}
      </section>
      {auth.user && (
        <section className="wallet-section referral-history">
          <div className="section-heading">
            <div>
              <span className="eyebrow">RECENT SIGNUPS</span>
              <h2>Referral history</h2>
            </div>
            <span className="status-pill">{history.length} total</span>
          </div>
          {history.length ? (
            <ul className="referral-history__list">
              {history.map((entry, index) => (
                <li className="referral-history__item" key={`${entry.joined_at}-${index}`}>
                  <span className="referral-history__avatar" aria-hidden="true">G</span>
                  <span className="referral-history__details">
                    <strong>Golden Rewards member</strong>
                    <small>{new Date(entry.joined_at).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}</small>
                  </span>
                  <span className={`referral-history__status ${entry.email_confirmed ? "is-confirmed" : ""}`}>
                    {entry.email_confirmed ? "Confirmed" : "Pending"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-state-card">
              <h3>No referrals yet</h3>
              <p>Members who register with your link will appear here.</p>
            </div>
          )}
        </section>
      )}
      <aside className="guide-disclaimer">Referral earnings are not enabled; this page reports signup activity only.</aside>
    </main>
  );
}
