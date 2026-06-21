# Xyris Vision — Deploy guide

Ship the hackathon build as a real, hosted product: a static **frontend** (your
Veil design, untouched) talking to a secret-holding **Express backend**, with
**Supabase** (auth + Postgres), **Stripe** (credits) and **NVIDIA NIM / OpenRouter**
(vision) behind it.

```
repo/
├── frontend/          # static site — host on Vercel / Netlify / Cloudflare Pages
│   ├── index.html     # your Veil DC (design + animations untouched)
│   ├── support.js     # DC runtime
│   └── config.js      # ← fill in apiUrl + Supabase URL/anon key to go live
├── backend/           # Express API — host on Render / Railway / Fly
│   ├── src/…
│   └── .env.example   # ← copy to .env, fill secrets
└── database/
    └── schema.sql     # paste into Supabase SQL editor
```

The frontend reads `window.XENLENS_CONFIG` (set in `frontend/config.js`).
**Leave it blank and the app still runs** — on-device metadata strip + a demo
visual scan. Fill it in to unlock real Google sign-in, server-side credits,
Stripe, and the live NVIDIA / OpenRouter vision scan.

---

## 0. Prerequisites
- Node 20+
- A Supabase project, a Stripe account (test mode is fine), and an OpenRouter
  key for `CREDIT_API_KEY_OPENROUTER`

> ⚠️ The original repo you migrated from committed **live API keys** in its
> `.env.example`. Treat those as compromised — rotate the Supabase service-role
> key, NVIDIA, OpenRouter and Stripe keys before going live. The `.env.example`
> files here are blank on purpose.

## 1. Database (Supabase)
1. Supabase dashboard → **SQL Editor** → paste all of `database/schema.sql` → Run.
   (Creates `profiles`, `scans`, `stripe_events`, the atomic `increment_balance`
   / `deduct_balance` functions, the `handle_new_user` trigger and RLS policies.)
2. **Authentication → Providers → Google**: enable it, add redirect URL:
   `https://<your-frontend-domain>/` (and `http://localhost:3000/` for dev).

## 2. Backend (Render / Railway / Fly)
```bash
cd backend
cp .env.example .env        # fill in every value
npm install
npm run dev                 # local: http://localhost:4000
# production:
npm run build && npm start
```
Set the host's env vars from your `.env`. Point `CORS_ALLOWED_ORIGINS` at your
frontend URL(s). Note the deployed API base URL (e.g. `https://xenlens-api.onrender.com`).

**Vision:** the only required key is `CREDIT_API_KEY_OPENROUTER` — it powers and
bills every paid scan. `MODEL_API_USERS_OPENROUTER` (default
`anthropic/claude-opus-4.8:extra`) is the single model served to credit users
and the admin. `NVIDIA_NIM_API_KEY` / `OPENROUTER_API_KEY` are now optional.

**Admin:** set `ADMIN_EMAIL` (default `aegiswheil@gmail.com`). Whoever signs in
with that Google account gets unlimited, free access to the paid model — never
credit-gated, never charged — riding directly on `CREDIT_API_KEY_OPENROUTER`.
This is the portal to demo a live API call. No separate password: auth is
Google OAuth, so "creating" the admin = enabling that Google identity in
Supabase and setting `ADMIN_EMAIL`.

**Stripe (demo with test mode):** create a one-time **$10.00** price, put its id
in `STRIPE_PRICE_ID`. A successful purchase grants `CREDITS_GRANTED_USD` ($5.00)
of usable credits — i.e. **pay $10, get $5 of usage**. For the hackathon use
**test-mode keys** (`sk_test_…` / `whsec_…`) and the test card
`4242 4242 4242 4242` (any future expiry / any CVC): this is a *real, working*
Stripe Checkout flow — no real money moves, nothing is faked in code. Add a
webhook endpoint `https://<your-api>/api/stripe/webhook` listening for
`checkout.session.completed`, and put its signing secret in `STRIPE_WEBHOOK_SECRET`.
Local testing: `stripe listen --forward-to localhost:4000/api/stripe/webhook`.

## 3. Frontend (Vercel / Netlify / Cloudflare Pages / any static host)
1. Edit `frontend/config.js`:
   ```js
   window.XENLENS_CONFIG = {
     apiUrl: 'https://<your-api>',
     supabaseUrl: 'https://<project>.supabase.co',
     supabaseAnonKey: '<supabase anon key>',
   };
   ```
2. Deploy the `frontend/` folder as static files (no build step needed).
   - Vercel: "Other" framework, output dir = `frontend`.
   - Netlify: publish directory = `frontend`.
3. Make sure your frontend origin is in the backend's `CORS_ALLOWED_ORIGINS`
   and in Supabase's Google redirect list.

---

## What runs where

| Feature | Config blank (preview/local file) | Config filled (hosted) |
|---|---|---|
| Metadata strip + EXIF report | ✅ on-device | ✅ on-device |
| AI visual scan + red boxes | demo | real via `/api/analyze` — admin: free & unlimited; credit users: billed against credits |
| Click-to-blur redaction | ✅ | ✅ |
| Redacted download | gated | gated by tier/credits |
| Google sign-in | hidden | ✅ Supabase OAuth |
| Credits / Stripe | local demo top-up | ✅ real Stripe checkout + webhook |
| Scan history | localStorage | ✅ Supabase |

## Security notes (carried over from the backend)
- Images are processed **in memory and never stored**; metadata is stripped in
  the browser before any base64 is sent.
- All real keys are **server-side only**; the frontend holds only public values.
- Stripe webhook signature is verified; credit provisioning is idempotent.
- Balance math is atomic (Postgres functions); RLS on every table.
- `/api/analyze` is rate-limited (10/min/user) behind Helmet + a CORS allow-list.
