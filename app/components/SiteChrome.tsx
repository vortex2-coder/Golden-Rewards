import { getCurrentMember } from "@/lib/supabase/server";

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
  const greetingName = member.profile?.username ?? "guest";

  return (
    <>
      <header className="site-header">
        <div className="site-header__greeting">
          <strong>hello, {greetingName}</strong>
          <span>Welcome to Golden Rewards</span>
        </div>
        <span className="language-chip" aria-label="Current language: English">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
          </svg>
          EN
        </span>
      </header>
    </>
  );
}
