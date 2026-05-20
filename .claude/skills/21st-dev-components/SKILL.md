---
name: 21st-dev-components
description: Use whenever installing pre-built UI components from 21st.dev, Magic UI, Aceternity UI, or other shadcn-compatible registries. Knows the install commands, the highest-impact components for Voxa, and the integration pattern. Trigger on terms "21st.dev", "Magic UI", "Aceternity", "shadcn registry", "install component", "animated component".
---

# 21st.dev and the Component Registry Ecosystem

## Mental model

`shadcn@latest add` can install components from ANY URL that hosts a valid registry JSON. The major free registries are:

| Registry | URL pattern | Notes |
|---|---|---|
| **shadcn/ui** | `npx shadcn@latest add button` | The base. Already installed in your project. |
| **Magic UI** | `npx shadcn@latest add "https://magicui.design/r/{name}.json"` | All free. Animated. |
| **21st.dev** | `npx shadcn@latest add "https://21st.dev/r/{author}/{component}"` | Community-curated. Most free. |
| **Aceternity** | Copy-paste from site (no CLI for most) | Some free, some paid. |
| **shadcnblocks.com** | `npx shadcn@latest add "https://www.shadcnblocks.com/r/{name}.json"` | Page sections. |
| **Tremor** | `pnpm add @tremor/react` then import | Not via shadcn — npm package. |

After install, the component is vendored into `components/ui/` (or `components/magicui/`) and is yours to edit. No runtime dependency on the registry.

## The Voxa "essential install" list

Run this as a single block on Day 1 right after shadcn init:

```bash
# Animated text and numbers
npx shadcn@latest add "https://magicui.design/r/animated-gradient-text.json"
npx shadcn@latest add "https://magicui.design/r/number-ticker.json"
npx shadcn@latest add "https://magicui.design/r/animated-shiny-text.json"
npx shadcn@latest add "https://magicui.design/r/text-shimmer.json"
npx shadcn@latest add "https://magicui.design/r/word-rotate.json"

# Backgrounds
npx shadcn@latest add "https://magicui.design/r/dot-pattern.json"
npx shadcn@latest add "https://magicui.design/r/grid-pattern.json"
npx shadcn@latest add "https://magicui.design/r/animated-grid-pattern.json"

# Hero / feature components
npx shadcn@latest add "https://magicui.design/r/animated-beam.json"
npx shadcn@latest add "https://magicui.design/r/bento-grid.json"
npx shadcn@latest add "https://magicui.design/r/marquee.json"

# Cards and borders
npx shadcn@latest add "https://magicui.design/r/magic-card.json"
npx shadcn@latest add "https://magicui.design/r/border-beam.json"
npx shadcn@latest add "https://magicui.design/r/shine-border.json"

# Buttons
npx shadcn@latest add "https://magicui.design/r/shimmer-button.json"
npx shadcn@latest add "https://magicui.design/r/rainbow-button.json"
npx shadcn@latest add "https://magicui.design/r/interactive-hover-button.json"
npx shadcn@latest add "https://magicui.design/r/pulsating-button.json"

# Effects
npx shadcn@latest add "https://magicui.design/r/sparkles-text.json"
npx shadcn@latest add "https://magicui.design/r/blur-fade.json"
npx shadcn@latest add "https://magicui.design/r/text-reveal.json"
```

This is ~20 components. Total install time: ~3 minutes. All saved to `components/magicui/`. Tree-shakes — only what's imported ships to the client.

## Component → Voxa screen mapping

### Landing page (/)

