 # Voxa — 10-Phase Implementation Prompts

> Each phase is a self-contained prompt you paste into Claude Code. Run phases sequentially unless explicitly marked parallel-safe.
> **Use the slash commands instead when available.** `/phase 1` is equivalent to pasting Phase 1 prompt.

---

## ⚡ Quick start

```bash
# In Cursor / terminal at the repo root
claude

# Then dispatch phases:
> /bootstrap                  # Verifies prereqs, sets up .env
> /phase 1                    # Foundation
> /phase 2                    # Schema
> ...
> /smoke                      # End-to-end test
> /ship                       # Deploy
```

---

## Phase 1 — Foundation & Repo Bootstrap (target: 3h, was 2-3h)

```
You are kicking off Phase 1 of the Voxa hackathon project. Read CLAUDE.md first, including the "UI stack" section. Then read docs/ui-spec.md for the design tokens.

GOAL: A working Next.js 15 app deployed to Vercel, Supabase provisioned, Clerk wired, n8n deployed to Railway, the full UI library stack installed and pre-styled with Voxa's tokens.

DO:
1. Verify these env vars are set (ask me if missing): CLERK_SECRET_KEY, NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_ANON_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, ELEVENLABS_API_KEY, ANTHROPIC_API_KEY, N8N_WEBHOOK_BASE_URL.
2. Bootstrap Next.js 15 with App Router, TypeScript strict, Tailwind v4, pnpm. Initialize shadcn/ui with the slate base theme.
3. Install backend packages: @clerk/nextjs, @supabase/supabase-js, @supabase/ssr, stripe, twilio, @elevenlabs/elevenlabs-js, @anthropic-ai/sdk, zod, react-hook-form.
4. Install UI packages (the god-level stack): motion, @tremor/react, @xyflow/react, wavesurfer.js, react-parallax-tilt, sonner, vaul, cmdk, lucide-react, @tabler/icons-react, geist.
5. Run the Magic UI batch install (use /component magic for each — copy from .claude/skills/21st-dev-components/SKILL.md "essential install list"):
   - animated-beam, bento-grid, border-beam, magic-card, shimmer-button, interactive-hover-button, pulsating-button, number-ticker, animated-gradient-text, animated-shiny-text, text-shimmer, word-rotate, sparkles-text, dot-pattern, grid-pattern, blur-fade, text-reveal, marquee
6. Add Cal Sans font to public/fonts/ (download from github.com/calcom/font). Wire it into app/layout.tsx alongside Geist Sans + Geist Mono.
7. Create lib/design-tokens.ts with the locked Voxa palette from docs/ui-spec.md.
8. Update Tailwind config (Tailwind v4 uses @theme in CSS, not tailwind.config.js) — add the indigo-primary, pink-accent, emerald-success color tokens with semantic names.
9. Add Clerk middleware (clerkMiddleware, not authMiddleware) — Google OAuth only.
10. Create lib/supabase/{server,client,middleware}.ts using the SSR pattern (see nextjs-supabase-realtime skill).
11. Create lib/stripe.ts (apiVersion: '2025-03-31.basil'), lib/elevenlabs.ts, lib/twilio.ts, lib/n8n.ts as typed wrappers.
12. Build a real (not placeholder) landing page hero: <DotPattern /> background + <AnimatedGradientText /> pill + Cal Sans headline with <WordRotate /> + <ShimmerButton /> CTA. This is the FIRST screen judges will see when they open your repo — make it pop on day 1.
13. Add <Toaster /> from sonner in the root layout. Add the next-themes ThemeProvider.
14. Set up Vercel project, link, deploy to production. Confirm landing page loads with all animations working.
15. Stop and report: env vars still missing, deployment URL, screenshot of the landing hero.

PARALLEL DISPATCH:
- frontend-engineer: steps 2-3, 9-11, 13-14
- ui-virtuoso: steps 4-8, 12 (in parallel after step 2 completes)
- data-architect: nothing yet (Phase 2)
- integration-tester: step 1 (env verification) + step 15 (final report)

Sync after parallel work, then continue.
```

