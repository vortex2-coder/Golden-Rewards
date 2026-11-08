import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getCurrentMember } from "@/lib/supabase/server";
import AdminSectionNavigation from "./AdminSectionNavigation";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const member = await getCurrentMember();

  if (!member.configured || !member.user) redirect("/login");
  if (
    !member.profile ||
    member.profile.account_status !== "active" ||
    member.user.app_metadata?.role !== "admin"
  ) {
    notFound();
  }

  return (
    <>
      <AdminSectionNavigation />
      {children}
    </>
  );
}
