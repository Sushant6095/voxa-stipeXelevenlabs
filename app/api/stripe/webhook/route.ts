import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import type Stripe from 'stripe';

import { N8N_WORKFLOWS, triggerN8nWorkflow } from '@/lib/n8n';
import { isStripeTier, type StripeTier } from '@/lib/pricing';
import { stripe } from '@/lib/stripe';
import { createServiceClient } from '@/lib/supabase/server';
import type {
  Json,
  SubscriptionStatus,
  SubscriptionTier,
} from '@/lib/supabase/types';

/**
 * Stripe webhook sink — POST /api/stripe/webhook
 *
 * Responsibilities (in order):
 *   1. Verify signature against the RAW body (text(), not json()).
 *   2. Persist event.id to `stripe_webhook_events` for idempotency.
 *   3. Mutate subscription state on the events we care about.
 *   4. Forward the raw event to n8n for downstream side-effects (Twilio,
 *      WhatsApp, agent provisioning, etc.).
 *
 * Always returns 200 once the signature verifies, even if downstream work
 * fails — the event is durable in `stripe_webhook_events` and can be
 * retried. Returning non-2xx triggers exponential-backoff redelivery from
 * Stripe and would block other events.
 */

export const runtime = 'nodejs';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function epochToIso(epoch: number | null | undefined): string | null {
  if (typeof epoch !== 'number' || !Number.isFinite(epoch)) return null;
  return new Date(epoch * 1000).toISOString();
}

function pickSubscriptionStatus(
  stripeStatus: Stripe.Subscription.Status,
): SubscriptionStatus {
  switch (stripeStatus) {
    case 'trialing':
    case 'active':
    case 'past_due':
    case 'canceled':
    case 'paused':
      return stripeStatus;
    case 'incomplete':
    case 'incomplete_expired':
      return 'past_due';
    case 'unpaid':
      return 'past_due';
    default:
      return 'active';
  }
}

function tierFromMetadata(
  metadata: Stripe.Metadata | null | undefined,
): SubscriptionTier | null {
  const raw = metadata?.tier;
  if (raw && isStripeTier(raw)) return raw as StripeTier;
  return null;
}

/**
 * Stripe types declare `current_period_end` on Subscription historically but
 * the field actually lives on each subscription item in newer API versions.
 * We accept either shape and fall back gracefully.
 */
function subscriptionPeriodEndIso(
  sub: Stripe.Subscription,
): string | null {
  const top = (sub as unknown as { current_period_end?: number })
    .current_period_end;
  if (typeof top === 'number') return epochToIso(top);
  const item = sub.items?.data?.[0] as
    | (Stripe.SubscriptionItem & { current_period_end?: number })
    | undefined;
  if (item && typeof item.current_period_end === 'number') {
    return epochToIso(item.current_period_end);
  }
  return null;
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const signature = request.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json(
      { error: 'Missing stripe-signature or STRIPE_WEBHOOK_SECRET' },
      { status: 400 },
    );
  }

  // CRITICAL: read raw body BEFORE parsing JSON. constructEvent verifies the
  // signature against the exact bytes Stripe signed — calling request.json()
  // first mutates the body and breaks verification.
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Unknown signature error';
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${message}` },
      { status: 400 },
    );
  }

  const supabase = createServiceClient();

  // ---- Idempotency log ---------------------------------------------------
  // Insert first; if the row already exists, short-circuit. ON CONFLICT DO
  // NOTHING via upsert with `ignoreDuplicates: true`.
  const { error: insertEventError, count } = await supabase
    .from('stripe_webhook_events')
    .upsert(
      {
        id: event.id,
        event_type: event.type,
        // Stripe.Event is a structured POJO with no Date/Symbol/etc — cast
        // through unknown so the Supabase generated `Json` shape accepts it.
        payload: event as unknown as Json,
      },
      { onConflict: 'id', ignoreDuplicates: true, count: 'exact' },
    );

  if (insertEventError) {
    // The audit row write failed — return 500 so Stripe retries.
    return NextResponse.json(
      { error: `Idempotency log failed: ${insertEventError.message}` },
      { status: 500 },
    );
  }
  if (count === 0) {
    // Duplicate delivery — already processed.
    return NextResponse.json({ received: true, duplicate: true });
  }

  // ---- Per-type handlers --------------------------------------------------
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        await handleCheckoutCompleted(
          supabase,
          event.data.object as Stripe.Checkout.Session,
          event,
        );
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.created':
      case 'customer.subscription.resumed':
      case 'customer.subscription.paused': {
        await handleSubscriptionUpdated(
          supabase,
          event.data.object as Stripe.Subscription,
        );
        break;
      }
      case 'customer.subscription.deleted': {
        await handleSubscriptionDeleted(
          supabase,
          event.data.object as Stripe.Subscription,
          event,
        );
        break;
      }
      case 'invoice.payment_failed': {
        await handleInvoicePaymentFailed(event);
        break;
      }
      default: {
        // Logged via the idempotency table — nothing else to do.
        break;
      }
    }
  } catch (error: unknown) {
    // Internal handler failed AFTER signature verification + idempotency
    // write. Log the failure but still 200 — the audit row preserves the
    // payload so it can be replayed manually. Returning 500 would cause
    // Stripe to redeliver, but our idempotency layer would short-circuit
    // and we'd never reprocess.
    const message =
      error instanceof Error ? error.message : 'unknown error';
    console.error(`[stripe-webhook] handler failed for ${event.type}: ${message}`);
  }

  return NextResponse.json({ received: true });
}

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

type ServiceClient = ReturnType<typeof createServiceClient>;

async function handleCheckoutCompleted(
  supabase: ServiceClient,
  session: Stripe.Checkout.Session,
  rawEvent: Stripe.Event,
): Promise<void> {
  const businessId = session.metadata?.business_id;
  const tier = tierFromMetadata(session.metadata);
  const customerId =
    typeof session.customer === 'string'
      ? session.customer
      : session.customer?.id;
  const subscriptionId =
    typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription?.id ?? null;

  if (!businessId || !tier || !customerId) {
    console.error(
      `[stripe-webhook] checkout.session.completed missing required metadata`,
      { businessId, tier, customerId },
    );
    return;
  }

  // Fetch the subscription to capture period_end + status (the Checkout
  // session itself doesn't include those reliably).
  let status: SubscriptionStatus = 'active';
  let periodEndIso: string | null = null;
  if (subscriptionId) {
    const sub = await stripe.subscriptions.retrieve(subscriptionId);
    status = pickSubscriptionStatus(sub.status);
    periodEndIso = subscriptionPeriodEndIso(sub);
  }

  const { error } = await supabase.from('subscriptions').upsert(
    {
      business_id: businessId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      tier,
      status,
      current_period_end: periodEndIso,
    },
    { onConflict: 'business_id' },
  );

  if (error) {
    throw new Error(`subscriptions upsert failed: ${error.message}`);
  }

  // Forward to n8n W1 (onboarding) so it can provision Twilio + ElevenLabs.
  await triggerN8nWorkflow(
    N8N_WORKFLOWS.ONBOARDING,
    {
      business_id: businessId,
      tier,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      session,
      event: rawEvent,
    },
    { timeoutMs: 4_000 },
  ).catch((err: unknown) => {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[stripe-webhook] n8n onboarding trigger failed: ${message}`);
  });
}

