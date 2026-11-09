import type { Metadata } from "next";
import Link from "next/link";
import { AuthenticatedPage } from "./components/AuthenticatedPage";
import { formatMoney } from "@/lib/currency";
import {
  getActiveEarningTasks,
  getMemberReferralCashHistory,
  getMemberReferralSummary,
  getMemberRewardHistory,
  getMemberSurveyRewardHistory,
} from "@/lib/rewards";
import {
  getAvailableSurveys,
  getMemberPointsHistory,
  getMemberPointsSummary,
  getMemberSurveyActivity,
  getSurveyCategoryProgress,
} from "@/lib/points";
import { getCurrentMember } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Home",
  description:
    "Review your Golden Rewards balances, survey category, earning opportunities, and recent account activity.",
};

type RecentCashActivity = {
  key: string;
  createdAt: string;
  description: string;
  status: string;
  amountUsd: number;
};

async function HomeContent() {
  const [
    member,
    pointsResult,
    surveyResult,
    taskResult,
    rewardHistory,
    surveyRewardHistory,
    referralHistory,
    referralSummary,
    pointsHistory,
  ] = await Promise.all([
    getCurrentMember(),
    getMemberPointsSummary(),
    getAvailableSurveys(),
    getActiveEarningTasks(),
    getMemberRewardHistory(10),
    getMemberSurveyRewardHistory(10),
    getMemberReferralCashHistory(),
    getMemberReferralSummary(),
    getMemberPointsHistory(5),
  ]);
  if (!member.profile) throw new Error("Could not load the signed-in member profile.");

  const cashBalance = pointsResult.summary?.cashBalanceUsd;
  const [categoryResult, surveyActivity] = await Promise.all([
    cashBalance === undefined
      ? Promise.resolve(null)
      : getSurveyCategoryProgress(cashBalance),
    getMemberSurveyActivity(member.profile.id),
  ]);

  const recentCashActivity: RecentCashActivity[] = [
    ...(rewardHistory.entries ?? []).map((entry) => ({
      key: `partner-${entry.id}`,
      createdAt: entry.created_at,
      description: entry.partner_name,
      status: entry.status,
      amountUsd: entry.status === "reversed" ? -entry.amount_usd : entry.amount_usd,
    })),
    ...(surveyRewardHistory.entries ?? []).map((entry) => ({
      key: `survey-${entry.id}`,
      createdAt: entry.created_at,
      description: "Approved survey reward",
      status: "approved",
      amountUsd: entry.amount_usd,
    })),
    ...(referralHistory.entries ?? []).map((entry) => ({
      key: `referral-${entry.id}`,
      createdAt: entry.created_at,
      description: entry.description,
      status: "approved",
      amountUsd: entry.amount_usd,
    })),
  ]
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    )
    .slice(0, 6);

  const activityErrors = [
    rewardHistory.error,
    surveyRewardHistory.error,
    referralHistory.error,
  ].filter((error): error is string => Boolean(error));
  const category = categoryResult?.progress;
  const progressPercent = category?.progressPercent ?? 0;
  const nextThreshold = category?.nextCategoryCashUsd;
  const memberName = member.profile.username;

  return (
    <main className="app-page home-page">
      <header className="public-page__heading">
        <span className="eyebrow">HOME · MEMBER DASHBOARD</span>
        <h1>Welcome back, @{memberName}.</h1>
        <p>Your balances and activity, updated from your account records.</p>
      </header>

      <section
        className="rewards-card"
        aria-label={
          cashBalance === undefined
            ? "Cash balance unavailable"
            : `Cash balance ${formatMoney(cashBalance, "USD")}`
        }
      >
        <div className="rewards-card__top">
          <span>GOLDEN REWARDS · CASH BALANCE</span>
          <span className="rewards-card__chip" aria-hidden="true" />
        </div>
        <div>
          <strong className="rewards-card__balance">
            {cashBalance === undefined
              ? "Unavailable"
              : formatMoney(cashBalance, "USD")}
          </strong>
        </div>
        <div className="rewards-card__footer">
          <span>ACCOUNT</span>
          <strong>@{memberName}</strong>
        </div>
      </section>

      <section className="summary-grid home-dashboard-grid" aria-label="Account overview">
        <article className="summary-card">
          <span>Golden Points</span>
          <strong>
            {pointsResult.summary
              ? pointsResult.summary.balance.toLocaleString()
              : "Unavailable"}
          </strong>
          <small>Separate from Cash Balance; not redeemable as cash</small>
          <Link className="text-link" href="/wallet">View points history</Link>
        </article>
        <article className="summary-card">
          <span>Survey category</span>
          <strong>
            {categoryResult === null
              ? "Unavailable"
              : categoryResult.error
                ? "Unavailable"
                : category?.currentCategory ?? "Not assigned"}
          </strong>
          <small>
            {categoryResult === null
              ? pointsResult.error
              : categoryResult.error
                ? categoryResult.error
                : category?.nextCategory
                  ? `Next: ${category.nextCategory}`
                  : category?.currentCategory
                    ? "No higher survey category is configured"
                    : "No category matches your Cash Balance"}
          </small>
        </article>
        <article className="summary-card">
          <span>Available surveys</span>
          <strong>
            {surveyResult.error
              ? "Unavailable"
              : surveyResult.surveys?.length ?? 0}
          </strong>
          <small>Surveys available with your current access</small>
          <Link className="text-link" href="/earn">Browse earning opportunities</Link>
        </article>
        <article className="summary-card">
          <span>Partner earning tasks</span>
          <strong>
            {taskResult.error ? "Unavailable" : taskResult.tasks?.length ?? 0}
          </strong>
          <small>Only current offers configured by the platform</small>
        </article>
      </section>

      <nav className="home-quick-actions" aria-label="Quick actions">
        <Link href="/earn">
          <span className="home-quick-actions__icon" aria-hidden="true">+</span>
          <span><strong>Find ways to earn</strong><small>Explore surveys and partner offers</small></span>
          <span className="home-quick-actions__arrow" aria-hidden="true">→</span>
        </Link>
        <Link href="/team">
          <span className="home-quick-actions__icon" aria-hidden="true">↗</span>
          <span><strong>Invite your team</strong><small>Share your referral link</small></span>
          <span className="home-quick-actions__arrow" aria-hidden="true">→</span>
        </Link>
        <Link href="/wallet">
          <span className="home-quick-actions__icon" aria-hidden="true">$</span>
          <span><strong>Review your wallet</strong><small>See separate cash and points history</small></span>
          <span className="home-quick-actions__arrow" aria-hidden="true">→</span>
        </Link>
      </nav>

      <section className="wallet-section home-category-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">SURVEY CATEGORY</span>
            <h2>Progress toward your next category</h2>
          </div>
          {category?.nextCategory && (
            <span className="status-pill">{Math.round(progressPercent)}%</span>
          )}
        </div>
        {categoryResult === null ? (
          <p className="supporting-copy">
            {pointsResult.error ?? "Cash Balance is unavailable."}
          </p>
        ) : categoryResult.error ? (
          <p className="supporting-copy" role="status">{categoryResult.error}</p>
        ) : category?.nextCategory &&
          typeof nextThreshold === "number" &&
          typeof cashBalance === "number" ? (
          <>
            <p className="supporting-copy">
              {formatMoney(cashBalance, "USD")} of{" "}
              {formatMoney(nextThreshold, "USD")} toward {category.nextCategory}.
              Cash is never deducted or reserved to determine category eligibility.
            </p>
            <div
              className="home-category-progress"
              role="progressbar"
              aria-label={`Progress toward ${category.nextCategory}`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progressPercent)}
            >
              <span style={{ width: `${progressPercent}%` }} />
            </div>
          </>
        ) : category?.currentCategory ? (
          <p className="supporting-copy">
            No higher survey category is currently configured. Your Cash Balance
            is not locked or reduced.
          </p>
        ) : (
          <p className="supporting-copy">
            No survey category is configured for your current Cash Balance.
          </p>
        )}
      </section>

      <section className="summary-grid home-dashboard-grid" aria-label="Referral overview">
        <article className="summary-card">
          <span>Registered referrals</span>
          <strong>
            {referralSummary.summary?.successfulReferrals ?? "Unavailable"}
          </strong>
          <small>
            {referralSummary.summary
              ? `${referralSummary.summary.totalInvited} total attributed signups`
              : referralSummary.error}
          </small>
          <Link className="text-link" href="/team">View your team</Link>
        </article>
        <article className="summary-card">
          <span>Referral rewards</span>
          <strong>
            {referralSummary.summary
              ? formatMoney(referralSummary.summary.earnedUsd, "USD")
              : "Unavailable"}
          </strong>
          <small>Recorded referral credits in your account</small>
        </article>
      </section>

      <section className="wallet-section" aria-labelledby="recent-transactions-title">
        <div className="section-heading">
          <div>
            <span className="eyebrow">CASH ACTIVITY</span>
            <h2 id="recent-transactions-title">Recent transactions</h2>
          </div>
          <Link className="text-link" href="/wallet">View wallet</Link>
        </div>
        {recentCashActivity.length ? (
          <div className="reward-history-list">
            {recentCashActivity.map((entry) => (
              <article className="reward-history-row" key={entry.key}>
                <span>
                  <strong>{entry.description}</strong>
                  <small>{new Date(entry.createdAt).toLocaleString()}</small>
                </span>
                <span
                  className={`status-pill${entry.status === "reversed" ? " status-pill--warning" : ""}`}
                >
                  {entry.status}
                </span>
                <strong
                  className={entry.amountUsd < 0 ? "reward-history-row__reversed" : ""}
                >
                  {entry.amountUsd < 0 ? "−" : "+"}
                  {formatMoney(Math.abs(entry.amountUsd), "USD")}
                </strong>
              </article>
            ))}
          </div>
        ) : activityErrors.length ? (
          <div className="empty-state-card" role="status">
            <h3>Transaction activity is unavailable</h3>
            <p>{activityErrors.join(" ")}</p>
          </div>
        ) : (
          <div className="empty-state-card">
            <h3>No cash transactions yet</h3>
            <p>Approved partner, survey, and referral credits will appear here.</p>
          </div>
        )}
      </section>

      <section className="wallet-section" aria-labelledby="survey-activity-title">
        <div className="section-heading">
          <div>
            <span className="eyebrow">SURVEY ACTIVITY</span>
            <h2 id="survey-activity-title">Recent survey submissions</h2>
          </div>
          <Link className="text-link" href="/earn">Go to Earn</Link>
        </div>
        {surveyActivity.error ? (
          <div className="empty-state-card" role="status">
            <h3>Survey activity is unavailable</h3>
            <p>{surveyActivity.error}</p>
          </div>
        ) : surveyActivity.entries?.length ? (
          <div className="reward-history-list">
            {surveyActivity.entries.map((entry) => (
              <article className="reward-history-row" key={entry.id}>
                <span>
                  <strong>{entry.title}</strong>
                  <small>{new Date(entry.created_at).toLocaleString()}</small>
                  {entry.status === "rejected" && entry.review_note && (
                    <small>Review note: {entry.review_note}</small>
                  )}
                </span>
                <span
                  className={`status-pill${entry.status === "rejected" ? " status-pill--warning" : ""}`}
                >
                  {entry.status}
                </span>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state-card">
            <h3>No survey submissions yet</h3>
            <p>Submitted surveys and their review status will appear here.</p>
          </div>
        )}
      </section>

      <section className="wallet-section" aria-labelledby="points-activity-title">
        <div className="section-heading">
          <div>
            <span className="eyebrow">GOLDEN POINTS</span>
            <h2 id="points-activity-title">Recent points activity</h2>
          </div>
          <Link className="text-link" href="/wallet">View points wallet</Link>
        </div>
        {pointsHistory.error ? (
          <p className="supporting-copy" role="status">{pointsHistory.error}</p>
        ) : pointsHistory.entries?.length ? (
          <div className="reward-history-list">
            {pointsHistory.entries.map((entry) => (
              <article className="reward-history-row" key={entry.id}>
                <span>
                  <strong>
                    {entry.reason === "campaign_reward"
                      ? entry.partner_name ?? "Confirmed partner reward"
                      : "Survey access unlock"}
                  </strong>
                  <small>{new Date(entry.created_at).toLocaleString()}</small>
                </span>
                <span className="status-pill">Points</span>
                <strong className={entry.points_delta < 0 ? "reward-history-row__reversed" : ""}>
                  {entry.points_delta > 0 ? "+" : ""}
                  {entry.points_delta.toLocaleString()}
                </strong>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state-card">
            <h3>No Golden Points activity yet</h3>
            <p>Partner-confirmed point awards and survey unlock spending appear here.</p>
          </div>
        )}
      </section>

      <aside className="notice-card">
        <strong>Important earning information</strong>
        <p>
          Standard Google AdSense impressions and clicks are never paid activities.
          Partner rewards and survey rewards are recorded only after the required
          confirmation or administrator approval.
        </p>
        <Link href="/terms">Review earning terms <span aria-hidden="true">→</span></Link>
      </aside>
    </main>
  );
}

export default function Home() {
  return (
    <AuthenticatedPage>
      <HomeContent />
    </AuthenticatedPage>
  );
}