| Slot | Component | Why |
|---|---|---|
| Background | `<DotPattern />` + radial mask | The Linear/Vercel signature look |
| Above-the-fold pill | `<AnimatedGradientText />` "New: Voice cloning in 60 seconds" | Catches the eye instantly |
| Headline | Cal Sans 56px + `<SparklesText />` on "AI Receptionist" | Subtle emphasis without being gaudy |
| Subhead phrase rotator | `<WordRotate />` cycling through Hindi/Tamil/Telugu/English | Demonstrates multilingual without writing the word "multilingual" |
| Primary CTA | `<ShimmerButton />` "Get your number — ₹999/mo" | The button HAS to shimmer |
| Secondary CTA | `<InteractiveHoverButton />` "Watch 60s demo" | Hover effect that hints at interactivity |
| Below-fold beam | `<AnimatedBeam />` showing Caller → Twilio → EL → back | Wordless explanation of what we do |
| Features grid | `<BentoGrid />` with 6 cells | Modern, scannable, mobile-friendly |
| Pricing | 3 cards, middle one has `<BorderBeam />` | Singling out the recommended tier |
| Social proof | `<Marquee />` scrolling logos of "trusted by" (use placeholder Indian SMB names like Sharma Dental, Reddy Salon, etc.) | Even fake testimonials lift perceived legitimacy |
| Footer | `<TextShimmer />` on copyright | Tiny detail that says "we care" |

### Dashboard (/dashboard)

| Slot | Component | Why |
|---|---|---|
| KPI cards | `<MagicCard />` with `<NumberTicker />` | Animated entry, premium feel |
| Sparklines | Tremor `<SparkAreaChart />` | Standard but well-executed |
| Live orchestration | React Flow (see react-flow-realtime skill) | The killer moment |
| Empty state | `<BlurFade />` wrapping an illustration | Smooth mount, not jarring |
| Recent calls header | `<AnimatedShinyText />` "Live" badge | Subtly signals real-time |

### Onboarding (/onboarding)

| Slot | Component | Why |
|---|---|---|
| Progress steps | Custom with Framer Motion `<LayoutGroup />` | Smooth step transitions |
| Voice recorder | Wavesurfer.js + `<PulsatingButton />` | Pulsing record button screams "do this now" |
| URL input | Standard shadcn `<Input />` with `<TextShimmer />` placeholder | Detail polish |
| "Provisioning..." step | `<BlurFade />` + `<NumberTicker />` counting "60... 59... 58..." | Tension that makes 60s feel acceptable |
| Success step | `<SparklesText />` "Your AI receptionist is ready" + big animated phone number | Reward moment |

### Calls page (/calls)

| Slot | Component | Why |
|---|---|---|
| Table | Shadcn `<Table />` + `<BlurFade />` row entry | Don't over-design lists |
| Live indicator | Pulsing green dot (Tailwind `animate-pulse` + custom) | Universally readable |
| Transcript modal | Shadcn `<Dialog />` with `<TextReveal />` on text | Smooth reveal as user scrolls |
| Audio player | Custom with wavesurfer.js | The call recording IS the feature |

### Leads kanban (/leads)

| Slot | Component | Why |
|---|---|---|
| Columns | dnd-kit + Framer Motion `<Reorder />` | Smooth drag-and-drop |
| Lead card | `<MagicCard />` with `<BorderBeam />` on hot leads (score ≥ 7) | Visual hierarchy |
| Score badge | Custom with gradient based on score | Glance-readable |

## Component-by-component cheat sheet

### `<AnimatedBeam />` (Magic UI)

Use to connect two elements with an animated light beam. Perfect for the landing hero's "how it works."

```tsx
import { AnimatedBeam } from "@/components/magicui/animated-beam";
import { useRef } from "react";

export function HeroBeams() {
  const containerRef = useRef<HTMLDivElement>(null);
  const fromRef = useRef<HTMLDivElement>(null);
  const toRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className="relative flex items-center justify-between p-12">
      <div ref={fromRef} className="size-12 rounded-full bg-indigo-500" />
      <div ref={toRef} className="size-12 rounded-full bg-pink-500" />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={fromRef}
        toRef={toRef}
        gradientStartColor="#6366F1"
        gradientStopColor="#EC4899"
        duration={3}
      />
    </div>
  );
}
```

