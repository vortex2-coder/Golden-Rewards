import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { signOutAction } from "@/app/actions/auth";
import { createSupabaseServerClient, getCurrentMember } from "@/lib/supabase/server";

export async function AuthenticatedPage({ children }: { children: ReactNode }) {
  const member = await getCurrentMember();

  if (!member.configured) {
    return (
      <main className="app-page auth-required-state">
        <span className="eyebrow">ACCOUNT SETUP</span>
        <h1>Sign-in is being prepared.</h1>
        <p>Golden Rewards account pages will be available after the site owner configures the Supabase project.</p>
        <Link className="button button--outline" href="/login">Go to log in</Link>
      </main>
    );
  }
  if (!member.user) redirect("/login");
  if (!member.profile) {
    return (
      <main className="app-page auth-required-state">
        <span className="eyebrow">ACCOUNT UNAVAILABLE</span>
        <h1>We could not load your profile.</h1>
        <p>Try signing out and back in. Contact support if the problem continues.</p>
        <form action={signOutAction}>
          <button className="button button--outline" type="submit">Sign out</button>
        </form>
      </main>
    );
  }
  if (member.profile.account_status === "suspended") {
    const supabase = await createSupabaseServerClient();
    if (supabase) await supabase.auth.signOut();
    redirect("/login?message=suspended");
  }

  return children;
}
