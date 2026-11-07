import type { Metadata } from "next";
import { AuthenticatedPage } from "../components/AuthenticatedPage";
import ReferralTools from "../components/ReferralTools";
import { createSupabaseServerClient, getCurrentMember, getSiteUrl } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Team",
  description: "Invite friends and review your Golden Rewards referral activity.",
};

type ReferralRecord = {
  username: string;
  created_at: string;
  email_confirmed: boolean;
};

async function TeamContent() {
  const member = await getCurrentMember();
  if (!member.profile) throw new Error("Could not load the signed-in member profile.");

  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Supabase is not configured for referral information.");
  const siteUrl = await getSiteUrl();

  const [summaryResult, historyResult] = await Promise.all([
    supabase.rpc("get_referral_summary"),
    supabase.rpc("get_referral_history"),
  ]);
  if (summaryResult.error || historyResult.error) {
    throw new Error("Could not load referral information. Confirm the latest Supabase migration has been applied.");
  }

  const summary = summaryResult.data?.[0];
  const referralHistory: ReferralRecord[] = historyResult.data ?? [];

  return (
    <main className="app-page public-page team-page">
      <header className="public-page__heading">
        <span className="eyebrow">TEAM · REFERRALS</span>
        <h1>Grow your team.</h1>
        <p>Invite friends with your personal link and follow their registration status.</p>
      </header>
      <ReferralTools referralCode={member.profile.referral_code} username={member.profile.username} siteUrl={siteUrl} />
      <section className="team-summary">
        <div className="section-heading">
          <div>
            <span className="eyebrow">REFERRAL OVERVIEW</span>
            <h2>Signup activity</h2>
          </div>
        </div>
        <div className="summary-grid">
          <article className="summary-card">
            <span>Total invited</span>
            <strong>{summary?.total_invited ?? 0}</strong>
            <small>Accounts attributed to your link</small>
          </article>
          <article className="summary-card">
            <span>Verified referrals</span>
            <strong>{summary?.successful_referrals ?? 0}</strong>
            <small>Email address verified</small>
          </article>
          <article className="summary-card">
            <span>Pending referrals</span>
            <strong>{summary?.pending_referrals ?? 0}</strong>
            <small>Awaiting email verification</small>
          </article>
          <article className="summary-card">
            <span>Referral earnings</span>
            <strong>Not configured</strong>
            <small>No referral reward policy is active</small>
          </article>
        </div>
      </section>
      <section className="wallet-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">INVITATION ACTIVITY</span>
            <h2>Referral history</h2>
          </div>
          <span className="status-pill">{referralHistory.length} members</span>
        </div>
        {referralHistory.length ? (
          <div className="referral-history-list">
            {referralHistory.map((referral) => (
              <article
                className="referral-history-row"
                key={`${referral.username}-${referral.created_at}`}
              >
                <span className="profile-avatar profile-avatar--small" aria-hidden="true">
                  {referral.username.slice(0, 1).toUpperCase()}
                </span>
                <span>
                  <strong>@{referral.username}</strong>
                  <small>Joined {new Date(referral.created_at).toLocaleDateString()}</small>
                </span>
                <span className={`status-pill ${referral.email_confirmed ? "" : "status-pill--muted"}`}>
                  {referral.email_confirmed ? "Verified" : "Pending"}
                </span>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state-card">
            <h3>No invitations yet</h3>
            <p>Share your invitation link to start building your team.</p>
          </div>
        )}
      </section>
      <aside className="guide-disclaimer">
        Referral registrations are tracked securely. Earnings remain unavailable until the operator configures and publishes qualifying reward rules.
      </aside>
    </main>
  );
}

export default function TeamPage() {
  return (
    <AuthenticatedPage>
      <TeamContent />
    </AuthenticatedPage>
  );
}
