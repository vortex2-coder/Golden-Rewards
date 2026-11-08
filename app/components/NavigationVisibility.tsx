"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export default function NavigationVisibility({
  authenticated,
  admin,
  navigation,
}: {
  authenticated: boolean;
  admin: boolean;
  navigation: ReactNode;
}) {
  const pathname = usePathname();

  if (!authenticated || admin || pathname.startsWith("/admin")) return null;
  return navigation;
}
