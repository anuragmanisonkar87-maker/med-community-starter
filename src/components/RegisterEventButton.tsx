"use client";

import { useState } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { capture } from "@/lib/posthog";

// Razorpay checkout for a PAID event. Free events use a plain form instead.
export default function RegisterEventButton({
  eventId, priceLabel, userName, userPhone,
}: {
  eventId: string; priceLabel: string; userName?: string; userPhone?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function register() {
    setError(null);
    setLoading(true);
    capture("event_checkout_started", { eventId });

    const res = await fetch("/api/razorpay/event-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId }),
    });
    if (!res.ok) {
      setLoading(false);
      const j = await res.json().catch(() => ({}));
      return setError(j.error || "Could not start registration. Please sign in and try again.");
    }
    const order = await res.json();

    const rzp = new (window as any).Razorpay({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      name: "MedWealth Circle",
      description: order.eventTitle,
      order_id: order.orderId,
      prefill: { name: userName, contact: userPhone },
      theme: { color: "#009356" },
      handler: async (resp: any) => {
        const v = await fetch("/api/razorpay/event-verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(resp),
        });
        if (v.ok) {
          capture("event_registered", { eventId });
          router.refresh();
        } else {
          setError("Payment verification failed. If money was deducted, contact support.");
        }
      },
      modal: { ondismiss: () => setLoading(false) },
    });
    rzp.open();
    setLoading(false);
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <button onClick={register} disabled={loading} className="btn-primary w-full">
        {loading ? "Starting…" : `Register — ${priceLabel}`}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </>
  );
}
