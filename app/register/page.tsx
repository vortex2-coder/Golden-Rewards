import type { Metadata } from "next";
import { Suspense } from "react";
import AuthForm from "../components/AuthForm";
import { signUp } from "../actions/auth";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Create a Golden Rewards account.",
};

type RegisterPageProps = {
  searchParams: Promise<{ ref?: string }>;
};

export default function RegisterPage(props: RegisterPageProps) {
  return (
    <Suspense fallback={<main className="app-page"><div className="empty-state-card">Loading registration…</div></main>}>
      <RegisterForm searchParams={props.searchParams} />
    </Suspense>
  );
}

async function RegisterForm({ searchParams }: RegisterPageProps) {
  const { ref } = await searchParams;
  const referralCode = ref && /^[a-zA-Z0-9]{10}$/.test(ref) ? ref.toUpperCase() : "";

  return (
    <AuthForm
      action={signUp}
      mode="register"
      referralCode={referralCode}
    />
  );
}
