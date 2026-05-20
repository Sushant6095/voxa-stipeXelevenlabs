"use client";

import {
  Calendar,
  Languages,
  MessageCircle,
  Mic,
  Receipt,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";

import { BentoCard, BentoGrid } from "@/components/ui/bento-grid";
import { BorderBeam } from "@/components/ui/border-beam";
import { NumberTicker } from "@/components/ui/number-ticker";
import { cn } from "@/lib/utils";

/**
 * Bento grid of the six Voxa capabilities. Each card is asymmetric — the
 * voice-clone hero card spans two columns, the calendar card spans two rows.
 *
 * On hover, a `<BorderBeam />` rims the card. We mount the beam only when the
 * pointer is over the card (CSS sibling selector) so unhovered cards stay
 * calm — six simultaneous beams would look like a Christmas tree.
 */
export function BentoFeatures() {
  return (
    <section
      id="features"
      aria-labelledby="features-heading"
      className="relative w-full px-6 py-20 sm:py-28"
    >
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
            Capabilities
          </p>
          <h2
            id="features-heading"
            className="mt-3 font-display text-3xl tracking-tight text-slate-950 sm:text-4xl dark:text-slate-50"
          >
            One agent. Six superpowers.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-balance text-sm text-slate-600 sm:text-base dark:text-slate-300">
            Built for Indian SMBs that want enterprise-grade voice AI without an
            enterprise-grade implementation team.
          </p>
        </div>

        {/* Bento grid — 3 cols on lg, asymmetric */}
        <div className="mt-14">
          <BentoGrid className="grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:auto-rows-[18rem]">
            <FeatureCell
              name="Voice cloning"
              description="60 seconds of audio. Your AI receptionist sounds exactly like you."
              icon={Mic}
              span="col-span-1 sm:col-span-2 lg:col-span-2"
              background={<WaveformBackground />}
            />
            <FeatureCell
              name="Multilingual"
              description="Auto-detects Hindi, Tamil, Telugu, English mid-call. No menus."
              icon={Languages}
              span="col-span-1"
              background={<FlagCarouselBackground />}
            />
            <FeatureCell
              name="Stripe-metered billing"
              description="Per-minute billing wired to Stripe Meter. No surprises."
              icon={Receipt}
              span="col-span-1"
              background={<MeterCounterBackground />}
            />
            <FeatureCell
              name="WhatsApp confirmations"
              description="Every booking lands as a WhatsApp message — for them and you."
              icon={MessageCircle}
              span="col-span-1"
              background={<WhatsAppBubbleBackground />}
            />
            <FeatureCell
              name="Calendar bookings"
              description="Cal.com slots are negotiated in-call and confirmed before hangup."
              icon={Calendar}
              span="col-span-1 sm:col-span-2 lg:col-span-1 lg:row-span-2"
              background={<CalendarBackground />}
            />
            <FeatureCell
              name="Knowledge base RAG"
              description="Paste a URL. Voxa learns your hours, services, and prices in seconds."
              icon={Sparkles}
              span="col-span-1 sm:col-span-2 lg:col-span-2"
              background={<RagBackground />}
            />
          </BentoGrid>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Feature cell — wraps <BentoCard /> with brand styling + hover BorderBeam
// ---------------------------------------------------------------------------

interface FeatureCellProps {
  readonly name: string;
  readonly description: string;
  readonly icon: React.ElementType;
  readonly span: string;
  readonly background: React.ReactNode;
}

function FeatureCell({
  name,
  description,
  icon,
  span,
  background,
}: FeatureCellProps) {
  return (
    <div className={cn("group/cell relative", span)}>
      <BentoCard
        name={name}
        description={description}
        Icon={icon}
        href="#"
        cta="Learn more"
        className={cn(
          "col-span-full h-full overflow-hidden",
          // Brand surface — subtle slate→indigo wash
          "bg-white/70 backdrop-blur-sm dark:bg-slate-950/40",
          "border border-slate-200/70 dark:border-slate-800/60",
          // Lift on hover
          "transition-transform duration-300 ease-out hover:-translate-y-0.5",
        )}
        background={background}
      />
      {/* Hover-only border beam — invisible until pointer enters the cell */}
      <div className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-200 group-hover/cell:opacity-100">
        <BorderBeam
          size={160}
          duration={6}
          colorFrom="#6366F1"
          colorTo="#EC4899"
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Background SVG / motion illustrations per cell
// ---------------------------------------------------------------------------

/** Voice-clone — a soft waveform that pulses left-to-right. */
function WaveformBackground() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-x-6 top-6 h-24 opacity-70 transition-opacity duration-300 group-hover:opacity-100"
    >
      <svg
        viewBox="0 0 600 80"
        className="h-full w-full"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="waveform-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#6366F1" stopOpacity="0.1" />
            <stop offset="50%" stopColor="#6366F1" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#EC4899" stopOpacity="0.6" />
          </linearGradient>
        </defs>
        {Array.from({ length: 40 }).map((_, i) => {
          // Smooth pseudo-random heights based on index — deterministic AND
          // rounded so Node and V8 emit byte-identical SVG (no hydration drift).
          const raw =
            14 +
            Math.abs(Math.sin(i * 1.3) * 22) +
            Math.abs(Math.cos(i * 0.7) * 18);
          const h = Math.round(raw * 100) / 100;
          const y = Math.round((40 - h / 2) * 100) / 100;
          return (
            <rect
              key={i}
              x={i * 15 + 2}
              y={y}
              width={5}
              height={h}
              rx={2}
              fill="url(#waveform-grad)"
              className="animate-pulse"
              style={{
                animationDelay: `${i * 60}ms`,
                animationDuration: "2.4s",
              }}
            />
          );
        })}
      </svg>
    </div>
  );
}

/** Multilingual — language chips fade in/out every two seconds. */
function FlagCarouselBackground() {
  const langs = [
    { code: "EN", label: "English", flag: "🇬🇧" },
    { code: "हि", label: "हिन्दी", flag: "🇮🇳" },
    { code: "த", label: "தமிழ்", flag: "🇮🇳" },
    { code: "తె", label: "తెలుగు", flag: "🇮🇳" },
  ];
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % langs.length), 2000);
    return () => clearInterval(t);
  }, [langs.length]);

  return (
    <div
      aria-hidden="true"
      className="absolute right-6 top-6 flex h-20 w-32 items-center justify-center"
    >
      <div className="relative h-12 w-full">
        {langs.map((lang, i) => (
          <div
            key={lang.code}
            className={cn(
              "absolute inset-0 flex items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-white/90 px-3 py-2 text-sm font-semibold transition-all duration-700 ease-out dark:border-slate-700/60 dark:bg-slate-900/80",
              i === idx
                ? "translate-y-0 opacity-100 scale-100"
                : "translate-y-2 opacity-0 scale-95",
            )}
          >
            <span className="font-display text-base">{lang.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Stripe meter — number ticker counting toward 2000. */
function MeterCounterBackground() {
  return (
    <div
      aria-hidden="true"
      className="absolute right-6 top-6 flex flex-col items-end"
    >
      <NumberTicker
        value={847}
        className="font-mono text-4xl font-semibold tracking-tight text-slate-900 dark:text-slate-100"
      />
      <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-slate-400">
        of 2000 minutes
      </p>
      <div className="mt-2 h-1 w-32 overflow-hidden rounded-full bg-slate-200/70 dark:bg-slate-800/80">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#6366F1] to-[#EC4899]"
          style={{ width: "42%" }}
        />
      </div>
    </div>
  );
}

/** WhatsApp — a chat bubble slides in from the right on a 4s loop. */
function WhatsAppBubbleBackground() {
  return (
    <div
      aria-hidden="true"
      className="absolute right-4 top-4 w-44 overflow-hidden"
    >
      <div
        className="ml-auto flex max-w-[10rem] flex-col gap-1 rounded-2xl rounded-tr-sm bg-emerald-500 px-3 py-2 text-[11px] text-white shadow-md"
        style={{
          animation: "voxa-whatsapp-slide 4s ease-in-out infinite",
        }}
      >
        <p className="font-medium">Booking confirmed ✓</p>
        <p className="text-emerald-50/90">Sat 7:30 PM — Dr. Sharma</p>
      </div>
      {/* Inline keyframes scoped to this background */}
      <style>{`
        @keyframes voxa-whatsapp-slide {
          0%   { transform: translateX(120%); opacity: 0; }
          15%  { transform: translateX(0%);   opacity: 1; }
          80%  { transform: translateX(0%);   opacity: 1; }
          100% { transform: translateX(120%); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

/** Calendar — a 7-day grid with one slot highlighted. */
function CalendarBackground() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-x-6 top-6 grid grid-cols-7 gap-1.5"
    >
      {Array.from({ length: 28 }).map((_, i) => {
        const isPicked = i === 17;
        return (
          <div
            key={i}
            className={cn(
              "h-7 rounded-md border text-center transition-all",
              isPicked
                ? "border-[#6366F1] bg-gradient-to-br from-[#6366F1] to-[#EC4899] shadow-[0_0_20px_-2px_rgba(99,102,241,0.6)]"
                : "border-slate-200/70 bg-slate-100/40 dark:border-slate-800/50 dark:bg-slate-900/30",
            )}
          />
        );
      })}
    </div>
  );
}

/** Knowledge-base RAG — URL pill on the left, arrow, answer pill on the right. */
function RagBackground() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-x-6 top-6 flex items-center justify-center gap-3"
    >
      <div className="rounded-lg border border-slate-200/80 bg-white px-3 py-1.5 font-mono text-[10px] text-slate-500 shadow-sm dark:border-slate-700/60 dark:bg-slate-900 dark:text-slate-400">
        sharmadental.in
      </div>
      <svg width="40" height="14" viewBox="0 0 40 14" fill="none">
        <path
          d="M0 7 H32 M28 3 L32 7 L28 11"
          stroke="#6366F1"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="rounded-lg bg-gradient-to-br from-[#6366F1] to-[#EC4899] px-3 py-1.5 font-mono text-[10px] text-white shadow-sm">
        Open 9–7, ₹500 cleaning
      </div>
    </div>
  );
}
