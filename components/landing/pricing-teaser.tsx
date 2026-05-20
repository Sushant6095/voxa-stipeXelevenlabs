import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

import { BorderBeam } from "@/components/ui/border-beam";
import { PRICING_TIERS, STRIPE_TIERS, formatPaiseAsINR } from "@/lib/pricing";
import { cn } from "@/lib/utils";

/**
 * Landing-page pricing preview — simplified 3-card row that links to /pricing.
 *
 * Only two highlights from each tier (the full feature list lives on the
 * pricing page itself). Growth gets a `<BorderBeam />` and a "Most popular"
 * chip; the others are calmly visible.
 *
 * Server component — no interactivity here.
 */
export function PricingTeaser() {
  return (
    <section
      id="pricing-teaser"
      aria-labelledby="pricing-teaser-heading"
      className="relative w-full px-6 py-20 sm:py-28"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
            Pricing
          </p>
          <h2
            id="pricing-teaser-heading"
            className="mt-3 font-display text-3xl tracking-tight text-slate-950 sm:text-4xl dark:text-slate-50"
          >
            Honest, INR pricing. Pay per minute.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-balance text-sm text-slate-600 sm:text-base dark:text-slate-300">
            One flat fee for the plan, fair per-minute overage when calls run
            long. No "AI minutes" trickery. No annual contracts.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {STRIPE_TIERS.map((tier) => (
            <TeaserCard key={tier} tier={tier} />
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            href="/pricing"
            className="group inline-flex items-center gap-1.5 rounded-full border border-slate-200/70 bg-white/70 px-4 py-2 text-sm font-medium text-slate-700 backdrop-blur transition-all hover:border-slate-300 hover:bg-white dark:border-slate-800/60 dark:bg-slate-900/40 dark:text-slate-200 dark:hover:bg-slate-900"
          >
            See full plan comparison
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Teaser card — two-feature preview, not the full pricing card
// ---------------------------------------------------------------------------

const HIGHLIGHTED_TIER = "growth" as const;

function TeaserCard({ tier }: { tier: (typeof STRIPE_TIERS)[number] }) {
  const config = PRICING_TIERS[tier];
  const isHighlight = tier === HIGHLIGHTED_TIER;
  // Show only the two most compelling features — full list lives on /pricing.
  const features = config.features.slice(0, 2);

  return (
    <div
      className={cn(
        "relative flex flex-col gap-5 rounded-2xl border bg-white/80 p-6 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:shadow-[0_24px_48px_-16px_rgba(99,102,241,0.25)] dark:bg-slate-950/40",
        isHighlight
          ? "border-[#6366F1]/40 shadow-[0_0_0_1px_rgba(99,102,241,0.18)_inset]"
          : "border-slate-200/70 dark:border-slate-800/60",
      )}
    >
      {isHighlight ? (
        <BorderBeam
          size={220}
          duration={10}
          colorFrom="#6366F1"
          colorTo="#EC4899"
        />
      ) : null}

      <div className="flex items-baseline justify-between">
        <h3 className="font-display text-xl font-semibold tracking-tight">
          {config.name}
        </h3>
        {isHighlight ? (
          <span className="rounded-full bg-gradient-to-r from-[#6366F1] to-[#EC4899] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
            Popular
          </span>
        ) : null}
      </div>

      <div>
        <div className="flex items-baseline gap-1">
          <span className="font-mono text-4xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
            {formatPaiseAsINR(config.flatPaise)}
          </span>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            /month
          </span>
        </div>
        <p className="mt-1 font-mono text-xs text-slate-500 dark:text-slate-400">
          {config.includedMinutes.toLocaleString("en-IN")} min ·{" "}
          {formatPaiseAsINR(config.overagePaise)}/extra min
        </p>
      </div>

      <ul className="space-y-1.5 text-sm text-slate-700 dark:text-slate-300">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <Check
              className="mt-0.5 h-4 w-4 flex-none text-emerald-500"
              aria-hidden="true"
            />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <Link
        href="/pricing"
        className={cn(
          "mt-auto inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition-all",
          isHighlight
            ? "bg-gradient-to-r from-[#6366F1] to-[#EC4899] text-white shadow-md hover:shadow-lg"
            : "border border-slate-200 text-slate-900 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800",
        )}
      >
        Choose {config.name}
      </Link>
    </div>
  );
}
