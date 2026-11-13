"use client";

import { useState } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { capture } from "@/lib/posthog";

// Loads Razorpay Checkout, creates an order server-side, then verifies the payment.
export default function BuyCourseButton({
  courseId,
  priceLabel,
  userName,
  userPhone,
}: {
  courseId: string;
  priceLabel: string;
  userName?: string;
  userPhone?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function buy() {
    setError(null);
    setLoading(true);
    capture("checkout_started", { courseId });

    // 1. Create order server-side (price comes from the DB, not the client).
    const res = await fetch("/api/razorpay/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId }),
    });
    if (!res.ok) {
      setLoading(false);
      const j = await res.json().catch(() => ({}));
      return setError(j.error || "Could not start checkout. Please sign in and try again.");
    }
    const order = await res.json();

    // 2. Open Razorpay Checkout.
    const rzp = new (window as any).Razorpay({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      name: "MedWealth Circle",
      description: order.courseTitle,
      order_id: order.orderId,
      prefill: { name: userName, contact: userPhone },
      theme: { color: "#009356" },
      handler: async (resp: any) => {
        // 3. Verify signature server-side, then grant access.
        const v = await fetch("/api/razorpay/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(resp),
        });
        if (v.ok) {
          capture("purchase_completed", { courseId });
          router.push(`/courses/learn/${courseId}`);
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
      <button onClick={buy} disabled={loading} className="btn-primary w-full">
        {loading ? "Starting…" : `Enroll — ${priceLabel}`}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </>
  );
}
