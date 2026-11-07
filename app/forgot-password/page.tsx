import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthFallback, AuthPageFrame, getAuthPageContext } from "@/app/components/AuthPageFrame";
import { ForgotPasswordForm } from "@/app/components/AuthForms";

export const metadata: Metadata = {
  title: "Reset password",
  description: "Request a secure Golden Rewards password reset link.",
};

async function ForgotPasswordContent() {
  const context = await getAuthPageContext(false);
  return (
    <AuthPageFrame
      eyebrow="ACCOUNT RECOVERY"
      title="Reset your password."
      description="Enter your account email and we’ll send a secure reset link if it matches an account."
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