---

## Phase 2 — Database Schema + RLS (target: 1.5h)

```
Phase 2: Supabase schema for Voxa. Read CLAUDE.md for the table list.

DO:
1. Use the data-architect agent. Generate SQL migrations in supabase/migrations/0001_initial_schema.sql.
2. Create all tables from CLAUDE.md: businesses, agents, subscriptions, knowledge_base, calls, leads, meter_events.
3. Add foreign keys and indexes (every FK column gets an index, plus a composite index on calls(business_id, created_at desc)).
4. RLS policies: enable RLS on every table. For each, allow SELECT/INSERT/UPDATE only when business_id matches a business owned by auth.jwt() ->> 'sub' (the Clerk user ID).
5. Enable Supabase Realtime: ALTER PUBLICATION supabase_realtime ADD TABLE calls, leads.
6. Create a SQL function `current_business_id()` that returns the caller's business UUID for convenience.
7. Apply the migration via `supabase db push` (or psql to the connection string).
8. Generate TypeScript types: `supabase gen types typescript --linked > lib/supabase/types.ts`.
9. Add seed.sql with one demo business for local dev.
10. Smoke test: insert a business via the service role key, then select via an authed Clerk session — confirm RLS works.

OUTPUT: the SQL migration file and the generated types file. Confirm RLS by showing the smoke test result.
```

---

## Phase 3 — Stripe Foundation (target: 2.5h)

```
Phase 3: Stripe Meter + Products + Prices + Checkout + Customer Portal + Webhook.

Read .claude/skills/stripe-metered-billing/SKILL.md before writing any code.

DO:
1. Use the stripe-architect agent.
2. Create scripts/setup-stripe.ts. It MUST be idempotent (re-runnable). Use Stripe SDK to:
   a. Create or find a Meter: event_name="call_minutes", default_aggregation.formula="sum", customer_mapping.event_payload_key="stripe_customer_id".
   b. Create 3 Products: Voxa Starter, Voxa Growth, Voxa Scale.
   c. For each product, create TWO prices: one flat licensed monthly (₹999/₹2,999/₹7,999 in paise — Stripe uses smallest currency unit, so 99900/299900/799900), and one metered (per_unit, recurring.interval=month, recurring.usage_type=metered, recurring.meter=METER_ID, ₹15/₹12/₹10 per unit = 1500/1200/1000 in paise).
   d. Print all IDs to stdout and append to .env.local.
3. Build app/api/stripe/checkout/route.ts: accepts {tier: 'starter'|'growth'|'scale'}, returns Checkout Session URL with mode='subscription', line_items=[{price: flat}, {price: metered}].
4. Build app/api/stripe/portal/route.ts: returns Customer Portal session URL for the current Clerk user.
5. Build app/api/stripe/webhook/route.ts: verifies signature, switches on event type, forwards relevant events to n8n via fetch to N8N_WEBHOOK_BASE_URL + '/webhook/stripe'. Handle: checkout.session.completed, customer.subscription.{created,updated,deleted}, invoice.payment_failed.
6. Create a tiny test page at /pricing with 3 buttons that POST to /api/stripe/checkout.
7. Smoke test: complete a Checkout in test mode with card 4242 4242 4242 4242. Confirm the webhook fires and reaches n8n (use webhook.site temporarily if n8n isn't ready).

PARALLEL: stripe-architect handles 1-5, frontend-engineer handles 6, integration-tester handles 7.

OUTPUT: all 6 Price IDs added to .env.local, webhook.site capture proving end-to-end works.
```

---

## Phase 4 — Twilio + ElevenLabs Phone Setup (target: 3h)