Gotcha: the refs must point to actual DOM elements at render time. SSR-only refs return null.

### `<NumberTicker />` (Magic UI)

```tsx
import { NumberTicker } from "@/components/magicui/number-ticker";

<NumberTicker value={1247} className="text-4xl font-bold tabular-nums" />
```

Animates from 0 to the value on mount. For "minutes used" updating live, key it on the value so it re-animates: `key={minutes}`.

### `<BentoGrid />` (Magic UI)

```tsx
import { BentoGrid, BentoCard } from "@/components/magicui/bento-grid";
import { MicIcon } from "lucide-react";

<BentoGrid className="grid-cols-3">
  <BentoCard
    name="Voice cloning"
    description="Clone your voice in 60 seconds. Your receptionist sounds like you."
    Icon={MicIcon}
    href="#"
    cta="Learn more"
    background={<div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-pink-50" />}
    className="col-span-2"  // make the first cell wider
  />
  {/* 5 more cells */}
</BentoGrid>
```

The Bento Grid's strength is asymmetry — make some cells span 2 columns, some span 2 rows. Symmetrical bento grids look generic.

### `<BorderBeam />` (Magic UI)

Wraps any element with an animated traveling border. Perfect for the "Growth" pricing tier.

```tsx
<div className="relative rounded-2xl border bg-white p-8">
  <BorderBeam size={250} duration={12} colorFrom="#6366F1" colorTo="#EC4899" />
  {/* card content */}
</div>
```

### `<ShimmerButton />` (Magic UI)

```tsx
<ShimmerButton shimmerColor="#ffffff" background="#6366F1">
  <span className="text-white font-medium">Get your number</span>
</ShimmerButton>
```

Replaces the shadcn Button on the landing primary CTA. Don't use on every button — overuse kills the effect.

### `<DotPattern />` (Magic UI)

Background pattern for every marketing and app page. Pair with a radial gradient mask:

```tsx
<div className="relative">
  <DotPattern
    width={20}
    height={20}
    className={cn(
      "[mask-image:radial-gradient(ellipse_at_center,white,transparent_70%)]",
      "fill-slate-300/30"
    )}
  />
  {/* page content */}
</div>
```

### Tremor components

`@tremor/react` is npm, not shadcn. Install once: `pnpm add @tremor/react`. Then:

```tsx
import { Card, Metric, Text, ProgressBar, SparkAreaChart } from '@tremor/react';

<Card>
  <Text>Minutes this month</Text>
  <Metric>847 / 2000</Metric>
  <ProgressBar value={42.35} color="indigo" className="mt-3" />
</Card>
```

Tremor's design clashes slightly with shadcn — wrap Tremor components in a shadcn `<Card />` and use only the inner pieces (ProgressBar, SparkAreaChart). Don't mix Tremor's `<Card />` with shadcn's.

## When NOT to use a registry component

- For **functional CRUD UI** (forms, tables, dialogs) — plain shadcn is fine. Don't bling up the leads-table-edit-form with shimmer borders.
- For **dark patterns** — animated components in places that don't need attention (e.g., the footer copyright) are noise.
- When you need to **customize beyond ~30%** of the component — just rebuild it.

## Workflow

1. User describes a visual goal: "I want the hero to feel like Linear's home page."
2. Open 21st.dev / Magic UI / Aceternity in another tab. Find the closest match.
3. Install via shadcn CLI. Read the generated file. Note the props.
4. Drop into your page. Tweak colors to Voxa palette (#6366F1 / #EC4899).
5. Test on mobile + dark mode.
6. Commit with a screenshot.

## Don't do these

- Don't install all 50 Magic UI components "just in case" — only install what you'll use this hour. They bloat the codebase.
- Don't mix more than 3 registries in one app (Magic UI + Tremor + base shadcn is plenty)
- Don't pay for Aceternity UI — the free components cover everything Voxa needs
- Don't use components without reading their source — you need to know how they animate before you can debug them
