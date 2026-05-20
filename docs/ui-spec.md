# Voxa UI Spec — The God-Level Bible

> Every screen. Every wow moment. Every component install. Reference for ui-virtuoso.
> If it's not on this list, don't build it. If it IS on this list, build it well.

---

## Design tokens (locked)

```ts
// lib/design-tokens.ts
export const colors = {
  primary:    '#6366F1',  // indigo-500 — Voxa brand
  primaryDark:'#4F46E5',  // indigo-600
  accent:     '#EC4899',  // pink-500 — voice/AI motif
  accentDark: '#DB2777',  // pink-600
  success:    '#10B981',  // emerald-500 — booking confirmed, meter event
  warning:    '#F59E0B',  // amber-500
  danger:     '#EF4444',  // red-500
  bgLight:    'bg-gradient-to-br from-slate-50 via-indigo-50/30 to-pink-50/20',
  bgDark:     'bg-gradient-to-br from-slate-950 via-indigo-950/30 to-pink-950/20',
};

export const fonts = {
  sans: 'Geist Sans',       // body
  mono: 'Geist Mono',       // numbers, code
  display: 'Cal Sans',      // hero headlines only
};

export const easing = {
  smooth:     [0.16, 1, 0.3, 1],   // luxurious reveals
  out:        [0.22, 1, 0.36, 1],  // standard out
  inOut:      [0.4, 0, 0.2, 1],    // page transitions
};

export const radius = {
  card: 'rounded-2xl',
  button: 'rounded-lg',
  pill: 'rounded-full',
};
```

## Library inventory (install on Day 1)

```bash
# Animations & motion
pnpm add motion

# Visual extras
pnpm add @tremor/react              # dashboard charts
pnpm add @xyflow/react              # React Flow for orchestration
pnpm add wavesurfer.js              # voice waveform
pnpm add react-parallax-tilt        # 3D tilt on pricing cards

# UX primitives
pnpm add sonner vaul cmdk           # toast / drawer / command palette

# Icons
pnpm add lucide-react @tabler/icons-react

# Magic UI components (install batch via /component or shadcn CLI)
# See .claude/skills/21st-dev-components/SKILL.md for the install commands
```

## Fonts

In `app/layout.tsx`:

```tsx
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import localFont from 'next/font/local';

const calSans = localFont({
  src: '../public/fonts/CalSans-SemiBold.woff2',
  variable: '--font-cal',
  display: 'swap',
});

<body className={`${GeistSans.variable} ${GeistMono.variable} ${calSans.variable} font-sans antialiased`}>
```

Download Cal Sans free from https://github.com/calcom/font.

---

## Screen 1 — Landing (/)

**Goal:** A first-time visitor in 5 seconds understands: AI receptionist, Indian businesses, multilingual, ₹999/mo.

### Hero (above fold)

```
┌─────────────────────────────────────────────────────────┐
│  ⠐ Dot pattern background with radial mask              │
│                                                         │
│    ✨ <AnimatedGradientText> Voice cloning in 60s       │
│                                                         │
│    The AI Receptionist that                             │
│    speaks <WordRotate>Hindi|Tamil|Telugu|English</…>   │
│              (Cal Sans, 64px)                           │
│                                                         │
│    Never miss a customer call again.                    │
│    Books appointments, sends WhatsApp confirmations,    │
│    and bills you per minute via Stripe.                 │
│                                                         │
│    [ShimmerButton: Get your number — ₹999/mo]           │
│    [InteractiveHoverButton: Watch 60s demo]             │
│                                                         │
│    ⠐⠐⠐⠐⠐⠐⠐⠐⠐⠐⠐⠐⠐⠐⠐⠐⠐⠐⠐⠐⠐⠐⠐⠐⠐⠐⠐⠐⠐⠐⠐⠐⠐⠐⠐⠐⠐⠐⠐⠐⠐⠐⠐⠐⠐ │
└─────────────────────────────────────────────────────────┘
```

Required components:
- `<DotPattern />` with radial mask
- `<AnimatedGradientText />` for the "Voice cloning in 60s" pill
- `<WordRotate />` for the language cycle (English → Hindi → Tamil → Telugu → English…)
- `<ShimmerButton />` for primary CTA
- `<InteractiveHoverButton />` for secondary CTA

Background polish:
- Animated gradient orb (aurora effect) blurred behind the headline, slow pulse

### "How it works" — Animated Beam section

