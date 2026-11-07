import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthFallback, AuthPageFrame, getAuthPageContext } from "@/app/components/AuthPageFrame";
import { UpdatePasswordForm } from "@/app/components/AuthForms";

export const metadata: Metadata = {
  title: "Choose a new password",
  description: "Update your Golden Rewards account password.",
};

async function ResetPasswordContent() {
  const context = await getAuthPageContext(false);
  if (!context.member.user) redirect("/login?message=link-invalid");

  return (
    <AuthPageFrame
      eyebrow="SECURE YOUR ACCOUNT"
      title="Choose a new password."
      description="Use a strong password you have not used on another site."
    >
      <UpdatePasswordForm />
    </AuthPageFrame>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<AuthFallback />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
