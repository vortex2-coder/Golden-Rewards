import type { Metadata } from "next";
import { getAdSenseSettings } from "@/lib/adsense";
import AdSenseSettingsForm from "../AdSenseSettingsForm";

export const metadata: Metadata = {
  title: "Ad configuration",
  description: "Configure the Google AdSense display placement.",
};

export default async function AdminAdsPage() {
  const settings = await getAdSenseSettings();

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
    </main>
  );
}