```
Phase 4: Get a real phone call ringing through to an AI agent. This is the critical milestone.

Read .claude/skills/twilio-elevenlabs/SKILL.md before doing anything.

DO:
1. Use the telephony-engineer agent.
2. In the Twilio console, manually purchase 1 Indian local number for testing. Cost ~$1. Note the SID and E.164 number.
3. In the ElevenLabs dashboard, manually create a temporary test agent: name "Voxa Test", default voice, system prompt: "You are a friendly receptionist at Sharma Dental Clinic in Bengaluru. Greet warmly in Hindi-English mix. Offer to book appointments." First message: "Namaste, Sharma Dental Clinic, kaise madad kar sakti hoon?"
4. In ElevenLabs → Phone Numbers → Import number → From Twilio. Paste Twilio SID, Auth Token, and the number. Label "Voxa Test Number".
5. Assign the imported number to the test agent.
6. CALL THE NUMBER FROM YOUR PHONE. The agent must answer. If it doesn't: pause everything and debug. Don't move on until this works.
7. Once working, automate: build lib/telephony.ts with:
   - `provisionTwilioNumber(country='IN'): Promise<{sid, e164}>` — calls Twilio AvailablePhoneNumbers then IncomingPhoneNumbers.
   - `importNumberToElevenLabs(opts: {sid, token, e164, label}): Promise<{phone_number_id}>` — calls EL POST /v1/convai/phone-numbers.
   - `assignNumberToAgent(phone_number_id, agent_id): Promise<void>` — calls EL PATCH /v1/convai/phone-numbers/:id.
8. Test the automation: run a script that provisions a NEW number and attaches it to the existing test agent. Call the new number. Must work end-to-end.

OUTPUT: a recording or log showing a real phone call answered by the AI agent. The lib/telephony.ts file. The test agent ID and number in .env.local.

CHECKPOINT: if hour 7 of Phase 4 has passed and no call rings through, escalate. Fallback plan: use ElevenLabs "register call" endpoint with your own TwiML.
```

---

## Phase 5 — ElevenLabs Agent System (target: 3h)

```
Phase 5: Productionize the EL agent. Multilingual prompt, server tools, voice cloning, knowledge base.

Read .claude/skills/elevenlabs-conv-ai/SKILL.md before writing code.

DO:
1. Use the voice-engineer agent.
2. Build app/api/voice/clone/route.ts: accepts an audio file (multipart/form-data, max 60s), uploads to ElevenLabs via `POST /v1/voices/add`, returns {voice_id, name}. Store voice_id on the business row.
3. Build scripts/setup-elevenlabs-template.ts: defines the canonical agent template — system prompt, first message, language detection rules, voice settings, and 6 server tool definitions. Tools point at `${N8N_WEBHOOK_BASE_URL}/webhook/tool/{tool_name}`.
4. The 6 tools (each as an EL server tool config):
   - `check_availability(date: string, time_window: string)`
   - `book_appointment(customer_name, customer_phone, datetime_iso, service)`
   - `get_business_info(query: string)` — RAG over knowledge_base
   - `escalate_to_owner(reason: string, urgency: 'low'|'high')`
   - `send_callback_link(customer_phone: string)`
   - `log_lead(customer_name, customer_phone, intent, notes)`
5. System prompt rules:
   - Detect language from caller's first utterance. Respond in same language for the rest of the call. Supported: en, hi, ta, te.
   - Always confirm appointment details by repeating them back.
   - If caller is angry/frustrated (detected via sentiment cues), call escalate_to_owner with urgency='high'.
   - For business hours/services/menu questions, ALWAYS call get_business_info before answering. Never guess.
   - End every successful booking by mentioning the WhatsApp confirmation is coming.
6. Build `lib/elevenlabs.ts` with:
   - `createAgent(business: Business): Promise<{agent_id}>` — applies the template with business-specific overrides (business name, voice_id, language preference).
   - `ingestKnowledgeBase(agent_id, url): Promise<void>` — scrapes URL, pushes to agent's KB.
7. Add a settings page at /app/(app)/settings/voice that lets the user record (MediaRecorder API) 60s of audio and submit it to /api/voice/clone.
8. Test: clone your own voice, create a new agent using that voice via lib/elevenlabs.ts, attach a Twilio number from Phase 4, call it. The agent should respond in your cloned voice.

OUTPUT: the agent template script, the lib helpers, a voice-clone UI that works end-to-end, and a test call recording.
```

