"use client";

import { useState } from "react";

export default function ReferralTools({
  referralCode,
  username,
  siteUrl,
}: {
  referralCode: string;
  username: string;
  siteUrl: string;
}) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");
  const referralUrl = `${siteUrl}/register?ref=${encodeURIComponent(referralCode)}`;

  async function copyInvitation() {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      setCopyError("");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
      setCopyError("Could not copy the link. Copy it from the preview below.");
    }
  }

  const shareText = `Join me on Golden Rewards. Use my invitation link: ${referralUrl}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  return (
    <section className="referral-panel">
      <div className="referral-panel__heading">
        <div>
          <span className="eyebrow">YOUR INVITATION</span>
          <h2>Invite your team</h2>
        </div>
        <span className="status-pill">Personal link</span>
      </div>
      <p>Get $10.00 USD when you join with a referral, and earn another $10.00 USD for each new member who joins with your link or code.</p>
      <div className="referral-code-box">
        <span>REFERRAL CODE</span>
        <strong>{referralCode}</strong>
        <small>Invited by @{username}</small>
      </div>
      <div className="referral-actions">
        <button className="button button--gold" type="button" onClick={copyInvitation}>
          {copied ? "Link copied" : "Copy invite link"}
        </button>
        <a className="button button--outline" href={whatsappUrl} target="_blank" rel="noreferrer">
          Share on WhatsApp
        </a>
      </div>
      {copyError && <p className="auth-feedback auth-feedback--error" role="alert">{copyError}</p>}
      <p className="referral-link-preview">{referralUrl}</p>
    </section>
  );
}
