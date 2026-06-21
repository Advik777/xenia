# Xyris Vision — Deploy guide

**Live URLs**

| Service | Host | URL |
|---|---|---|
| Frontend | Vercel | https://xyrisvision.vercel.app |
| Backend API | Render | https://xenlens-backend.onrender.com |
| Auth + DB | Supabase | `xhsxnelygnibwhmxhwob.supabase.co` |

The static **frontend** on Vercel talks to the secret-holding **Express backend** on Render, with **Supabase** (auth + Postgres), **Stripe** (credits), and **OpenRouter** (vision) behind it.

```
repo/
├── frontend/          # static site — deployed on Vercel
│   ├── index.html
│   ├── support.js
│   └── config.js      # apiUrl → Render; Supabase anon key
├── backend/           # Express API — deployed on Render
│   └── src/…
├── vercel.json        # Vercel: publish frontend/
├── render.yaml        # Render: build & env template for backend/
└── database/
    └── schema.sql     # paste into Supabase SQL editor
```

The frontend reads `window.XENLENS_CONFIG` (set in `frontend/config.js`). When filled in, the app unlocks Google sign-in, server-side credits, Stripe checkout, and live AI visual scans.

---

## 0. Prerequisites
- Node 20+
- A Supabase project, a Stripe account (test mode is fine), and an OpenRouter key for `CREDIT_API_KEY_OPENROUTER`

---

## 1. Database (Supabase)

1. Supabase dashboard → **SQL Editor** → paste all of `database/schema.sql` → Run.
2. **Authentication → URL Configuration**
   - **Site URL**: `https://xyrisvision.vercel.app`
   - **Redirect URLs**:
     - `https://xyrisvision.vercel.app/**`
     - `http://localhost:3000/**`
     - `http://127.0.0.1:3000/**`
     - `http://localhost:5500/**`
3. **Authentication → Providers → Google**: enable it.
   - [Google Cloud Console](https://console.cloud.google.com/) → Credentials → OAuth client ID → Web application
   - **Authorized JavaScript origins**: `https://xyrisvision.vercel.app`, `http://localhost:3000`
   - **Authorized redirect URIs**: `https://xhsxnelygnibwhmxhwob.supabase.co/auth/v1/callback`
   - Paste Client ID + Secret into Supabase → Google provider

---

## 2. Backend (Render)

**Live service:** https://xenlens-backend.onrender.com

### Render dashboard setup
1. Connect this repo to Render (or use `render.yaml` Blueprint).
2. Set **Root Directory** to `backend`.
3. **Build command:** `npm install && npm run build`
4. **Start command:** `npm start`
5. **Health check path:** `/health`

### Required environment variables (Render → Environment)

| Variable | Production value |
|---|---|
| `NODE_ENV` | `production` |
| `APP_URL` | `https://xyrisvision.vercel.app` |
| `CORS_ALLOWED_ORIGINS` | `https://xyrisvision.vercel.app,http://localhost:3000,http://localhost:5500,http://127.0.0.1:3000,http://127.0.0.1:5500` |
| `SUPABASE_URL` | your Supabase project URL |
| `SUPABASE_ANON_KEY` | anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | service-role key (server only) |
| `CREDIT_API_KEY_OPENROUTER` | OpenRouter key for paid scans |
| `MODEL_API_USERS_OPENROUTER` | `anthropic/claude-opus-4.8:extra` |
| `STRIPE_SECRET_KEY` | `sk_test_…` or live key |
| `STRIPE_WEBHOOK_SECRET` | from Stripe webhook setup |
| `STRIPE_PRICE_ID` | one-time $10 price id |
| `CREDITS_GRANTED_USD` | `5.00` |
| `ADMIN_EMAIL` | admin Google account email |
| `SUPPORT_EMAIL` | `aegiswheil@gmail.com` |

### Local dev
```bash
cd backend
cp ../.env.example .env   # fill secrets; use APP_URL=http://localhost:3000 for local Stripe redirects
npm install
npm run dev                 # http://localhost:4000
```

### Stripe webhook (Render)
- Endpoint: `https://xenlens-backend.onrender.com/api/stripe/webhook`
- Event: `checkout.session.completed`
- Put the signing secret in `STRIPE_WEBHOOK_SECRET` on Render.

Local testing: `stripe listen --forward-to localhost:4000/api/stripe/webhook`

---

## 3. Frontend (Vercel)

**Live site:** https://xyrisvision.vercel.app

### Vercel dashboard setup
1. Import this repo on Vercel.
2. **Framework Preset:** Other (no build step).
3. **Root Directory:** leave as repo root — `vercel.json` sets `outputDirectory` to `frontend`.
4. Deploy.

`frontend/config.js` is already wired:
- **Vercel (production):** `apiUrl` → `https://xenlens-backend.onrender.com`
- **localhost:** `apiUrl` → `http://localhost:4000`

No Vercel environment variables are required — all public config lives in `config.js`.

---

## What runs where

| Feature | Local / demo | Vercel + Render (live) |
|---|---|---|
| Metadata strip + EXIF report | on-device | on-device |
| AI visual scan + red boxes | demo | real via Render `/api/analyze` |
| Click-to-blur redaction | yes | yes |
| Redacted download | gated | gated by tier/credits |
| Google sign-in | — | Supabase OAuth |
| Credits / Stripe | — | Stripe Checkout + Render webhook |
| Scan history | localStorage | Supabase |

---

## Security notes
- Images are processed **in memory and never stored**; metadata is stripped in the browser before any base64 is sent.
- All secret keys live **only on Render**; Vercel holds public Supabase anon key only.
- Stripe webhook signature is verified; credit provisioning is idempotent.
- Balance math is atomic (Postgres functions); RLS on every table.
- `/api/analyze` is rate-limited (10/min/user) behind Helmet + CORS allow-list.
