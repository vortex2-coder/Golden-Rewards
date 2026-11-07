import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthFallback, AuthPageFrame, getAuthPageContext } from "@/app/components/AuthPageFrame";

export const metadata: Metadata = {
  title: "Verify your email",
  description: "Verify your email address to activate your Golden Rewards account.",
};

async function VerifyEmailContent() {
  await getAuthPageContext();
  return (
    <AuthPageFrame
      eyebrow="ONE LAST STEP"
      title="Check your inbox."
      description="We sent a verification link to the email address you used to register. Open it on this device to activate your account."
    >
      <div className="auth-verification-card">
        <span className="auth-verification-card__icon" aria-hidden="true">✉</span>
        <div>
          <strong>Verify your email address</strong>
          <p>The link will return you to Golden Rewards after verification. If you don’t see it, check your spam folder.</p>
        </div>
      </div>
      <p className="auth-switch">Already verified? <Link href="/login">Log in</Link></p>
    </AuthPageFrame>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<AuthFallback />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
