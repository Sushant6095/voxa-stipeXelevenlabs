---
name: motion-and-effects
description: Use whenever adding animations, transitions, micro-interactions, scroll effects, page transitions, or sophisticated motion. Covers Framer Motion / Motion 12+, the new `motion/react` package, layout animations, gestures, scroll-triggered reveals, and animation timing principles. Trigger on terms "animation", "transition", "framer motion", "motion", "scroll trigger", "micro-interaction", "page transition", "blur fade".
---

# Motion & Effects

## Package note (2025+)

Framer Motion rebranded to **Motion**. The new package is `motion`. Import as `motion/react`.

```bash
pnpm add motion
```

Old: `import { motion } from 'framer-motion'`
New: `import { motion } from 'motion/react'`

The API is backward-compatible — same `motion.div`, same `<AnimatePresence />`, same `useScroll`. Use the new package on new code.

## Animation timing principles (read this first)

| Use case | Duration | Easing |
|---|---|---|
| Micro-interactions (hover, tap) | 100-200ms | `easeOut` |
| Modal/dialog enter | 200-300ms | `[0.22, 1, 0.36, 1]` (smooth) |
| Page transitions | 300-500ms | `easeInOut` |
| Hero/marketing reveals | 500-800ms | `[0.16, 1, 0.3, 1]` (luxurious) |
| Loading spinners | rotate, 1000ms+ | `linear` |
| Pulsing (live indicators) | 1500-2500ms | `easeInOut`, `repeat: Infinity` |

If your animation feels slow, it's probably 50ms too long. If it feels janky, it's probably 50ms too fast.

## The 9 patterns Voxa uses

### 1. Fade-in on mount (BlurFade pattern)

For hero text, cards entering view, transcript lines arriving:

```tsx
import { motion } from 'motion/react';

<motion.div
  initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
>
  {content}
</motion.div>
```

Or use Magic UI's `<BlurFade>` directly:

```tsx
import { BlurFade } from "@/components/magicui/blur-fade";

<BlurFade delay={0.1} inView>
  <h1>Headline</h1>
</BlurFade>
```

For sequential reveals (stagger), wrap multiple in `<BlurFade />` with incrementing `delay`.

### 2. Staggered children (the Linear/Vercel signature)

```tsx
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

<motion.ul variants={container} initial="hidden" animate="show">
  {items.map(i => (
    <motion.li key={i.id} variants={item}>{i.name}</motion.li>
  ))}
</motion.ul>
```

This is what makes a list of cards feel "alive" instead of "data dump." Voxa uses this on the dashboard recent-calls list and the pricing page.

### 3. Scroll-triggered reveal

```tsx
import { useInView } from 'motion/react';
import { useRef } from 'react';

function ScrollReveal({ children }: { children: React.ReactNode }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
```

Use on landing page sections. `once: true` means it fires once and stays — don't re-animate on scroll back. `margin: '-100px'` makes it fire when the element is 100px from entering the viewport (smoother UX).

### 4. Layout animations (FLIP)

When list items reorder (leads moving between kanban columns), use `layout`:

```tsx
<motion.div layout transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}>
  {/* card content */}
</motion.div>
```

`layout` automatically animates from old position to new position. No manual calculation.

For shared layout between unmount/mount (e.g., a card expanding to a modal), use `layoutId`:

```tsx
<motion.div layoutId={`lead-${lead.id}`} />  // collapsed
<motion.div layoutId={`lead-${lead.id}`} />  // expanded in modal
```

### 5. Pulsing live indicators

For "call in progress" badges, recording dots:

```tsx
<motion.div
  className="size-2 rounded-full bg-emerald-500"
  animate={{
    scale: [1, 1.4, 1],
    opacity: [1, 0.6, 1],
  }}
  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
/>
```

Or with a pulsing ring around a static dot:

```tsx
<div className="relative inline-flex">
  <span className="size-2 rounded-full bg-emerald-500" />
  <motion.span
    className="absolute inset-0 rounded-full bg-emerald-500"
    animate={{ scale: [1, 2.5], opacity: [0.6, 0] }}
    transition={{ duration: 1.5, repeat: Infinity }}
  />
</div>
```

### 6. Number transitions

Use Magic UI's `<NumberTicker />` for count-up. For numbers that change live (minutes during a call):

