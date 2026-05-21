<div align="center">

<img src="docs/images/voxa-icon.svg" alt="Voxa" width="96" height="96" />

# Voxa

### **The AI receptionist that picks up — in your voice, in your customer's language.**

Built for [`#ElevenHacks`](https://elevenlabs.io/hackathon) · ElevenLabs × Stripe · 2026

[![Live deploy](https://img.shields.io/badge/live-voxa--inky.vercel.app-6366F1?style=for-the-badge&logo=vercel&logoColor=white)](https://voxa-inky.vercel.app)
[![Call the AI](https://img.shields.io/badge/📞_call_the_AI-+1_(912)_912--6711-10B981?style=for-the-badge)](tel:+19129126711)
[![License](https://img.shields.io/badge/license-MIT-EC4899?style=for-the-badge)](#-license)

![Next.js](https://img.shields.io/badge/Next.js_15-000?style=flat&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Tailwind v4](https://img.shields.io/badge/Tailwind_v4-38B2AC?style=flat&logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=flat&logo=supabase&logoColor=white)
![Stripe](https://img.shields.io/badge/Stripe_Meter_API-635BFF?style=flat&logo=stripe&logoColor=white)
![ElevenLabs](https://img.shields.io/badge/ElevenLabs_Conv_AI-000?style=flat)
![Twilio](https://img.shields.io/badge/Twilio-F22F46?style=flat&logo=twilio&logoColor=white)
![Anthropic](https://img.shields.io/badge/Claude_opus--4--7-D97757?style=flat&logo=anthropic&logoColor=white)
![n8n](https://img.shields.io/badge/n8n-EA4B71?style=flat&logo=n8n&logoColor=white)

</div>

<br>

<div align="center">
  <img src="docs/images/architecture-banner.jpg" alt="Voxa system architecture — Stripe Checkout, n8n W1 Onboarding, ElevenLabs voice clone + agent creation, Twilio number import, WhatsApp activation" width="100%" />
</div>

<br>

> A small clinic in Bengaluru. A salon in Pune. A tutor in Hyderabad. Every day they lose customers because nobody picks up the phone after hours. Voxa picks up — in the owner's cloned voice, in the caller's language, every time.

---

## 🎬 See it. Hear it. Call it.

| | |
|---|---|
| 📞 **Live phone demo** | [`+1 (912) 912-6711`](tel:+19129126711) — call from any phone. The AI answers in Hindi/Tamil/Telugu/English. |
| 🌐 **Production site** | <https://voxa-inky.vercel.app> |
| 📚 **API docs** | <https://voxa-inky.vercel.app/docs> · with interactive React Flow architecture diagrams |
| 🎙 **Agent ID** | `agent_1501ks3dxeg6f489ksmqvd9hs8gz` (Sharma Dental Clinic persona, Hindi primary) |
| 🎬 **Demo video** | 87s master · 1920×1080 · burned-in captions · see [`docs/demo-video-README.md`](docs/demo-video-README.md) |

---

## 🪄 What Voxa does

<div align="center">
  <img src="docs/images/01-landing-hero.png" alt="Voxa landing hero — 'The AI Receptionist that speaks English / हिन्दी / தமிழ் / తెలుగు' with a live demo phone number chip" width="100%" />
</div>

### Six capabilities, end-to-end

| | |
|---|---|
| 🎙 **Voice cloning** | A 60-second sample of the owner's voice → ElevenLabs IVC. Every subsequent call sounds like *them*. |
| 🌐 **Multilingual auto-switch** | Detects the caller's language on the first utterance. Locks to it for the rest of the call. Tamil-only and Telugu-only rules baked into the prompt. |
| 📞 **Native Twilio import** | The agent is plugged into the phone line via the ElevenLabs Phone Numbers API. No custom TwiML. Less than 60 seconds from Stripe Checkout to a ringing number. |
| 📅 **Cal.com bookings** | The agent calls real availability slots and creates real bookings via 6 webhook tools wired through n8n. |
| 💬 **WhatsApp confirmations** | Twilio Business sandbox sends booking confirmations + hot-lead alerts. |
| 💳 **Stripe Meter billing** | The new Stripe **Meter Events API** (2025-03-31 release) handles per-minute usage billing. Three tiers, flat licensed price + metered overage. |

---

## 🏗 Architecture

<div align="center">
  <img src="docs/images/02-architecture-system.png" alt="Interactive React Flow system overview — Caller → Twilio → ElevenLabs → n8n → Cal.com / Stripe Meter / WhatsApp / Supabase / Claude" width="100%" />
</div>

### High-level data flow

```mermaid
flowchart LR
    Caller([📞 Caller]) -->|"PSTN"| Twilio[Twilio Voice]
    Twilio -->|"Native import"| EL[ElevenLabs Conv AI]
    EL -->|"6 webhook tools"| n8n{{n8n W2 — Live Tools}}

    EL -.->|"post_call_transcription<br/>~5–15 s after hangup"| W3{{n8n W3 — Post-Call}}

    n8n --> Cal[Cal.com<br/>slots + bookings]
    n8n --> WA[WhatsApp Business<br/>confirmations]
    n8n --> KB[(Supabase<br/>knowledge_base)]
    n8n --> Twilio2[Twilio call-forward<br/>+ owner alert]

    W3 --> Stripe[Stripe Meter Events]
    W3 --> Claude[Anthropic<br/>opus-4-7 extraction]
    W3 --> DB[(Supabase<br/>calls / leads)]
    DB -->|"Realtime channel"| Dashboard[Next.js Dashboard]

    Stripe -.->|"checkout.session.completed"| W1{{n8n W1 — Onboarding}}
    W1 --> Twilio
    W1 --> EL

    classDef brand fill:#6366F1,stroke:#4F46E5,color:#fff
    classDef stripe fill:#635BFF,stroke:#4F46E5,color:#fff
    classDef voice fill:#EC4899,stroke:#DB2777,color:#fff
    classDef store fill:#3FCF8E,stroke:#22994E,color:#0f172a
    classDef ext fill:#F59E0B,stroke:#B45309,color:#0f172a
    class EL voice
    class Stripe stripe
    class DB,KB store
    class n8n,W1,W3 brand
    class Cal,WA,Twilio,Twilio2,Claude ext
```

### The 5 n8n workflows

```mermaid
flowchart TD
    subgraph W1["W1 — Onboarding"]
        direction LR
        A1[checkout.session<br/>.completed] --> A2[Buy Twilio<br/>number]
        A2 --> A3[Clone voice]
        A3 --> A4[Create EL agent]
        A4 --> A5[Import number<br/>→ assign agent]
        A5 --> A6[WhatsApp<br/>activation msg]
    end

    subgraph W2["W2 — Live Tool Calls (&lt;2s p99)"]
        direction LR
        B1[Webhook<br/>/tool/:name] --> B2{Switch}
        B2 --> B3a[check_availability]
        B2 --> B3b[book_appointment]
        B2 --> B3c[get_business_info]
        B2 --> B3d[escalate_to_owner]
        B2 --> B3e[send_callback_link]
        B2 --> B3f[log_lead]
    end

    subgraph W3["W3 — Post-Call"]
        direction LR
        C1[EL post-call<br/>webhook] --> C2[Compute<br/>minutes]
        C2 --> C3[Stripe Meter<br/>event]
        C2 --> C4[Claude<br/>extraction]
        C4 --> C5[Supabase<br/>upsert]
        C5 --> C6{score &gt;= 7?}
        C6 -->|yes| C7[WhatsApp<br/>hot-lead alert]
    end

    classDef brand fill:#6366F1,stroke:#4F46E5,color:#fff
    class W1,W2,W3 brand
```

> **W4 — Stripe events** (subscription deletes + invoice failures) and **W5 — Daily Digest** (6 PM IST cron, WhatsApp summary per business) round out the orchestration.

---

## 📞 The 6 webhook tools

The ElevenLabs agent calls these during a live call. Each branch must complete in **&lt;2s** (EL's tool timeout is ~5s).

| Tool | Args | Backend action |
|---|---|---|
| `check_availability` | `date`, `time_window` | Cal.com `getSlots` → returns 2 specific times |
| `book_appointment` | `customer_name`, `customer_phone`, `datetime_iso`, `service` | Cal.com `createBooking` + Twilio WhatsApp confirm + Supabase `leads` insert |
| `get_business_info` | `query` | RAG over `knowledge_base` (URL-ingested content) |
| `escalate_to_owner` | `reason`, `urgency: 'low' \| 'high'` | Twilio call-forward TwiML update + WhatsApp owner alert |
| `send_callback_link` | `customer_phone`, `link_type` | Twilio WhatsApp deep-link |
| `log_lead` | `customer_name`, `customer_phone`, `intent`, `notes` | Supabase `leads` upsert |

---

## 🖥 Product tour

### Dashboard with live React Flow orchestration

<div align="center">
  <img src="docs/images/04-dashboard.png" alt="Voxa dashboard — KPI row (calls, minutes, hot leads, invoice) above a live React Flow diagram showing 8 service nodes" width="100%" />
</div>

The centerpiece of the demo video: a React Flow graph of every external service. Edges animate in real-time as Supabase Realtime pushes new `calls`, `leads`, and `meter_events` rows.

### Stripe-style API docs

<div align="center">
  <img src="docs/images/05-docs-overview.png" alt="Voxa API docs landing — Stripe-like three-column layout with sidebar nav, 6-card capability grid, language-tabbed quickstart" width="100%" />
</div>

Three-column docs shell at <https://voxa-inky.vercel.app/docs> — sidebar nav with method badges, language-tabbed code samples (curl / Node / Python), interactive React Flow architecture diagrams. Built with the design philosophy of [docs.stripe.com](https://docs.stripe.com).

### Live tool-call workflow visualisation

<div align="center">
  <img src="docs/images/03-architecture-w2.png" alt="Workflow 2 — Live tool calls. Caller → Twilio → ElevenLabs → n8n with 6 fan-out branches" width="100%" />
</div>

### Pricing — 3 tiers × 2 prices each

<div align="center">
  <img src="docs/images/06-pricing.png" alt="Voxa pricing — Starter ₹999, Growth ₹2,999 (animated BorderBeam), Scale ₹7,999 with parallax tilt" width="100%" />
</div>

| Tier | Flat / month | Included min | Overage / min |
|---|---|---|---|
| Starter | **₹999** | 100 | ₹15 |
| **Growth** ⭐ | **₹2,999** | 500 | ₹12 |
| Scale | **₹7,999** | 2,000 | ₹10 |

All Stripe-side: 1 Meter (`call_minutes`, `sum` aggregation) + 3 Products + 6 Prices, created idempotently via `pnpm setup:stripe`.

---

## 🛠 Tech stack

| Layer | Tools |
|---|---|
| **Frontend** | Next.js 15 (App Router, RSC, server actions) · React 19 · TypeScript strict · Tailwind v4 · shadcn/ui (slate) · Magic UI (18 components) · Motion · React Flow · Tremor · cmdk · Vaul · Wavesurfer · react-parallax-tilt |
| **Data** | Supabase Postgres (7 tables + RLS) · Supabase Realtime · Service-role + cookie-based clients |
| **Voice** | ElevenLabs Conversational AI · Instant Voice Cloning · Native Twilio Phone Numbers API |
| **Billing** | Stripe Meter Events API (`2025-03-31.basil`) · Stripe Checkout · Stripe Customer Portal · Idempotency table |
| **Telephony** | Twilio Voice (Indian / US numbers with auto IN→US fallback) · Twilio WhatsApp Business sandbox |
| **AI** | Anthropic `claude-opus-4-7` for post-call lead extraction (intent, sentiment, lead score) |
| **Orchestration** | n8n self-hostable + cloud (5 production workflows) · Cal.com for booking slots |
| **Infra** | Vercel (production) · Supabase Cloud · Anthropic API · ElevenLabs API |
| **Brand** | Cal Sans (headlines) · Geist Sans (body) · Geist Mono (code) · indigo `#6366F1` → pink `#EC4899` gradient |

---

## 🚀 Quick start

```bash
# Clone
git clone https://github.com/Sushant6095/voxa-stipeXelevenlabs.git voxa
cd voxa
pnpm install

# Add env vars (see docs/env-setup.md for the 25-min walkthrough)
cp .env.example .env.local
# Edit .env.local — paste keys from Supabase, Stripe, Twilio, EL, Anthropic, n8n

# Apply schema + provision Stripe + create EL agent + buy a phone number
pnpm setup:stripe          # Meter + 3 Products + 6 Prices
pnpm db:push               # 2 SQL migrations to Supabase
pnpm db:types              # regen lib/supabase/types.ts
pnpm setup:el-agent --business-name "Your Business" --language hi --voice-id <id> --n8n-url <url> --write-env
pnpm test:telephony <agent-id> --country=US   # buys + assigns a number

# Verify
pnpm smoke                 # 6 read-only checks across Supabase, Stripe, EL, Twilio, n8n, Anthropic

# Dev
pnpm dev                   # turbopack — http://localhost:4321

# Production
pnpm build && vercel --prod
```

Full walkthrough: [`docs/env-setup.md`](docs/env-setup.md).

---

## 📦 Project structure

```text
voxa/
├── app/
│   ├── (marketing)/pricing/       # 3-tier pricing page (parallax + BorderBeam)
│   ├── (app)/                     # App shell — dashboard, calls, leads, knowledge, voice, billing, settings
│   ├── docs/                      # Stripe-style API docs with React Flow diagrams
│   ├── onboarding/                # 6-step post-checkout wizard
│   ├── api/
│   │   ├── stripe/{checkout,portal,webhook}/
│   │   ├── elevenlabs/webhook/
│   │   ├── voice/clone/
│   │   ├── agent/create/
│   │   ├── knowledge/ingest/
│   │   └── onboarding/{business,scrape,status}/
│   ├── layout.tsx                 # Fonts + ThemeProvider + Toaster
│   ├── page.tsx                   # Landing — hero + bento + pricing + marquee + FAQ + footer
│   └── icon.svg                   # Crab favicon
├── components/
│   ├── brand/voxa-logo.tsx        # The gradient crab mascot
│   ├── landing/                   # Hero, Bento, AnimatedBeam, Marquee, Footer, mega-menu Navbar
│   ├── docs/                      # Stripe-style docs primitives + React Flow wrapper
│   ├── dashboard/                 # KPI cards, Live Orchestration, Leads kanban, Recent Calls drawer
│   ├── onboarding/                # 6 step components — progress dots, voice recorder, etc.
│   ├── app/                       # Sidebar, TopBar
│   ├── cmdk/                      # ⌘K command palette
│   └── ui/                        # shadcn primitives + 18 Magic UI components
├── lib/
│   ├── stripe.ts                  # Meter Events helpers, apiVersion 2025-03-31.basil
│   ├── elevenlabs.ts              # Agent CRUD, voice clone, phone number import
│   ├── telephony.ts               # IN→US fallback + orphan number cleanup
│   ├── twilio.ts                  # Number purchase + WhatsApp/SMS
│   ├── n8n.ts                     # Workflow trigger wrapper
│   ├── agent-template.ts          # The 800-word multilingual system prompt
│   ├── agent-tools.ts             # 6 webhook tool definitions
│   ├── dashboard-data.ts          # All Supabase queries
│   ├── realtime.ts                # Realtime hooks
│   ├── optimistic-leads.ts        # useOptimistic kanban
│   └── supabase/{server,client,middleware,types}.ts
├── supabase/migrations/
│   ├── 0001_initial_schema.sql    # 7 tables + RLS + Realtime publication + helper fns
│   └── 0002_stripe_webhook_events.sql
├── n8n/
│   ├── 01-onboarding.json         # W1
│   ├── 02-live-tools.json         # W2 (6 branches)
│   ├── 03-post-call.json          # W3
│   ├── 04-stripe-webhooks.json    # W4
│   ├── 05-daily-digest.json       # W5
│   └── README.md
├── scripts/
│   ├── setup-stripe.ts            # Idempotent Meter + Products + Prices
│   ├── setup-elevenlabs-template.ts
│   ├── test-telephony.ts
│   ├── smoke-test.ts              # 6-check live API verification
│   ├── record-demo-video.cjs      # Playwright 5-shot tour
│   └── generate-narration.mjs     # ElevenLabs TTS for the 3 narration clips
├── docs/
│   ├── architecture.md
│   ├── env-setup.md               # 25-min key-collection walkthrough
│   ├── runbook.md
│   ├── ui-spec.md
│   ├── demo-video-README.md
│   └── images/                    # Screenshots used in this README
└── middleware.ts
```

---

## 🧪 What ships

| Inventory | Count |
|---|---|
| Production routes (200) | **17** (8 marketing/docs · 7 app · 2 onboarding flows) |
| API routes | **11** |
| Supabase tables | **8** (businesses, agents, subscriptions, knowledge_base, calls, leads, meter_events, stripe_webhook_events) |
| RLS policies | **15** |
| Stripe resources provisioned | **1 Meter · 3 Products · 6 Prices** |
| n8n workflow JSONs | **5** (80 nodes total, all validate) |
| ElevenLabs server tools | **6** |
| TypeScript errors | **0** (strict mode, project-wide) |
| Source files | **150+** |

---

## 💳 Try the live demo

Three ways, in increasing order of "wow":

1. **Browse:** open <https://voxa-inky.vercel.app> on any device. Tap **"📞 Call AI demo"** in the navbar.
2. **Call:** dial **+1 (912) 912-6711** from any phone, anywhere in the world. Try opening with Hindi, Tamil, or Telugu — the agent locks to your language.
3. **Inspect:** open <https://voxa-inky.vercel.app/docs/architecture> for the interactive React Flow walk-through of every workflow.

---

## 🎬 Demo video

Recorded automatically via `scripts/record-demo-video.cjs` — a 5-shot Playwright tour of the live site at 1920×1080 with burned-in captions.

| Aspect | File | Use for |
|---|---|---|
| 16:9 master | `voxa-demo-master.mp4` | Hackathon submission, YouTube, X main, LinkedIn |
| 9:16 vertical | `voxa-demo-vertical.mp4` | TikTok, Reels, Shorts |
| 1:1 square | `voxa-demo-square.mp4` | Instagram feed |

See [`docs/demo-video-README.md`](docs/demo-video-README.md) for the FFmpeg mux command to add ElevenLabs voice narration.

---

## 🏆 Built for #ElevenHacks

**50 hours. Two solo developers' worth of scope. Shipped.**

This repository is the entire product — backend, frontend, infrastructure, n8n workflows, deployment scripts, documentation site, and demo video pipeline. Every line was written during the ElevenLabs × Stripe hackathon weekend.

| Why this submission | |
|---|---|
| **Real product, real users** | A small-business owner could subscribe via Stripe Checkout, get a working phone number, and have customers calling within an hour. Not a toy. |
| **Deepest possible Stripe + EL integration** | Uses Stripe's brand-new (2025-03-31) Meter Events API for usage billing — *and* ElevenLabs' native Twilio import which is the recommended path, not a custom TwiML bridge. |
| **Voice cloning that matters** | The agent sounds like the *owner*, not a generic TTS. For a regional SMB customer who calls a familiar voice, this is the whole product. |
| **Multilingual is non-trivial** | The agent detects language on the first utterance and locks to it — Tamil-only callers don't get Hinglish, Telugu-only callers don't get Hindi. The system prompt is 800 words of regional language rules. |
| **Live, callable** | [`+1 (912) 912-6711`](tel:+19129126711). Judges can dial it from anywhere. |

---

## 📜 License

MIT — see [LICENSE](LICENSE).

---

<div align="center">

**Built by [@Sushant6095](https://github.com/Sushant6095) with help from Claude · 50 hours · ElevenHacks 2026**

[Live demo](https://voxa-inky.vercel.app) · [Call the AI](tel:+19129126711) · [API docs](https://voxa-inky.vercel.app/docs) · [Architecture](https://voxa-inky.vercel.app/docs/architecture)

</div>
