'use server';

import { redirect } from 'next/navigation';

import { currentClerkUserId } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';
import { createPortalSession } from '@/lib/stripe';

/**
 * /billing server actions.
 *
 * The Customer Portal redirect is the only meaningful billing action a user
 * can take from inside Voxa — subscription tier changes, payment method
 * updates, and cancellation all happen on Stripe's hosted portal.
 */

function appUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  ).replace(/\/$/, '');
}

export async function openBillingPortal(): Promise<never> {
  const userId = await currentClerkUserId();
  if (!userId) redirect('/pricing');

  // Service-role lookup so we don't depend on the user's request having a
  // hydrated session cookie at this moment — the action is invoked from a
  // form submission and we want the cheapest possible path to the portal.
  const supabase = createServiceClient();

  const { data: business, error: bizErr } = await supabase
    .from('businesses')
    .select('id')
    .eq('clerk_user_id', userId)
    .maybeSingle();

  if (bizErr) throw new Error(`business lookup failed: ${bizErr.message}`);
  if (!business) redirect('/onboarding');

  const { data: sub, error: subErr } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('business_id', business.id)
    .maybeSingle();

  if (subErr) throw new Error(`subscription lookup failed: ${subErr.message}`);
  if (!sub) redirect('/pricing');

  const session = await createPortalSession({
    customerId: sub.stripe_customer_id,
    returnUrl: `${appUrl()}/billing`,
  });

  if (!session.url) {
    throw new Error('Stripe portal session has no URL');
  }
  redirect(session.url);
}
