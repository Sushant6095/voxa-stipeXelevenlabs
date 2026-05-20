import 'server-only';

import Stripe from 'stripe';

import {
  PRICING_TIERS,
  STRIPE_TIERS,
  type StripeTier,
} from './pricing';

/**
 * Stripe API version is LOCKED at 2025-03-31.basil per CLAUDE.md.
 *
 * The installed SDK (stripe@22) ships a newer ApiVersion type literal — we
 * intentionally pin to the basil release so behavior matches the n8n
 * workflows + meter-event payload format. The Stripe SDK forwards the
 * version string verbatim in the `Stripe-Version` header, so the cast is
 * runtime-safe; we widen via `Parameters<typeof Stripe>[1]` so the literal
 * type drift between SDK majors doesn't break the build.
 */
const STRIPE_API_VERSION = '2025-03-31.basil';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  // We throw at import time on the server so misconfiguration is loud.
  // Webhook + Checkout routes will fail fast instead of silently mis-billing.
  throw new Error('STRIPE_SECRET_KEY is not configured');
}

// The SDK's `apiVersion` field is typed as a single literal that tracks the
// latest dahlia release; we deliberately override it to the locked basil
// version per CLAUDE.md. The runtime accepts any version string.
type LockedApiVersion = NonNullable<
  ConstructorParameters<typeof Stripe>[1]
>['apiVersion'];

export const stripe: Stripe = new Stripe(stripeSecretKey, {
  apiVersion: STRIPE_API_VERSION as unknown as LockedApiVersion,
  typescript: true,
  appInfo: {
    name: 'voxa',
    version: '0.1.0',
  },
});

// ---------------------------------------------------------------------------
// Re-export pure pricing data so server-only modules can import everything
// from `@/lib/stripe`. Client components should import from `@/lib/pricing`.
// ---------------------------------------------------------------------------
export { PRICING_TIERS, STRIPE_TIERS, type StripeTier };

// Legacy alias retained for Phase-1 callers (`VoxaTier`). Prefer `StripeTier`
// for new code — both point at the same union.
export type VoxaTier = StripeTier;

// ---------------------------------------------------------------------------
// Price ID lookup (one flat + one metered per tier).
// ---------------------------------------------------------------------------
export interface TierPriceIds {
  flat: string;
  meter: string;
}

/**
 * Read the price IDs for a tier from environment. Populated by
 * `scripts/setup-stripe.ts` — see PROMPTS.md Phase 3.
 *
 * Returns the raw env values (or `undefined`) — callers needing strict
 * validation should use `priceIdsForTier()` which throws.
 */
export const STRIPE_PRICE_IDS: Record<StripeTier, Partial<TierPriceIds>> = {
  starter: {
    flat: process.env.STRIPE_PRICE_STARTER_FLAT,
    meter: process.env.STRIPE_PRICE_STARTER_METER,
  },
  growth: {
    flat: process.env.STRIPE_PRICE_GROWTH_FLAT,
    meter: process.env.STRIPE_PRICE_GROWTH_METER,
  },
  scale: {
    flat: process.env.STRIPE_PRICE_SCALE_FLAT,
    meter: process.env.STRIPE_PRICE_SCALE_METER,
  },
};

/**
 * Strict price-id lookup. Throws a helpful error if either price is missing
 * — common during initial env wiring before `setup-stripe.ts` has been run.
 */
export function priceIdsForTier(tier: StripeTier): TierPriceIds {
  const ids = STRIPE_PRICE_IDS[tier];
  if (!ids.flat || !ids.meter) {
    const envFlat = `STRIPE_PRICE_${tier.toUpperCase()}_FLAT`;
    const envMeter = `STRIPE_PRICE_${tier.toUpperCase()}_METER`;
    throw new Error(
      `Stripe price IDs missing for tier "${tier}". Set ${envFlat} and ${envMeter} (run \`pnpm setup:stripe\`).`,
    );
  }
  return { flat: ids.flat, meter: ids.meter };
}

// ---------------------------------------------------------------------------
// Customers
// ---------------------------------------------------------------------------

export interface GetOrCreateCustomerInput {
  clerkUserId: string;
  email?: string;
  name?: string;
}

/**
 * Get-or-create a Stripe customer keyed by `metadata.clerk_user_id`.
 *
 * We avoid `customers.search()` here because it lags behind writes by
 * several seconds on test mode — using `list({ email })` plus a metadata
 * cross-check is eventually consistent within the same request and
 * sufficient for our scale.
 */
