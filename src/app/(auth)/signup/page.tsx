import OtpAuth from "@/components/OtpAuth";

export const metadata = { title: "Join free" };
export const dynamic = "force-dynamic";

export default function SignupPage() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <OtpAuth mode="signup" />
    </main>
  );
}
