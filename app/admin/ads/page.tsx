import type { Metadata } from "next";
import { getAdSenseSettings } from "@/lib/adsense";
import { getDefaultPartnerRewardUsd } from "@/lib/reward-settings";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import AdSenseSettingsForm from "../AdSenseSettingsForm";
import EarningTaskForm, { type EarningTaskFormValues } from "../EarningTaskForm";
import PointsConfiguration from "../PointsConfiguration";
import { getPointsAdminData } from "@/lib/points-admin";

export const metadata: Metadata = {
  title: "Ad configuration",
  description: "Configure the Google AdSense display placement.",
};

export default async function AdminAdsPage() {
  const [settings, defaultRewardUsd, supabase, pointsAdminResult] = await Promise.all([
    getAdSenseSettings(),
    getDefaultPartnerRewardUsd(),
    Promise.resolve(createSupabaseAdminClient()),
    getPointsAdminData(),
  ]);
  const taskQuery = supabase
    ? await supabase
        .from("earning_tasks")
        .select(
          "id, partner_name, title, description, destination_url, reward_usd, tracking_parameter, is_active",
        )
        .order("created_at", { ascending: false })
    : null;
  const tasksError = !supabase
    ? "The server-side Supabase service key is missing."
    : taskQuery?.error
      ? "Partner reward tasks are unavailable. Apply the partner rewards database migration."
      : null;
  if (taskQuery?.error) {
    console.error("Could not load partner earning tasks in the admin page.", taskQuery.error);
  }
  const tasks = (taskQuery?.data ?? []) as EarningTaskFormValues[];
  const postbackReady = (process.env.REWARDS_POSTBACK_SECRET?.length ?? 0) >= 32;

  return (
    <main className="app-page public-page admin-page">
      <header className="public-page__heading">
        <span className="eyebrow">ADMIN · AD CONFIGURATION</span>
        <h1>Google AdSense</h1>
        <p>Configure the standard display ad shown on the Earn page.</p>
      </header>

      <section className="wallet-section" aria-labelledby="adsense-settings-title">
        <div className="section-heading">
          <div>
            <span className="eyebrow">PUBLISHER SETTINGS</span>
            <h2 id="adsense-settings-title">Ad unit</h2>
          </div>
          <span className="status-pill">
            {settings?.enabled ? "Enabled" : "Disabled"}
          </span>
        </div>
        {settings ? (
          <AdSenseSettingsForm
            enabled={settings.enabled}
            clientId={settings.clientId}
            slotId={settings.slotId}
            defaultRewardUsd={defaultRewardUsd}
          />
        ) : (
          <div className="empty-state-card" role="status">
            <h3>Ad settings are unavailable</h3>
            <p>
              Configure the server-side Supabase service key and apply the
              AdSense settings migration before adding an ad unit.
            </p>
          </div>
        )}
      </section>

      <section className="wallet-section" aria-labelledby="partner-rewards-title">
        <div className="section-heading">
          <div>
            <span className="eyebrow">PARTNER-CONFIRMED REWARDS</span>
            <h2 id="partner-rewards-title">Earning tasks</h2>
          </div>
          <span className={`status-pill${postbackReady ? "" : " status-pill--warning"}`}>
            {postbackReady ? "Postback ready" : "Postback not configured"}
          </span>
        </div>
        <p className="supporting-copy">
          Configure offers from a partner that expressly allows incentivized rewards. Standard AdSense views and clicks are never credited. A task pays only after a signed server-to-server confirmation.
        </p>
        {!postbackReady && (
          <div className="empty-state-card admin-rewards-notice">
            <h3>Partner confirmation is not configured</h3>
            <p>
              Set the server-only <code>REWARDS_POSTBACK_SECRET</code> environment variable to a random secret of at least 32 characters. Offers remain visible to users but cannot be started until it is set.
            </p>
          </div>
        )}
        {tasksError ? (
          <div className="empty-state-card admin-rewards-notice" role="status">
            <h3>Task configuration is unavailable</h3>
            <p>{tasksError}</p>
          </div>
        ) : (
          <>
            <div className="admin-earning-task-list">
              {tasks.length ? tasks.map((task) => (
                <details className="admin-earning-task" key={task.id}>
                  <summary>
                    <span>
                      <strong>{task.title}</strong>
                      <small>{task.partner_name} · ${Number(task.reward_usd).toFixed(2)} USD</small>
                    </span>
                    <span className="status-pill">{task.is_active ? "Active" : "Paused"}</span>
                  </summary>
                  <EarningTaskForm
                    task={{ ...task, reward_usd: Number(task.reward_usd) }}
                    defaultRewardUsd={defaultRewardUsd}
                  />
                </details>
              )) : (
                <div className="empty-state-card">
                  <h3>No partner tasks configured</h3>
                  <p>Add an offer below. It will stay separate from the standard AdSense placement.</p>
                </div>
              )}
            </div>
            <details className="admin-earning-task admin-earning-task--new">
              <summary><strong>Add a partner task</strong></summary>
              <EarningTaskForm defaultRewardUsd={defaultRewardUsd} />
            </details>
          </>
        )}
        <div className="admin-rewards-guide">
          <h3>Partner callback format</h3>
          <p>
            Task links add an opaque click ID using the configured tracking parameter (default <code>subid</code>). Send a POST request to <code>/api/rewards/postback</code> with a JSON body containing <code>click_id</code>, <code>event_id</code>, <code>transaction_id</code>, and <code>partner_name</code>. Sign the exact raw body with HMAC-SHA256 using <code>REWARDS_POSTBACK_SECRET</code>; send the lowercase hex digest as <code>x-rewards-signature: sha256=&lt;digest&gt;</code>. Never send an amount: the recorded reward is fixed from the task configuration.
          </p>
        </div>
      </section>

      <section className="wallet-section" aria-labelledby="golden-points-title">
        <div className="section-heading">
          <div>
            <span className="eyebrow">POINTS · SURVEY ACCESS</span>
            <h2 id="golden-points-title">Golden Points</h2>
          </div>
        </div>
        {pointsAdminResult.data ? (
          <PointsConfiguration
            settings={pointsAdminResult.data.settings}
            campaigns={pointsAdminResult.data.campaigns}
            pointsPostbackReady={(process.env.POINTS_POSTBACK_SECRET?.length ?? 0) >= 32}
          />
        ) : (
          <div className="empty-state-card" role="status">
            <h3>Golden Points administration unavailable</h3>
            <p>{pointsAdminResult.error}</p>
          </div>
        )}
      </section>
    </main>
  );
}
