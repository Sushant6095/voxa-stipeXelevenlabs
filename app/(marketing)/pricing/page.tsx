import { auth } from '@/lib/auth';
import { ArrowRight, Check } from 'lucide-react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { MarketingFooter } from '@/components/landing/marketing-footer';
import { MarketingNavbar } from '@/components/landing/marketing-navbar';
import { FeatureComparisonTable } from '@/components/pricing/feature-comparison-table';
import { PricingCardShell } from '@/components/pricing/pricing-card-shell';
import { Button } from '@/components/ui/button';
import {
  PRICING_TIERS,
  STRIPE_TIERS,
  formatPaiseAsINR,
  isStripeTier,
  type StripeTier,
} from '@/lib/pricing';
import { cn } from '@/lib/utils';

/**
 * /pricing — full marketing pricing page.
 *
 * The server action and tier data flow ship unchanged from Phase 3. Phase 8
 * upgrades the visual treatment:
 *   - parallax tilt + MagicCard cursor spotlight per card
 *   - animated BorderBeam ringing the Growth tier
 *   - pulsing "Most popular" badge on Growth
 *   - feature comparison table below the three cards
 */

export const metadata = {
  title: 'Pricing — Voxa',
  description:
    'Voxa pricing. INR. 7-day free trial. Voice cloning, multilingual AI receptionist for Indian SMBs.',
};

const HIGHLIGHTED_TIER: StripeTier = 'growth';

// ---------------------------------------------------------------------------
// Server action: subscribeToTier
// ---------------------------------------------------------------------------

async function subscribeToTier(formData: FormData): Promise<void> {
  'use server';

  const rawTier = formData.get('tier');
  if (typeof rawTier !== 'string' || !isStripeTier(rawTier)) {
    throw new Error('Invalid tier');
  }

  const { userId } = await auth();
  if (!userId) {
    redirect(`/sign-in?redirect_url=/pricing`);
  }

  const headerList = await headers();
  const host = headerList.get('host');
  const proto = headerList.get('x-forwarded-proto') ?? 'https';
  const base = process.env.NEXT_PUBLIC_APP_URL ?? `${proto}://${host}`;

  const cookieHeader = headerList.get('cookie') ?? '';

  const response = await fetch(`${base}/api/stripe/checkout`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      cookie: cookieHeader,
    },
    body: JSON.stringify({ tier: rawTier }),
    cache: 'no-store',
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(
      `Checkout creation failed: ${response.status} ${response.statusText} ${text}`.trim(),
    );
  }

  const data = (await response.json()) as { url?: string };
  if (!data.url) {
    throw new Error('Checkout did not return a URL');
  }

  redirect(data.url);
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ cancelled?: string }>;
}) {
  return (
    <main className="voxa-bg-light dark:voxa-bg-dark min-h-screen w-full">
      <MarketingNavbar />
      <div className="mx-auto w-full max-w-6xl px-6 py-20">
        <header className="mb-12 max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
            Pricing
          </p>
          <h1 className="mt-3 font-display text-4xl tracking-tight text-slate-950 sm:text-5xl dark:text-slate-50">
            One number. One agent. One bill.
          </h1>
          <p className="mt-4 text-base text-slate-600 sm:text-lg dark:text-slate-300">
            Indian INR. 7-day free trial via Stripe. Overage is metered per
            minute — you only pay for what your AI receptionist actually
            answers.
          </p>
        </header>

        <CancelledNotice searchParamsPromise={searchParams} />

        <section
          aria-label="Pricing tiers"
          className="grid gap-6 pt-4 md:grid-cols-3"
        >
          {STRIPE_TIERS.map((tier) => (
            <PricingCardShell
              key={tier}
              highlighted={tier === HIGHLIGHTED_TIER}
            >
              <PricingCardContent
                tier={tier}
                highlighted={tier === HIGHLIGHTED_TIER}
              />
            </PricingCardShell>
          ))}
        </section>

        <FeatureComparisonTable />

        <section
          aria-label="Pricing call to action"
          className="mt-16 flex flex-col items-center gap-3 rounded-2xl border border-slate-200/70 bg-white/60 px-6 py-8 text-center backdrop-blur-sm sm:flex-row sm:justify-between sm:text-left dark:border-slate-800/60 dark:bg-slate-950/40"
        >
          <div>
            <h3 className="font-display text-lg font-semibold tracking-tight">
              Not sure where to start?
            </h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Talk to a human. We&apos;ll match you to the right plan in a
              ten-minute call.
            </p>
          </div>
          <a
            href="mailto:hello@voxa.in"
            className="group inline-flex items-center gap-1.5 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            Talk to us
            <ArrowRight
              className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </a>
        </section>
      </div>
      <MarketingFooter />
    </main>
  );
}

// ---------------------------------------------------------------------------
// Subcomponents
// ---------------------------------------------------------------------------

async function CancelledNotice({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<{ cancelled?: string }>;
}) {
  const params = await searchParamsPromise;
  if (params.cancelled !== '1') return null;
  return (
    <div
      role="status"
      className="mb-8 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm"
    >
      Checkout cancelled — no card was charged. Pick a tier when you&apos;re
      ready.
    </div>
  );
}

interface PricingCardContentProps {
  readonly tier: StripeTier;
  readonly highlighted: boolean;
}

function PricingCardContent({ tier, highlighted }: PricingCardContentProps) {
  const config = PRICING_TIERS[tier];

  return (
    <div className="flex h-full flex-col gap-6 p-8">
      <header className="space-y-3">
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          {config.name}
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {config.tagline}
        </p>
      </header>

      <div>
        <div className="flex items-baseline gap-1">
          <span className="font-mono text-4xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
            {formatPaiseAsINR(config.flatPaise)}
          </span>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            / month
          </span>
        </div>
        <p className="mt-2 font-mono text-xs text-slate-500 dark:text-slate-400">
          {config.includedMinutes.toLocaleString('en-IN')} minutes included ·{' '}
          {formatPaiseAsINR(config.overagePaise)} / extra min
        </p>
      </div>

      <ul className="space-y-2 text-sm">
        {config.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <Check
              aria-hidden="true"
              className="mt-0.5 h-4 w-4 flex-none text-emerald-500"
            />
            <span className="text-slate-700 dark:text-slate-200">
              {feature}
            </span>
          </li>
        ))}
      </ul>

      <form action={subscribeToTier} className="mt-auto w-full pt-2">
        <input type="hidden" name="tier" value={tier} />
        <Button
          type="submit"
          className={cn(
            'w-full',
            highlighted &&
              'bg-gradient-to-r from-[#6366F1] to-[#EC4899] text-white shadow-md hover:opacity-95',
          )}
          variant={highlighted ? 'default' : 'secondary'}
        >
          Subscribe to {config.name}
        </Button>
      </form>
    </div>
  );
}
