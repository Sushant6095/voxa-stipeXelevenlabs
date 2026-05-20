---
name: stripe-metered-billing
description: Use whenever working with Stripe usage-based billing — creating Meters, sending Meter Events, building metered Prices, attaching to Subscriptions. Covers the 2025-03-31+ API (legacy usage_records API is REMOVED). Trigger on terms "metered", "usage-based", "meter event", "billing meter", "usage record", or Stripe pricing for Voxa.
---

# Stripe Metered Billing (2025 API)

## The mental model

```
Meter ←── Price ←── Subscription Item ←── Customer
  ↑
  └── Meter Events (sent via API as customer consumes)
```

A **Meter** defines what you're tracking and how to aggregate. A **Price** with `usage_type: 'metered'` and `meter: METER_ID` is what the customer subscribes to. A **Meter Event** is the raw usage data — you fire one every time the customer consumes a billable unit.

## Setup (one-time per Stripe account)

```typescript
// scripts/setup-stripe.ts — idempotent
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-03-31.basil',
});

// 1. Find or create the Meter
async function ensureMeter() {
  const list = await stripe.billing.meters.list({ status: 'active', limit: 100 });
  const existing = list.data.find(m => m.event_name === 'call_minutes');
  if (existing) return existing;
  
  return stripe.billing.meters.create({
    display_name: 'Call minutes',
    event_name: 'call_minutes',
    default_aggregation: { formula: 'sum' },
    customer_mapping: { type: 'by_id', event_payload_key: 'stripe_customer_id' },
    value_settings: { event_payload_key: 'value' },
  });
}

// 2. Find or create the Product
async function ensureProduct(name: string, lookupKey: string) {
  const list = await stripe.products.list({ active: true, limit: 100 });
  const existing = list.data.find(p => p.metadata.lookup_key === lookupKey);
  if (existing) return existing;
  
  return stripe.products.create({
    name,
    metadata: { lookup_key: lookupKey },
  });
}

// 3. Find or create the flat (licensed) Price
async function ensureFlatPrice(productId: string, amount: number, lookupKey: string) {
  const list = await stripe.prices.list({ product: productId, active: true });
  const existing = list.data.find(p => p.metadata.lookup_key === lookupKey);
  if (existing) return existing;
  
  return stripe.prices.create({
    product: productId,
    unit_amount: amount,  // in smallest currency unit (paise for INR)
    currency: 'inr',
    recurring: { interval: 'month', usage_type: 'licensed' },
    metadata: { lookup_key: lookupKey },
  });
}

// 4. Find or create the metered Price
async function ensureMeteredPrice(productId: string, meterId: string, amount: number, lookupKey: string) {
  const list = await stripe.prices.list({ product: productId, active: true });
  const existing = list.data.find(p => p.metadata.lookup_key === lookupKey);
  if (existing) return existing;
  
  return stripe.prices.create({
    product: productId,
    unit_amount: amount,  // per unit (per minute), in paise
    currency: 'inr',
    recurring: {
      interval: 'month',
      usage_type: 'metered',
      meter: meterId,   // ← THIS IS THE NEW PART
    },
    billing_scheme: 'per_unit',
    metadata: { lookup_key: lookupKey },
  });
}

// 5. Run all
const meter = await ensureMeter();
const tiers = [
  { name: 'Voxa Starter', flat: 99900, metered: 1500, lookup: 'starter' },
  { name: 'Voxa Growth', flat: 299900, metered: 1200, lookup: 'growth' },
  { name: 'Voxa Scale', flat: 799900, metered: 1000, lookup: 'scale' },
];

for (const t of tiers) {
  const product = await ensureProduct(t.name, t.lookup);
  const flat = await ensureFlatPrice(product.id, t.flat, `${t.lookup}_flat`);
  const metered = await ensureMeteredPrice(product.id, meter.id, t.metered, `${t.lookup}_metered`);
  console.log(`${t.name}:`);
  console.log(`  STRIPE_PRICE_${t.lookup.toUpperCase()}_FLAT=${flat.id}`);
  console.log(`  STRIPE_PRICE_${t.lookup.toUpperCase()}_METER=${metered.id}`);
}
console.log(`STRIPE_METER_ID=${meter.id}`);
```

## Creating Checkout with both prices

```typescript
const session = await stripe.checkout.sessions.create({
  mode: 'subscription',
  line_items: [
    { price: process.env.STRIPE_PRICE_STARTER_FLAT, quantity: 1 },
    { price: process.env.STRIPE_PRICE_STARTER_METER },  // no quantity for metered
  ],
  success_url: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
  client_reference_id: clerkUserId,
  metadata: { clerk_user_id: clerkUserId, tier },
});
```

## Sending a meter event (from n8n or server)

```typescript
await stripe.billing.meterEvents.create({
  event_name: 'call_minutes',
  payload: {
    stripe_customer_id: customer.id,
    value: String(Math.ceil(durationSeconds / 60)),  // ← MUST be string of whole int
  },
});
```

### From n8n HTTP Request node

```
URL: https://api.stripe.com/v1/billing/meter_events
Method: POST
Authentication: Basic Auth (username: STRIPE_SECRET_KEY, password: empty)
Body type: form-urlencoded
Body params:
  event_name = call_minutes
  payload[stripe_customer_id] = {{ $json.stripe_customer_id }}
  payload[value] = {{ String(Math.ceil($json.duration_seconds / 60)) }}
```

## Reading usage (for the dashboard)

```typescript
// Get usage for the current period
const summary = await stripe.billing.meters.listEventSummaries(meterId, {
  customer: customerId,
  start_time: Math.floor(periodStart.getTime() / 1000),
  end_time: Math.floor(Date.now() / 1000),
});

const totalMinutes = summary.data.reduce((sum, s) => sum + (s.aggregated_value ?? 0), 0);
```

## Webhook handler pattern

```typescript
// app/api/stripe/webhook/route.ts
export const runtime = 'nodejs';  // Stripe SDK needs Node, not Edge

export async function POST(req: Request) {
  const body = await req.text();  // ← MUST be text(), not json()
  const sig = req.headers.get('stripe-signature');
  if (!sig) return new Response('No signature', { status: 400 });
  
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    return new Response(`Webhook signature failed: ${err}`, { status: 400 });
  }
  
  // Forward to n8n for orchestration
  await fetch(`${process.env.N8N_WEBHOOK_BASE_URL}/webhook/stripe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  }).catch(err => console.error('n8n forward failed', err));
  
  return new Response(null, { status: 200 });
}
```

## Critical gotchas

1. **`value` must be a string of a whole integer.** `"3"` works. `3` rejected. `"3.5"` rejected.
2. **Use `req.text()` before `constructEvent`.** Calling `req.json()` first mutates the body and signature verification fails.
3. **Meter events are eventually consistent.** They appear in the dashboard within ~30s, not instantly. Don't poll for them with tight timeouts.
4. **Don't send meter events from concurrent processes for the same customer.** Stripe enforces uniqueness via `identifier`. Use a UUID per event if you need to retry.
5. **Customer Portal must be configured.** Stripe Dashboard → Settings → Billing → Customer Portal → enable subscription management. Without this, the portal endpoint errors.
6. **Legacy `usage_records` API is GONE in 2025-03-31.** `subscriptionItem.usageRecords.create()` will fail. Use `meterEvents.create()`.

## Don't do these

- Don't create a single Price for both flat + metered (separate Price objects are required)
- Don't store the Price ID in code (always read from env)
- Don't try to "preview" the upcoming invoice yourself (use `stripe.invoices.retrieveUpcoming`)
- Don't use the Stripe CLI in production (it's for local webhook forwarding only)