```tsx
import { motion, useMotionValue, useTransform, animate } from 'motion/react';
import { useEffect } from 'react';

function AnimatedCount({ value }: { value: number }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, latest => Math.round(latest));

  useEffect(() => {
    const controls = animate(count, value, { duration: 0.6, ease: 'easeOut' });
    return controls.stop;
  }, [value, count]);

  return <motion.span>{rounded}</motion.span>;
}
```

### 7. Hover lift on cards

Pricing cards, dashboard KPI cards:

```tsx
<motion.div
  whileHover={{ y: -4, boxShadow: '0 20px 40px -8px rgba(99, 102, 241, 0.2)' }}
  transition={{ duration: 0.2, ease: 'easeOut' }}
  className="rounded-2xl border bg-white p-6"
>
  {/* content */}
</motion.div>
```

Subtle — the card lifts 4px and gains a colored shadow.

### 8. Tap feedback (mobile-first)

```tsx
<motion.button
  whileTap={{ scale: 0.96 }}
  transition={{ duration: 0.1 }}
  className="rounded-lg bg-indigo-500 px-4 py-2 text-white"
>
  Book appointment
</motion.button>
```

`whileTap` works on mouse and touch. Replaces the need for `:active` CSS.

### 9. Page transitions (App Router)

App Router doesn't expose `useRouter` events for transitions, but you can use `<AnimatePresence />` in a layout:

```tsx
// app/(app)/template.tsx (template, not layout — re-mounts on nav)
'use client';
import { motion } from 'motion/react';

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
```

`template.tsx` (not `layout.tsx`) re-mounts on every navigation — perfect for transitions.

## Effects that punch above their weight

### Aurora background

A blurred, animated gradient orb sitting behind the hero. Aceternity has it; or build it yourself:

```tsx
<div className="relative overflow-hidden">
  <div className="absolute -top-40 left-1/2 -translate-x-1/2 size-[600px] rounded-full bg-gradient-to-br from-indigo-400/40 to-pink-400/40 blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
  {/* hero content */}
</div>
```

### Glow on hover (CSS-only, no JS)

```tsx
<button className="group relative overflow-hidden rounded-lg bg-indigo-500 px-6 py-3 text-white">
  <span className="relative z-10">Click me</span>
  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-700" />
</button>
```

The light sweep on hover. Cheap, effective.

### Tilt effect on cards

Add a 3D tilt to pricing cards when the mouse moves over them. Use a library: `npm install react-parallax-tilt`. 20 minutes of work, looks expensive.

```tsx
import Tilt from 'react-parallax-tilt';

<Tilt tiltMaxAngleX={6} tiltMaxAngleY={6} glareEnable glareMaxOpacity={0.1}>
  <PricingCard {...props} />
</Tilt>
```

## Performance: when NOT to animate

- Don't animate `box-shadow` on a long list — it forces repaints. Use a static shadow or a separate pseudo-element with opacity.
- Don't animate `width` or `height` — animate `scale` or `transform`. The compositor handles transforms on the GPU; layout properties force reflow.
- Don't animate more than ~8 things simultaneously in viewport. The eye can't track it; the GPU groans.
- Don't run heavy animations on every scroll event. Use `useScroll` with `useTransform` (Motion handles RAF for you), not `addEventListener('scroll', ...)`.

## Accessibility

Respect `prefers-reduced-motion`:

```tsx
import { useReducedMotion } from 'motion/react';

function HeroBeam() {
  const shouldReduceMotion = useReducedMotion();
  return shouldReduceMotion
    ? <div>Static fallback</div>
    : <AnimatedBeam {...props} />;
}
```

Most Magic UI components don't check this by default — you have to wrap. Skip on the hackathon if time is tight, but it's good citizenship.

## Don't do these

- Don't use `transition: all` in Tailwind — it's a perf footgun. Specify properties: `transition-transform`, `transition-colors`, `transition-opacity`.
- Don't animate gradients via CSS (`background-position` keyframes). Use Framer Motion's `motion.div` with explicit color stops if you need animated gradients.
- Don't use spring physics for UI animations — they feel "bouncy" and unprofessional. Use cubic-bezier easings. Springs are for native-feeling drag/throw interactions only.
- Don't auto-play sound. Ever.
- Don't use parallax on mobile (motion sickness, especially with iOS Safari).
