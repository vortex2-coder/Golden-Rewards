import type { Metadata } from "next";
import { Suspense } from "react";
import "./premium.css";
import AuthenticatedNavigation from "./components/AuthenticatedNavigation";
import SiteChrome from "./components/SiteChrome";

export const metadata: Metadata = {
  title: {
    default: "Golden Rewards",
    template: "%s | Golden Rewards",
  },
  description: "Golden Rewards account, referrals, wallet, and advertising platform.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-theme="dark">
      <body>
        <div className="app-shell">
          <Suspense fallback={
            <header className="site-header">
              <div className="site-header__greeting">
                <strong>hello, reader</strong>
                <span>Welcome to Golden Rewards</span>
              </div>
              <span className="language-chip" aria-label="Current language: English">EN</span>
            </header>
          }>
            <SiteChrome />
          </Suspense>
          <Suspense fallback={null}>{children}</Suspense>
        </div>
        <Suspense fallback={null}>
          <AuthenticatedNavigation />
        </Suspense>
      </body>
    </html>
  );
}
