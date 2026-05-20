import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

import { N8N_WORKFLOWS, triggerN8nWorkflow } from '@/lib/n8n';
import { stripe } from '@/lib/stripe';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * /onboarding
 *
 * The post-Stripe-Checkout landing page. Verifies the Stripe Checkout
 * Session, ensures a placeholder business row exists, then redirects to
 * `/onboarding/welcome` so the wizard can take over.
 *
 * Search params:
 *   - session_id  : Stripe Checkout Session ID (cs_…). Required first time.
 *
 * Behaviour:
 *   - No `session_id` AND user has an active agent  -> redirect to /dashboard
 *   - No `session_id` AND user is mid-onboarding    -> /onboarding/welcome
 *   - Has `session_id` but invalid / not paid       -> /pricing?cancelled=1
 *   - Valid `session_id`                            -> kick n8n W1 + welcome
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface OnboardingPageProps {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function OnboardingGate({
  searchParams,
}: OnboardingPageProps) {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in?redirect_url=/onboarding');
  }

  const params = await searchParams;
  const sessionIdParam = params.session_id;
  const sessionId =
    typeof sessionIdParam === 'string' && sessionIdParam.length > 0
      ? sessionIdParam
      : null;

  const supabase = createServiceClient();

  // ---- 1. Stripe session verification --------------------------------------
  if (sessionId) {
    let verified = false;
    let businessIdFromSession: string | null = null;

    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      const isPaid = session.payment_status === 'paid';
      const owner = session.metadata?.clerk_user_id;
      if (isPaid && owner === userId) {
        verified = true;
        businessIdFromSession = session.metadata?.business_id ?? null;
      }
    } catch {
      // Invalid session id, expired, or wrong account — fall through to
      // the unverified branch.
    }

    if (!verified) {
      redirect('/pricing?cancelled=1');
    }

    // n8n W1 should have been kicked off by the Stripe webhook. We fire a
    // best-effort secondary trigger here so that if the webhook handler
    // wasn't reachable at the time, we still progress. n8n's workflow is
    // idempotent on business_id.
    if (businessIdFromSession) {
      triggerN8nWorkflow(N8N_WORKFLOWS.ONBOARDING, {
        business_id: businessIdFromSession,
        clerk_user_id: userId,
        trigger: 'onboarding_gate',
      }).catch(() => {
        // Swallow — provisioning page can retry via startProvisioning().
      });
    }

    redirect('/onboarding/welcome');
  }

  // ---- 2. No session_id — figure out where to land them --------------------
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('clerk_user_id', userId)
    .maybeSingle();

  if (!business) {
    // They've never paid — go pick a tier.
    redirect('/pricing');
  }

  const { data: agent } = await supabase
    .from('agents')
    .select('status')
    .eq('business_id', business.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (agent?.status === 'active') {
    redirect('/dashboard');
  }

  // Otherwise resume the wizard at the welcome step. The user can navigate
  // forward; pages are individually addressable.
  redirect('/onboarding/welcome');
}
