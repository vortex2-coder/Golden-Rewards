import type { Metadata } from "next";
import { AuthenticatedPage } from "../components/AuthenticatedPage";
import ReferralTools from "../components/ReferralTools";
import { formatMoney } from "@/lib/currency";
import { createSupabaseServerClient, getCurrentMember, getSiteUrl } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Team",
  description: "Invite friends and review your Golden Rewards referral activity.",
};

type ReferralRecord = {
  username: string;
  created_at: string;
  email_confirmed: boolean;
  earned_usd: number;
};

async function TeamContent() {
  const member = await getCurrentMember();
  if (!member.profile) throw new Error("Could not load the signed-in member profile.");

  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Supabase is not configured for referral information.");
  const siteUrl = await getSiteUrl();

  const [summaryResult, historyResult] = await Promise.all([
    supabase.rpc("get_my_referral_summary"),
    supabase.rpc("get_my_referral_history"),
  ]);
  if (summaryResult.error || historyResult.error) {
    throw new Error("Could not load referral information. Confirm the latest Supabase migration has been applied.");
  }

  const summary = summaryResult.data?.[0];
  const referralHistory: ReferralRecord[] = historyResult.data ?? [];
  const totalInvited = summary?.total_invited ?? 0;
  const successfulReferrals = summary?.successful_referrals ?? 0;
  const referralEarningsUsd = Number(summary?.earned_usd ?? 0);

  return (
    <main className="app-page public-page team-page">
      <header className="public-page__heading">
        <span className="eyebrow">TEAM · REFERRALS</span>
        <h1>Grow your team.</h1>
        <p>Get $10.00 USD for joining with a referral, and get $10.00 USD every time a new member joins using your invitation.</p>
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
            <strong>{totalInvited}</strong>
            <small>Accounts attributed to your link</small>
          </article>
          <article className="summary-card">
            <span>Successful referrals</span>
            <strong>{successfulReferrals}</strong>
            <small>Completed account registrations attributed to your link</small>
          </article>
          <article className="summary-card">
            <span>Pending referrals</span>
            <strong>{summary?.pending_referrals ?? 0}</strong>
            <small>Referred accounts not yet verified</small>
          </article>
          <article className="summary-card">
            <span>Referral earnings</span>
            <strong>{formatMoney(referralEarningsUsd, "USD")}</strong>
            <small>$10.00 USD credited for each successful referral</small>
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
                <span className="status-pill">{referral.email_confirmed ? "Successful" : "Pending"}</span>
                {referral.earned_usd > 0 && (
                  <strong>+{formatMoney(Number(referral.earned_usd), "USD")}</strong>
                )}
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
        Both you and the person you invite receive a $10.00 USD wallet credit after their account is successfully created. Withdrawals remain unavailable until a payout service is connected.
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
