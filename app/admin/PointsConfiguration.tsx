"use client";

import { useActionState } from "react";
import {
  savePointsCampaign,
  savePointsSettings,
  type AdminPointsActionState,
} from "./points-actions";
import type {
  AdminPointsCampaign,
  AdminPointsSettings,
} from "@/lib/points-admin";

const initialState: AdminPointsActionState = {};

function ActionMessage({ state }: { state: AdminPointsActionState }) {
  return (
    <>
      {state.error && <p className="form-message" role="alert">{state.error}</p>}
      {state.success && <p className="form-message form-message--success" role="status">{state.success}</p>}
    </>
  );
}

function PointsSettingsForm({ settings }: { settings: AdminPointsSettings }) {
  const [state, action, pending] = useActionState(savePointsSettings, initialState);
  return (
    <form className="admin-ads-form" action={action}>
      <label className="admin-ads-form__field">
        <span>Maximum Golden Points per user per day</span>
        <input name="maxPointsPerDay" type="number" min="1" step="1" required defaultValue={settings.max_points_per_day || ""} />
      </label>
      <label className="admin-ads-form__field">
        <span>Maximum rewarded activities per user per day</span>
        <input name="maxRewardedAdsPerDay" type="number" min="1" step="1" required defaultValue={settings.max_rewarded_ads_per_day || ""} />
      </label>
      <label className="admin-ads-form__field">
        <span>Golden Points to unlock surveys</span>
        <input name="surveyUnlockPoints" type="number" min="1" step="1" required defaultValue={settings.survey_unlock_points || ""} />
      </label>
      <label className="admin-ads-form__field">
        <span>Survey access duration (hours)</span>
        <input name="surveyAccessHours" type="number" min="1" max="8760" step="1" required defaultValue={settings.survey_access_hours || ""} />
      </label>
      <label className="admin-ads-form__toggle">
        <input name="enabled" type="checkbox" defaultChecked={settings.enabled} />
        <span>Enable partner-confirmed Golden Points campaigns</span>
      </label>
      <p className="supporting-copy">
        Golden Points are separate from Cash Balance and cannot be exchanged for cash. Google AdSense impressions and clicks must never award points.
      </p>
      <ActionMessage state={state} />
      <button className="button button--primary" disabled={pending}>
        {pending ? "Saving…" : "Save points settings"}
      </button>
    </form>
  );
}

function CampaignForm({
  campaign,
}: {
  campaign?: AdminPointsCampaign;
}) {
  const [state, action, pending] = useActionState(savePointsCampaign, initialState);
  return (
    <form className="admin-ads-form admin-task-form" action={action}>
      {campaign && <input type="hidden" name="campaignId" value={campaign.id} />}
      <label className="admin-ads-form__field">
        <span>Approved rewarded partner</span>
        <input name="partnerName" required minLength={2} maxLength={80} defaultValue={campaign?.partner_name ?? ""} placeholder="Partner name" />
      </label>
      <label className="admin-ads-form__field">
        <span>Campaign title</span>
        <input name="title" required minLength={3} maxLength={120} defaultValue={campaign?.title ?? ""} />
      </label>
      <label className="admin-ads-form__field">
        <span>Instructions</span>
        <textarea name="description" rows={3} maxLength={500} defaultValue={campaign?.description ?? ""} />
      </label>
      <label className="admin-ads-form__field">
        <span>Partner destination URL</span>
        <input name="destinationUrl" type="url" required defaultValue={campaign?.destination_url ?? ""} placeholder="https://partner.example/campaign" />
      </label>
      <label className="admin-ads-form__field">
        <span>Golden Points per verified completion</span>
        <input name="pointsReward" type="number" min="1" step="1" required defaultValue={campaign?.points_reward ?? ""} />
      </label>
      <label className="admin-ads-form__field">
        <span>Tracking parameter</span>
        <input name="trackingParameter" maxLength={40} pattern="[A-Za-z][A-Za-z0-9_]{0,39}" defaultValue={campaign?.tracking_parameter ?? "subid"} required />
        <small>The click ID is sent to the partner under this query parameter.</small>
      </label>
      <label className="admin-ads-form__field">
        <span>Available countries (ISO codes)</span>
        <input name="allowedCountries" defaultValue={campaign?.allowed_countries.join(", ") ?? ""} placeholder="KE, UG, TZ" />
        <small>Leave blank for all countries supported by your provider.</small>
      </label>
      <label className="admin-ads-form__toggle">
        <input name="isActive" type="checkbox" defaultChecked={campaign?.is_active ?? false} />
        <span>Make this provider-approved campaign available</span>
      </label>
      <ActionMessage state={state} />
      <button className="button button--primary" disabled={pending}>
        {pending ? "Saving…" : campaign ? "Save campaign" : "Add points campaign"}
      </button>
    </form>
  );
}

