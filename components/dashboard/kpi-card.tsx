'use client';

import { motion, useReducedMotion } from 'motion/react';
import dynamic from 'next/dynamic';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { formatPaiseAsINR } from '@/lib/pricing';
import { MagicCard } from '@/components/ui/magic-card';
import { NumberTicker } from '@/components/ui/number-ticker';
import { BorderBeam } from '@/components/ui/border-beam';

// Lazy-import Tremor's sparkline — keeps the chart bundle out of the
// dashboard entry chunk.
const SparkAreaChart = dynamic(
  () => import('@tremor/react').then((m) => ({ default: m.SparkAreaChart })),
  { ssr: false, loading: () => <div className="h-8 w-full" /> },
);

interface KPICardProps {
  label: string;
  /** Numeric value or display string. NumberTicker animates numerics. */
  value: number | string;
  /**
   * When true, treats `value` (paise) as an INR currency amount and
   * formats with `formatPaiseAsINR` after the ticker reaches it.
   */
  isCurrency?: boolean;
  /** 7-day trend data for the sparkline. */
  trend?: number[];
  /** Pulsing emerald "live" dot in the header. */
  livePulse?: boolean;
  /** Wraps the card in `<BorderBeam />` when the metric is "hot". */
  hot?: boolean;
  /** Linear progress bar shown beneath the value. */
  progress?: { used: number; total: number };
  /** Optional icon shown at the right end of the header. */
  Icon?: LucideIcon;
  /** Optional secondary descriptor below the value. */
  caption?: string;
}

/**
 * Voxa dashboard KPI card. Composes:
 *  - `<MagicCard />` with hover glow
 *  - `<NumberTicker />` for animated numeric value
 *  - Tremor `<SparkAreaChart />` for the 7-day trend
 *  - Optional pulsing emerald "live" dot
 *  - Optional `<BorderBeam />` perimeter when `hot`
 */
export function KPICard({
  label,
  value,
  isCurrency = false,
  trend,
  livePulse = false,
  hot = false,
  progress,
  Icon,
  caption,
}: KPICardProps) {
  const reduceMotion = useReducedMotion();

  const trendData = (trend ?? []).map((v, i) => ({ idx: i, value: v }));
  const numericValue = typeof value === 'number' ? value : null;

  return (
    <motion.div
      whileHover={reduceMotion ? undefined : { y: -3 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="relative h-full"
    >
      <MagicCard
        mode="gradient"
        gradientFrom="#6366F1"
        gradientTo="#EC4899"
        gradientOpacity={0.12}
        className={cn(
          'relative h-full rounded-2xl bg-card/80 backdrop-blur-sm',
          'ring-1 ring-foreground/5',
        )}
      >
        {hot && (
          <BorderBeam
            size={120}
            duration={8}
            colorFrom="#6366F1"
            colorTo="#EC4899"
          />
        )}

        <div className="relative flex h-full flex-col gap-3 p-5">
          {/* Header row: label + live dot / icon */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {label}
              </span>
              {livePulse && (
                <span
                  aria-label="Live"
                  className="relative inline-flex size-1.5"
                >
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-voxa-success/70" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-voxa-success" />
                </span>
              )}
            </div>
            {Icon && (
              <Icon
                aria-hidden="true"
                className="size-4 text-muted-foreground/70"
              />
            )}
          </div>

          {/* Big numeric value */}
          <div className="flex items-baseline gap-2">
            {numericValue !== null ? (
              isCurrency ? (
                <CurrencyTicker value={numericValue} />
              ) : (
                <NumberTicker
                  value={numericValue}
                  className="font-mono text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
                />
              )
            ) : (
              <span className="font-mono text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                {value}
              </span>
            )}
            {caption && (
              <span className="text-sm text-muted-foreground tabular-nums">
                {caption}
              </span>
            )}
          </div>

          {/* Progress bar */}
          {progress && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground tabular-nums">
                <span>{progress.used.toLocaleString('en-IN')}</span>
                <span>/ {progress.total.toLocaleString('en-IN')}</span>
              </div>
              <div className="relative h-1.5 overflow-hidden rounded-full bg-muted">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${
                      progress.total > 0
                        ? Math.min(
                            100,
                            (progress.used / progress.total) * 100,
                          )
                        : 0
                    }%`,
                  }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full rounded-full bg-gradient-to-r from-voxa-primary to-voxa-accent"
                />
              </div>
            </div>
          )}

          {/* Sparkline */}
          {trendData.length > 0 && (
            <div className="mt-auto h-8 w-full">
              <SparkAreaChart
                data={trendData}
                categories={['value']}
                index="idx"
                colors={['indigo']}
                className="h-8 w-full"
              />
            </div>
          )}
        </div>
      </MagicCard>
    </motion.div>
  );
}

/**
 * Specialised wrapper that runs the NumberTicker in paise and formats
 * the displayed text via `formatPaiseAsINR` on each frame.
 *
 * Implementation note: `<NumberTicker />` rewrites `textContent` from
 * inside a motion subscription, which means we can't compose currency
 * formatting via children. We instead render the rupee glyph alongside
 * the ticker and let the ticker show the integer rupee amount.
 */
function CurrencyTicker({ value }: { value: number }) {
  // Display in whole rupees (value in paise → divide by 100)
  const rupees = Math.round(value / 100);
  return (
    <span className="flex items-baseline gap-0.5 font-mono text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
      <span className="text-2xl text-muted-foreground sm:text-3xl">₹</span>
      <NumberTicker
        value={rupees}
        className="font-mono text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
      />
      {/* Screen-reader friendly canonical value */}
      <span className="sr-only">{formatPaiseAsINR(value)}</span>
    </span>
  );
}
