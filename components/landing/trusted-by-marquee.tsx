import { Marquee } from "@/components/ui/marquee";
import { cn } from "@/lib/utils";

/**
 * "Trusted by" marquee — two rows of fictitious Indian SMB names that scroll
 * in opposite directions. Names ride in Cal Sans so they feel like wordmarks
 * rather than plain text. Even placeholder testimonials lift perceived
 * legitimacy when the alternative is no social proof at all.
 */

const ROW_ONE: ReadonlyArray<string> = [
  "Sharma Dental",
  "Reddy Salon",
  "Patel Clinic",
  "Iyer Realty",
  "Kumar Boutique",
  "Mehta Tutors",
  "Singh Auto",
  "Krishna Cafe",
];

const ROW_TWO: ReadonlyArray<string> = [
  "Bose Studio",
  "Joshi Legal",
  "Rao Optical",
  "Khan Tailors",
  "Banerjee Consulting",
  "Pillai Mart",
  "Verma Logistics",
  "Pandey Photography",
];

export function TrustedByMarquee() {
  return (
    <section
      aria-labelledby="trusted-heading"
      className="relative w-full overflow-hidden px-6 py-20 sm:py-24"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
            Social proof
          </p>
          <h2
            id="trusted-heading"
            className="mt-3 font-display text-2xl tracking-tight text-slate-950 sm:text-3xl dark:text-slate-50"
          >
            Trusted by ambitious Indian businesses
          </h2>
        </div>

        <div className="relative mt-12">
          {/* Fade masks for the marquee edges */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-background to-transparent"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-background to-transparent"
          />

          <Marquee pauseOnHover className="[--duration:42s]">
            {ROW_ONE.map((name) => (
              <LogoChip key={name} name={name} />
            ))}
          </Marquee>
          <Marquee reverse pauseOnHover className="mt-4 [--duration:56s]">
            {ROW_TWO.map((name) => (
              <LogoChip key={name} name={name} variant="muted" />
            ))}
          </Marquee>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

function LogoChip({
  name,
  variant = "default",
}: {
  readonly name: string;
  readonly variant?: "default" | "muted";
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-xl border px-5 py-2.5 font-display text-lg tracking-tight transition-colors",
        variant === "muted"
          ? "border-slate-200/50 bg-white/30 text-slate-500 dark:border-slate-800/40 dark:bg-slate-900/20 dark:text-slate-400"
          : "border-slate-200/70 bg-white/60 text-slate-700 dark:border-slate-800/60 dark:bg-slate-900/40 dark:text-slate-200",
      )}
    >
      {name}
    </span>
  );
}
