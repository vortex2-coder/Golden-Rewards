import type { Metadata } from "next";
import { Suspense } from "react";
import AuthForm from "../components/AuthForm";
import { signIn } from "../actions/auth";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Golden Rewards account.",
};

type LoginPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default function LoginPage(props: LoginPageProps) {
  return (
    <Suspense fallback={<main className="app-page"><div className="empty-state-card">Loading sign-in…</div></main>}>
      <LoginForm searchParams={props.searchParams} />
    </Suspense>
  );
}

async function LoginForm({ searchParams }: LoginPageProps) {
  const { next } = await searchParams;
  return <AuthForm action={signIn} mode="login" nextPath={next === "/admin" ? "/admin" : "/"} />;
}
