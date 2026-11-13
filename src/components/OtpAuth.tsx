"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { capture } from "@/lib/posthog";

type Mode = "signup" | "login";

/**
 * Phone-number OTP flow backed by Supabase Auth.
 * Supabase sends the SMS through the provider configured in
 * Dashboard -> Authentication -> Providers -> Phone (e.g. MSG91 / Twilio).
 *
 * On signup we also collect a few profile fields (name, DRN, state) and
 * write them to `profiles` after verification.
 */
export default function OtpAuth({ mode }: { mode: Mode }) {
  const supabase = createClient();
  const router = useRouter();

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [drn, setDrn] = useState(""); // doctor registration number
  const [state, setState] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0); // seconds until OTP can be resent

  // Count down the resend timer.
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  // Returns an error string if the phone-step inputs are invalid, else null.
  function validatePhoneStep(): string | null {
    const digits = phone.replace(/\D/g, "");
    const ten = digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;
    if (ten.length !== 10 || !/^[6-9]/.test(ten)) return "Enter a valid 10-digit Indian mobile number.";
    if (mode === "signup") {
      if (name.trim().length < 2) return "Please enter your full name.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "Enter a valid email address.";
      if (drn.trim().length < 3) return "Please enter your medical registration number.";
      if (!consent) return "Please accept the terms to continue.";
    }
    return null;
  }

  // Basic client-side validation; real validation also happens server-side.
  const e164 = (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    return digits.startsWith("91") ? `+${digits}` : `+91${digits}`;
  };

  async function sendOtp() {
    setError(null);
    const invalid = validatePhoneStep();
    if (invalid) return setError(invalid);
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      phone: e164(phone),
      options: { channel: "sms" },
    });
    setLoading(false);
    if (error) return setError(error.message);
    capture("otp_requested", { mode });
    setResendIn(30); // 30s cooldown before resend
    setStep("otp");
  }

  async function verifyOtp() {
    setError(null);
    setLoading(true);
    const { data, error } = await supabase.auth.verifyOtp({
      phone: e164(phone),
      token: otp,
      type: "sms",
    });
    if (error) {
      setLoading(false);
      return setError(error.message);
    }
    // On signup, save profile fields.
    if (mode === "signup" && data.user) {
      await supabase.from("profiles").upsert({
        id: data.user.id,
        full_name: name,
        email,
        drn,
        state,
        role: "member",
      });
    }
    capture(mode === "signup" ? "signup_completed" : "login_completed");
    setLoading(false);
    router.push("/community");
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
      <h1 className="font-display text-2xl font-semibold text-brand-ink">
        {mode === "signup" ? "Create your account" : "Sign in"}
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        {mode === "signup"
          ? "Join the community — free, no password."
          : "Welcome back. We'll text you a one-time code."}
      </p>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {step === "phone" ? (
        <div className="mt-6 space-y-4">
          {mode === "signup" && (
            <>
              <Field label="Full name" value={name} onChange={setName} placeholder="Dr. Full Name" />
              <Field label="Email address" value={email} onChange={setEmail} placeholder="you@example.com" inputMode="email" />
              <Field label="Medical registration no. (DRN)" value={drn} onChange={setDrn} placeholder="e.g. MH-12345" />
              <Field label="State" value={state} onChange={setState} placeholder="Maharashtra" />
            </>
          )}
          <Field label="Mobile number" value={phone} onChange={setPhone} placeholder="98XXXXXXXX" inputMode="tel" />
          {mode === "signup" && (
            <label className="flex items-start gap-2 text-sm text-gray-600">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" />
              <span>I agree to the terms and privacy policy, and consent to being contacted.</span>
            </label>
          )}
          <button onClick={sendOtp} disabled={loading} className="btn-primary w-full">
            {loading ? "Sending…" : "Send OTP"}
          </button>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          <Field label="Enter the 6-digit code" value={otp} onChange={setOtp} placeholder="______" inputMode="numeric" />
          <button onClick={verifyOtp} disabled={loading} className="btn-primary w-full">
            {loading ? "Verifying…" : "Verify & continue"}
          </button>
          <div className="flex items-center justify-between text-sm">
            <button onClick={() => setStep("phone")} className="text-gray-500 hover:underline">
              Change number
            </button>
            {resendIn > 0 ? (
              <span className="text-gray-400">Resend in {resendIn}s</span>
            ) : (
              <button onClick={sendOtp} disabled={loading} className="font-medium text-brand-600 hover:underline">
                Resend OTP
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label, value, onChange, placeholder, inputMode,
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
  inputMode?: "tel" | "numeric" | "email";
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
      <input
        value={value}
        inputMode={inputMode}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
      />
    </label>
  );
}
