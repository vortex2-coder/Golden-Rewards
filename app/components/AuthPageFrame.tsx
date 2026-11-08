import Link from "next/link";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient, getCurrentMember } from "@/lib/supabase/server";

export async function getAuthPageContext(redirectAuthenticated = true) {
  const member = await getCurrentMember();
  if (redirectAuthenticated && member.user && member.profile?.account_status === "active") {
    redirect(member.user.app_metadata?.role === "admin" ? "/admin" : "/");
  }
  if (member.user && member.profile?.account_status === "suspended") {
    const supabase = await createSupabaseServerClient();
    if (supabase) await supabase.auth.signOut();
  }
  return { configured: member.configured, member };
}

export function AuthPageFrame({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="auth-page">
      <div className="auth-card">
        <Link className="auth-brand" href="/" aria-label="Golden Rewards">
          <span className="auth-brand__mark">GR</span>
          <span>GOLDEN <strong>REWARDS</strong></span>
        </Link>
        <header className="auth-heading">
          <span className="eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </header>
        {children}
        <p className="auth-footnote">
          By using Golden Rewards, you agree to our <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </div>
    </main>
  );
}

export function AuthFallback() {
  return (
    <main className="auth-page">
      <div className="auth-card auth-card--loading" aria-label="Loading authentication page">
        <span className="auth-brand__mark">GR</span>
        <span className="auth-loading-line" />
      </div>
    </main>
  );
}