---

## Phase 6 — n8n Workflows (target: 6h, biggest phase)

```
Phase 6: Build all 5 n8n workflows. This is the orchestration backbone.

Read .claude/skills/n8n-workflow-design/SKILL.md first.

DO:
1. Use the workflow-architect agent.
2. Open n8n at your Railway URL. Build 5 workflows. Export each as JSON to n8n/0X-name.json.

WORKFLOW 1 — Onboarding (trigger: Stripe webhook checkout.session.completed forwarded from /api/stripe/webhook):
   nodes: Webhook → Set (extract metadata) → HTTP Request (Twilio buy number) → HTTP Request (EL voices/add if voice_sample_url present) → HTTP Request (EL agents/create) → HTTP Request (EL phone-numbers/import) → HTTP Request (EL phone-numbers/:id assign agent) → Supabase Insert (agents row) → HTTP Request (Twilio WhatsApp send activation msg to owner)
   Test with a real Checkout session.

WORKFLOW 2 — Live Tools (trigger: Webhook receives EL tool calls):
   nodes: Webhook (path /webhook/tool/:tool_name) → Switch on $params.tool_name with 6 branches:
   - check_availability: HTTP → Cal.com getSlots → Respond
   - book_appointment: HTTP → Cal.com createBooking → HTTP → Twilio WhatsApp confirmation → Supabase insert leads → Respond
   - get_business_info: Supabase select knowledge_base → Respond
   - escalate_to_owner: HTTP → Twilio call-forward TwiML update + WhatsApp → Respond
   - send_callback_link: HTTP → Twilio WhatsApp with Cal.com link → Respond
   - log_lead: Supabase insert leads + optional HubSpot push → Respond
   Each branch must respond in <2s (EL tool timeout is ~5s).

WORKFLOW 3 — Post-Call Processing (trigger: EL post_call_transcription webhook forwarded from /api/elevenlabs/webhook):
   nodes: Webhook → Code (compute minutes = ceil(duration_seconds/60)) → HTTP Request (Stripe meter_events.create with stripe_customer_id from business lookup, value as string of integer) → HTTP Request (Anthropic Claude API for structured extraction: lead_score, intent, sentiment, customer_name, customer_phone, follow_up) → Supabase Insert calls + Upsert leads → IF lead_score >= 7 OR sentiment='angry' → Twilio WhatsApp hot-lead alert to owner.

WORKFLOW 4 — Stripe Webhooks (trigger: Webhook from /api/stripe/webhook):
   nodes: Webhook → Switch on event.type:
   - invoice.payment_failed: WhatsApp owner + Supabase update agents.status='paused'
   - customer.subscription.deleted: HTTP Twilio release number + HTTP EL delete agent + Supabase archive
   - customer.subscription.updated: Supabase update subscriptions row

WORKFLOW 5 — Daily Digest (trigger: Cron at 18:00 IST):
   nodes: Cron → Supabase query (calls + leads for today, grouped by business) → loop → format → Twilio WhatsApp to business.owner_whatsapp.

3. For each workflow, after building it visually, click ⋯ → Download to get JSON. Save into n8n/ folder.
4. Activate every workflow (toggle production URL).
5. Test each: trigger via curl/Postman or by completing a real call/Checkout. Verify execution log shows green.

PARALLEL: workflow-architect builds W1 + W2 in serial, integration-tester builds W3 + W4 + W5 in parallel after W1 + W2 are done.

OUTPUT: 5 JSON files in n8n/, all activated in production, all tested end-to-end.
```

---

## Phase 7 — Dashboard with LIVE ORCHESTRATION (target: 7h)

