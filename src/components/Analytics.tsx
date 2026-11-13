"use client";

import Script from "next/script";
import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { initPostHog, posthog } from "@/lib/posthog";

// Loads GA4 + PostHog and sends a pageview on every client-side route change.
export default function Analytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ga4 = process.env.NEXT_PUBLIC_GA4_ID;

  useEffect(() => {
    initPostHog();
  }, []);

  useEffect(() => {
    const url = pathname + (searchParams?.toString() ? `?${searchParams}` : "");
    // GA4 pageview
    if (ga4 && typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "page_view", { page_path: url });
    }
    // PostHog pageview
    if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      posthog.capture("$pageview", { $current_url: window.location.href });
    }
  }, [pathname, searchParams, ga4]);

  return (
    <>
      {ga4 && (
        <>
          {/* GA4 loads in "denied" consent mode until the user accepts (see ConsentBanner). */}
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga4}`} strategy="afterInteractive" />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag('js', new Date());
              gtag('consent', 'default', {
                ad_storage: 'denied', analytics_storage: 'denied',
                ad_user_data: 'denied', ad_personalization: 'denied'
              });
              gtag('config', '${ga4}', { send_page_view: false });
            `}
          </Script>
        </>
      )}
    </>
  );
}
