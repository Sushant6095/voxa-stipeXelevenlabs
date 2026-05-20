import { ExternalLink } from 'lucide-react';

import { openBillingPortal } from './actions';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { NumberTicker } from '@/components/ui/number-ticker';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getBillingSummary } from '@/lib/dashboard-data';
import { PRICING_TIERS, formatPaiseAsINR } from '@/lib/pricing';

export const dynamic = 'force-dynamic';

export default async function BillingPage() {
  const summary = await getBillingSummary();
  const tier = summary.tier ?? 'starter';
  const tierConfig = PRICING_TIERS[tier];
  const includedMinutes = tierConfig.includedMinutes;
  const usedMinutes = summary.minutesUsed;
  const usagePercent = includedMinutes > 0
    ? Math.min(100, Math.round((usedMinutes / includedMinutes) * 100))
    : 0;
  const invoiceRupees = summary.estimatedInvoicePaise / 100;

  return (
    <div className="space-y-6">
      <DashboardHeader title="Billing" subtitle="Plan, usage, and estimated invoice." />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="p-6">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Current plan
          </p>
          <h2 className="mt-2 font-heading text-2xl font-semibold capitalize">
            Voxa {tierConfig.name}
          </h2>
          <p className="mt-1 font-mono text-xl text-muted-foreground">
            {formatPaiseAsINR(tierConfig.flatPaise)} / month
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            Includes {tierConfig.includedMinutes} min · {formatPaiseAsINR(tierConfig.overagePaise)}/min overage
          </p>
        </Card>

        <Card className="p-6">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Estimated invoice this period
          </p>
          <p className="mt-2 font-mono text-3xl font-semibold">
            ₹<NumberTicker value={invoiceRupees} />
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Updates live as calls complete.
          </p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-base font-semibold">Minutes this month</h3>
          <p className="font-mono text-sm tabular-nums">
            {usedMinutes} / {includedMinutes}
          </p>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent-voxa transition-[width] duration-500"
            style={{ width: `${usagePercent}%` }}
            aria-valuenow={usagePercent}
            aria-valuemin={0}
            aria-valuemax={100}
            role="progressbar"
          />
        </div>
        {usedMinutes > includedMinutes && (
          <p className="mt-2 text-xs text-amber-600">
            {usedMinutes - includedMinutes} minute{usedMinutes - includedMinutes === 1 ? '' : 's'} in overage at {formatPaiseAsINR(tierConfig.overagePaise)}/min.
          </p>
        )}
      </Card>

      <Card className="flex flex-wrap items-center justify-between gap-3 p-6">
        <div>
          <h3 className="font-heading text-base font-semibold">
            Manage subscription
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Update card, download invoices, or cancel via Stripe Customer Portal.
          </p>
        </div>
        <form action={openBillingPortal}>
          <Button type="submit">
            Open portal
            <ExternalLink aria-hidden className="ml-2 size-4" />
          </Button>
        </form>
      </Card>
    </div>
  );
}