```
Phase 7: God-level dashboard. This is the screen judges see in Demo Act 2 of the video. The React Flow live orchestration view is the centerpiece — get it right.

READ FIRST:
- docs/ui-spec.md (Screen 4 — Dashboard section)
- .claude/skills/react-flow-realtime/SKILL.md (the orchestration view, full implementation)
- .claude/skills/21st-dev-components/SKILL.md (components to use)
- .claude/skills/motion-and-effects/SKILL.md (animation patterns)
- .claude/agents/ui-virtuoso.md

PARALLEL DISPATCH:
- ui-virtuoso: layout shell, KPI cards visuals, React Flow orchestration, empty states, animations
- frontend-engineer: data fetching, Supabase Realtime wiring, drawer/dialog plumbing
- integration-tester: at the end, verify realtime stream end-to-end

BUILD:
1. App shell (app/(app)/layout.tsx):
   - Sidebar: 7 nav items (Dashboard, Calls, Leads, Knowledge, Voice, Billing, Settings)
   - Active route gets indigo bg; use motion.div layoutId="nav-indicator" for sliding indicator
   - Top bar: Voxa logo, ⌘K search trigger, notification bell, Clerk UserButton
   - <DotPattern /> background with radial mask on main content
   - next-themes ThemeProvider, <Toaster /> from sonner

2. /dashboard (3 sections top to bottom):
   
   2a. KPI ROW — 4 <MagicCard /> cards:
   - "Today's calls": <NumberTicker /> + Tremor <SparkAreaChart /> + pulsing emerald live dot
   - "Minutes this month": "842 / 2000" with Tremor <ProgressBar color="indigo" />
   - "Hot leads": count of score≥7, sparkline, <BorderBeam /> if >5
   - "Estimated invoice": ₹ in Geist Mono, refreshes on meter event
   Each card: motion.div whileHover={{y:-4}}; <BlurFade /> entry with stagger.
   
   2b. LIVE ORCHESTRATION (the showcase):
   - Implement EXACTLY per .claude/skills/react-flow-realtime/SKILL.md
   - Dynamic import with ssr:false (React Flow can't SSR)
   - Subscribe to Supabase Realtime: calls, leads, meter_events for this business
   - Add Cmd+Shift+D keyboard shortcut to simulate a call flow (for video filming)
   - Card border using <ShineBorder /> if not too visually busy
   - "Live" badge above with <AnimatedShinyText /> + pulsing dot
   
   2c. RECENT CALLS table:
   - Last 10 calls, shadcn <Table />
   - Each row in motion.tr with layout prop; new rows enter via <BlurFade />
   - Realtime INSERT subscription prepends rows
   - Row click → Vaul <Drawer /> with transcript + Wavesurfer audio player
   - In-progress calls show pulsing emerald dot
   - Empty state: designed phone icon + "Call your number" + copy-demo-number button

3. /calls — full table with filters (date range, language, has_lead), pagination, same drawer

4. /leads — kanban:
   - pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
   - 4 columns (New, Contacted, Won, Lost)
   - Cards use <MagicCard />; hot leads (≥7) wrapped in <BorderBeam />
   - Score badge: gradient pill emerald→amber→slate
   - On drag end → server action; motion.layout for smooth swap
   - Empty columns: dashed border + "Drag leads here"

5. /knowledge — URL input + Tremor <ProgressBar /> ingest + sources list

6. /voice — Wavesurfer recorder + current cloned voice waveform + clone date

7. /billing — current plan + Tremor <ProgressBar /> usage + <NumberTicker /> invoice + Stripe Portal button

8. Command palette (cmdk):
   - ⌘K trigger from anywhere in (app)
   - Navigate, search calls/leads, jump to settings

9. Sonner toasts everywhere user-facing actions complete

10. Performance:
    - Lazy-load React Flow, Wavesurfer, Tremor (each ~50KB+)
    - Suspense boundaries per section
    - Lighthouse target: Performance ≥ 90, Accessibility ≥ 95

OUTPUT:
- 5 screenshots in docs/screenshots/ (dashboard, calls drawer, leads kanban, voice clone, billing)
- 10s screen recording of the orchestration view animating during a call (or simulated)
- Lighthouse report attached
- Confirm realtime: make a call, dashboard updates without refresh
```

