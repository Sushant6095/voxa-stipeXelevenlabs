import 'server-only';

import { auth, clerkClient } from '@/lib/auth';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import {
  createCheckoutSession,
  getOrCreateStripeCustomer,
} from '@/lib/stripe';
import { STRIPE_TIERS, isStripeTier } from '@/lib/pricing';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * POST /api/stripe/checkout
 *
 * Body: `{ "tier": "starter" | "growth" | "scale" }`
 *
 * Flow:
 *   1. Authenticate the caller via Clerk.
 *   2. Resolve (or create) the Stripe customer keyed by clerk_user_id.
 *   3. Upsert a placeholder business row so the post-checkout webhook has
 *      a stable `business_id` to attach the subscription to.
 *   4. Create a Checkout Session with both the flat + metered prices.
 *   5. Return `{ url }` so the client (or server action) redirects.
 *
 * Subscription state mutations happen in the webhook handler — never here.
 */

const requestSchema = z.object({
  tier: z.enum(STRIPE_TIERS as readonly [string, ...string[]]),
});

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  // ---- Auth ----------------------------------------------------------------
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ---- Body validation ----------------------------------------------------
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { tier } = parsed.data;
  if (!isStripeTier(tier)) {
    return NextResponse.json({ error: 'Unknown tier' }, { status: 400 });
  }

  // ---- Clerk user details -------------------------------------------------
  const clerk = await clerkClient();
  const user = await clerk.users.getUser(userId);
  const email = user.primaryEmailAddress?.emailAddress;
  const name =
    [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
    user.username ||
    undefined;

  // ---- Stripe customer ----------------------------------------------------
  const customer = await getOrCreateStripeCustomer({
    clerkUserId: userId,
    email,
    name,
  });

  // ---- Business row (placeholder if missing) ------------------------------
  const supabase = createServiceClient();
  const { data: existingBusiness, error: lookupError } = await supabase
    .from('businesses')
    .select('id')
    .eq('clerk_user_id', userId)
    .maybeSingle();

  if (lookupError) {
    return NextResponse.json(
      { error: `Business lookup failed: ${lookupError.message}` },
      { status: 500 },
    );
  }

  let businessId = existingBusiness?.id;
  if (!businessId) {
    const { data: inserted, error: insertError } = await supabase
      .from('businesses')
      .insert({
        clerk_user_id: userId,
        name: 'Pending business',
        language: 'en',
      })
      .select('id')
      .single();

    if (insertError || !inserted) {
      return NextResponse.json(
        {
          error: `Business creation failed: ${insertError?.message ?? 'unknown'}`,
        },
        { status: 500 },
      );
    }
    businessId = inserted.id;
  }

  // ---- Checkout session ---------------------------------------------------
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;

  const session = await createCheckoutSession({
    tier,
    customerId: customer.id,
    successUrl: `${appUrl}/onboarding?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${appUrl}/pricing?cancelled=1`,
    metadata: {
      business_id: businessId,
      tier,
      clerk_user_id: userId,
    },
  });

  if (!session.url) {
    return NextResponse.json(
      { error: 'Stripe did not return a Checkout URL' },
      { status: 500 },
    );
  }

  return NextResponse.json({ url: session.url }, { status: 200 });
}
