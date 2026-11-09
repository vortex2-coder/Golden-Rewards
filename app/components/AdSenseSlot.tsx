"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    adsbygoogle?: Record<string, never>[];
  }
}

export default function AdSenseSlot({
  clientId,
  slotId,
  enabled,
}: {
  clientId: string;
  slotId: string;
  enabled: boolean;
}) {
  const configured = enabled && clientId && slotId;

  useEffect(() => {
    if (configured) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (error) {
        console.error("Could not initialize the AdSense placement.", error);
      }
    }
  }, [configured]);

  if (!configured) {
    return (
      <div className="ad-placeholder" role="status">
        <span className="eyebrow">ADVERTISEMENT</span>
        <p>Ad placement is not configured.</p>
      </div>
    );
  }

  return (
    <div className="ad-slot">
      <span className="eyebrow">ADVERTISEMENT</span>
      <ins
        className="adsbygoogle"
        style={{ display: "block", minHeight: 90 }}
        data-ad-client={clientId}
        data-ad-slot={slotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
