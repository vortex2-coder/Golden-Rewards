import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { signOut } from "../actions/auth";
import { createSupabaseServerClient, getCurrentUser } from "../../lib/supabase/server";

export const metadata: Metadata = {
  title: "Me",
  description: "Golden Rewards profile, account settings, and support.",
};

export default function MePage() {
  return (
    <Suspense fallback={<main className="app-page"><div className="empty-state-card">Loading account…</div></main>}>
      <MeContent />
    </Suspense>
  );
}

async function MeContent() {
  const auth = await getCurrentUser();
  const supabase = auth.user ? await createSupabaseServerClient() : null;
  const { data: profile, error: profileError } =
    supabase && auth.user
      ? await supabase
          .from("profiles")
          .select("display_name, is_admin")
          .eq("id", auth.user.id)
          .maybeSingle()
      : { data: null, error: null };
  const displayName =
    profile?.display_name ||
    (typeof auth.user?.user_metadata.display_name === "string"
      ? auth.user.user_metadata.display_name
      : null) ||
    auth.user?.email?.split("@")[0] ||
    "Guest";
  const accountError = auth.error ?? profileError?.message ?? null;

  return (
    <main className="app-page public-page me-page">
      <header className="public-page__heading">
        <span className="eyebrow">ME · ACCOUNT</span>
        <h1>Your profile and preferences.</h1>
        <p>Manage account access and find Golden Rewards information.</p>
      </header>
      <section className="profile-panel">
        <div className="profile-avatar" aria-hidden="true">
          {displayName.slice(0, 1).toUpperCase()}
        </div>
        <div className="profile-panel__identity">
          <strong>{displayName}</strong>
          <span>{auth.user ? "Golden Rewards account" : "Not signed in"}</span>
        </div>
        <span className="status-pill">{auth.user ? "Member" : "Guest"}</span>
      </section>
      <section className="account-details">
        <div className="account-detail"><span>Email address</span><strong>{auth.user?.email ?? "Not available"}</strong></div>
        <div className="account-detail"><span>Account ID</span><strong>{auth.user?.id ?? "Not assigned"}</strong></div>
        <div className="account-detail">
          <span>Email verification</span>
          <strong>{auth.user ? (auth.user.email_confirmed_at ? "Verified" : "Pending") : "Not signed in"}</strong>
        </div>
      </section>
      {accountError && <p className="form-message form-message--error" role="alert">{accountError}</p>}
      {!auth.user && (
        <section className="account-callout">
          <div>
            <span className="eyebrow">ACCOUNT</span>
            <h2>Sign in or create an account</h2>
            <p>{auth.configured ? "Your profile, referral link, and account settings require sign-in." : "Supabase account services are not configured yet."}</p>
          </div>
          <div className="button-row">
            <Link className="button button--gold" href="/register">Create account</Link>
            <Link className="button button--outline" href="/login">Sign in</Link>
          </div>
        </section>
      )}
      <section className="settings-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">ACCOUNT</span>
            <h2>Settings &amp; support</h2>
          </div>
        </div>
        <div className="settings-list">
          <div className="settings-row">
            <span><strong>Edit profile</strong><small>Profile editing is not configured</small></span>
            <span className="settings-row__value">—</span>
          </div>
          <div className="settings-row">
            <span><strong>Language preferences</strong><small>English · only language currently available</small></span>
            <span className="settings-row__value">EN</span>
          </div>
          <Link className="settings-row" href="/login">
            <span><strong>Password &amp; security</strong><small>Sign-in and email confirmation are managed by Supabase</small></span>
            <span className="settings-row__arrow" aria-hidden="true">↗</span>
          </Link>
          <Link className="settings-row" href="/contact">
            <span><strong>Help &amp; support</strong><small>Contact information and site status</small></span>
            <span className="settings-row__arrow" aria-hidden="true">↗</span>
          </Link>
          <Link className="settings-row" href="/privacy">
            <span><strong>Privacy policy</strong><small>Account and advertising data information</small></span>
            <span className="settings-row__arrow" aria-hidden="true">↗</span>
          </Link>
          <Link className="settings-row" href="/terms">
            <span><strong>Terms &amp; conditions</strong><small>Golden Rewards terms of use</small></span>
            <span className="settings-row__arrow" aria-hidden="true">↗</span>
          </Link>
          {profile?.is_admin && (
            <Link className="settings-row" href="/admin">
              <span><strong>Admin · user metrics</strong><small>Restricted administrator tools</small></span>
              <span className="settings-row__arrow" aria-hidden="true">↗</span>
            </Link>
          )}
          {auth.user && (
            <form action={signOut}>
              <button className="settings-row settings-row--button" type="submit">
                <span><strong>Log out</strong><small>End your Golden Rewards session</small></span>
                <span className="settings-row__arrow" aria-hidden="true">→</span>
              </button>
            </form>
          )}
        </div>
      </section>
      <aside className="guide-disclaimer">
        Golden Rewards displays standard advertisements only. AdSense views and clicks do not create user rewards or payouts.
      </aside>
    </main>
  );
}
