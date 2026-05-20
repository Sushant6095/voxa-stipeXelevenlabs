---
description: Verify prerequisites, set up .env, and prepare to run Phase 1.
---

You are bootstrapping the Voxa hackathon project. Read CLAUDE.md first.

# Step 1: Verify prerequisites

Run these checks. For each, output ✓ or ✗ with details:

```bash
node --version          # Must be >= 22
pnpm --version          # Must be installed (npm install -g pnpm if missing)
git --version
gh --version || true    # GitHub CLI (optional but useful)
stripe --version || true # Stripe CLI for webhook testing
supabase --version || true
which claude || true    # Claude Code CLI confirmation
```

# Step 2: Check accounts

List which accounts need to be created. Ask the user to confirm:

- [ ] Twilio account with billing enabled (~$5 minimum)
- [ ] ElevenLabs account on Creator plan (use the hackathon's free attendee offer!)
- [ ] Stripe account in test mode
- [ ] Supabase account + new project provisioned
- [ ] Railway account (for n8n hosting)
- [ ] Clerk account + new application created (Google OAuth enabled)
- [ ] Cal.com account
- [ ] GitHub repo created (private or public)
- [ ] Vercel account linked to GitHub
- [ ] Anthropic API key for Claude (for post-call extraction)

# Step 3: Generate .env.example

Create `.env.example` with ALL required variables, grouped and commented:

```
# === Clerk ===
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# === Supabase ===
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# === Stripe ===
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STARTER_FLAT=price_...
STRIPE_PRICE_STARTER_METER=price_...
STRIPE_PRICE_GROWTH_FLAT=price_...
STRIPE_PRICE_GROWTH_METER=price_...
STRIPE_PRICE_SCALE_FLAT=price_...
STRIPE_PRICE_SCALE_METER=price_...
STRIPE_METER_ID=mtr_...

# === Twilio ===
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# === ElevenLabs ===
ELEVENLABS_API_KEY=sk_...
ELEVENLABS_AGENT_TEMPLATE_ID=  # filled after first agent creation

# === Anthropic (post-call extraction) ===
ANTHROPIC_API_KEY=sk-ant-...

# === Cal.com ===
CALCOM_API_KEY=cal_live_...
CALCOM_EVENT_TYPE_ID=

# === n8n ===
N8N_WEBHOOK_BASE_URL=https://voxa-n8n.up.railway.app

# === App ===
NEXT_PUBLIC_APP_URL=https://voxa.app
```

# Step 4: Initialize docs

Create these stub files:

- `docs/status.md` — phase tracker (use the format from shipping-orchestrator agent)
- `docs/bug-log.md` — empty bug log
- `docs/runbook.md` — operational runbook (placeholder)
- `docs/architecture.md` — architecture (placeholder)
- `docs/demo-script.md` — video script (from PROMPTS.md Phase 10)

# Step 5: Report

After all of the above, output a concise readiness report:

```
VOXA BOOTSTRAP REPORT
=====================

Prerequisites: 8/8 ✓
Accounts:      9/10 (missing: Cal.com)
Env vars:      24/27 (missing: STRIPE_PRICE_* — created in Phase 3)
Repo:          initialized, no commits
Docs:          5 stub files created

Next action: run `/phase 1` to bootstrap the Next.js app.

Estimated time to Phase 1 complete: 2-3 hours.
```

Do NOT run Phase 1 automatically. Wait for the user to issue `/phase 1`.
