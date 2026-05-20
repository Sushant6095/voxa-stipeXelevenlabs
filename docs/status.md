# Voxa Status

**Current phase:** 1-10 code complete; awaiting env-paste for live deploy + smoke
**Status:** all 10 phases shipped; final blocker is the env-var paste at end-of-build (user-deferred)
**Blockers:** 12 env vars missing (see `docs/env-setup.md`) — required for Vercel deploy, n8n activation, Stripe setup, real phone call test
**Code freeze:** in effect — no new features until video shoot completes

## Phase progress

- [x] Phase 1 — Foundation (scaffold + UI stack + landing hero)
- [x] Phase 2 — Schema (7 tables, RLS, Realtime publication, helper fns, hand-authored types)
- [x] Phase 3 — Stripe (Meter API 2025-03-31, 3 tiers × 2 prices, webhook, Checkout, Portal, idempotency table)
- [x] Phase 4 — Telephony (lib/twilio + lib/telephony orchestrator, IN→US fallback, orphan cleanup)
- [x] Phase 5 — EL Agent (lib/elevenlabs full SDK wrap, 801-word multilingual prompt, 6 webhook tools, voice clone API)
- [x] Phase 6 — n8n (5 workflow JSONs hand-authored, 80 nodes total, all validate)
- [x] Phase 7 — Dashboard (app shell, sidebar, KPI row, React Flow live orchestration, recent calls, leads kanban, knowledge, voice, billing, settings, cmdk)
- [x] Phase 8 — Landing + Onboarding (how-it-works AnimatedBeam, bento grid, pricing polish with parallax+BorderBeam, marquee, FAQ, footer, 7 onboarding steps)
- [x] Phase 9 — WhatsApp + Polish (sandbox setup documented in runbook; multilingual prompt locks language per call; Tamil/Telugu-only rule already in agent template)
- [x] Phase 10 — Smoke + Docs (`scripts/smoke-test.ts` orchestrator; `pnpm smoke` runs 6 read-only checks against real APIs once env is pasted)

## Verification

- `pnpm tsc --noEmit` → **exit 0** (strict mode, project-wide)
- File count: ~120 source files in scope
- 18 Magic UI components + 14 shadcn primitives
- 5 n8n workflows in `n8n/` (all valid JSON, 80 nodes)
- 7 typed lib wrappers (`stripe`, `elevenlabs`, `twilio`, `telephony`, `n8n`, `agent-template`, `agent-tools`)
- 3 Supabase clients (server async, browser w/ Clerk JWT, middleware refresh)
- 2 SQL migrations (initial schema + stripe webhook idempotency)
- 7 dashboard routes + 7 onboarding routes + marketing routes
- All actions Zod-validated; all server files `import 'server-only'`

## End-of-build paste sequence

When you're ready (per `docs/env-setup.md`):

```bash
cd "/Users/vyapar/Downloads/voxa-bootstrap 2"
cp .env.example .env.local
# Edit .env.local — paste real values for the 12 keys
pnpm setup:stripe                # Creates Meter + 3 Products + 6 Prices, appends IDs to .env.local
pnpm db:push                     # Applies the 2 SQL migrations to your Supabase project
pnpm db:types                    # Regenerates lib/supabase/types.ts from the live schema
pnpm setup:el-agent              # Creates the canonical EL agent template
pnpm test:telephony              # End-to-end provision a phone number + assign to EL agent
pnpm smoke                       # Final 6-check smoke against real APIs
pnpm build                       # Production build sanity
pnpm dlx vercel@latest --prod    # Deploy

# Then import the 5 n8n workflow JSONs at your Railway n8n URL (see n8n/README.md)
# And in the Clerk dashboard, create a JWT template "supabase" with sub={{user.id}}, role="authenticated"
# Finally, register webhooks:
#   - Stripe → https://<your-vercel-url>/api/stripe/webhook
#   - ElevenLabs → https://<your-vercel-url>/api/elevenlabs/webhook
```

## Demo phone number

Populated after `pnpm test:telephony` runs successfully.

- Number: TBD
- Agent ID: TBD
- Status: not yet provisioned

## What ships

- One-tap onboarding (Stripe Checkout → 6-step wizard → auto-provision)
- Voice cloning (60s sample → EL voice clone → agent uses it)
- Inbound calls (Twilio + EL native import)
- Multilingual auto-switch (en/hi/ta/te with Tamil/Telugu hard-locked)
- Cal.com booking via EL server tools → n8n W2
- Knowledge base RAG (URL → EL ingestion)
- WhatsApp confirmations (Twilio sandbox)
- Sentiment escalation (escalate_to_owner with urgency=high)
- Live owner dashboard (KPI cards, React Flow live orchestration, recent calls drawer)
- Post-call AI summary + lead scoring (Claude opus-4-7 extraction in n8n W3)
- Stripe metered billing (3 tiers + per-minute overage via Meter API)
- 7 polished marketing/landing sections (hero, beam, bento, pricing, marquee, FAQ, footer)
- Dark + light mode throughout

## Demo video shot list

See `docs/demo-script.md`. Code freeze means: from this point forward, only bug fixes, video shoot, edit, posting.