```
┌────────────────────────────────────────────────────────┐
│  How Voxa works                                        │
│                                                        │
│   📞 Caller  ━━━━━━━━━━━━━━ 📱 Twilio                  │
│                                  ┃                     │
│              ✨ AnimatedBeam     ┃                     │
│                                  ▼                     │
│   📊 Stripe Meter  ◀━━━━━━ 🤖 ElevenLabs              │
│                                                        │
│   The beams animate continuously — light travels along │
│   each edge in a 3s loop, gradient #6366F1 → #EC4899.  │
└────────────────────────────────────────────────────────┘
```

Use Magic UI's `<AnimatedBeam />` with 4 nodes. Lays out the architecture in one image.

### Bento Grid features

6 cells, asymmetric. From the skill:

```
┌──────────────────────┬──────────────┐
│ Voice cloning        │ Multilingual │
│ (waveform svg)       │ (flag carou.)│
│  (col-span-2)        │              │
├──────────────────────┼──────────────┤
│ Stripe Meter         │ WhatsApp     │
│ (counting up)        │ confirmations│
├──────────────┬───────┴──────────────┤
│ Calendar     │ Knowledge base RAG   │
│ bookings     │ (URL → answers)      │
└──────────────┴──────────────────────┘
```

Each cell has:
- A small animated illustration or SVG
- Title (16px, bold)
- One-line description (14px, slate-600)
- Hover lift + subtle glow

### Pricing — 3 tiers, middle one beams

```
┌───────────┐   ┌───────────┐   ┌───────────┐
│  Starter  │   │  Growth   │   │  Scale    │
│  ₹999/mo  │   │ ₹2,999/mo │   │ ₹7,999/mo │
│           │   │  ┌─────┐  │   │           │
│ 100 min   │   │  │BEAM │  │   │ 2000 min  │
│ ₹15/min   │   │  └─────┘  │   │ ₹10/min   │
│  overage  │   │ 500 min   │   │  overage  │
│           │   │ ₹12/min   │   │           │
│  [Start]  │   │  [POPULAR]│   │ [Contact] │
└───────────┘   └───────────┘   └───────────┘
```

The Growth card uses `<BorderBeam />` traveling the perimeter. All three use `<MagicCard />` for hover glow. Use `react-parallax-tilt` for subtle 3D tilt on hover.

### Marquee / trusted by

Horizontal scrolling row of "trusted by" placeholders: Sharma Dental, Reddy Salon, Patel Clinic, Iyer Realty, etc. Use Magic UI `<Marquee />` with `reverse` on a second row for visual balance.

### Footer

- 3 columns: Product / Company / Resources
- Copyright with `<TextShimmer />` on "Voxa" word
- Social links with Lucide icons

---

## Screen 2 — Pricing page (/pricing)

Same 3 cards as on landing, but full-page with feature comparison table below.

Feature comparison table uses Lucide CheckCircle (green) and X (slate-400) icons. Sticky header on scroll.

---

## Screen 3 — Onboarding wizard (/onboarding)

Multi-step, post-checkout. Each step is a separate page that animates in via `template.tsx`.

### Step 1 — Welcome

```
┌──────────────────────────────────────┐
│  🎉 (sparkles text)                  │
│  Your subscription is active.         │
│                                       │
│  Let's get your AI receptionist        │
│  ringing in 60 seconds.               │
│                                       │
│  Progress: ●━━○━━○━━○━━○                │
│            1   2   3   4   5           │
│                                       │
│  [Continue →]                          │
└──────────────────────────────────────┘
```

### Step 2 — Business details

Form: name, owner WhatsApp, language preference (radio), website URL.
Each input has a subtle border-glow on focus.

### Step 3 — Voice clone

```
┌──────────────────────────────────────┐
│  Record your voice (60 seconds)       │
│                                       │
│  ┌───────────────────────────────┐   │
│  │ ▁▂▃▅▇▅▃▂▁▂▃▅▇▅▃▂▁▂▃▅▇▅▃▂▁    │   │
│  │  (live wavesurfer waveform)    │   │
│  └───────────────────────────────┘   │
│                                       │
│         🔴  ← <PulsatingButton>       │
│        Tap to record                  │
│                                       │
│  [Skip for now — use default voice]   │
└──────────────────────────────────────┘
```

When recording:
- Big circular record button pulses with a ring (Framer Motion `animate={{ scale: [1, 1.1, 1] }}`)
- Wavesurfer draws live amplitude
- Countdown "0:58" in `<NumberTicker />` style

After 60s or user taps stop:
- Waveform freezes
- Playback button appears
- "Sounds good →" / "Re-record" buttons

### Step 4 — Website URL

Simple input + "Scrape and ingest" button. Show progress bar while scraping. Show pages count when done.

### Step 5 — Provisioning

