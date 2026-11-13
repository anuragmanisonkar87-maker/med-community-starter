import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import Analytics from "@/components/Analytics";
import ConsentBanner from "@/components/ConsentBanner";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "MedWealth Circle — Personal finance community for doctors",
    template: "%s · MedWealth Circle",
  },
  description:
    "A free, doctor-only community for personal finance: webinars, courses and peer discussion on tax, investing, insurance and wealth planning.",
  openGraph: {
    title: "MedWealth Circle — Personal finance community for doctors",
    description: "Free webinars, expert courses and a verified doctor-only community.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN">
      <body>
        <Suspense fallback={null}>
          <Analytics />
        </Suspense>
        <SiteHeader />
        {children}
        <SiteFooter />
        <ConsentBanner />
      </body>
    </html>
  );
}
