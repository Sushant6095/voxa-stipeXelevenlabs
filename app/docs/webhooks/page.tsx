import {
  AnchorHeading,
  Callout,
  CodeBlock,
  EndpointHeader,
  ParamTable,
} from '@/components/docs/docs-primitives';

export const metadata = {
  title: 'Webhooks — Voxa API docs',
  description: 'Inbound webhooks Voxa accepts from Stripe and ElevenLabs, plus the verification model.',
};

export default function DocsWebhooksPage() {
  return (
    <article className="mx-auto max-w-3xl">
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-primary">
        Webhooks
      </p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">Webhooks</h1>
      <p className="mt-4 text-base leading-relaxed text-foreground/70">
        Voxa receives two inbound webhooks — one from Stripe and one from
        ElevenLabs. Both are verified at the Next.js edge, then forwarded into
        n8n for orchestration. Voxa never returns non-2xx to a webhook caller:
        all payloads are persisted to the idempotency log first, then handled
        async, so retries are safe.
      </p>

      <AnchorHeading level={2} id="signatures">
        Verifying signatures
      </AnchorHeading>
      <p className="text-[15px] leading-relaxed text-foreground/75">
        Stripe uses HMAC-SHA256 with the timestamped signature header{' '}
        <code>stripe-signature</code>. Voxa reads the raw request body via{' '}
        <code>request.text()</code> (NOT parsed JSON) and passes it to{' '}
        <code>stripe.webhooks.constructEvent</code> alongside{' '}
        <code>STRIPE_WEBHOOK_SECRET</code>. If verification fails the
        endpoint returns <code>400</code>.
      </p>
      <p className="text-[15px] leading-relaxed text-foreground/75">
        ElevenLabs delivers post-call analytics signed with{' '}
        <code>ELEVENLABS_WEBHOOK_SECRET</code>. Voxa uses constant-time HMAC
        verification (see <code>app/api/elevenlabs/webhook/route.ts</code>).
      </p>

      <CodeBlock
        language="typescript"
        filename="app/api/stripe/webhook/route.ts"
        code={`const rawBody = await request.text();
const signature = request.headers.get('stripe-signature');
if (!signature) return new Response('Missing signature', { status: 400 });

let event: Stripe.Event;
try {
  event = stripe.webhooks.constructEvent(
    rawBody,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!,
  );
} catch {
  return new Response('Invalid signature', { status: 400 });
}`}
      />

      <Callout variant="warning" title="Always raw, never parsed">
        Calling <code>request.json()</code> before signature verification
        re-serializes the body and the resulting hash will not match. The
        Stripe webhook handler MUST read <code>request.text()</code> first.
      </Callout>

      {/* -------------------- Stripe ---------------------------------------*/}

      <AnchorHeading level={2} id="stripe">
        Stripe events
      </AnchorHeading>
      <EndpointHeader
        method="POST"
        path="/api/stripe/webhook"
        description="Accepts every Stripe event the dashboard is subscribed to. Forwards only the events Voxa orchestrates against."
      />

      <ParamTable
        params={[
          {
            name: 'checkout.session.completed',
            type: 'event',
            description: (
              <>
                Triggers <strong>n8n W1 (onboarding)</strong>. Voxa upserts the{' '}
                <code>subscriptions</code> row first, then invokes the workflow
                with <code>{`{ business_id, tier, stripe_customer_id, ... }`}</code>.
              </>
            ),
          },
          {
            name: 'customer.subscription.updated',
            type: 'event',
            description: 'Updated locally in the subscriptions table. Not forwarded.',
          },
          {
            name: 'customer.subscription.deleted',
            type: 'event',
            description: (
              <>
                Triggers <strong>n8n W4 (cleanup)</strong> — release the Twilio
                number, delete the EL agent, archive the row.
              </>
            ),
          },
          {
            name: 'invoice.payment_failed',
            type: 'event',
            description: (
              <>
                Triggers <strong>n8n W4 (cleanup)</strong> — pauses the agent
                and WhatsApps the owner.
              </>
            ),
          },
        ]}
      />

      {/* -------------------- ElevenLabs ----------------------------------*/}

      <AnchorHeading level={2} id="elevenlabs">
        ElevenLabs post-call
      </AnchorHeading>
      <EndpointHeader
        method="POST"
        path="/api/elevenlabs/webhook"
        description="Fires 5–15 seconds after the caller hangs up. Forwards to n8n W3 for billing + lead extraction."
      />

      <CodeBlock
        language="json"
        filename="post_call_transcription.json"
        code={`{
  "type": "post_call_transcription",
  "data": {
    "conversation_id": "conv_xyz",
    "agent_id": "agent_xyz",
    "started_at": "2026-05-20T08:14:02Z",
    "ended_at":   "2026-05-20T08:18:47Z",
    "transcript": [
      { "role": "agent", "text": "Namaste, Sharma Dental..." },
      { "role": "user",  "text": "Mujhe kal subah appointment chahiye." }
    ],
    "audio_url": "https://elevenlabs.io/...",
    "language": "hi",
    "caller_id": "+919876543210",
    "summary": "Hindi caller booked an appointment for tomorrow morning."
  }
}`}
      />

      <Callout variant="tip" title="Why forward to n8n?">
        The Next.js handler does the bare minimum (verify → persist → enqueue)
        and returns 200 to ElevenLabs in &lt;200ms. n8n W3 then does the slow
        work — Claude extraction (~1.5s), Stripe Meter Event POST, multi-row
        Supabase write, conditional WhatsApp alert. If n8n is briefly down,
        the audit row persists and the workflow can be re-fired by hand.
      </Callout>
    </article>
  );
}