```
┌──────────────────────────────────────┐
│  Provisioning your AI receptionist…   │
│                                       │
│  ⏱  <NumberTicker counting 60→0>       │
│                                       │
│  ✓ Buying Indian phone number          │
│  ✓ Cloning your voice                  │
│  ✓ Creating AI agent                   │
│  ⠋ Importing number to ElevenLabs      │
│  ○ Configuring tools                   │
│  ○ Sending you a WhatsApp activation   │
│                                       │
└──────────────────────────────────────┘
```

Polls Supabase for `agents.status='active'`. Each step lights up green with `<BlurFade />` as it completes.

### Step 6 — Success

```
┌──────────────────────────────────────┐
│  ✨ <SparklesText>You're live!         │
│                                       │
│  Your AI receptionist is ready:        │
│                                       │
│  📞 +91 80 4567 8910                   │
│      (display: 4xl, font-mono)        │
│                                       │
│  [📱 Call your AI receptionist now]    │
│                                       │
│  We just sent you a WhatsApp           │
│  message to confirm.                   │
└──────────────────────────────────────┘
```

---

## Screen 4 — Dashboard (/dashboard) — THE SHOWCASE

### Layout

```
┌──────────────────────────────────────────────────┐
│  [Logo] Voxa     [Search] [Bell] [Avatar▼]       │
├──────────────────────────────────────────────────┤
│ │                                                │
│ │  KPI Row (4 cards with NumberTicker + sparkline)│
│ │  ┌──────┬──────┬──────┬──────┐                  │
│ │  │Today's│ Min  │ Hot  │Bill │                   │
│ │  │ Calls│Used  │Leads │₹####│                   │
│ │  │  47▲ │842/2k│  12🔥│      │                   │
│ │  └──────┴──────┴──────┴──────┘                  │
│ │                                                  │
│N│  ╔════════════════════════════════════════╗   │
│a│  ║   ★ LIVE ORCHESTRATION (React Flow)    ║   │
│v│  ║                                         ║   │
│ │  ║   ☎ Caller ━━ Twilio ━━ EL Agent       ║   │
│ │  ║                          ┃              ║   │
│ │  ║                          ↓ (animating)  ║   │
│ │  ║                       n8n ━┬━ Cal.com   ║   │
│ │  ║                            ├━ WhatsApp  ║   │
│ │  ║                            ├━ Supabase  ║   │
│ │  ║                            └━ Stripe    ║   │
│ │  ╚════════════════════════════════════════╝   │
│ │                                                  │
│ │  Recent calls table (last 10, realtime stream)  │
│ │  [calls with row entry BlurFade]                │
└──────────────────────────────────────────────────┘
```

