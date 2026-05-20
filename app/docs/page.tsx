import { ArrowRight, BookOpen, Mic, Phone, Sparkles, Webhook, Workflow } from 'lucide-react';
import Link from 'next/link';

import {
  AnchorHeading,
  Callout,
  CodeTabs,
} from '@/components/docs/docs-primitives';

export const metadata = {
  title: 'Overview — Voxa API docs',
  description: 'Build with the Voxa AI receptionist API. Voice cloning, multilingual calls, Stripe metered billing, and n8n orchestration.',
};

export default function DocsOverviewPage() {
  return (
    <article className="mx-auto max-w-3xl">
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-primary">
        Get started
      </p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">
        Voxa API
      </h1>
      <p className="mt-4 text-base leading-relaxed text-foreground/70">
        Voxa is an AI receptionist for Indian SMBs. It answers inbound phone calls
        in Hindi, Tamil, Telugu, or English in a cloned voice, books appointments
        through Cal.com, sends WhatsApp confirmations, and bills per minute via
        Stripe Meter Events. This reference covers the HTTP API, webhooks, n8n
        orchestration workflows, and the data model.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Link
          href="/docs/architecture"
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          See the architecture
          <ArrowRight aria-hidden className="size-3.5" />
        </Link>
        <Link
          href="/docs/api"
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-black/[0.08] bg-white px-4 text-sm font-medium text-foreground hover:bg-foreground/[0.04] dark:border-white/10 dark:bg-white/[0.03]"
        >
          API reference
        </Link>
      </div>

      {/* Feature grid */}
      <AnchorHeading level={2} id="capabilities">
        Capabilities
      </AnchorHeading>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {[
          {
            Icon: Mic,
            title: 'Voice cloning',
            desc: 'Upload a 60-second audio sample to clone the owner’s voice. Every subsequent call uses it.',
            href: '/docs/api#voice-clone',
          },
          {
            Icon: Phone,
            title: 'Native Twilio import',
            desc: 'Indian or US numbers purchased on Twilio are imported into ElevenLabs in one POST — no TwiML.',
            href: '/docs/architecture',
          },
          {
            Icon: BookOpen,
            title: 'Knowledge base',
            desc: 'POST a public URL; Voxa ingests the page so the agent answers questions about hours, menu, services.',
            href: '/docs/api#knowledge-ingest',
          },
          {
            Icon: Webhook,
            title: 'Webhooks',
            desc: 'Stripe Checkout + EL post-call deliveries are verified and fanned out to n8n for orchestration.',
            href: '/docs/webhooks',
          },
          {
            Icon: Workflow,
            title: 'n8n workflows',
            desc: '5 production workflows handle onboarding, live tool calls, post-call billing, and the daily WhatsApp digest.',
            href: '/docs/architecture#workflows',
          },
          {
            Icon: Sparkles,
            title: 'Per-minute billing',
            desc: 'Stripe Meter Events 2025-03-31 API. 3 tiers × 2 prices each, with overage billed per whole minute.',
            href: '/docs/api#stripe-checkout',
          },
        ].map(({ Icon, title, desc, href }) => (
          <Link
            key={title}
            href={href}
            className="group flex flex-col gap-2 rounded-xl border border-black/[0.06] bg-white p-4 transition-colors hover:border-primary/30 hover:bg-primary/[0.02] dark:border-white/10 dark:bg-white/[0.02]"
          >
            <span className="inline-flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon aria-hidden className="size-4" />
            </span>
            <p className="font-semibold text-foreground">{title}</p>
            <p className="text-[13px] leading-relaxed text-foreground/65">{desc}</p>
          </Link>
        ))}
      </div>

      {/* Quickstart */}
      <AnchorHeading level={2} id="quickstart">
        Quickstart
      </AnchorHeading>
      <p className="text-[15px] leading-relaxed text-foreground/75">
        The fastest path to a working receptionist: subscribe via Stripe Checkout,
        run through the 6-step onboarding wizard, then call the provisioned number.
        Every API call below is authenticated by the demo user — replace with your
        own auth when you bolt Clerk back in.
      </p>

      <CodeTabs
        tabs={[
          {
            label: 'curl',
            language: 'bash',
            code: `# 1. Health check
curl http://localhost:4321/api/health

# 2. Create a Checkout session
curl -X POST http://localhost:4321/api/stripe/checkout \\
  -H 'Content-Type: application/json' \\
  -d '{"tier": "growth"}'`,
          },
          {
            label: 'Node',
            language: 'typescript',
            code: `// 1. Health check
const health = await fetch('http://localhost:4321/api/health').then((r) => r.json());

// 2. Create a Checkout session
const res = await fetch('http://localhost:4321/api/stripe/checkout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ tier: 'growth' }),
});
const { url } = await res.json();
// → redirect the user to \`url\`
`,
          },
          {
            label: 'Python',
            language: 'python',
            code: `import requests

# 1. Health check
health = requests.get("http://localhost:4321/api/health").json()

# 2. Create a Checkout session
res = requests.post(
    "http://localhost:4321/api/stripe/checkout",
    json={"tier": "growth"},
).json()
print(res["url"])  # redirect the user here
`,
          },
        ]}
      />

      <Callout variant="tip" title="Demo mode">
        Auth was removed from this build. Every request is the same demo user.
        For production, drop Clerk back in via <code>middleware.ts</code> and
        toggle the <code>lib/auth.ts</code> shim back to real <code>auth()</code> calls.
      </Callout>

      <AnchorHeading level={2} id="base-url">
        Base URL
      </AnchorHeading>
      <p className="text-[15px] leading-relaxed text-foreground/75">
        Local dev: <code>http://localhost:4321</code>. The production base URL is
        set per-environment via <code>NEXT_PUBLIC_APP_URL</code>. All API routes
        return JSON unless otherwise noted.
      </p>

      <AnchorHeading level={2} id="versioning">
        Versioning
      </AnchorHeading>
      <p className="text-[15px] leading-relaxed text-foreground/75">
        The Voxa API is unversioned during the hackathon; endpoints may change
        without notice. The Stripe SDK is pinned to API version{' '}
        <code>2025-03-31.basil</code> (Meter Events). The ElevenLabs SDK is{' '}
        <code>@elevenlabs/elevenlabs-js@2.48</code>.
      </p>

      <Callout variant="info" title="Next">
        Continue to{' '}
        <Link href="/docs/architecture" className="underline-offset-2 hover:underline">
          architecture
        </Link>{' '}
        for the interactive system diagram, or{' '}
        <Link href="/docs/api" className="underline-offset-2 hover:underline">
          API reference
        </Link>{' '}
        for endpoint-by-endpoint specs.
      </Callout>
    </article>
  );
}
