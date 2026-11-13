import OtpAuth from "@/components/OtpAuth";

export const metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <OtpAuth mode="login" />
    </main>
  );
}
