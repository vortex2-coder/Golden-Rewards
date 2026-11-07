import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthFallback, AuthPageFrame, getAuthPageContext } from "@/app/components/AuthPageFrame";
import { LoginForm } from "@/app/components/AuthForms";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to your Golden Rewards account.",
};

async function LoginContent({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string | string[]; message?: string | string[] }>;
}) {
  const [params, context] = await Promise.all([searchParams, getAuthPageContext()]);
  const referral = typeof params.ref === "string" ? params.ref.slice(0, 64) : "";
  const message =
    params.message === "suspended"
      ? "This account is currently suspended. Contact support for assistance."
      : params.message === "link-invalid"
        ? "That verification or reset link is invalid or has expired. Request a new link."
        : "";

  return (
    <AuthPageFrame
      eyebrow="MEMBER ACCESS"
      title="Welcome back."
      description="Log in securely to continue to your Golden Rewards account."
    >
      <LoginForm referral={referral} configured={context.configured} notice={message} />
    </AuthPageFrame>
  );
}

export default function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  return (
    <Suspense fallback={<AuthFallback />}>
      <LoginContent searchParams={searchParams} />
    </Suspense>
  );
}