---

## Phase 8 — Landing + Onboarding (target: 5h)

```
Phase 8: Landing is the second-most-important screen after dashboard. Make it look like Linear, Vercel, or Cal.com — not a hackathon project.

READ FIRST:
- docs/ui-spec.md (Screen 1 Landing + Screen 3 Onboarding)
- .claude/skills/21st-dev-components/SKILL.md
- .claude/skills/motion-and-effects/SKILL.md
- .claude/agents/ui-virtuoso.md

PARALLEL DISPATCH:
- ui-virtuoso: hero, bento grid, pricing visuals, onboarding step UIs, animations
- frontend-engineer: form handlers, server actions, Stripe Checkout wiring, onboarding state machine

BUILD:

1. Landing (/):
   1a. HERO (above fold):
   - <DotPattern /> background + radial mask
   - Aurora orb: blurred animated gradient behind headline
   - <AnimatedGradientText /> pill "✨ Voice cloning in 60 seconds"
   - Headline Cal Sans 64px: "The AI Receptionist that speaks {<WordRotate words={['Hindi','Tamil','Telugu','English']} />}"
   - Subhead 2 lines slate-600
   - <ShimmerButton> "Get your number — ₹999/mo" → /pricing
   - <InteractiveHoverButton> "Watch 60s demo" → opens video modal
   - <BlurFade /> staggered entry on each element
   
   1b. "How it works" — <AnimatedBeam /> connecting 4 icons (Phone → Twilio → ElevenLabs → Phone), with 3-step text below
   
   1c. BENTO GRID (6 cells asymmetric):
   - Cell 1 (col-span-2): Voice cloning + animated waveform SVG
   - Cell 2: Multilingual + fading flag emojis
   - Cell 3: Stripe Meter + <NumberTicker /> counting ₹
   - Cell 4: WhatsApp + sliding notification mock
   - Cell 5 (row-span-2): Calendar booking + grid SVG
   - Cell 6: Knowledge base + scrape→answer illustration
   - Hover lift + subtle glow border on each
   
   1d. PRICING (3 cards):
   - All wrapped in react-parallax-tilt (tiltMaxAngleX={6})
   - Each uses <MagicCard />
   - Middle "Growth" tier ALSO has <BorderBeam size={250} duration={12} colorFrom="#6366F1" colorTo="#EC4899" />
   - Subscribe buttons → server action → Stripe Checkout
   - "Popular" badge on Growth with pulse animation
   
   1e. <Marquee /> with 8 placeholder SMB names + reverse second row
   
   1f. FAQ accordion (shadcn) with 5 questions
   
   1g. Footer: 3 columns, <TextShimmer /> on "Voxa", Lucide social icons

2. /pricing — same 3 cards (refactor into shared component) + feature comparison table with sticky header

3. /onboarding (multi-step wizard):
   - Gate behind session_id query param from Stripe success_url; verify server-side
   - template.tsx transitions (fade-in-from-bottom)
   - Progress dots with motion.div layoutId for active indicator
   
   Step 1 — Welcome: <SparklesText /> heading, brief copy, Continue
   Step 2 — Business form: name, owner WhatsApp E.164, language radio, website URL. Focus state has border glow. POST to /api/onboarding/business → returns business_id
   Step 3 — Voice clone:
     - Wavesurfer live amplitude
     - <PulsatingButton /> with red dot, animates inner ring when recording
     - <NumberTicker /> 60→0 countdown
     - Stop + playback after
     - Submit → /api/voice/clone → stores voice_id
     - "Skip and use default" link
   Step 4 — Website URL: input + "Scrape" button + Tremor <ProgressBar /> + page count
   Step 5 — Provisioning:
     - "Provisioning your AI receptionist…" + <NumberTicker /> 60→0
     - 6 checklist items animate ⠋→✓ as they complete
     - Poll Supabase agents table every 2s for status='active'
     - Auto-advance to Step 6 on complete
   Step 6 — Success:
     - <SparklesText /> "You're live!"
     - Big phone number in Geist Mono + copy button
     - <ShimmerButton /> "Call your AI receptionist now" → tel: link
     - "WhatsApp activation message sent" subtext

4. Video modal: Vaul <Drawer /> with iframe (placeholder until Day 4)

5. Dark mode tested on every page; toggle in app shell top bar

OUTPUT:
- 4 screenshots: landing hero, pricing, onboarding step 3, onboarding step 6
- Lighthouse on /: Performance ≥ 90, Accessibility ≥ 95
- Full onboarding flow tested with real Stripe Checkout
```

