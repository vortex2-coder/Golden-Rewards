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
    <html lang="en">
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5651051237474715"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <div className="site-frame">
          <div className="app-shell">
            <Suspense fallback={
              <header className="site-header">
                <div className="site-header__greeting">
                  <span className="site-header__eyebrow">GOLDEN REWARDS</span>
                  <strong>Welcome to Golden Rewards</strong>
                  <span>Your rewards workspace</span>
                </div>
              </header>
            }>
              <SiteChrome />
            </Suspense>
            <Suspense fallback={null}>{children}</Suspense>
          </div>
          <Suspense fallback={null}>
            <AuthenticatedNavigation />
          </Suspense>
        </div>
      </body>
    </html>
  );
}
