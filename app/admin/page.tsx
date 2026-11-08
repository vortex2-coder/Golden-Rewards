import type { Metadata } from "next";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Admin home",
  description: "Golden Rewards administrator overview.",
};

async function getAdminOverview() {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return null;

  const [membersResult, suspendedResult, referralsResult, recentResult] =
    await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("account_status", "suspended"),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .not("referred_by_user_id", "is", null),
      supabase
        .from("profiles")
        .select("id, username, created_at, account_status")
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

  if (
    membersResult.error ||
    suspendedResult.error ||
    referralsResult.error ||
    recentResult.error
  ) {
    throw new Error("Could not load the admin overview from Supabase.");
  }

  return {
    memberCount: membersResult.count ?? 0,
    suspendedCount: suspendedResult.count ?? 0,
    referralCount: referralsResult.count ?? 0,
    recentMembers: recentResult.data ?? [],
  };
}

export default async function AdminPage() {
  const overview = await getAdminOverview();

  return (
    <main className="app-page public-page admin-page">
      <header className="public-page__heading">
        <span className="eyebrow">ADMIN · HOME</span>
        <h1>Platform overview</h1>
        <p>Registered accounts and recent platform activity.</p>
      </header>

      {!overview ? (
        <section className="empty-state-card" role="status">
          <h2>Admin data is not configured</h2>
          <p>
            Add the server-only Supabase secret key to this deployment before
            using the admin overview.
          </p>
        </section>
      ) : (
        <>
          <section className="summary-grid" aria-label="Account overview">
            <article className="summary-card">
              <span>Total users registered</span>
              <strong>{overview.memberCount}</strong>
              <small>All registered platform accounts</small>
            </article>
            <article className="summary-card">
              <span>Suspended accounts</span>
              <strong>{overview.suspendedCount}</strong>
              <small>Current account status</small>
            </article>
            <article className="summary-card">
              <span>Referred members</span>
              <strong>{overview.referralCount}</strong>
              <small>Registrations attributed to a referral</small>
            </article>
          </section>

          <section className="wallet-section" aria-labelledby="recent-members-title">
            <div className="section-heading">
              <div>
                <span className="eyebrow">MEMBERS</span>
                <h2 id="recent-members-title">Recent signups</h2>
              </div>
              <span className="status-pill">{overview.recentMembers.length} shown</span>
            </div>
            {overview.recentMembers.length ? (
              <div className="referral-history-list">
                {overview.recentMembers.map((profile) => (
                  <article className="referral-history-row" key={profile.id}>
                    <span className="profile-avatar profile-avatar--small" aria-hidden="true">
                      {profile.username.slice(0, 1).toUpperCase()}
                    </span>
                    <span>
                      <strong>@{profile.username}</strong>
                      <small>Joined {new Date(profile.created_at).toLocaleDateString()}</small>
                    </span>
                    <span className="status-pill">
                      {profile.account_status === "active" ? "Active" : "Suspended"}
                    </span>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state-card">
                <h3>No member accounts</h3>
                <p>New registrations will appear here.</p>
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