---

## Phase 9 — WhatsApp + Advanced Polish (target: 3h)

```
Phase 9: WhatsApp Business sandbox + multilingual testing + sentiment escalation refinement.

DO:
1. Use the telephony-engineer agent.
2. Activate the Twilio WhatsApp Business sandbox (Console → Messaging → Try it Out → Send a WhatsApp message). Note the sandbox number and join code.
3. Document in docs/runbook.md: "To receive WhatsApp confirmations, recipients must first WhatsApp the join code to +1 415 523 8886."
4. In n8n Workflow 2 (book_appointment branch) and Workflow 3 (hot-lead alert), confirm the WhatsApp node uses `whatsapp:` prefix on To and From numbers.
5. Test all 4 supported languages with real test calls. For each, record a 15s clip showing the agent responding correctly. Use these in the demo video.
6. Refine the system prompt if any language fails (often Tamil needs more guidance — add "If caller speaks Tamil, respond ONLY in Tamil, do not mix English.").
7. Sentiment escalation: test by calling and being aggressive. Confirm escalate_to_owner fires and the WhatsApp alert lands within 10s.
8. Audio quality: in the EL agent settings, lock the model to `eleven_turbo_v2_5` for lowest latency. Stability 0.5, similarity 0.75.

OUTPUT: 4 short test call recordings (one per language), screenshots of WhatsApp confirmations, updated runbook.
```

---

## Phase 10 — Polish, Smoke Test, Video Prep (target: 4h)

```
Phase 10: Lock the code. Test end-to-end. Prepare for video shoot.

DO:
1. Use the shipping-orchestrator agent.
2. Run `/smoke` — the full end-to-end test: fresh signup → Checkout → onboarding → voice clone → URL ingest → first call → booking → WhatsApp → dashboard shows lead → meter event in Stripe → daily digest preview.
3. Fix any bugs that surface. ONLY bug fixes. No new features.
4. README.md: write a clean overview with stack, demo link, demo phone number, architecture diagram (link to docs/architecture.md), 3-line "how it works."
5. docs/architecture.md: paste the architecture diagram from CLAUDE.md and the n8n workflow descriptions.
6. docs/demo-script.md: the 60-second video shot list from CLAUDE.md.
7. Smoke test on a different device/browser to catch session issues.
8. Confirm production deployment is stable. Vercel deploy logs clean, n8n executions green.
9. Set the demo phone number to "always available" — no rate limits, no test mode pause.
10. CODE FREEZE. Tag the repo `v1.0-hackathon-submission`. After this, no commits to main except critical bug fixes.

OUTPUT: clean README, all docs in place, smoke test pass, repo tagged. Ready for video day.
```

---

## After Phase 10 — Day 4 (video + posting, NOT a coding phase)

Use these slash commands:

```
> /demo prep      # Prints the shot list and pre-flight checklist
> /demo record    # Reminders for filming
> /demo post      # Generates platform-specific social copy
```

Do not open the codebase on Day 4 unless something is broken in the demo.