async function handleSubscriptionUpdated(
  supabase: ServiceClient,
  sub: Stripe.Subscription,
): Promise<void> {
  const customerId =
    typeof sub.customer === 'string' ? sub.customer : sub.customer.id;

  const tier = tierFromMetadata(sub.metadata);
  const status = pickSubscriptionStatus(sub.status);
  const periodEndIso = subscriptionPeriodEndIso(sub);

  // Locate the row by stripe_customer_id — Stripe is the source of truth.
  const { data: existing, error: lookupError } = await supabase
    .from('subscriptions')
    .select('id, business_id, tier')
    .eq('stripe_customer_id', customerId)
    .maybeSingle();

  if (lookupError) {
    throw new Error(`subscription lookup failed: ${lookupError.message}`);
  }
  if (!existing) {
    // We can land here if the subscription.updated event arrives before
    // checkout.session.completed (unusual but possible). Skip — the
    // session.completed handler will create the row with up-to-date state.
    return;
  }

  const { error: updateError } = await supabase
    .from('subscriptions')
    .update({
      stripe_subscription_id: sub.id,
      status,
      current_period_end: periodEndIso,
      ...(tier ? { tier } : {}),
    })
    .eq('id', existing.id);

  if (updateError) {
    throw new Error(`subscription update failed: ${updateError.message}`);
  }
}

async function handleSubscriptionDeleted(
  supabase: ServiceClient,
  sub: Stripe.Subscription,
  rawEvent: Stripe.Event,
): Promise<void> {
  const customerId =
    typeof sub.customer === 'string' ? sub.customer : sub.customer.id;

  const { data: existing, error: lookupError } = await supabase
    .from('subscriptions')
    .select('id, business_id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle();

  if (lookupError) {
    throw new Error(`subscription lookup failed: ${lookupError.message}`);
  }

  if (existing) {
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({ status: 'canceled' })
      .eq('id', existing.id);
    if (updateError) {
      throw new Error(`subscription cancel failed: ${updateError.message}`);
    }
  }

  await triggerN8nWorkflow(
    N8N_WORKFLOWS.STRIPE_WEBHOOK,
    {
      kind: 'subscription_deleted',
      business_id: existing?.business_id ?? null,
      subscription: sub,
      event: rawEvent,
    },
    { timeoutMs: 4_000 },
  ).catch((err: unknown) => {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[stripe-webhook] n8n cleanup trigger failed: ${message}`);
  });
}

async function handleInvoicePaymentFailed(
  rawEvent: Stripe.Event,
): Promise<void> {
  await triggerN8nWorkflow(
    N8N_WORKFLOWS.STRIPE_WEBHOOK,
    {
      kind: 'invoice_payment_failed',
      event: rawEvent,
    },
    { timeoutMs: 4_000 },
  ).catch((err: unknown) => {
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      `[stripe-webhook] n8n payment-failed trigger failed: ${message}`,
    );
  });
}
