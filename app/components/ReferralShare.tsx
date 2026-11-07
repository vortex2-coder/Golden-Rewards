"use client";

import { useState } from "react";

export default function ReferralShare({ referralCode }: { referralCode: string }) {
  const [message, setMessage] = useState("");

  function getReferralLink() {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    return `${baseUrl.replace(/\/$/, "")}/register?ref=${encodeURIComponent(referralCode)}`;
  }

  const displayedLink = `${(process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "")}/register?ref=${encodeURIComponent(referralCode)}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(getReferralLink());
      setMessage("Referral link copied.");
    } catch {
      setMessage("Could not copy the link. Copy it from the box above.");
    }
  }

  async function shareLink() {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Join Golden Rewards",
          text: "Create a Golden Rewards account.",
          url: getReferralLink(),
        });
        return;
      }

      await copyLink();
    } catch {
      setMessage("Could not share the link. Copy it from the box above.");
    }
  }

  return (
    <>
      <div className="referral-link-preview">{displayedLink}</div>
      <div className="button-row">
        <button className="button button--gold" type="button" onClick={copyLink}>Copy link</button>
        <button className="button button--outline" type="button" onClick={shareLink}>Share invite</button>
      </div>
      {message && <p className="form-message" role="status">{message}</p>}
    </>
  );
}