export async function getOrCreateStripeCustomer({
  clerkUserId,
  email,
  name,
}: GetOrCreateCustomerInput): Promise<Stripe.Customer> {
  // 1. Try search by metadata first (real-time index can be slow but is the
  //    authoritative lookup once it catches up).
  try {
    const searchResults = await stripe.customers.search({
      query: `metadata['clerk_user_id']:'${clerkUserId}'`,
      limit: 1,
    });
    const hit = searchResults.data[0];
    if (hit) {
      return hit;
    }
  } catch {
    // search can 400 if metadata indexing hasn't initialised on a new account;
    // fall through to the email/list fallback.
  }

  // 2. Fallback: list by email and verify metadata to avoid hijacking a
  //    customer that shares the email but belongs to another Clerk user.
  if (email) {
    const list = await stripe.customers.list({ email, limit: 10 });
    const match = list.data.find(
      (c) => c.metadata?.clerk_user_id === clerkUserId,
    );
    if (match) return match;
  }

  // 3. Create a new customer.
  return stripe.customers.create({
    email,
    name,
    metadata: { clerk_user_id: clerkUserId },
  });
}

/**
 * Phase-1 compat alias — same contract as the new helper but returns null
 * instead of creating. Kept so older callers don't break.
 */
export async function getStripeCustomerByClerkUserId(
  clerkUserId: string,
): Promise<Stripe.Customer | null> {
  try {
    const searchResults = await stripe.customers.search({
      query: `metadata['clerk_user_id']:'${clerkUserId}'`,
      limit: 1,
    });
    return searchResults.data[0] ?? null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Checkout
// ---------------------------------------------------------------------------

export interface CreateCheckoutSessionInput {
  tier: StripeTier;
  customerId: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}

/**
 * Create a subscription Checkout Session with both the flat licensed price
 * and the metered overage price. Metered line items MUST NOT have a
 * quantity — Stripe rejects the request otherwise.
 *
 * INR is hardcoded because the locked pricing table is INR-only.
 */
export async function createCheckoutSession({
  tier,
  customerId,
  successUrl,
  cancelUrl,
  metadata = {},
}: CreateCheckoutSessionInput): Promise<Stripe.Checkout.Session> {
  const { flat, meter } = priceIdsForTier(tier);

  const subscriptionMetadata: Record<string, string> = {
    ...metadata,
    tier,
  };

  return stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [
      { price: flat, quantity: 1 },
      // No quantity for metered prices — Stripe enforces this.
      { price: meter },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
    currency: 'inr',
    subscription_data: {
      metadata: subscriptionMetadata,
    },
    metadata: subscriptionMetadata,
  });
}

// ---------------------------------------------------------------------------
// Customer Portal
// ---------------------------------------------------------------------------

export interface CreatePortalSessionInput {
  customerId: string;
  returnUrl: string;
}

/**
 * Wrap `stripe.billingPortal.sessions.create`. The portal must be enabled
 * in Stripe Dashboard → Settings → Billing → Customer Portal, otherwise
 * this call throws `customer_portal_disabled`.
 */
export async function createPortalSession({
  customerId,
  returnUrl,
}: CreatePortalSessionInput): Promise<Stripe.BillingPortal.Session> {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}

// ---------------------------------------------------------------------------
// Meter events
// ---------------------------------------------------------------------------

export interface SendMeterEventInput {
  stripeCustomerId: string;
  callMinutes: number;
  /**
   * Stripe enforces uniqueness on `identifier` for ~24h, making it the
   * dedupe key on webhook retries / parallel n8n executions. Always pass
   * the call's UUID (or a deterministic hash of it) so we never double-bill.
   */
  identifier?: string;
}

/**
 * Report call minutes to Stripe's billing Meter.
 *
 * value MUST be a whole-number string per Stripe 2025-03-31+ API.
 * We floor `callMinutes` to an integer and stringify before sending.
 *
 * @see https://docs.stripe.com/billing/subscriptions/usage-based/recording-usage
 */
export async function sendMeterEvent({
  stripeCustomerId,
  callMinutes,
  identifier,
}: SendMeterEventInput) {
  const wholeMinutes = Math.max(0, Math.floor(callMinutes));
  // value MUST be a whole-number string per Stripe 2025-03-31+ API
  const value = String(wholeMinutes);

  return stripe.billing.meterEvents.create({
    event_name: 'call_minutes',
    payload: {
      stripe_customer_id: stripeCustomerId,
      value,
    },
    ...(identifier ? { identifier } : {}),
  });
}
