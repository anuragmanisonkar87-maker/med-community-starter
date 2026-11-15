import Link from "next/link";
import OtpAuth from "@/components/OtpAuth";

export const metadata = { title: "Login" };
export const dynamic = "force-dynamic";

// Two-panel login: a branded welcome panel beside the OTP login form.
export default function LoginPage() {
  return (
    <main className="min-h-[80vh]">
      <div className="container-page grid items-stretch gap-0 py-10 lg:grid-cols-2 lg:gap-10">
        {/* Brand panel */}
        <div className="hidden rounded-3xl bg-brand-ink p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <p className="font-display text-xl font-semibold">
              MedWealth<span className="text-brand-500">Circle</span>
            </p>
            <h1 className="mt-10 font-display text-3xl font-semibold leading-tight">
              Welcome back.
            </h1>
            <p className="mt-3 max-w-sm text-gray-300">
              Log in with your mobile number to reach your community, courses and webinars.
              No password to remember.
            </p>
          </div>
          <ul className="space-y-3 text-sm text-gray-300">
            <li>✓ Verified doctor-only community</li>
            <li>✓ Free webinars and expert courses</li>
            <li>✓ Secure mobile OTP login</li>
          </ul>
        </div>

        {/* Form */}
        <div className="flex flex-col items-center justify-center py-8">
          <OtpAuth mode="login" />
          <p className="mt-6 text-sm text-gray-500">
            New here?{" "}
            <Link href="/signup" className="font-medium text-brand-600 hover:underline">
              Create a free account
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
