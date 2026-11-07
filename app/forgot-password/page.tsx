import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthFallback, AuthPageFrame, getAuthPageContext } from "@/app/components/AuthPageFrame";
import { ForgotPasswordForm } from "@/app/components/AuthForms";

export const metadata: Metadata = {
  title: "Reset password",
  description: "Request a Golden Rewards password reset link. Email delivery may be restricted.",
};

async function ForgotPasswordContent() {
  const context = await getAuthPageContext(false);
  return (
    <AuthPageFrame
      eyebrow="ACCOUNT RECOVERY"
      title="Reset your password."
      description="Email confirmation is disabled. Supabase’s default email service may not deliver reset links to public addresses."
    >
      <ForgotPasswordForm configured={context.configured} />
    </AuthPageFrame>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<AuthFallback />}>
      <ForgotPasswordContent />
    </Suspense>
  );
}
