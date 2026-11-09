import type { Metadata } from "next";
import { AuthenticatedPage } from "../components/AuthenticatedPage";
import AdSenseSlot from "../components/AdSenseSlot";
import { getAdSenseSettings } from "@/lib/adsense";
import { formatMoney, getLocalCurrencyQuote } from "@/lib/currency";
import {
  getActiveEarningTasks,
  getMemberRewardHistory,
  getMemberRewardSummary,
} from "@/lib/rewards";
import { getCurrentMember } from "@/lib/supabase/server";
import {
  getAvailablePointsCampaigns,
  getAvailableSurveys,
  getMemberPointsSummary,
} from "@/lib/points";
import SurveyAccessPanel from "./SurveyAccessPanel";

export const metadata: Metadata = {
  title: "Earn",
  description:
    "Browse partner-confirmed earning tasks. Standard Google AdSense ads are not compensated user activities.",
};

export default async function EarnPage() {
  const [adSenseSettings, taskResult, historyResult, summary, member, pointsResult, surveyResult] =
    await Promise.all([
      getAdSenseSettings(),
      getActiveEarningTasks(),
      getMemberRewardHistory(),
      getMemberRewardSummary(),
      getCurrentMember(),
      getMemberPointsSummary(),
      getAvailableSurveys(),
    ]);

  const countryIsoCode = member.profile?.country_iso_code ?? "";
  const campaignsResult = await getAvailablePointsCampaigns(countryIsoCode);
  const tasks = taskResult.tasks ?? [];
  const taskQuotes = await Promise.all(
    tasks.map((task) => getLocalCurrencyQuote(task.reward_usd, countryIsoCode)),
  );
  const totalQuote =
    summary && countryIsoCode
      ? await getLocalCurrencyQuote(summary.approvedUsd, countryIsoCode)
      : null;
  const postbackReady =
    (process.env.REWARDS_POSTBACK_SECRET?.length ?? 0) >= 32;

  return (
    <AuthenticatedPage>
      <main className="app-page public-page earn-page">
        <header className="public-page__heading">
          <span className="eyebrow">EARN</span>
          <h1>Discover earning opportunities.</h1>
          <p>
            Choose a partner offer and follow its terms. Rewards are added only
            after the partner confirms a valid completion.
          </p>
        </header>

        <SurveyAccessPanel
          summary={pointsResult.summary}
          campaigns={campaignsResult.campaigns ?? []}
          surveys={surveyResult.surveys ?? []}
          surveysError={surveyResult.error}
          campaignsError={campaignsResult.error}
          pointsPostbackReady={(process.env.POINTS_POSTBACK_SECRET?.length ?? 0) >= 32}
        />

        <section className="earn-status-card" aria-labelledby="earning-status-title">
          <div className="earn-status-card__heading">
            <div className="earn-status-card__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M12 3v18M17 7.5c0-1.7-2.2-3-5-3s-5 1.3-5 3 2.2 3 5 3 5 1.3 5 3-2.2 3-5 3-5-1.3-5-3" /></svg>
            </div>
            <div>
              <span className="eyebrow">PARTNER OPPORTUNITIES</span>
              <h2 id="earning-status-title">
                {taskResult.error
                  ? "Tasks are currently unavailable"
                  : tasks.length
                    ? `${tasks.length} offer${tasks.length === 1 ? "" : "s"} available`
                    : "No verified tasks available"}
              </h2>
            </div>
          </div>
          <p>
            {taskResult.error ??
              "Provider tracking and approval are required before a reward is credited. No activity is credited automatically."}
          </p>
          <div className="earn-progress">
            <div><span>Completed partner tasks</span><strong>{summary?.completedTasks ?? "Unavailable"}</strong></div>
            <span className="earn-progress__track" aria-label="Verified task activity"><span /></span>
          </div>
        </section>

        <div className="summary-grid">
          <article className="summary-card">
            <span>Approved rewards</span>
            <strong>{summary ? formatMoney(summary.approvedUsd, "USD") : "Unavailable"}</strong>
            <small>
              {totalQuote?.amount !== null && totalQuote
                ? `Approx. ${formatMoney(totalQuote.amount, totalQuote.currencyCode)}`
                : "Local-currency conversion unavailable"}
            </small>
          </article>
          <article className="summary-card">
            <span>Available partner tasks</span>
            <strong>{taskResult.error ? "Unavailable" : tasks.length}</strong>
            <small>Only current offers configured by the platform</small>
          </article>
        </div>

        {tasks.length > 0 && (
          <section className="wallet-section partner-offers" aria-labelledby="partner-offers-title">
            <div className="section-heading">
              <div>
                <span className="eyebrow">PARTNER OFFERS</span>
                <h2 id="partner-offers-title">Available tasks</h2>
              </div>
            </div>
            <div className="partner-offer-list">
              {tasks.map((task, index) => {
                const quote = taskQuotes[index];
                return (
                  <article className="partner-offer-card" key={task.id}>
                    <div className="partner-offer-card__top">
                      <span className="eyebrow">{task.partner_name}</span>
                      <strong>{formatMoney(task.reward_usd, "USD")}</strong>
                    </div>
                    <h3>{task.title}</h3>
                    {task.description && <p>{task.description}</p>}
                    <small className="partner-offer-card__local">
                      {quote?.amount !== null && quote
                        ? `Approx. ${formatMoney(quote.amount, quote.currencyCode)}`
                        : "Local-currency estimate unavailable"}
                      {quote?.updatedAt ? ` · Rates updated ${quote.updatedAt}` : ""}
                    </small>
                    {postbackReady ? (
                      <form action="/api/rewards/start" method="post">
                        <input type="hidden" name="task" value={task.id} />
                        <button className="button button--primary" type="submit">
                          Continue to offer
                        </button>
                      </form>
                    ) : (
                      <p className="form-message">
                        This offer is paused until partner confirmation is configured.
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        )}

        <section className="ad-section earn-ad-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">SPONSORED CONTENT</span>
              <h2>Display advertisement</h2>
            </div>
            <span className="status-pill">Not rewarded</span>
          </div>
          <AdSenseSlot
            clientId={adSenseSettings?.clientId ?? ""}
            slotId={adSenseSettings?.slotId ?? ""}
            enabled={adSenseSettings?.enabled ?? false}
          />
        </section>

        <section className="wallet-section earn-history">
          <div className="section-heading">
            <div>
              <span className="eyebrow">ACTIVITY</span>
              <h2>Confirmed task history</h2>
            </div>
            <span className="status-pill">
              {historyResult.entries ? `${historyResult.entries.length} records` : "Unavailable"}
            </span>
          </div>
          {historyResult.error ? (
            <div className="empty-state-card" role="status">
              <h3>Reward history is unavailable</h3>
              <p>{historyResult.error}</p>
            </div>
          ) : historyResult.entries?.length ? (
            <div className="reward-history-list">
              {historyResult.entries.map((entry) => (
                <article className="reward-history-row" key={entry.id}>
                  <span>
                    <strong>{entry.partner_name}</strong>
                    <small>{new Date(entry.created_at).toLocaleString()}</small>
                  </span>
                  <span className={`status-pill${entry.status === "reversed" ? " status-pill--warning" : ""}`}>
                    {entry.status}
                  </span>
                  <strong className={entry.status === "reversed" ? "reward-history-row__reversed" : ""}>
                    {entry.status === "reversed" ? "−" : "+"}{formatMoney(entry.amount_usd, "USD")}
                  </strong>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state-card">
              <h3>No completed tasks yet</h3>
              <p>Only confirmed completions from a supported rewards partner appear in your activity.</p>
            </div>
          )}
        </section>
      </main>
    </AuthenticatedPage>
  );
}
