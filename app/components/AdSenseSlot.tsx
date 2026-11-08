"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

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
  const [loadError, setLoadError] = useState(false);

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
      <Script
        async
        crossOrigin="anonymous"
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`}
        strategy="afterInteractive"
        onError={() => setLoadError(true)}
      />
      <ins
        className="adsbygoogle"
        style={{ display: "block", minHeight: 90 }}
        data-ad-client={clientId}
        data-ad-slot={slotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
      {loadError && (
        <p className="form-message" role="alert">
          The ad placement could not load. Ad activity is never credited as a reward.
        </p>
      )}
    </div>
  );
}
