# MedWealth Circle — starter

A production-ready **Next.js 14 (App Router) + Supabase** starter for a doctors'
personal-finance community, wired with phone-OTP auth, Razorpay payments,
Cal.com booking, GA4 and PostHog. The layout mirrors the structure of a
community/course site; **all branding and copy are neutral placeholders** — swap
in your own approved brand, assets and content.

> This project reproduces structure and integration wiring, not any other
> company's logo, images, testimonials or copy. Add only assets you own or are
> licensed to use.

---

## 1. Stack

| Concern | Tool |
|---|---|
| Framework / hosting | Next.js 14, deploy on Vercel or Cloudflare Pages |
| DB + Auth + Storage | Supabase (Postgres, Auth, Storage) |
| Phone OTP | Supabase Auth phone provider (MSG91 / Twilio SMS) |
| Payments | Razorpay (order + signature verify + webhook) |
| Booking | Cal.com embed |
| Analytics | GA4 + PostHog, gated by a consent banner |
| Edge / security | Cloudflare (DNS, SSL, CDN, WAF, Turnstile) |

## 2. Quick start

```bash
npm install
cp .env.example .env.local   # fill in real values
npm run dev                  # http://localhost:3000
```

## 3. Supabase setup

1. Create a project at supabase.com. Copy the **Project URL** and **anon key**
   into `.env.local`; copy the **service-role key** into `SUPABASE_SERVICE_ROLE_KEY`
   (server-only — never expose it).
2. In **SQL Editor**, run `supabase/schema.sql` (tables, triggers, RLS, seed data).
3. **Authentication → Providers → Phone**: enable it and connect your SMS
   provider (MSG91 or Twilio). Set OTP length/expiry. Turn on rate limits.
4. **Authentication → Rate limits**: cap OTP sends per hour to stop SMS abuse.

## 4. Phone OTP

The flow lives in `src/components/OtpAuth.tsx`:
`signInWithOtp({ phone })` → `verifyOtp({ phone, token })`. Supabase sends the SMS
via your configured provider. On signup we also save name, DRN and state to
`profiles`. No passwords are stored.

## 5. Razorpay

- `POST /api/razorpay/order` — creates an order; **price is read from the DB**, never trusted from the client.
- `POST /api/razorpay/verify` — verifies the checkout signature (HMAC-SHA256, constant-time compare), then grants access.
- `POST /api/razorpay/webhook` — server-to-server source of truth for `payment.captured`. Set the URL + secret in Razorpay Dashboard → Webhooks.

Test with Razorpay **test keys** and the published test cards first.

## 6. Cal.com

Set `NEXT_PUBLIC_CALCOM_LINK` to your `team/event` slug. `BookingButton` opens a
popup. No secret needed.

## 7. Analytics (consent-gated)

GA4 and PostHog load in **denied** state. `ConsentBanner` flips them to granted
only after the user accepts — GA4 via Consent Mode, PostHog session recording
stays off until consent. Pageviews are sent on client-side route changes.

## 8. Cloudflare (free plan)

1. Add your domain; point DNS to your host (Vercel/Pages). Enable **proxied** (orange cloud).
2. **SSL/TLS → Full (strict)**; turn on **Always Use HTTPS** and **HSTS**.
3. **Speed → Caching**: cache static assets; respect `Cache-Control`.
4. **Security → WAF**: enable managed rules; add **Turnstile** on the OTP form to stop bots.
5. **Rules → Transform Rules**: the app already sends security headers
   (`next.config.mjs`); Cloudflare can enforce them at the edge too.
6. Block `/xmlrpc.php` etc. — not applicable here (no WordPress), but keep the WAF on.

## 9. Security checklist (the fixes the reference site was missing)

- [x] Security headers (CSP, HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy) — `next.config.mjs`
- [x] Secrets in env vars only; service-role key never reaches the browser
- [x] Payment price from DB; signature + webhook verification
- [x] Row Level Security on every table
- [x] Consent banner before analytics
- [x] OTP rate limiting (configure in Supabase + Cloudflare Turnstile)
- [x] No personal data in URLs (Razorpay prefill passed in JS, not query string)
- [x] `lang="en-IN"`, SEO metadata, Open Graph

## 10. Test checklist (end to end)

1. Sign up with a real mobile → receive OTP → land in `/community`.
2. Sign in again with OTP.
3. Enroll in the **free** course → access granted.
4. Buy a **paid** course with a Razorpay test card → verify → access granted.
5. Trigger the webhook from the Razorpay dashboard → order marked paid.
6. Open the Cal.com popup and book a test slot.
7. Accept cookies → confirm GA4 + PostHog events fire; decline → confirm they don't.
8. Run Lighthouse + securityheaders.com → aim for A.

## 11. Project structure

```
src/
  app/
    layout.tsx            Root layout: analytics, header, footer, consent
    page.tsx              Homepage (placeholder copy)
    (auth)/login,signup   OTP auth pages
    courses/              List + detail + purchase
    api/razorpay/         order | verify | webhook
    api/courses/          enroll-free
  components/             Header, Footer, OtpAuth, BuyCourseButton, BookingButton, ConsentBanner, Analytics
  lib/
    supabase/             client | server | middleware
    razorpay.ts
    posthog.ts
supabase/schema.sql       Tables + RLS + seed
middleware.ts             Session refresh + route guard
```

## 12. Deploy

- **Vercel**: import the repo, add the env vars, deploy. Point Cloudflare DNS at it.
- **Cloudflare Pages**: use the Next.js preset; add env vars; same DNS setup.

---

Built as a starting point — replace placeholder copy/branding with your own and
complete the `/community`, `/webinars`, `/blog` pages to taste.
