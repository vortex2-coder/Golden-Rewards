import type { Metadata } from "next";
import { AuthenticatedPage } from "../components/AuthenticatedPage";
import { formatMoney, getLocalCurrencyQuote } from "@/lib/currency";
import {
  getMemberRewardHistory,
  getMemberReferralCashHistory,
  getMemberSurveyRewardHistory,
} from "@/lib/rewards";
import { getCurrentMember } from "@/lib/supabase/server";
import { getMemberPointsHistory, getMemberPointsSummary } from "@/lib/points";
import { getMobileMoneyProviders } from "@/lib/mobile-money";

export const metadata: Metadata = {
  title: "Wallet",
  description:
    "Review your cash balance and reward activity. Standard AdSense views do not create a payable balance.",
};

export default async function WalletPage() {
  const [historyResult, surveyHistory, referralHistory, member, pointsResult, pointsHistory] = await Promise.all([
    getMemberRewardHistory(),
    getMemberSurveyRewardHistory(),
    getMemberReferralCashHistory(),
    getCurrentMember(),
    getMemberPointsSummary(),
    getMemberPointsHistory(),
  ]);
  const countryIsoCode = member.profile?.country_iso_code ?? "";
  const mobileMoneyProviders = getMobileMoneyProviders(countryIsoCode);
  const cashBalanceUsd = pointsResult.summary?.cashBalanceUsd ?? null;
  const localQuote =
    cashBalanceUsd !== null && countryIsoCode
      ? await getLocalCurrencyQuote(cashBalanceUsd, countryIsoCode)
      : null;

  return (
    <AuthenticatedPage>
      <main className="app-page public-page wallet-page">
        <header className="public-page__heading">
          <span className="eyebrow">WALLET</span>
          <h1>Your wallet.</h1>
          <p>Your cash credits are shown in USD. Local-currency values are estimates for display only.</p>
        </header>
        <section className="wallet-section points-wallet-section" aria-labelledby="points-wallet-title">
          <div className="section-heading">
            <div>
              <span className="eyebrow">SEPARATE GOLDEN POINTS WALLET</span>
              <h2 id="points-wallet-title">Golden Points</h2>
            </div>
            <span className="status-pill">Not cash</span>
          </div>
          <div className="wallet-balance-card points-balance-card">
            <div className="wallet-balance-card__top">
              <span>POINTS BALANCE</span>
              <span className="wallet-balance-card__chip" aria-hidden="true" />
            </div>
            <strong>{pointsResult.summary ? pointsResult.summary.balance.toLocaleString() : "Unavailable"}</strong>
            <small>Golden Points are separate from Cash Balance and cannot be withdrawn as cash.</small>
          </div>
          {pointsHistory.error ? (
            <p className="supporting-copy">{pointsHistory.error}</p>
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
                    {entry.points_delta > 0 ? "+" : ""}{entry.points_delta.toLocaleString()}
                  </strong>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state-card">
              <h3>No Golden Points activity yet</h3>
              <p>Partner-confirmed point awards and survey unlock spending will be listed here separately.</p>
            </div>
          )}
        </section>
        <section className="wallet-balance-card" id="availability">
          <div className="wallet-balance-card__top">
            <span>CASH BALANCE · USD</span>
            <span className="wallet-balance-card__chip" aria-hidden="true" />
          </div>
          <strong>{cashBalanceUsd === null ? "Unavailable" : formatMoney(cashBalanceUsd, "USD")}</strong>
          <small>
            {localQuote?.amount !== null && localQuote
              ? `Approx. ${formatMoney(localQuote.amount, localQuote.currencyCode)}`
              : "Approximate local-currency conversion unavailable"}
            {localQuote?.updatedAt ? ` · Rates updated ${localQuote.updatedAt}` : ""}
          </small>
          <button className="button button--muted" type="button" disabled>
            Withdrawals unavailable
          </button>
        </section>

        <div className="summary-grid wallet-summary-grid">
          <article className="summary-card">
            <span>Pending balance</span>
            <strong>Not tracked</strong>
            <small>Partner reviews are not payable until confirmed</small>
          </article>
          <article className="summary-card">
            <span>Total cash credits</span>
            <strong>{cashBalanceUsd === null ? "Unavailable" : formatMoney(cashBalanceUsd, "USD")}</strong>
            <small>Partner, survey and referral credits, net of recorded reversals</small>
          </article>
          <article className="summary-card">
            <span>Total withdrawals</span>
            <strong>Not available</strong>
            <small>No payout integration is configured</small>
          </article>
          <article className="summary-card">
            <span>Mobile money</span>
            <strong>{mobileMoneyProviders[0] ?? "Not available"}</strong>
            <small>{member.profile?.country ?? "Country not set"}</small>
          </article>
        </div>

        <section className="wallet-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">PAYMENT METHODS</span>
              <h2>Payment methods</h2>
            </div>
            <span className="status-pill">Mobile money</span>
          </div>
          <p className="supporting-copy">
            Mobile money transfer options for {member.profile?.country ?? "your country"}:
          </p>
          {mobileMoneyProviders.length ? (
            <ul>
              {mobileMoneyProviders.map((provider) => <li key={provider}>{provider}</li>)}
            </ul>
          ) : (
            <p className="supporting-copy">No country-specific mobile-money provider is configured yet.</p>
          )}
          {member.profile && (
            <p className="supporting-copy">
              Mobile number on your account: <strong>{member.profile.phone_number_e164}</strong>
            </p>
          )}
          <p className="supporting-copy">
            Payouts are not enabled yet. A transfer is not considered successful until a payout service is connected and confirms it.
          </p>
        </section>

        <section className="wallet-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">TRANSACTIONS</span>
              <h2>Reward history</h2>
            </div>
            <span className="status-pill">
              {historyResult.entries || surveyHistory.entries || referralHistory.entries
                ? `${(historyResult.entries?.length ?? 0) + (surveyHistory.entries?.length ?? 0) + (referralHistory.entries?.length ?? 0)} records`
                : "Unavailable"}
            </span>
          </div>
          {historyResult.error && <p className="form-message" role="status">{historyResult.error}</p>}
          {surveyHistory.error && <p className="form-message" role="status">{surveyHistory.error}</p>}
          {referralHistory.error && <p className="form-message" role="status">{referralHistory.error}</p>}
          {historyResult.entries?.length || surveyHistory.entries?.length || referralHistory.entries?.length ? (
            <div className="reward-history-list">
              {historyResult.entries?.map((entry) => (
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
              {surveyHistory.entries?.map((entry) => (
                <article className="reward-history-row" key={entry.id}>
                  <span>
                    <strong>Approved survey reward</strong>
                    <small>{new Date(entry.created_at).toLocaleString()}</small>
                  </span>
                  <span className="status-pill">approved</span>
                  <strong>+{formatMoney(entry.amount_usd, "USD")}</strong>
                </article>
              ))}
              {referralHistory.entries?.map((entry) => (
                <article className="reward-history-row" key={entry.id}>
                  <span>
                    <strong>{entry.description}</strong>
                    <small>{new Date(entry.created_at).toLocaleString()}</small>
                  </span>
                  <span className="status-pill">approved</span>
                  <strong>+{formatMoney(entry.amount_usd, "USD")}</strong>
                </article>
              ))}
            </div>
          ) : !historyResult.error && !surveyHistory.error && !referralHistory.error ? (
            <div className="empty-state-card">
              <h3>No reward transactions yet</h3>
              <p>Confirmed partner, survey and referral credits will appear here.</p>
            </div>
          ) : null}
          <div className="withdrawal-states">
            <span className="withdrawal-states__label">Withdrawal statuses</span>
            <div className="withdrawal-states__list" aria-label="Possible withdrawal statuses">
              <span>Pending</span>
              <span>Processing</span>
              <span>Approved</span>
              <span>Rejected</span>
              <span>Completed</span>
            </div>
            <p className="supporting-copy">No withdrawal records exist until a payout service is configured.</p>
          </div>
        </section>
      </main>
    </AuthenticatedPage>
  );
}
