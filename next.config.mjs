/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // Add your Supabase storage / CDN host here when serving uploaded media.
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
    ],
  },
  async headers() {
    // Baseline security headers. Cloudflare can add/override these at the edge too.
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://checkout.razorpay.com https://app.cal.com https://www.googletagmanager.com https://*.posthog.com",
      "frame-src https://api.razorpay.com https://checkout.razorpay.com https://app.cal.com",
      "connect-src 'self' https://*.supabase.co https://lumberjack.razorpay.com https://*.posthog.com https://www.google-analytics.com",
      "img-src 'self' data: https:",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' data:",
      "object-src 'none'",
      "base-uri 'self'",
      "frame-ancestors 'self'",
    ].join("; ");
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
    ];
  },
};

export default nextConfig;
