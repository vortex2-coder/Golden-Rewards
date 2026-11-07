"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "HOME", icon: "home" },
  { href: "/earn", label: "EARN", icon: "earn" },
  { href: "/team", label: "TEAM", icon: "team" },
  { href: "/wallet", label: "WALLET", icon: "wallet" },
  { href: "/me", label: "ME", icon: "me" },
];

function NavigationIcon({ name }: { name: string }) {
  const shared = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.8,
    viewBox: "0 0 24 24",
  };

  switch (name) {
    case "home":
      return <svg {...shared} aria-hidden="true"><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9M9 20v-6h6v6" /></svg>;
    case "earn":
      return <svg {...shared} aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="m10 8 6 4-6 4z" /></svg>;
    case "team":
      return <svg {...shared} aria-hidden="true"><circle cx="9" cy="8" r="3" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0M16 5.5a3 3 0 0 1 0 5.8M17 14a5 5 0 0 1 3.5 4.8" /></svg>;
    case "wallet":
      return <svg {...shared} aria-hidden="true"><rect x="3" y="5" width="18" height="15" rx="2.5" /><path d="M3 9h18M16 14h2" /><path d="M7 5V3h11" /></svg>;
    default:
      return <svg {...shared} aria-hidden="true"><circle cx="12" cy="8" r="3.5" /><path d="M4.5 21a7.5 7.5 0 0 1 15 0" /></svg>;
  }
}

export default function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {items.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== "/" && pathname.startsWith(`${item.href}/`));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`bottom-nav__item ${active ? "is-active" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            <span className="bottom-nav__icon">
              <NavigationIcon name={item.icon} />
            </span>
            <span className="bottom-nav__label">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
