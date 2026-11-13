import Razorpay from "razorpay";

// Lazily create the Razorpay client at request time (not at build/import time,
// when env vars aren't present). Server-only — never import into client code.
let _client: Razorpay | null = null;

export function getRazorpay(): Razorpay {
  if (!_client) {
    _client = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });
  }
  return _client;
}
