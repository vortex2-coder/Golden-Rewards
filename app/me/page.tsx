import type { Metadata } from "next";
import Link from "next/link";
import { AuthenticatedPage } from "../components/AuthenticatedPage";
import SignOutButton from "../components/SignOutButton";
import ProfileEditForm from "../components/ProfileEditForm";
import { getCurrentMember } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Me",
  description: "Golden Rewards profile, account settings, and support.",
};

async function MeContent() {
  const member = await getCurrentMember();
  if (!member.profile) throw new Error("Could not load the signed-in member profile.");

  const profile = member.profile;
  const initials = `${profile.first_name[0] ?? ""}${profile.last_name[0] ?? ""}`.toUpperCase();

  return (
    <main className="app-page public-page me-page">
      <header className="public-page__heading">
        <span className="eyebrow">ME · ACCOUNT</span>
        <h1>Your profile.</h1>
        <p>Manage your account details and preferences.</p>
      </header>
      <section className="profile-panel">
        <div className="profile-avatar" aria-hidden="true">{initials || "GR"}</div>
        <div className="profile-panel__identity">
          <strong>{profile.first_name} {profile.last_name}</strong>
          <span>@{profile.username}</span>
        </div>
        <span className="status-pill">{profile.email_confirmed_at ? "Verified" : "Unverified"}</span>
      </section>
      <section className="account-details">
        <div className="account-detail"><span>EMAIL ADDRESS</span><strong>{profile.email}</strong></div>
        <div className="account-detail"><span>ACCOUNT ID</span><strong>{profile.id}</strong></div>
        <div className="account-detail"><span>COUNTRY</span><strong>{profile.country}</strong></div>
        <div className="account-detail"><span>PHONE</span><strong>{profile.phone_number_e164}</strong></div>
        <div className="account-detail"><span>ACCOUNT STATUS</span><strong>{profile.account_status === "active" ? "Active" : "Suspended"}</strong></div>
      </section>
      <section className="wallet-section profile-edit-section">
        <div className="section-heading">
          <div><span className="eyebrow">PERSONAL DETAILS</span><h2>Edit profile</h2></div>
        </div>
        <ProfileEditForm firstName={profile.first_name} lastName={profile.last_name} />
      </section>
      <section className="settings-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">PREFERENCES</span>
            <h2>Settings &amp; support</h2>
          </div>
        </div>
        <div className="settings-list">
          <div className="settings-row">
            <span><strong>Language</strong><small>English is currently the available language</small></span>
            <span className="settings-row__value">EN</span>
          </div>
          <Link className="settings-row" href="/forgot-password">
            <span><strong>Password &amp; security</strong><small>Request a secure password reset link</small></span>
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
          <div className="settings-row settings-row--logout">
            <span><strong>Log out</strong><small>End your Golden Rewards session</small></span>
            <SignOutButton />
          </div>
        </div>
      </section>
    </main>
  );
}

export default function MePage() {
  return (
    <AuthenticatedPage>
      <MeContent />
    </AuthenticatedPage>
  );
}
