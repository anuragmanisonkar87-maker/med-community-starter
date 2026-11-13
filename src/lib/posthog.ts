import posthog from "posthog-js";

// Thin wrapper so components can call capture() without importing posthog-js directly.
export function initPostHog() {
  if (typeof window === "undefined") return;
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
  if ((posthog as any).__loaded) return;
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
    capture_pageview: false, // we send pageviews manually on route change
    person_profiles: "identified_only",
    // Session recording stays OFF until the user consents (see ConsentBanner).
    disable_session_recording: true,
  });
}

export function capture(event: string, props?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  try {
    posthog.capture(event, props);
  } catch {
    /* analytics must never break the app */
  }
}

export { posthog };
