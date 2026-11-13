"use client";

import { useEffect, useState } from "react";
import { posthog } from "@/lib/posthog";

// Simple cookie-consent banner. Trackers stay off until the user accepts.
// Grants GA4 Consent Mode and enables PostHog session recording on accept.
export default function ConsentBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const choice = localStorage.getItem("cookie_consent");
    if (!choice) setShow(true);
    if (choice === "accepted") grant();
  }, []);

  function grant() {
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("consent", "update", {
        ad_storage: "granted",
        analytics_storage: "granted",
        ad_user_data: "granted",
        ad_personalization: "granted",
      });
    }
    try {
      posthog.set_config({ disable_session_recording: false });
      posthog.startSessionRecording?.();
    } catch {}
  }

  function decide(accepted: boolean) {
    localStorage.setItem("cookie_consent", accepted ? "accepted" : "rejected");
    if (accepted) grant();
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[9999] border-t border-black/10 bg-white/95 p-4 backdrop-blur">
      <div className="mx-auto flex max-w-content flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-600">
          We use cookies for analytics to improve the site. You can accept or decline non-essential cookies.
        </p>
        <div className="flex shrink-0 gap-2">
          <button onClick={() => decide(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm">
            Decline
          </button>
          <button onClick={() => decide(true)} className="btn-primary text-sm">
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
