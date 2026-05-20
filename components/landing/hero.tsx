import Link from "next/link";
import { Phone, Globe, Sparkles } from "lucide-react";

import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";
import { DotPattern } from "@/components/ui/dot-pattern";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { cn } from "@/lib/utils";

import { HeroWords } from "./hero-words";

/**
 * Voxa landing hero — above-the-fold section. Server Component composing
 * client primitives. Includes:
 *  - Dot pattern background with radial mask
 *  - Slow-pulsing indigo→pink gradient orb (CSS-only, reduced-motion safe)
 *  - Animated gradient pill ("✨ Voice cloning in 60 seconds")
 *  - Two-line headline with rotating language on line two
 *  - Subhead + two CTAs (shimmer primary, hover-arrow secondary)
 *  - Three small trust indicators
 */
export function Hero() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative isolate flex min-h-screen w-full items-center justify-center overflow-hidden px-6 py-24 sm:py-32"
    >
      {/* Background — dot pattern with radial mask */}
      <DotPattern
        width={22}
        height={22}
        cr={1.1}
        className={cn(
          "[mask-image:radial-gradient(ellipse_at_center,white,transparent_70%)]",
          "fill-slate-300/30 dark:fill-slate-500/25",
        )}
      />

      {/* Gradient orb behind headline (decorative) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 -z-10 h-[42rem] w-[42rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 blur-3xl animate-orb-pulse dark:opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(closest-side, rgba(99,102,241,0.55), rgba(236,72,153,0.35) 55%, transparent 75%)",
        }}
      />

      <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center text-center">
        {/* Pill — solid slate-900 in light, slate-100 in dark; gradient text */}
        <Link
          href="#how"
          className="group inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-1.5 text-xs font-medium text-white shadow-sm transition-all hover:bg-slate-800 sm:text-sm dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
        >
          <Sparkles className="h-3.5 w-3.5 text-[#EC4899]" aria-hidden="true" />
          <AnimatedGradientText
            speed={1}
            colorFrom="#A5B4FC"
            colorTo="#F9A8D4"
            className="font-semibold"
          >
            Voice cloning in 60 seconds
          </AnimatedGradientText>
          <span className="text-slate-300 transition-transform group-hover:translate-x-0.5 dark:text-slate-600">
            →
          </span>
        </Link>

        {/* Headline */}
        <h1
          id="hero-heading"
          className="mt-6 font-display tracking-tight text-slate-950 sm:mt-8 dark:text-slate-50"
          style={{ fontSize: "clamp(2.5rem, 5vw, 5rem)", lineHeight: 1.05 }}
        >
          <span className="block">The AI Receptionist that</span>
          <span className="block">
            speaks <span className="sr-only">multiple languages</span>
          </span>
          <span aria-hidden="true" className="block">
            <HeroWords />
          </span>
        </h1>

        {/* Subhead */}
        <p className="mx-auto mt-6 max-w-2xl text-balance text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-300">
          Never miss a customer call again. Books appointments, sends
          WhatsApp confirmations, and bills you per minute via Stripe.
        </p>

        {/* CTA row */}
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
          <Link href="/sign-up" aria-label="Get your number for ₹999 per month">
            <ShimmerButton
              background="#6366F1"
              shimmerColor="#ffffff"
              shimmerDuration="2.6s"
              borderRadius="9999px"
              className="px-6 py-3 text-sm font-semibold sm:text-base"
            >
              <span className="text-white">Get your number — ₹999/mo</span>
            </ShimmerButton>
          </Link>
          <Link href="#demo" aria-label="Watch a 60 second demo">
            <InteractiveHoverButton className="text-sm sm:text-base">
              Watch 60s demo
            </InteractiveHoverButton>
          </Link>
        </div>

        {/* Trust indicators */}
        <ul className="mt-10 flex flex-col items-center gap-3 text-xs text-slate-500 sm:flex-row sm:gap-6 sm:text-sm dark:text-slate-400">
          <li className="inline-flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5 text-[#6366F1]" aria-hidden="true" />
            100+ businesses live
          </li>
          <li
            className="hidden h-1 w-1 rounded-full bg-slate-300 sm:block dark:bg-slate-700"
            aria-hidden="true"
          />
          <li className="inline-flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5 text-[#EC4899]" aria-hidden="true" />
            4 languages
          </li>
          <li
            className="hidden h-1 w-1 rounded-full bg-slate-300 sm:block dark:bg-slate-700"
            aria-hidden="true"
          />
          <li className="inline-flex items-center gap-1.5">
            <Sparkles
              className="h-3.5 w-3.5 text-[#10B981]"
              aria-hidden="true"
            />
            Stripe-metered billing
          </li>
        </ul>
      </div>
    </section>
  );
}
