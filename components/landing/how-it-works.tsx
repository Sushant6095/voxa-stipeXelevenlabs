"use client";

import { Phone, PhoneIncoming, Sparkles } from "lucide-react";
import { useRef, type ReactNode, type Ref } from "react";

import { AnimatedBeam } from "@/components/ui/animated-beam";
import { cn } from "@/lib/utils";

/**
 * "How it works" — sits below the hero, before the bento grid.
 *
 * Four nodes connected with `<AnimatedBeam />` light beams that pulse the
 * indigo→pink Voxa gradient. The intent is to show, without much copy, what
 * Voxa orchestrates: a caller dials a Twilio number, ElevenLabs answers in a
 * cloned voice, the reply lands back to the caller.
 *
 * Layout — 4 nodes:
 *   Caller ─→ Twilio ─→ ElevenLabs ─→ Reply (back to caller)
 *
 * The return beam uses `reverse` + curved-down `curvature` so the light
 * travels right-to-left underneath, completing the loop visually.
 */
export function HowItWorks() {
  const containerRef = useRef<HTMLDivElement>(null);
  const callerRef = useRef<HTMLDivElement>(null);
  const twilioRef = useRef<HTMLDivElement>(null);
  const elevenRef = useRef<HTMLDivElement>(null);
  const callerEndRef = useRef<HTMLDivElement>(null);

  return (
    <section
      id="how"
      aria-labelledby="how-it-works-heading"
      className="relative w-full px-6 py-20 sm:py-28"
    >
      <div className="mx-auto max-w-5xl">
        {/* Eyebrow + heading */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
            How Voxa works
          </p>
          <h2
            id="how-it-works-heading"
            className="mt-3 font-display text-3xl tracking-tight text-slate-950 sm:text-4xl dark:text-slate-50"
          >
            Wire it once. Never miss a call again.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-balance text-sm text-slate-600 sm:text-base dark:text-slate-300">
            Voxa connects Twilio, ElevenLabs, and your calendar in under sixty
            seconds — then orchestrates every conversation that follows.
          </p>
        </div>

        {/* Beam diagram */}
        <div
          ref={containerRef}
          className="relative mx-auto mt-14 flex h-[180px] max-w-3xl items-center justify-between sm:h-[220px]"
        >
          <BeamNode
            nodeRef={callerRef}
            label="Caller"
            ring="from-slate-200 to-slate-100 dark:from-slate-700 dark:to-slate-800"
          >
            <PhoneIncoming className="h-7 w-7 text-slate-700 dark:text-slate-200" />
          </BeamNode>

          <BeamNode
            nodeRef={twilioRef}
            label="Twilio"
            ring="from-[#F22F46]/30 to-[#F22F46]/10"
          >
            <span className="font-display text-lg font-semibold text-[#F22F46]">
              T
            </span>
          </BeamNode>

          <BeamNode
            nodeRef={elevenRef}
            label="ElevenLabs"
            ring="from-[#6366F1]/30 to-[#EC4899]/20"
          >
            <Sparkles className="h-7 w-7 text-[#6366F1]" />
          </BeamNode>

          <BeamNode
            nodeRef={callerEndRef}
            label="Reply"
            ring="from-emerald-200 to-emerald-50 dark:from-emerald-800/60 dark:to-emerald-900/40"
          >
            <Phone className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
          </BeamNode>

          {/* Outbound beams: caller → twilio → elevenlabs */}
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={callerRef}
            toRef={twilioRef}
            gradientStartColor="#6366F1"
            gradientStopColor="#EC4899"
            duration={3.2}
            curvature={-30}
          />
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={twilioRef}
            toRef={elevenRef}
            gradientStartColor="#6366F1"
            gradientStopColor="#EC4899"
            duration={3.2}
            delay={0.4}
            curvature={-30}
          />
          {/* Return beam: elevenlabs → caller end (reverse, curved down) */}
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={elevenRef}
            toRef={callerEndRef}
            gradientStartColor="#10B981"
            gradientStopColor="#6366F1"
            duration={3.2}
            delay={0.8}
            curvature={30}
            reverse
          />
        </div>

        {/* Three-step explainer */}
        <ol className="mx-auto mt-14 grid max-w-3xl gap-6 sm:grid-cols-3 sm:gap-4">
          <Step
            n="01"
            title="Caller dials your number"
            body="A real Indian Twilio number, provisioned in your name, rings 24/7."
          />
          <Step
            n="02"
            title="ElevenLabs answers in your voice"
            body="Multilingual, knows your business, sounds like you cloned it last week."
          />
          <Step
            n="03"
            title="n8n closes the loop"
            body="Books the slot, sends WhatsApp, and meters the minute to Stripe."
          />
        </ol>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

interface BeamNodeProps {
  readonly children: ReactNode;
  readonly label: string;
  /** Tailwind class fragment for the inner gradient ring. */
  readonly ring: string;
  readonly nodeRef: Ref<HTMLDivElement>;
}

function BeamNode({ children, label, ring, nodeRef }: BeamNodeProps) {
  return (
    <div className="relative flex flex-col items-center gap-2">
      <div
        ref={nodeRef}
        className="relative z-10 grid size-14 place-items-center rounded-2xl border border-slate-200/80 bg-white shadow-[0_4px_24px_-8px_rgba(99,102,241,0.25)] sm:size-16 dark:border-slate-700/60 dark:bg-slate-900"
      >
        <div
          aria-hidden="true"
          className={cn(
            "absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br opacity-60 blur-sm",
            ring,
          )}
        />
        {children}
      </div>
      <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {label}
      </span>
    </div>
  );
}

interface StepProps {
  readonly n: string;
  readonly title: string;
  readonly body: string;
}

function Step({ n, title, body }: StepProps) {
  return (
    <li className="relative rounded-2xl border border-slate-200/70 bg-white/60 p-5 backdrop-blur-sm dark:border-slate-800/60 dark:bg-slate-900/40">
      <span className="font-mono text-xs text-slate-400 dark:text-slate-500">
        {n}
      </span>
      <h3 className="mt-1 font-display text-base font-semibold text-slate-900 dark:text-slate-100">
        {title}
      </h3>
      <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        {body}
      </p>
    </li>
  );
}
