import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { createSupabaseServerClient, getCurrentUser } from "../../lib/supabase/server";

export const metadata: Metadata = {
  title: "Admin",
  description: "Restricted Golden Rewards registered user count.",
};

export default function AdminPage() {
  return (
    <Suspense fallback={<main className="app-page"><div className="empty-state-card">Loading administrator metrics…</div></main>}>
      <AdminContent />
    </Suspense>
  );
}

async function AdminContent() {
  const auth = await getCurrentUser();

  if (auth.error) {
    return (
      <main className="app-page public-page">
        <div className="empty-state-card" role="alert">
          <h1>Admin access could not be verified</h1>
          <p>{auth.error}</p>
        </div>
      </main>
    );
  }

  if (!auth.configured) {
    return (
      <main className="app-page public-page">
        <div className="empty-state-card">
          <h1>Admin metrics are not configured</h1>
          <p>Configure Supabase and apply the database migration before using admin metrics.</p>
        </div>
      </main>
    );
  }

  if (!auth.user) {
    redirect("/login?next=%2Fadmin");
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase configuration is missing after user authentication.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (profileError) {
    return (
      <main className="app-page public-page">
        <div className="empty-state-card">
          <h1>Admin access could not be verified</h1>
          <p>{profileError.message}</p>
        </div>
      </main>
    );
  }

  if (!profile?.is_admin) {
    notFound();
  }

  const { data: userCount, error: countError } = await supabase.rpc(
    "admin_registered_user_count",
  );

  return (
    <main className="app-page public-page admin-page">
      <header className="public-page__heading">
        <span className="eyebrow">RESTRICTED · ADMIN</span>
        <h1>Golden Rewards overview.</h1>
        <p>Registered accounts in Supabase. This is not a live count of currently online sessions.</p>
      </header>
      {countError ? (
        <div className="empty-state-card" role="alert">
          <h2>User count unavailable</h2>
          <p>{countError.message}</p>
        </div>
      ) : (
        <section className="summary-card admin-metric">
          <span>Total registered users</span>
          <strong>{userCount?.toLocaleString() ?? "—"}</strong>
          <small>Count returned by the admin-only Supabase function</small>
        </section>
      )}
      <section className="wallet-section admin-ad-settings">
        <div className="section-heading">
          <div>
            <span className="eyebrow">ADVERTISING</span>
            <h2>AdSense placements</h2>
          </div>
        </div>
        <p className="supporting-copy">AdSense selects and serves advertisements in publisher placements; individual ads are not uploaded from this dashboard. Configure the approved publisher client and slot using deployment environment settings.</p>
        <p className="supporting-copy">Never reward ad views or clicks. AdSense activity is not a user earning event.</p>
      </section>
      <Link className="back-link" href="/">← Back to Golden Rewards</Link>
    </main>
  );
}
