/**
 * Voxa pricing — pure data + formatters.
 *
 * Intentionally has NO `'server-only'` so the marketing pricing page and
 * dashboard usage cards can import the same source of truth.
 *
 * The flat + overage amounts are denominated in PAISE (₹1 = 100 paise) per
 * Stripe's smallest-currency-unit convention. `setup-stripe.ts` reads these
 * values when materialising Products + Prices. The runtime app reads them
 * for display. Do not duplicate the numbers anywhere else.
 */

export const PRICING_TIERS = {
  starter: {
    name: 'Starter',
    flatPaise: 99_900,
    includedMinutes: 100,
    overagePaise: 1_500,
    tagline: 'For solo founders piloting voice automation.',
    features: [
      '1 phone number',
      '100 included minutes / month',
      'Voice cloning',
      'Hindi · Tamil · Telugu · English',
      'WhatsApp confirmations',
    ],
  },
  growth: {
    name: 'Growth',
    flatPaise: 299_900,
    includedMinutes: 500,
    overagePaise: 1_200,
    tagline: 'The standard plan for growing SMBs.',
    features: [
      'Everything in Starter',
      '500 included minutes / month',
      'Knowledge base RAG',
      'Calendar booking via Cal.com',
      'Smart escalation to owner',
    ],
  },
  scale: {
    name: 'Scale',
    flatPaise: 799_900,
    includedMinutes: 2_000,
    overagePaise: 1_000,
    tagline: 'Multi-location and high-volume.',
    features: [
      'Everything in Growth',
      '2,000 included minutes / month',
      'Priority routing + fail-over',
      'Daily WhatsApp digest',
      'Lower per-minute overage',
    ],
  },
} as const;

export type StripeTier = keyof typeof PRICING_TIERS;

export const STRIPE_TIERS: readonly StripeTier[] = ['starter', 'growth', 'scale'];

export function isStripeTier(value: unknown): value is StripeTier {
  return typeof value === 'string' && (STRIPE_TIERS as readonly string[]).includes(value);
}

const INR_FORMATTER = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

/**
 * Render an INR paise integer as a localised currency string.
 *
 * `99900` paise → `"₹999"`. We strip fractional digits because the locked
 * pricing table is whole-rupee only — surfacing `.00` would be visual noise.
 */
export function formatPaiseAsINR(paise: number): string {
  if (!Number.isFinite(paise)) {
    return INR_FORMATTER.format(0);
  }
  return INR_FORMATTER.format(Math.round(paise) / 100);
}
