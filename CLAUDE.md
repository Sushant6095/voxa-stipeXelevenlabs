# Voxa — AI Receptionist for Indian SMBs

> **Hackathon:** ElevenLabs x Stripe — submit by Thu 21 May 17:00 UTC.
> **Stack:** Next.js 15 + Supabase + Clerk + Stripe Meter API + Twilio + ElevenLabs Conv AI + n8n.
> **Goal:** Top-3 placement. Build fast, ship one killer demo video.

---

## Operating principles (read every session)

1. **Ship over perfect.** This is a 50-hour hackathon build. If a feature isn't on the locked list below, it does not exist. Do not add features unprompted.
2. **Parallel by default.** When a task has independent subtasks, dispatch subagents in parallel. Sequential work is the exception, not the default.
3. **Real APIs only.** No mocks, no fake data, no "we'll wire it later." Every endpoint hits real Stripe test mode, real Twilio, real ElevenLabs from the first commit.
4. **The video is the deliverable.** Hour 42 is code freeze. After hour 42, only video, polish, and posting. Do not write new features after the freeze.
5. **One business works end-to-end before multi-tenancy.** Get the happy path working for one phone number first. Generalize after.
6. **Stripe Meter API uses the 2025-03-31+ pattern.** Legacy `usage_type: 'metered'` without a backing Meter object is REMOVED. Always create Meter → Price (recurring.meter=...) → meter_events.create({event_name, payload: {stripe_customer_id, value: "N"}}). Value must be a whole-number string.
7. **ElevenLabs Twilio integration is native, not custom TwiML.** Import the Twilio number into ElevenLabs via their Phone Numbers UI/API. Do not write WebSocket bridges. The native path "just works."
8. **n8n is the orchestration backbone, not the application layer.** Business logic lives in n8n workflows. The Next.js app is auth, dashboard, and Stripe Checkout. Resist the urge to write API routes that duplicate n8n.

## Locked feature list (do not add to this without explicit approval)

1. One-tap onboarding (Stripe Checkout → auto-provision Twilio + EL agent in <60s)
2. Voice cloning (60s sample → EL voice clone → agent uses it)
3. Inbound calls (Twilio native EL integration)
4. Multilingual auto-switch (Hindi / Tamil / Telugu / English)
5. Calendar booking via Cal.com (EL server tool → n8n)
6. Knowledge base RAG (paste URL → EL agent ingests)
7. WhatsApp confirmations (Twilio Business sandbox)
8. Smart escalation (sentiment / keyword → call-forward + owner alert)
9. Live owner dashboard (Next.js + Supabase Realtime)
10. Post-call AI summary + lead scoring (Claude extraction → daily WhatsApp digest)
11. Stripe metered billing (3 tiers + per-minute overage)

## Explicitly NOT building (resist scope creep)

Stripe Connect reseller, barge-in takeover, mobile app, team accounts, multi-language *UI* (only the voice is multilingual), custom TwiML telephony, A/B testing, admin panel, SSO, audit logs, AI chat support, agent marketplace.

## Stack & versions (pin these)

- Next.js 15 (App Router, RSC, server actions)
- React 19
- Node 22 LTS
- Supabase (Postgres 15 + Realtime + Storage)
- Clerk (Google OAuth only — skip email magic links)
- Stripe Node SDK (latest, API version 2025-03-31.basil or newer)
- Twilio Node SDK
- ElevenLabs Node SDK (`@elevenlabs/elevenlabs-js`)
- Anthropic SDK (for post-call extraction)
- n8n self-hosted on Railway
- shadcn/ui + Tailwind CSS v4
- pnpm (faster than npm, lockfile is mandatory)

## UI stack — GOD-LEVEL POLISH IS A REQUIREMENT

Voxa wins the video on visual polish. A polished mediocre product beats an ugly excellent one in 60-second judging. The locked UI stack:

- **Magic UI** (`magicui.design`) — animated shadcn-compatible components. ~20 used. Free.
- **21st.dev** (`21st.dev`) — community shadcn registry. Free.
- **Tremor** (`@tremor/react`) — KPI dashboards, sparklines.
- **React Flow** (`@xyflow/react`) — the **live orchestration view** is Voxa's killer feature.
- **Motion** (`motion`, formerly `framer-motion`) — animations, transitions, layout animations.
- **Wavesurfer.js** — voice cloning waveform.
- **Sonner** — toasts. **Vaul** — drawers. **cmdk** — command palette.
- **react-parallax-tilt** — pricing card 3D tilt.
- **Geist Sans / Mono** (body, code) + **Cal Sans** (hero headlines only).

Color palette (use these, not raw Tailwind defaults):
- Primary indigo `#6366F1`, primary-dark `#4F46E5`
- Accent pink `#EC4899`, accent-dark `#DB2777`
- Success emerald `#10B981`
- Bg gradient: `from-slate-50 via-indigo-50/30 to-pink-50/20` (light) / inverse (dark)

**The 7 mandatory "wow" UI moments** (full spec in `docs/ui-spec.md`):
1. Landing hero with `<AnimatedBeam />` showing call flow
2. Bento grid features section
3. Pricing with `<BorderBeam />` on Growth tier + parallax tilt
4. Dashboard React Flow **live orchestration view** (call flows through nodes in real-time, Supabase Realtime-driven). This is the centerpiece of the demo video Act 2.
5. KPI cards with `<NumberTicker />` + Tremor sparklines
6. Voice cloning page with wavesurfer waveform + pulsing record button
7. Background depth: `<DotPattern />` + radial gradient mask on every page

Refer to:
- `.claude/agents/ui-virtuoso.md` for the visual polish specialist
- `.claude/skills/21st-dev-components/SKILL.md` for install commands
- `.claude/skills/react-flow-realtime/SKILL.md` for the orchestration view
- `.claude/skills/motion-and-effects/SKILL.md` for animation patterns
- `docs/ui-spec.md` for screen-by-screen design

Dispatch `ui-virtuoso` in parallel with `frontend-engineer` on every feature: ui-virtuoso designs visual moments and animations, frontend-engineer wires the data. Plain shadcn is fine for CRUD pages — judges don't grade those — but every screen the judges WILL see (landing, dashboard, onboarding) is god-level or it doesn't ship.

## Repo layout (target state)

```
voxa/
├── app/                          # Next.js App Router
│   ├── (marketing)/              # Landing page, pricing
│   ├── (app)/                    # Authed dashboard
│   │   ├── dashboard/
│   │   ├── calls/
│   │   ├── leads/
│   │   ├── settings/
│   │   └── onboarding/           # Post-Checkout voice + KB capture
│   └── api/
│       ├── stripe/
│       │   ├── checkout/         # Create Checkout session
│       │   ├── portal/           # Customer Portal redirect
│       │   └── webhook/          # Stripe event sink (forwards to n8n)
│       ├── elevenlabs/
│       │   └── webhook/          # Post-call webhook (forwards to n8n)
│       └── voice/
│           └── clone/            # Upload sample → EL voice add
├── components/                   # shadcn + custom
├── lib/
│   ├── stripe.ts                 # Stripe client + helpers
│   ├── supabase/                 # Server + client + types
│   ├── elevenlabs.ts             # EL agent helpers
│   ├── twilio.ts                 # Number provisioning
│   └── n8n.ts                    # Trigger n8n workflows
├── n8n/                          # Exported workflow JSON
│   ├── 01-onboarding.json
│   ├── 02-live-tools.json
│   ├── 03-post-call.json
│   ├── 04-stripe-webhooks.json
│   └── 05-daily-digest.json
├── scripts/
│   ├── setup-stripe.ts           # Creates Meter + Products + Prices
│   ├── setup-elevenlabs.ts       # Creates default agent template
│   └── smoke-test.ts             # End-to-end test
├── supabase/
│   ├── migrations/
│   └── seed.sql
├── docs/
│   ├── architecture.md
│   ├── demo-script.md
│   └── runbook.md
├── .env.example
├── CLAUDE.md                     # This file
└── README.md
```