KPI cards:
- `<MagicCard />` wrapper with hover glow
- `<NumberTicker />` for the value
- Tremor `<SparkAreaChart />` for the 7-day trend
- Pulsing emerald dot if "live" (today's calls updates in realtime)

Live Orchestration: see `.claude/skills/react-flow-realtime/SKILL.md`. This is the centerpiece. Lazy-load it (`dynamic(import, { ssr: false })`).

Recent calls:
- Plain shadcn `<Table />`
- Each new row enters with `<BlurFade />`
- Pulsing dot on currently-active calls
- Row click → opens transcript drawer (Vaul `<Drawer />`)

### Empty state (first-time user)

```
┌──────────────────────────────────────┐
│         (centered, 3xl)              │
│      No calls yet                    │
│                                       │
│   Your AI receptionist is ready and   │
│   waiting. Make a test call to        │
│   +91 80 XXX XXXXX to see it in       │
│   action.                             │
│                                       │
│   [Call my number]  [Skip tutorial]   │
└──────────────────────────────────────┘
```

With a subtle pulsing phone icon SVG above the heading.

---

## Screen 5 — Calls page (/calls)

Full table with filters (date range, language, has_lead). Each call row:
- Time + caller phone (formatted with country code)
- Duration (formatted m:ss)
- Language detected (flag emoji)
- Lead score badge (color-coded gradient)
- "View" button → opens drawer with transcript + audio player

Transcript drawer uses Vaul (smooth mobile drawer). Audio player uses Wavesurfer with playhead following the highlighted transcript line.

---

## Screen 6 — Leads kanban (/leads)

```
┌──────────────────────────────────────────────┐
│  [Search]  [Filter ▼]            [+ New]      │
├───────────┬───────────┬───────────┬───────────┤
│   New (12)│Contacted 5│  Won (3)  │ Lost (1)  │
├───────────┼───────────┼───────────┼───────────┤
│           │           │           │           │
│ ┌───────┐ │ ┌───────┐ │ ┌───────┐ │           │
│ │Card 9 │ │ │Card 8 │ │ │Card 10│ │           │
│ │BorderB│ │ │       │ │ │       │ │           │
│ └───────┘ │ └───────┘ │ └───────┘ │           │
│           │           │           │           │
│ ┌───────┐ │ ┌───────┐ │           │           │
│ │Card 7 │ │ │Card 6 │ │           │           │
│ └───────┘ │ └───────┘ │           │           │
└───────────┴───────────┴───────────┴───────────┘
```

- dnd-kit for drag-and-drop between columns
- Framer Motion `layout` prop for smooth transitions when cards move
- Hot leads (score ≥ 7) wrapped in `<BorderBeam />`
- Card hover → 3D tilt + glow

---

## Screen 7 — Knowledge base (/knowledge)

Simple. Paste URL → button "Ingest". List of ingested sources below with delete. Add a subtle ingestion progress bar with Tremor `<ProgressBar color="indigo" />`.

---

## Screen 8 — Voice settings (/voice)

Re-recording UI. Same wavesurfer pattern from onboarding. Show current cloned voice waveform + last clone date.

---

## Screen 9 — Billing (/billing)

```
┌──────────────────────────────────────┐
│  Current plan                         │
│  Growth — ₹2,999/mo                   │
│                                       │
│  Minutes used: 842 / 2000             │
│  ████████████░░░░░░░░░░ 42%           │
│                                       │
│  Estimated invoice this period:       │
│  ₹2,999 + ₹0 overage = ₹2,999         │
│                                       │
│  [Manage subscription via Stripe →]   │
│  [Download invoices]                  │
└──────────────────────────────────────┘
```

Pull current usage from Supabase aggregate of meter_events. The progress bar fills with smooth animation (`<ProgressBar />`).

---

## Sidebar nav (persistent in /app routes)

```
┌─────────┐
│  Voxa   │
├─────────┤
│ 📊 Dashboard│
│ ☎  Calls    │
│ ⭐ Leads    │
│ 📚 Knowledge│
│ 🎙 Voice    │
│ 💳 Billing  │
│           │
│ ─────────  │
│ ⚙ Settings │
│ 🚪 Sign out│
└─────────┘
```

Active route gets indigo background + indigo-700 text. Use `<motion.div layoutId="nav-indicator" />` for smooth indicator slide between items.

---

## Toasts (Sonner)

For success/error feedback. Position: bottom-right. Theme: matches Voxa colors.

```tsx
import { toast } from 'sonner';

toast.success('Number provisioned', { description: '+91 80 4567 8910' });
toast.error('Voice cloning failed', { description: 'Try again with a quieter recording.' });
```

In `app/layout.tsx`: `<Toaster richColors position="bottom-right" />`.

---

## Command palette (cmdk)

For power users. Trigger: `⌘K`. Lets the user jump to any page, search calls/leads, etc. Builds credibility — judges who try it see polish.

```tsx
import { Command } from 'cmdk';

<Command.Dialog open={open} onOpenChange={setOpen}>
  <Command.Input placeholder="Search calls, leads, settings…" />
  <Command.List>
    <Command.Group heading="Navigate">
      <Command.Item onSelect={() => router.push('/dashboard')}>Dashboard</Command.Item>
      {/* ... */}
    </Command.Group>
  </Command.List>
</Command.Dialog>
```

---

## Loading states (do NOT skip these)

- Page-level: shadcn `<Skeleton />` matching the eventual layout
- Inline: spinning Lucide `<Loader2 className="animate-spin" />` 
- Buttons: replace text with `<Loader2 className="animate-spin" />` + keep button width stable
- Full-page (onboarding provisioning): see Screen 3 Step 5

---

## What NOT to design

- Don't design a custom auth UI — Clerk provides one
- Don't design a custom Stripe checkout — redirect to Stripe Hosted
- Don't design a custom billing portal — redirect to Stripe Customer Portal
- Don't add a help/support page — out of scope
- Don't add a settings page beyond business details — out of scope
- Don't add team/multi-user UI — out of scope

---

## Quality checks before "ship UI complete"

For each screen:
- [ ] Mobile responsive at 375px width
- [ ] Dark mode looks intentional, not "shadcn defaults inverted"
- [ ] Loading states present and matching
- [ ] Empty states designed
- [ ] No layout shift on data load (use Skeleton or reserved space)
- [ ] Animations respect prefers-reduced-motion
- [ ] No console errors in production build
- [ ] Lighthouse Performance ≥ 90, Accessibility ≥ 95
- [ ] Screenshot captured in `docs/screenshots/` for video B-roll
