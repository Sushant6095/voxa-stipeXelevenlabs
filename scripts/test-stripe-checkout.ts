/**
 * scripts/test-stripe-checkout.ts — verify Checkout without the Next.js app.
 *
 * Usage:
 *   STRIPE_SECRET_KEY=sk_test_... STRIPE_PRICE_STARTER_FLAT=price_... \
 *   STRIPE_PRICE_STARTER_METER=price_... pnpm test:stripe
 *
 * Optional flags:
 *   --tier=growth        # default: starter
 *   --email=foo@bar.com  # default: test+TS@voxa.dev
 *
 * Prints a checkout URL to stdout. Open it, pay with `4242 4242 4242 4242`,
 * any future expiry, any CVC. The webhook listener should receive
 * `checkout.session.completed` and write a row to `public.subscriptions`.
 */

import Stripe from 'stripe';

import { STRIPE_TIERS, isStripeTier } from '../lib/pricing';

const STRIPE_API_VERSION = '2025-03-31.basil';

interface Args {
  tier: string;
  email: string;
}

function parseArgs(argv: readonly string[]): Args {
  const get = (name: string): string | undefined => {
    const match = argv.find((a) => a.startsWith(`--${name}=`));
    return match?.slice(`--${name}=`.length);
  };
  return {
    tier: get('tier') ?? 'starter',
    email: get('email') ?? `test+${Date.now()}@voxa.dev`,
  };
}

async function main(): Promise<void> {
  if (!process.env.STRIPE_SECRET_KEY) {
    // eslint-disable-next-line no-console
    console.error('Set STRIPE_SECRET_KEY first');
    process.exit(1);
  }

  const args = parseArgs(process.argv.slice(2));

  if (!isStripeTier(args.tier)) {
    // eslint-disable-next-line no-console
    console.error(
      `Unknown tier "${args.tier}". One of: ${STRIPE_TIERS.join(', ')}`,
    );
    process.exit(1);
  }

  const flatEnv = `STRIPE_PRICE_${args.tier.toUpperCase()}_FLAT`;
  const meterEnv = `STRIPE_PRICE_${args.tier.toUpperCase()}_METER`;
  const flat = process.env[flatEnv];
  const meter = process.env[meterEnv];
  if (!flat || !meter) {
    // eslint-disable-next-line no-console
    console.error(
      `Missing ${flatEnv} and/or ${meterEnv}. Run \`pnpm setup:stripe\` first.`,
    );
    process.exit(1);
  }

  type LockedApiVersion = NonNullable<
    ConstructorParameters<typeof Stripe>[1]
  >['apiVersion'];
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: STRIPE_API_VERSION as unknown as LockedApiVersion,
    typescript: true,
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const clerkUserId = `smoke_test_${Date.now()}`;

  // eslint-disable-next-line no-console
  console.log(`[1/3] Creating test customer (${args.email})`);
  const customer = await stripe.customers.create({
    email: args.email,
    name: 'Voxa Smoke Test',
    metadata: { clerk_user_id: clerkUserId },
  });
  // eslint-disable-next-line no-console
  console.log(`     customer.id = ${customer.id}`);

  // eslint-disable-next-line no-console
  console.log(`[2/3] Creating Checkout session for tier "${args.tier}"`);
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customer.id,
    line_items: [
      { price: flat, quantity: 1 },
      { price: meter },
    ],
    success_url: `${appUrl}/onboarding?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/pricing?cancelled=1`,
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
    currency: 'inr',
    subscription_data: {
      metadata: {
        tier: args.tier,
        clerk_user_id: clerkUserId,
        business_id: 'smoke-test-no-business',
      },
    },
    metadata: {
      tier: args.tier,
      clerk_user_id: clerkUserId,
      business_id: 'smoke-test-no-business',
    },
  });

  // eslint-disable-next-line no-console
  console.log(`     session.id = ${session.id}`);

  // eslint-disable-next-line no-console
  console.log(`\n[3/3] Open this URL to complete checkout (card 4242 4242 4242 4242):`);
  // eslint-disable-next-line no-console
  console.log(`\n${session.url}\n`);
}

main().catch((err: unknown) => {
  // eslint-disable-next-line no-console
  console.error(err instanceof Error ? err.stack ?? err.message : String(err));
  process.exit(1);
});
