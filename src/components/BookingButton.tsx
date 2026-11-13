"use client";

import { useEffect } from "react";
import { capture } from "@/lib/posthog";

// Opens a Cal.com popup for booking a consultation.
// Set NEXT_PUBLIC_CALCOM_LINK to your "team/event" slug.
export default function BookingButton({
  children = "Book a free consultation",
  className = "btn-primary",
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  const link = process.env.NEXT_PUBLIC_CALCOM_LINK;

  useEffect(() => {
    // Load Cal.com embed script once.
    (function (C: any, A: string, L: string) {
      const p = (a: any, ar: any) => a.q.push(ar);
      const d = C.document;
      C.Cal =
        C.Cal ||
        function (...args: any[]) {
          const cal = C.Cal;
          const ar = arguments;
          if (!cal.loaded) {
            cal.ns = {};
            cal.q = cal.q || [];
            d.head.appendChild(d.createElement("script")).src = A;
            cal.loaded = true;
          }
          if (ar[0] === L) {
            const api: any = function (...a: any[]) { p(api, arguments); };
            const namespace = ar[1];
            api.q = api.q || [];
            typeof namespace === "string" ? (cal.ns[namespace] = api) && p(api, ar) : p(cal, ar);
            return;
          }
          p(cal, ar);
        };
    })(window, "https://app.cal.com/embed/embed.js", "init");

    (window as any).Cal?.("init", { origin: "https://app.cal.com" });
  }, []);

  function open() {
    capture("booking_opened", { link });
    (window as any).Cal?.("modal", { calLink: link });
  }

  if (!link) return null;
  return (
    <button onClick={open} className={className}>
      {children}
    </button>
  );
}
