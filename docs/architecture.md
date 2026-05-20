# Voxa Architecture

## High level

```
                  ┌─────────────────────────┐
                  │   Voxa Owner (browser)  │
                  └────────────┬────────────┘
                               │
                       ┌───────▼────────┐
                       │  Next.js 15    │
                       │  on Vercel     │  ← Clerk auth (Google)
                       │ (Dashboard +   │
                       │  Landing +     │
                       │  Onboarding)   │
                       └───┬────────┬───┘
                           │        │
              ┌────────────┘        └─────────────┐
              │                                   │
        ┌─────▼──────┐                       ┌────▼─────┐
        │  Supabase  │◄────────Realtime──────│  Browser │
        │ (Postgres +│                       │  client  │
        │  Realtime) │                       └──────────┘
        └─────┬──────┘
              │ service-role from n8n
              │
   ┌──────────▼──────────────┐
   │   n8n on Railway        │
   │  (5 workflows)          │
   │                         │
   │ W1: Onboarding          │
   │ W2: Live Tools          │
   │ W3: Post-Call           │
   │ W4: Stripe Webhooks     │
   │ W5: Daily Digest        │
   └─┬─────────┬───────┬─────┘
     │         │       │
     ▼         ▼       ▼
 ┌────────┐ ┌──────┐ ┌────────┐
 │ Stripe │ │Twilio│ │EL Conv │
 │ (Meter │ │ (#s +│ │  AI    │
 │  API)  │ │  WA) │ │(agents)│
 └────────┘ └──────┘ └────────┘
                ▲
                │ phone call
                │
        ┌───────┴────────┐
        │   Caller       │
        │   (customer)   │
        └────────────────┘
```

## Data flow — happy path

1. **Sign up:** owner visits voxa.app, Clerk auth via Google, lands on /pricing
2. **Subscribe:** picks tier → Stripe Checkout → success → /onboarding
3. **Configure:** business form → record 60s voice → paste website URL
4. **Provision:** Stripe webhook → /api/stripe/webhook → forwards to n8n
   - n8n W1: buys Twilio number → clones voice → creates EL agent → imports number → assigns agent → DB insert → WhatsApp activation
5. **Live:** owner gets a Twilio number that answers in their cloned voice
6. **A call comes in:** Twilio → EL native integration → agent answers
   - Agent uses 6 server tools (n8n W2) for any data lookup or action
   - Each tool branch responds in <2s
7. **Call ends:** EL fires post-call webhook → /api/elevenlabs/webhook → n8n W3
   - Computes minutes, fires Stripe meter event, runs Claude extraction, upserts lead, optionally alerts owner
8. **Dashboard updates live:** Supabase Realtime pushes the new call + lead to the owner's browser
9. **6 PM IST daily:** n8n W5 cron sends WhatsApp digest

## Why each piece exists

| Component | Why |
|---|---|
| **Next.js 15 + Vercel** | Familiar stack, instant deploys, App Router for clean RSC patterns |
| **Clerk** | Auth in 15 minutes. Google-only keeps onboarding clean |
| **Supabase Postgres** | Open SQL, free tier, Realtime for the dashboard |
| **Supabase Realtime** | Live transcript stream demos beautifully in the video |
| **Stripe Meter Events** | The 2025 API — usage-based billing without custom infra |
| **Twilio** | The only viable Indian phone number provider with API access |
| **ElevenLabs Conv AI** | Native Twilio integration + voice cloning + multilingual model |
| **n8n on Railway** | Visual workflows judges can SEE in screenshots; saves writing duplicate API routes |
| **Cal.com** | Open API for booking, simpler than Google Calendar OAuth |
| **Anthropic Claude** | Best at structured extraction for the post-call summary |

## Schema

See `data-architect` agent for the full SQL schema. Tables: businesses, agents, subscriptions, knowledge_base, calls, leads, meter_events.

## Webhooks summary

| Source | Endpoint | Handled by |
|---|---|---|
| Stripe events | `/api/stripe/webhook` | Next.js verifies signature → forwards to n8n W4 |
| ElevenLabs post-call | `/api/elevenlabs/webhook` | Next.js verifies → forwards to n8n W3 |
| Owner triggers onboarding | `/api/onboarding/trigger` | Direct n8n W1 invocation |
| EL agent server tools | `${N8N_BASE}/webhook/tool/{name}` | n8n W2 directly |

## Security boundaries

- **Service role key:** ONLY in n8n and Next.js server-only code. Never reaches client.
- **Clerk JWT:** browser → Supabase enforces RLS per business.
- **Webhook signatures:** Stripe + EL both verified before forwarding.
- **API keys (Twilio, EL, Anthropic, Stripe):** server-only, never in client bundles.
