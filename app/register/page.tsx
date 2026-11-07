import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthFallback, AuthPageFrame, getAuthPageContext } from "@/app/components/AuthPageFrame";
import { SignupForm } from "@/app/components/AuthForms";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Create your Golden Rewards account.",
};

async function RegisterContent({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string | string[] }>;
}) {
  const [params, context] = await Promise.all([searchParams, getAuthPageContext()]);
  const referral = typeof params.ref === "string" ? params.ref.slice(0, 64) : "";

  return (
    <AuthPageFrame
      eyebrow="WELCOME TO GOLDEN REWARDS"
      title="Create your account."
      description="Set up your profile to access your rewards account, invitations, and wallet."
    >
      <SignupForm initialReferral={referral} configured={context.configured} />
    </AuthPageFrame>
  );
}

export default function RegisterPage({
  searchParams,
}: PageProps<"/register">) {
  return (
    <Suspense fallback={<AuthFallback />}>
      <RegisterContent searchParams={searchParams} />
    </Suspense>
  );
}
