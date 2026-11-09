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
      <Link className="admin-section-nav__brand" href="/admin">
        <span className="desktop-sidebar__mark" aria-hidden="true">GR</span>
        <span>GOLDEN<strong>ADMIN</strong></span>
      </Link>
      <span className="desktop-sidebar__caption">ADMINISTRATION</span>
      <div className="admin-section-nav__links">
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
              <span className="admin-section-nav__icon" aria-hidden="true">
                {section.label === "Home" ? "OV" : section.label === "Users" ? "US" : "AD"}
              </span>
              <span>{section.label}</span>
            </Link>
          );
        })}
      </div>
      <Link className="admin-section-nav__support" href="/">Return to member site <span aria-hidden="true">↗</span></Link>
    </nav>
  );
}
