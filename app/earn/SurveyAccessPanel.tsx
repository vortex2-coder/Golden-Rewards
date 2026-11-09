"use client";

import { useActionState } from "react";
import {
  submitSurveyResponse,
  unlockSurveyAccess,
  type SurveyActionState,
} from "./actions";
import type { AvailableSurvey, PointsCampaign, PointsSummary } from "@/lib/points";

const initialState: SurveyActionState = {};

function ActionMessage({ state }: { state: SurveyActionState }) {
  return (
    <>
      {state.error && <p className="form-message" role="alert">{state.error}</p>}
      {state.success && <p className="form-message form-message--success" role="status">{state.success}</p>}
    </>
  );
}

function SurveyResponseForm({ survey }: { survey: AvailableSurvey }) {
  const [state, action, pending] = useActionState(submitSurveyResponse, initialState);
  return (
    <details className="member-survey-card">
      <summary>
        <span>
          <strong>{survey.title}</strong>
          <small>{survey.category_name ?? "All categories"} · ${survey.reward_usd.toFixed(2)} USD after approval</small>
        </span>
        <span className="status-pill">Start</span>
      </summary>
      <form className="admin-ads-form" action={action}>
        <input type="hidden" name="surveyId" value={survey.id} />
        {survey.description && <p className="supporting-copy">{survey.description}</p>}
        {survey.questions.map((question, index) => (
          <label className="admin-ads-form__field" key={`${survey.id}-${index}`}>
            <span>{index + 1}. {question}</span>
            <textarea name={`answer_${index}`} rows={3} maxLength={2000} required />
          </label>
        ))}
        <p className="supporting-copy">Submitting a response does not credit cash. An administrator reviews it first.</p>
        <ActionMessage state={state} />
        <button className="button button--primary" disabled={pending}>
          {pending ? "Submitting…" : "Submit for review"}
        </button>
      </form>
    </details>
  );
}

export default function SurveyAccessPanel({
  summary,
  campaigns,
  surveys,
  surveysError,
  campaignsError,
  pointsPostbackReady,
}: {
  summary: PointsSummary | null;
  campaigns: PointsCampaign[];
  surveys: AvailableSurvey[];
  surveysError: string | null;
  campaignsError: string | null;
  pointsPostbackReady: boolean;
}) {
  const [unlockState, unlockAction, unlockPending] = useActionState(
    unlockSurveyAccess,
    initialState,
  );
  const accessActive = summary?.accessActive ?? false;
  const balance = summary?.balance ?? 0;
  const canUnlock = Boolean(summary && summary.unlockCost > 0 && balance >= summary.unlockCost);

  return (
    <>
      <section className="wallet-section" aria-labelledby="golden-points-balance-title">
        <div className="section-heading">
          <div>
            <span className="eyebrow">SEPARATE POINTS WALLET</span>
            <h2 id="golden-points-balance-title">Golden Points</h2>
          </div>
          <span className="status-pill">{summary ? "Points only" : "Unavailable"}</span>
        </div>
        <div className="summary-grid">
          <article className="summary-card">
            <span>Points balance</span>
            <strong>{summary ? balance.toLocaleString() : "Unavailable"}</strong>
            <small>Never combined with or converted into Cash Balance</small>
          </article>
          <article className="summary-card">
            <span>Earned today</span>
            <strong>{summary ? summary.earnedToday.toLocaleString() : "—"}</strong>
            <small>{summary ? `${summary.adsCompletedToday} confirmed activities` : "Partner-confirmed only"}</small>
          </article>
          <article className="summary-card">
            <span>Cash Balance category</span>
            <strong>{summary?.surveyCategory ?? (summary ? "Not assigned" : "—")}</strong>
            <small>
              Current Cash Balance: {summary ? `$${summary.cashBalanceUsd.toFixed(2)} USD` : "—"}
            </small>
          </article>
        </div>
        <p className="supporting-copy">
          Your Cash Balance determines survey eligibility only. It is not spent, reserved, or locked when determining your category.
        </p>
      </section>

      <section className="wallet-section" aria-labelledby="points-campaigns-member-title">
        <div className="section-heading">
          <div>
            <span className="eyebrow">PROVIDER-VERIFIED REWARDS</span>
            <h2 id="points-campaigns-member-title">Earn Golden Points</h2>
          </div>
        </div>
        <p className="supporting-copy">
          Points are awarded only after a partner that permits incentivized rewards confirms completion.
        </p>
        {campaignsError ? (
          <div className="empty-state-card" role="status">
            <h3>Points campaigns unavailable</h3>
            <p>{campaignsError}</p>
          </div>
        ) : campaigns.length ? (
          <div className="partner-offer-list">
            {campaigns.map((campaign) => (
              <article className="partner-offer-card" key={campaign.id}>
                <div className="partner-offer-card__top">
                  <span className="eyebrow">{campaign.partner_name}</span>
                  <strong>{campaign.points_reward.toLocaleString()} points</strong>
                </div>
                <h3>{campaign.title}</h3>
                {campaign.description && <p>{campaign.description}</p>}
                {pointsPostbackReady ? (
                  <form action="/api/points/start" method="post">
                    <input type="hidden" name="campaign" value={campaign.id} />
                    <button className="button button--primary">Continue to partner</button>
                  </form>
                ) : <p className="form-message">Campaign rewards are paused until the partner callback is configured.</p>}
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state-card">
            <h3>No points campaigns available</h3>
            <p>Provider-approved campaigns will appear here when enabled.</p>
          </div>
        )}
      </section>

      <section className="wallet-section" aria-labelledby="survey-access-title">
        <div className="section-heading">
          <div>
            <span className="eyebrow">SURVEYS · GOLDEN POINTS ACCESS</span>
            <h2 id="survey-access-title">Survey access</h2>
          </div>
          <span className="status-pill">{accessActive ? "Unlocked" : "Locked"}</span>
        </div>
        {accessActive ? (
          <p className="supporting-copy">
            Access is active until {new Date(summary!.accessUntil!).toLocaleString()}. Survey rewards go to Cash Balance only after review.
          </p>
        ) : (
          <>
            <p className="supporting-copy">
              Unlocking costs {summary?.unlockCost.toLocaleString() ?? "—"} Golden Points and lasts {summary?.accessHours.toLocaleString() ?? "—"} hours. Cash Balance is never used to pay for access.
            </p>
            <form className="admin-ads-form" action={unlockAction}>
              <ActionMessage state={unlockState} />
              <button className="button button--primary" disabled={!canUnlock || unlockPending}>
                {unlockPending ? "Unlocking…" : canUnlock ? "Unlock surveys with points" : "Not enough Golden Points"}
              </button>
            </form>
          </>
        )}
        {surveysError ? (
          <div className="empty-state-card" role="status">
            <h3>Surveys unavailable</h3>
            <p>{surveysError}</p>
          </div>
        ) : accessActive ? (
          surveys.length ? (
            <div className="member-survey-list">
              {surveys.map((survey) => <SurveyResponseForm key={survey.id} survey={survey} />)}
            </div>
          ) : (
            <div className="empty-state-card">
              <h3>No surveys match your current category</h3>
              <p>Eligible surveys will appear here while your access is active.</p>
            </div>
          )
        ) : null}
      </section>
    </>
  );
}