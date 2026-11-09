import Link from "next/link";
import { getCurrentMember } from "@/lib/supabase/server";
import ThemeSwitcher from "./ThemeSwitcher";

export default function SiteChrome() {
  const memberPromise = getCurrentMember();
  return <SiteChromeContent memberPromise={memberPromise} />;
}

async function SiteChromeContent({
  memberPromise,
}: {
  memberPromise: ReturnType<typeof getCurrentMember>;
}) {
  const member = await memberPromise;
  const profile = member.profile;
  const greetingName = profile?.username ?? "guest";
  const initials = profile
    ? `${profile.first_name[0] ?? ""}${profile.last_name[0] ?? ""}`.toUpperCase()
    : "GR";

  return (
    <>
      <header className="site-header">
        <div className="site-header__greeting">
          <span className="site-header__eyebrow">GOLDEN REWARDS</span>
          <strong>{profile ? `Welcome back, @${greetingName}` : "Welcome to Golden Rewards"}</strong>
          <span>Your rewards workspace</span>
        </div>
        {profile ? (
          <Link className="site-header__profile" href="/me" aria-label={`View profile for ${greetingName}`}>
            <span className="site-header__avatar" aria-hidden="true">{initials || "GR"}</span>
            <span className="site-header__profile-copy">
              <strong>@{greetingName}</strong>
              <small>Account</small>
            </span>
            <span className="site-header__profile-arrow" aria-hidden="true">↗</span>
          </Link>
        ) : (
          <Link className="site-header__guest-link" href="/login">Member sign in <span aria-hidden="true">↗</span></Link>
        )}
        <ThemeSwitcher />
      </header>
    </>
  );
}
