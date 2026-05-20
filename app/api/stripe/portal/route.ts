import 'server-only';

import { auth } from '@/lib/auth';
import { NextResponse, type NextRequest } from 'next/server';

import { createPortalSession } from '@/lib/stripe';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * POST /api/stripe/portal
 *
 * Looks up the subscription row for the current Clerk user's business and
 * issues a Customer Portal session so they can manage payment method,
 * downgrade, cancel, view invoices, etc.
 *
 * 404 if no subscription has been created yet (user hasn't completed
 * Checkout). The caller should route them to /pricing in that case.
 */

export const runtime = 'nodejs';

export async function POST(_request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();

  // Two-step join: businesses → subscriptions. We avoid a single PostgREST
  // join here so the error messages stay precise.
  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .select('id')
    .eq('clerk_user_id', userId)
    .maybeSingle();

  if (businessError) {
    return NextResponse.json(
      { error: `Business lookup failed: ${businessError.message}` },
      { status: 500 },
    );
  }
  if (!business) {
    return NextResponse.json({ error: 'No business found' }, { status: 404 });
  }

  const { data: subscription, error: subError } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('business_id', business.id)
    .maybeSingle();

  if (subError) {
    return NextResponse.json(
      { error: `Subscription lookup failed: ${subError.message}` },
      { status: 500 },
    );
  }
  if (!subscription?.stripe_customer_id) {
    return NextResponse.json(
      { error: 'No active subscription' },
      { status: 404 },
    );
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? new URL(_request.url).origin;

  const portal = await createPortalSession({
    customerId: subscription.stripe_customer_id,
    returnUrl: `${appUrl}/billing`,
  });

  return NextResponse.json({ url: portal.url }, { status: 200 });
}
