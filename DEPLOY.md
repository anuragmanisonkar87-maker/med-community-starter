# Deploy for testing — click-by-click

Goal: a live `*.vercel.app` URL where you can test OTP login, payments, booking
and analytics. ~20–30 minutes. Use **test** keys throughout.

---

## 1. Supabase (database + auth)

1. Go to https://supabase.com → **New project**. Pick a region close to India
   (e.g. Mumbai / Singapore). Set a strong database password.
2. When it's ready, open **Project Settings → API** and copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (keep secret)
3. Open **SQL Editor → New query**, paste the whole of `supabase/schema.sql`
   from this repo, and **Run**. This creates the tables, RLS policies, the
   new-user trigger and seed courses.
4. **Authentication → Providers → Phone**: toggle **Enable Phone provider**.
   Choose an SMS provider:
   - **MSG91** (India): add your MSG91 auth key / sender ID / DLT template.
   - or **Twilio**: add Account SID, Auth Token, Message Service SID.
5. **Authentication → Rate Limits**: lower the "OTP / SMS sent per hour" to a
   safe number (e.g. 10) to prevent SMS abuse.

## 2. Razorpay (payments — test mode)

1. https://dashboard.razorpay.com → switch to **Test Mode** (top toggle).
2. **Settings → API Keys → Generate Test Key**. Copy:
   - Key ID → `NEXT_PUBLIC_RAZORPAY_KEY_ID`
   - Key Secret → `RAZORPAY_KEY_SECRET`
3. Webhook is set up in step 5 (after you have the Vercel URL).

## 3. Cal.com, GA4, PostHog

- **Cal.com**: create an event type, copy its `username/event` slug →
  `NEXT_PUBLIC_CALCOM_LINK`.
- **GA4**: Google Analytics → Admin → Data Streams → Web → copy the
  `G-XXXXXXXXXX` measurement ID → `NEXT_PUBLIC_GA4_ID`.
- **PostHog**: Project Settings → copy Project API Key (`phc_...`) →
  `NEXT_PUBLIC_POSTHOG_KEY`, and the host (`https://us.i.posthog.com`) →
  `NEXT_PUBLIC_POSTHOG_HOST`.

## 4. Vercel (hosting)

1. https://vercel.com → **Add New → Project → Import Git Repository**.
2. Choose `anuragmanisonkar87-maker/med-community-starter`. Vercel detects
   Next.js automatically — leave build settings as-is.
3. Expand **Environment Variables** and add every key from `.env.example`
   with the values gathered above. Also set:
   - `NEXT_PUBLIC_SITE_URL` = your Vercel URL (e.g. `https://med-community-starter.vercel.app`)
4. Click **Deploy**. When it finishes you get the live URL.

## 5. Finish the Razorpay webhook

1. In Razorpay (Test Mode) → **Settings → Webhooks → Add New Webhook**.
2. URL: `https://YOUR-APP.vercel.app/api/razorpay/webhook`
3. Secret: pick any string; set the same value as `RAZORPAY_WEBHOOK_SECRET`
   in Vercel env vars (then redeploy).
4. Subscribe to the `payment.captured` event. Save.

## 6. (Optional) Cloudflare — custom domain

Only needed once you add your own domain:

1. Add the domain to Cloudflare; set DNS to point at Vercel (Vercel shows the
   exact CNAME/A records under **Project → Settings → Domains**). Keep the
   record **Proxied** (orange cloud).
2. **SSL/TLS → Overview → Full (strict)**; enable **Always Use HTTPS** and
   **HSTS**.
3. **Security → WAF**: enable managed rules. Add **Turnstile** to the OTP form
   to block bots.
4. **Caching**: leave default; the app already sets `Cache-Control` and
   security headers (`next.config.mjs`).

## 7. Test end to end

1. Visit the Vercel URL. Accept cookies → confirm GA4 + PostHog fire (decline → they don't).
2. **Sign up** with a real mobile → receive OTP → land in `/community`.
3. **Sign in** again with OTP.
4. **Enroll** in the free "Money Starter Kit" course → access granted.
5. **Buy** a paid course with a Razorpay test card
   (`4111 1111 1111 1111`, any future expiry, any CVV) → verify → access granted.
6. In Razorpay dashboard, resend the webhook → order marked `paid`.
7. Open the **Book a consultation** button → Cal.com popup loads.
8. Run https://securityheaders.com against the URL → aim for grade A.

## Troubleshooting

- **OTP not arriving**: check the SMS provider is enabled in Supabase and (for
  MSG91) your DLT template is approved.
- **Payment "Invalid signature"**: `RAZORPAY_KEY_SECRET` in Vercel must match the
  key that generated the order; redeploy after changing env vars.
- **Build fails on Vercel**: run `npm run build` locally first; all env vars that
  pages read at build time must be present in Vercel.
