import {
  AnchorHeading,
  Callout,
  CodeBlock,
  CodeTabs,
  EndpointHeader,
  ParamTable,
} from '@/components/docs/docs-primitives';

export const metadata = {
  title: 'API reference — Voxa',
  description: 'Endpoint-by-endpoint reference for the Voxa HTTP API.',
};

export default function DocsApiPage() {
  return (
    <article className="mx-auto max-w-3xl">
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-primary">
        Reference
      </p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">API reference</h1>
      <p className="mt-4 text-base leading-relaxed text-foreground/70">
        The Voxa HTTP API powers the dashboard, the onboarding wizard, and the
        n8n orchestration backbone. All endpoints accept and return JSON unless
        otherwise noted.
      </p>

      {/* -------------------- Core ----------------------------------------- */}

      <AnchorHeading level={2} id="authentication">
        Authentication
      </AnchorHeading>
      <p className="text-[15px] leading-relaxed text-foreground/75">
        Auth was removed from this build — every request is treated as the same
        demo user (<code>demo-user</code> / <code>demo@voxa.local</code>). To
        wire Clerk back in, restore <code>middleware.ts</code> to use
        <code>clerkMiddleware</code> and replace <code>lib/auth.ts</code>&apos;s
        stub with the real <code>@clerk/nextjs/server</code> imports.
      </p>
      <p className="text-[15px] leading-relaxed text-foreground/75">
        Internal endpoints called by n8n (<code>/api/agent/create</code>,
        the webhook handlers) verify a shared secret via{' '}
        <code>X-Voxa-Internal-Secret</code>, read from{' '}
        <code>VOXA_INTERNAL_SECRET</code>.
      </p>

      <AnchorHeading level={2} id="errors">
        Errors
      </AnchorHeading>
      <p className="text-[15px] leading-relaxed text-foreground/75">
        Voxa uses standard HTTP status codes. Successful responses are{' '}
        <code>2xx</code>; client errors are <code>4xx</code>; server errors
        are <code>5xx</code>. Error bodies always have an{' '}
        <code>error</code> string and may include a{' '}
        <code>issues</code> field with Zod validation details.
      </p>
      <CodeBlock
        language="json"
        filename="error.json"
        code={`{
  "error": "Invalid request body",
  "issues": {
    "fieldErrors": {
      "tier": ["Invalid enum value. Expected 'starter' | 'growth' | 'scale'"]
    }
  }
}`}
      />

      <AnchorHeading level={2} id="rate-limits">
        Rate limits
      </AnchorHeading>
      <p className="text-[15px] leading-relaxed text-foreground/75">
        No application-level rate limits are enforced. Upstream providers do
        rate-limit independently — most notably the Twilio WhatsApp Sandbox
        (50&nbsp;msg/day) and the ElevenLabs Conv AI tool timeout (~5s per
        webhook).
      </p>

      <AnchorHeading level={2} id="idempotency">
        Idempotency
      </AnchorHeading>
      <p className="text-[15px] leading-relaxed text-foreground/75">
        Stripe webhook deliveries are deduplicated by{' '}
        <code>event.id</code> in the <code>stripe_webhook_events</code> table.
        Stripe Meter Events use a derived <code>identifier</code>{' '}
        (<code>{`{conversation_id}_meter`}</code>) so retried meter writes never
        double-bill.
      </p>

      {/* -------------------- Health -------------------------------------- */}

      <AnchorHeading level={2} id="health">
        Health
      </AnchorHeading>
      <EndpointHeader
        method="GET"
        path="/api/health"
        description="Liveness check. Returns a JSON envelope with the current server time."
      />
      <CodeTabs
        tabs={[
          {
            label: 'curl',
            language: 'bash',
            code: `curl http://localhost:4321/api/health`,
          },
          {
            label: 'Response',
            language: 'json',
            code: `{
  "ok": true,
  "service": "voxa",
  "time": "2026-05-20T11:23:42.512Z"
}`,
          },
        ]}
      />

      {/* -------------------- Voice clone --------------------------------- */}

      <AnchorHeading level={2} id="voice-clone">
        Voice clone
      </AnchorHeading>
      <EndpointHeader
        method="POST"
        path="/api/voice/clone"
        description="Upload a 60-second audio sample. Voxa creates an ElevenLabs Instant Voice Clone and attaches the resulting voice_id to the caller's primary agent."
      />

      <h3 className="mt-6 text-sm font-semibold uppercase tracking-[0.12em] text-foreground/55">
        Body (multipart/form-data)
      </h3>
      <ParamTable
        params={[
          {
            name: 'audio',
            type: 'File',
            required: true,
            description: (
              <>
                Audio blob. Max <code>10&nbsp;MB</code>. WebM, MP3, WAV, M4A are all
                accepted. Voxa converts everything to 22050&nbsp;Hz mono before
                upload.
              </>
            ),
          },
        ]}
      />

      <h3 className="mt-6 text-sm font-semibold uppercase tracking-[0.12em] text-foreground/55">
        Response
      </h3>
      <ParamTable
        params={[
          {
            name: 'voiceId',
            type: 'string',
            required: true,
            description: 'ElevenLabs voice ID. Stored on the agents row.',
          },
          {
            name: 'name',
            type: 'string',
            required: true,
            description: 'Display name, derived from the demo user ID.',
          },
        ]}
      />

      <CodeTabs
        tabs={[
          {
            label: 'curl',
            language: 'bash',
            code: `curl -X POST http://localhost:4321/api/voice/clone \\
  -F "audio=@./sample-60s.webm"`,
          },
          {
            label: 'Node',
            language: 'typescript',
            code: `const blob = await fetch('/sample-60s.webm').then((r) => r.blob());
const form = new FormData();
form.append('audio', blob, 'sample-60s.webm');

const res = await fetch('/api/voice/clone', { method: 'POST', body: form });
const { voiceId, name } = await res.json();`,
          },
        ]}
      />

      {/* -------------------- Knowledge ingest ---------------------------- */}

      <AnchorHeading level={2} id="knowledge-ingest">
        Knowledge ingest
      </AnchorHeading>
      <EndpointHeader
        method="POST"
        path="/api/knowledge/ingest"
        description="Ingest a public URL into the agent's knowledge base. The agent's get_business_info tool can answer questions about the page from that point on."
      />
      <ParamTable
        params={[
          {
            name: 'url',
            type: 'string',
            required: true,
            description: 'Public HTTPS URL. JS-rendered pages may need an extra crawl pass before the content is queryable (handled by EL).',
          },
        ]}
      />

      {/* -------------------- Agent create -------------------------------- */}

      <AnchorHeading level={2} id="agent-create">
        Agent create
      </AnchorHeading>
      <EndpointHeader
        method="POST"
        path="/api/agent/create"
        description="Internal endpoint called by n8n W1 during onboarding. Creates the ElevenLabs Conv AI agent with the canonical multilingual system prompt + the 6 webhook tools."
      />
      <Callout variant="warning" title="Internal — requires shared secret">
        Caller must send <code>X-Voxa-Internal-Secret: $VOXA_INTERNAL_SECRET</code>.
        The dashboard never calls this directly; n8n W1 owns it.
      </Callout>
      <ParamTable
        params={[
          {
            name: 'business_id',
            type: 'uuid',
            required: true,
            description: 'Foreign key into businesses. The agent inherits the business name, language, and voiceId.',
          },
        ]}
      />

      {/* -------------------- Onboarding status --------------------------- */}

      <AnchorHeading level={2} id="onboarding-status">
        Onboarding status
      </AnchorHeading>
      <EndpointHeader
        method="GET"
        path="/api/onboarding/status"
        description="Used by the provisioning step of the wizard to poll progress. Returns 0–6 inclusive."
      />
      <ParamTable
        params={[
          {
            name: 'completedSteps',
            type: 'number (0–6)',
            required: true,
            description: 'Derived from the agents row state: voice cloned, agent created, number purchased, number imported, status=active.',
          },
          {
            name: 'status',
            type: "'provisioning' | 'active' | 'failed'",
            required: true,
            description: 'Mirror of agents.status.',
          },
          {
            name: 'phoneNumber',
            type: 'string | null',
            description: 'E.164 number assigned to the agent, once active.',
          },
        ]}
      />

      {/* -------------------- Stripe checkout ----------------------------- */}

      <AnchorHeading level={2} id="stripe-checkout">
        Stripe checkout
      </AnchorHeading>
      <EndpointHeader
        method="POST"
        path="/api/stripe/checkout"
        description="Create a Stripe Checkout session with both the flat licensed price and the metered price for the chosen tier."
      />
      <ParamTable
        params={[
          {
            name: 'tier',
            type: "'starter' | 'growth' | 'scale'",
            required: true,
            description: 'Which Voxa plan to subscribe to.',
          },
        ]}
      />

      <CodeTabs
        tabs={[
          {
            label: 'curl',
            language: 'bash',
            code: `curl -X POST http://localhost:4321/api/stripe/checkout \\
  -H 'Content-Type: application/json' \\
  -d '{"tier": "growth"}'`,
          },
          {
            label: 'Response',
            language: 'json',
            code: `{
  "url": "https://checkout.stripe.com/c/pay/cs_test_xxx..."
}`,
          },
        ]}
      />

      {/* -------------------- Stripe portal ------------------------------- */}

      <AnchorHeading level={2} id="stripe-portal">
        Stripe portal
      </AnchorHeading>
      <EndpointHeader
        method="POST"
        path="/api/stripe/portal"
        description="Returns a one-time URL into the Stripe Customer Portal so the owner can update payment method, view invoices, or cancel."
      />
      <Callout variant="info" title="No body">
        The portal endpoint reads the subscription row attached to the
        current business. If no subscription exists, it returns{' '}
        <code>404</code>.
      </Callout>

      <AnchorHeading level={2} id="onboarding-business">
        Onboarding business
      </AnchorHeading>
      <EndpointHeader
        method="POST"
        path="/api/onboarding/business"
        description="Persist the form values from step 2 of the onboarding wizard."
      />

      <AnchorHeading level={2} id="onboarding-scrape">
        Onboarding scrape
      </AnchorHeading>
      <EndpointHeader
        method="POST"
        path="/api/onboarding/scrape"
        description="Convenience wrapper for the website-URL step that forwards into /api/knowledge/ingest."
      />
    </article>
  );
}