## Database schema (Supabase)

```sql
-- Core tables
businesses (id, clerk_user_id, name, owner_phone, owner_whatsapp, language, website_url, created_at)
agents (id, business_id, elevenlabs_agent_id, elevenlabs_voice_id, twilio_number_sid, twilio_phone_e164, status, created_at)
subscriptions (id, business_id, stripe_customer_id, stripe_subscription_id, tier, status, current_period_end)
knowledge_base (id, business_id, source_url, content, embedded_at)
calls (id, agent_id, elevenlabs_conversation_id, caller_phone, duration_seconds, transcript jsonb, audio_url, language_detected, created_at)
leads (id, call_id, business_id, customer_name, customer_phone, intent, lead_score int, sentiment, follow_up_action, status, created_at)
meter_events (id, call_id, stripe_event_id, minutes_billed, sent_at)
```

RLS policies: every table scoped by `business_id` matched against the user's Clerk ID via a `businesses` join.

## Stripe pricing (locked)

| Plan | Flat Price ID env | Metered Price ID env | Base | Included min | Overage |
|---|---|---|---|---|---|
| Starter | `STRIPE_PRICE_STARTER_FLAT` | `STRIPE_PRICE_STARTER_METER` | ₹999/mo | 100 | ₹15/min |
| Growth | `STRIPE_PRICE_GROWTH_FLAT` | `STRIPE_PRICE_GROWTH_METER` | ₹2,999/mo | 500 | ₹12/min |
| Scale | `STRIPE_PRICE_SCALE_FLAT` | `STRIPE_PRICE_SCALE_METER` | ₹7,999/mo | 2,000 | ₹10/min |

Meter: `event_name="call_minutes"`, aggregation `sum`, customer mapping by `stripe_customer_id`.

## Critical gotchas (learned from research, do not relearn)

- Stripe meter event `value` MUST be a string of a whole number. `"3"` not `3` not `"3.5"`.
- ElevenLabs post-call webhook fires AFTER analysis completes (~5-15s after hangup). Don't expect synchronous.
- Twilio Indian numbers (+91) require KYC for outbound; INBOUND-only is fine for the hackathon.
- ElevenLabs Conv AI tool calls have a tight timeout (~5s). n8n endpoints must respond fast — defer heavy work to async branches.
- Twilio WhatsApp sandbox requires recipients to opt in by texting a join code. Demo recipients: pre-opt them in.
- Supabase Realtime requires publication enabled per table. Run `ALTER PUBLICATION supabase_realtime ADD TABLE calls;`.
- Clerk + Next.js 15: middleware must use `clerkMiddleware()` not the deprecated `authMiddleware()`.

## Definition of done (per feature)

A feature is "done" when:
1. End-to-end test passes from real input to real output (real phone call, real Stripe event, real WhatsApp delivery)
2. It works for a fresh new business (not just the dev account)
3. It's filmable for the demo video without staging tricks
4. It's deployed to production (Vercel for app, Railway for n8n)

If any of these fail, the feature is not done. Move on only when all four pass.

## Communication style

- Be direct, command-ready, and skip restating my prompts back to me.
- Show diffs in code blocks, not full file dumps when only a few lines change.
- If a phase task is blocked by an external account/key, STOP and tell me what's missing. Don't fabricate.
- When dispatching parallel subagents, output a brief plan first (one line per agent), then dispatch.
- Default to `pnpm` for all installs. Default to TypeScript strict mode.

## When in doubt

Re-read this file. Then read `docs/architecture.md`. Then ask. Never invent.