export default function PointsConfiguration({
  settings,
  campaigns,
  pointsPostbackReady,
}: {
  settings: AdminPointsSettings;
  campaigns: AdminPointsCampaign[];
  pointsPostbackReady: boolean;
}) {
  return (
    <>
      <section className="wallet-section" aria-labelledby="points-settings-title">
        <div className="section-heading">
          <div>
            <span className="eyebrow">SEPARATE REWARD WALLET</span>
            <h2 id="points-settings-title">Golden Points settings</h2>
          </div>
          <span className={`status-pill${pointsPostbackReady ? "" : " status-pill--warning"}`}>
            {pointsPostbackReady ? "Provider callback ready" : "Provider callback not configured"}
          </span>
        </div>
        {!pointsPostbackReady && (
          <div className="empty-state-card admin-rewards-notice">
            <h3>Partner confirmation is required</h3>
            <p>
              Add a random server-only <code>POINTS_POSTBACK_SECRET</code> (at least 32 characters) in Vercel before enabling campaigns. This is separate from the AdSense settings and secret.
            </p>
          </div>
        )}
        <PointsSettingsForm settings={settings} />
      </section>

      <section className="wallet-section" aria-labelledby="points-campaigns-title">
        <div className="section-heading">
          <div>
            <span className="eyebrow">REWARDED PARTNER ACTIVITIES</span>
            <h2 id="points-campaigns-title">Golden Points campaigns</h2>
          </div>
          <span className="status-pill">{campaigns.length} configured</span>
        </div>
        <p className="supporting-copy">
          Only use a partner contract and campaign that explicitly allow incentivized points. Never connect these rewards to standard Google AdSense ads.
        </p>
        <div className="admin-earning-task-list">
          {campaigns.map((campaign) => (
            <details className="admin-earning-task" key={campaign.id}>
              <summary>
                <span>
                  <strong>{campaign.title}</strong>
                  <small>{campaign.partner_name} · {campaign.points_reward.toLocaleString()} points</small>
                </span>
                <span className="status-pill">{campaign.is_active ? "Active" : "Paused"}</span>
              </summary>
              <CampaignForm campaign={campaign} />
            </details>
          ))}
        </div>
        <details className="admin-earning-task admin-earning-task--new">
          <summary><strong>Add a provider-approved campaign</strong></summary>
          <CampaignForm />
        </details>
        <div className="admin-rewards-guide">
          <h3>Partner callback</h3>
          <p>
            Pass the opaque click ID using the campaign tracking parameter, then POST JSON fields <code>click_id</code>, <code>event_id</code>, <code>transaction_id</code>, and <code>partner_name</code> to <code>/api/points/postback</code>. Sign the exact raw JSON body with HMAC-SHA256 using <code>POINTS_POSTBACK_SECRET</code> and send <code>x-rewards-signature: sha256=&lt;hex-digest&gt;</code>. Do not send a points amount; Golden Rewards uses the stored campaign settings and enforces daily limits.
          </p>
        </div>
      </section>
    </>
  );
}