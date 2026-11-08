"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const adminSections = [
  { href: "/admin", label: "Home" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/ads", label: "Ad Configuration" },
];

export default function AdminSectionNavigation() {
  const pathname = usePathname();

  return (
    <nav className="admin-section-nav" aria-label="Admin sections">
      {adminSections.map((section) => {
        const active =
          pathname === section.href ||
          (section.href !== "/admin" && pathname.startsWith(`${section.href}/`));
        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={active ? "is-active" : undefined}
            href={section.href}
            key={section.href}
          >
            {section.label}
          </Link>
        );
      })}
    </nav>
  );
}
