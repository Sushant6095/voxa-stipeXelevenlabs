import { CheckCircle2, X } from 'lucide-react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  PRICING_TIERS,
  formatPaiseAsINR,
  type StripeTier,
} from '@/lib/pricing';
import { cn } from '@/lib/utils';

/**
 * Feature comparison table that lives beneath the three pricing cards. Pure
 * server component — the data is static and the visual treatment relies on
 * Tailwind + Lucide icons only.
 *
 * Sticky header keeps the column titles visible while a long row list is
 * scrolled past on small screens.
 */

type Availability = boolean | string;

interface FeatureRow {
  readonly label: string;
  readonly values: Readonly<Record<StripeTier, Availability>>;
}

const ROWS: ReadonlyArray<FeatureRow> = [
  {
    label: 'Included minutes',
    values: {
      starter: `${PRICING_TIERS.starter.includedMinutes.toLocaleString('en-IN')} min`,
      growth: `${PRICING_TIERS.growth.includedMinutes.toLocaleString('en-IN')} min`,
      scale: `${PRICING_TIERS.scale.includedMinutes.toLocaleString('en-IN')} min`,
    },
  },
  {
    label: 'Overage rate',
    values: {
      starter: `${formatPaiseAsINR(PRICING_TIERS.starter.overagePaise)} / min`,
      growth: `${formatPaiseAsINR(PRICING_TIERS.growth.overagePaise)} / min`,
      scale: `${formatPaiseAsINR(PRICING_TIERS.scale.overagePaise)} / min`,
    },
  },
  {
    label: 'Voice cloning',
    values: { starter: true, growth: true, scale: true },
  },
  {
    label: 'Multilingual (HI · TA · TE · EN)',
    values: { starter: true, growth: true, scale: true },
  },
  {
    label: 'WhatsApp confirmations',
    values: { starter: true, growth: true, scale: true },
  },
  {
    label: 'Cal.com booking',
    values: { starter: true, growth: true, scale: true },
  },
  {
    label: 'Knowledge base RAG',
    values: { starter: true, growth: true, scale: true },
  },
  {
    label: 'Sentiment escalation',
    values: { starter: false, growth: true, scale: true },
  },
  {
    label: 'Custom branding',
    values: { starter: false, growth: false, scale: true },
  },
  {
    label: 'Dedicated support',
    values: { starter: false, growth: false, scale: true },
  },
];

const TIERS: ReadonlyArray<StripeTier> = ['starter', 'growth', 'scale'];

export function FeatureComparisonTable() {
  return (
    <section
      aria-labelledby="comparison-heading"
      className="mt-20"
    >
      <header className="mb-6 max-w-xl">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
          Side by side
        </p>
        <h2
          id="comparison-heading"
          className="mt-2 font-display text-2xl tracking-tight text-slate-950 sm:text-3xl dark:text-slate-50"
        >
          Compare every feature
        </h2>
      </header>

      <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white/60 backdrop-blur-sm dark:border-slate-800/60 dark:bg-slate-950/40">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-background/90 backdrop-blur">
            <TableRow>
              <TableHead className="w-1/3 font-display text-sm font-semibold tracking-tight">
                Feature
              </TableHead>
              {TIERS.map((tier) => (
                <TableHead
                  key={tier}
                  className={cn(
                    'text-center font-display text-sm font-semibold tracking-tight',
                    tier === 'growth' &&
                      'text-transparent bg-gradient-to-r from-[#6366F1] to-[#EC4899] bg-clip-text',
                  )}
                >
                  {PRICING_TIERS[tier].name}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {ROWS.map((row) => (
              <TableRow key={row.label}>
                <TableCell className="font-medium text-slate-700 dark:text-slate-200">
                  {row.label}
                </TableCell>
                {TIERS.map((tier) => (
                  <TableCell key={tier} className="text-center">
                    <ValueCell value={row.values[tier]} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

function ValueCell({ value }: { readonly value: Availability }) {
  if (value === true) {
    return (
      <>
        <span className="sr-only">Included</span>
        <CheckCircle2
          aria-hidden="true"
          className="inline-block h-4 w-4 text-emerald-500"
        />
      </>
    );
  }
  if (value === false) {
    return (
      <>
        <span className="sr-only">Not included</span>
        <X
          aria-hidden="true"
          className="inline-block h-4 w-4 text-slate-400"
        />
      </>
    );
  }
  return (
    <span className="font-mono text-xs text-slate-700 dark:text-slate-200">
      {value}
    </span>
  );
}
