# Voxa env-setup guide

This is the unlock for Phase 1 step 14 (Vercel deploy) and every phase after. Get these 12 keys, drop them into `.env.local`, paste the same values into Vercel project settings → Environment Variables.

> Time estimate: **~25 minutes** if you already have accounts on Clerk/Supabase/Stripe/Twilio/ElevenLabs/Anthropic. **~60 minutes** if signing up fresh.

## 1. Clerk (Auth) — 5 min

1. Sign up at https://clerk.com (free tier is fine)
2. **Create a new application**: name "Voxa", **enable Google** as the only social provider (uncheck email/password)
3. After creation: API Keys → copy both
   - `CLERK_SECRET_KEY` (starts `sk_test_…`)
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (starts `pk_test_…`)
4. (Already set in `.env.example`) URLs:
   - `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`
   - `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`
   - `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard`
   - `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding`

## 2. Supabase (Postgres + Realtime) — 5 min

1. https://supabase.com → New project → name "voxa", region closest to your users, set DB password (save it)
2. Wait ~2 min for provisioning
3. Project Settings → API:
   - `NEXT_PUBLIC_SUPABASE_URL` = Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon public key
   - `SUPABASE_SERVICE_ROLE_KEY` = service_role key (⚠ keep server-only — never commit)

## 3. Stripe (Test mode) — 3 min

1. https://dashboard.stripe.com (sign in or sign up)
2. **Toggle to Test mode** (top-right switch)
3. Developers → API keys:
   - `STRIPE_SECRET_KEY` = `sk_test_…`
4. `STRIPE_WEBHOOK_SECRET` = leave blank for now — generated in **Phase 3** when we register the webhook endpoint
5. The 6 price IDs (`STRIPE_PRICE_*_FLAT`/`_METER`) are also Phase 3 — `scripts/setup-stripe.ts` creates them.

## 4. Twilio — 5 min

1. https://twilio.com → sign up (uses ~$15 trial credit)
2. Console → Account Info:
   - `TWILIO_ACCOUNT_SID` (starts `AC…`)
   - `TWILIO_AUTH_TOKEN` (click "show")
3. WhatsApp sandbox setup happens in Phase 9 — for now leave `TWILIO_WHATSAPP_FROM=whatsapp:+14155238886` (the sandbox default).

> ⚠ Indian (+91) numbers require KYC for outbound. We only need inbound for the hackathon, so KYC can wait. Provisioning happens in Phase 4.

## 5. ElevenLabs — 3 min

1. https://elevenlabs.io → sign up → Creator plan ($5/mo for voice cloning)
2. Profile (top-right avatar) → Settings → API Keys:
   - `ELEVENLABS_API_KEY`
3. `ELEVENLABS_WEBHOOK_SECRET` = leave blank — Phase 5 generates this when we configure the post-call webhook.

## 6. Anthropic — 2 min

1. https://console.anthropic.com → sign in
2. Settings → API Keys → Create key
3. `ANTHROPIC_API_KEY` = `sk-ant-…`

## 7. n8n on Railway — 5 min

1. https://railway.app → New project → Deploy from Template → search "n8n"
2. Pick the official n8n template, deploy
3. Once deployed, open the service → Settings → Networking → generate a public domain
4. `N8N_WEBHOOK_BASE_URL` = `https://<your-n8n>.up.railway.app` (no trailing slash)

> Phase 6 imports our 5 workflow JSON files into this n8n instance.

---

## Putting it all together

```bash
cd "/Users/vyapar/Downloads/voxa-bootstrap 2"
cp .env.example .env.local
# Open .env.local in your editor and paste real values for the 12 keys above.
pnpm dev
# Open http://localhost:3000 — landing hero should render with the animated dots, gradient orb, WordRotate, and ShimmerButton.
```

If the dev server crashes on boot, the most likely culprit is an unset secret used at module load. `lib/stripe.ts`, `lib/elevenlabs.ts`, `lib/twilio.ts` fail fast if their secret is missing — fix the var and retry.

## Vercel deploy (Phase 1 step 14)

After `.env.local` works locally:

```bash
cd "/Users/vyapar/Downloads/voxa-bootstrap 2"
pnpm dlx vercel@latest link    # Connect to a Vercel project (create if needed)
pnpm dlx vercel@latest env pull # Optional sanity check
pnpm dlx vercel@latest --prod  # Deploy
```

Before the deploy: in Vercel dashboard → Project Settings → Environment Variables, paste every variable from `.env.local` (Production + Preview). Mark these as **Sensitive** (encrypted at rest):

- `CLERK_SECRET_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `TWILIO_AUTH_TOKEN`
- `ELEVENLABS_API_KEY`
- `ELEVENLABS_WEBHOOK_SECRET`
- `ANTHROPIC_API_KEY`

Everything else can be plain (the `NEXT_PUBLIC_*` ones ship to the browser anyway).
