import type { Edge, Node } from '@xyflow/react';

import {
  AnchorHeading,
  Callout,
} from '@/components/docs/docs-primitives';
import { FlowDiagram, type ServiceNodeData } from '@/components/docs/flow-diagram';

export const metadata = {
  title: 'Architecture — Voxa API docs',
  description: 'Voxa system architecture, n8n workflows, and live call flow visualised with React Flow.',
};

// ---------------------------------------------------------------------------
// Diagram 1 — system architecture
// ---------------------------------------------------------------------------

const systemNodes: Node<ServiceNodeData>[] = [
  {
    id: 'caller',
    position: { x: 0, y: 200 },
    data: {
      label: 'Caller',
      description: 'Mobile or landline',
      iconKey: 'phone-call',
      tone: 'neutral',
      hideTarget: true,
    },
  },
  {
    id: 'twilio',
    position: { x: 220, y: 200 },
    data: {
      label: 'Twilio',
      description: 'IN/US PSTN inbound',
      iconKey: 'server',
      tone: 'primary',
    },
  },
  {
    id: 'elevenlabs',
    position: { x: 440, y: 200 },
    data: {
      label: 'ElevenLabs',
      description: 'Conv AI · 4 languages',
      iconKey: 'mic',
      tone: 'accent',
    },
  },
  {
    id: 'n8n',
    position: { x: 660, y: 200 },
    data: {
      label: 'n8n',
      description: '5 production workflows',
      iconKey: 'workflow',
      tone: 'warning',
    },
  },
  {
    id: 'cal',
    position: { x: 880, y: 40 },
    data: {
      label: 'Cal.com',
      description: 'Slots + bookings',
      iconKey: 'calendar',
      tone: 'success',
      hideSource: true,
    },
  },
  {
    id: 'whatsapp',
    position: { x: 880, y: 140 },
    data: {
      label: 'WhatsApp',
      description: 'Confirmations + digest',
      iconKey: 'message-circle',
      tone: 'success',
      hideSource: true,
    },
  },
  {
    id: 'claude',
    position: { x: 880, y: 240 },
    data: {
      label: 'Claude',
      description: 'Lead extraction',
      iconKey: 'brain',
      tone: 'accent',
      hideSource: true,
    },
  },
  {
    id: 'stripe',
    position: { x: 880, y: 340 },
    data: {
      label: 'Stripe Meter',
      description: 'Per-minute billing',
      iconKey: 'banknote',
      tone: 'primary',
      hideSource: true,
    },
  },
  {
    id: 'supabase',
    position: { x: 220, y: 380 },
    data: {
      label: 'Supabase',
      description: 'Postgres + Realtime',
      iconKey: 'database',
      tone: 'success',
      hideSource: true,
    },
  },
  {
    id: 'dashboard',
    position: { x: 440, y: 380 },
    data: {
      label: 'Owner dashboard',
      description: 'Next.js + Realtime',
      iconKey: 'sparkles',
      tone: 'primary',
      hideSource: true,
    },
  },
];

const systemEdges: Edge[] = [
  { id: 'e1', source: 'caller', target: 'twilio' },
  { id: 'e2', source: 'twilio', target: 'elevenlabs' },
  { id: 'e3', source: 'elevenlabs', target: 'n8n' },
  { id: 'e4', source: 'n8n', target: 'cal' },
  { id: 'e5', source: 'n8n', target: 'whatsapp' },
  { id: 'e6', source: 'n8n', target: 'claude' },
  { id: 'e7', source: 'n8n', target: 'stripe' },
  { id: 'e8', source: 'n8n', target: 'supabase' },
  { id: 'e9', source: 'supabase', target: 'dashboard' },
];

// ---------------------------------------------------------------------------
// Diagram 2 — onboarding workflow (W1)
// ---------------------------------------------------------------------------

const onboardingNodes: Node<ServiceNodeData>[] = [
  {
    id: 'checkout',
    position: { x: 0, y: 160 },
    data: {
      label: 'Stripe checkout',
      description: 'checkout.session.completed',
      iconKey: 'receipt',
      tone: 'primary',
      hideTarget: true,
    },
  },
  {
    id: 'webhook',
    position: { x: 220, y: 160 },
    data: {
      label: '/api/stripe/webhook',
      description: 'Verifies signature → forwards',
      iconKey: 'server',
      tone: 'neutral',
    },
  },
  {
    id: 'w1',
    position: { x: 470, y: 160 },
    data: {
      label: 'n8n W1',
      description: 'Onboarding workflow',
      iconKey: 'workflow',
      tone: 'warning',
    },
  },
  {
    id: 'twilio-buy',
    position: { x: 720, y: 30 },
    data: {
      label: 'Twilio: buy number',
      description: 'IncomingPhoneNumbers.create',
      iconKey: 'phone-call',
      tone: 'primary',
      hideSource: true,
    },
  },
  {
    id: 'el-clone',
    position: { x: 720, y: 110 },
    data: {
      label: 'EL: clone voice',
      description: 'voices.ivc.create',
      iconKey: 'mic',
      tone: 'accent',
      hideSource: true,
    },
  },
  {
    id: 'el-agent',
    position: { x: 720, y: 190 },
    data: {
      label: 'EL: create agent',
      description: 'multilingual + 6 tools',
      iconKey: 'sparkles',
      tone: 'accent',
      hideSource: true,
    },
  },
  {
    id: 'el-import',
    position: { x: 720, y: 270 },
    data: {
      label: 'EL: import number',
      description: 'phone-numbers.create',
      iconKey: 'briefcase',
      tone: 'accent',
      hideSource: true,
    },
  },
  {
    id: 'wa-activate',
    position: { x: 720, y: 350 },
    data: {
      label: 'WhatsApp: activation',
      description: 'Owner receives go-live msg',
      iconKey: 'message-circle',
      tone: 'success',
      hideSource: true,
    },
  },
];

const onboardingEdges: Edge[] = [
  { id: 'a', source: 'checkout', target: 'webhook' },
  { id: 'b', source: 'webhook', target: 'w1' },
  { id: 'c', source: 'w1', target: 'twilio-buy' },
  { id: 'd', source: 'w1', target: 'el-clone' },
  { id: 'e', source: 'w1', target: 'el-agent' },
  { id: 'f', source: 'w1', target: 'el-import' },
  { id: 'g', source: 'w1', target: 'wa-activate' },
];

// ---------------------------------------------------------------------------
// Diagram 3 — live call + tool calls (W2)
// ---------------------------------------------------------------------------

const liveCallNodes: Node<ServiceNodeData>[] = [
  {
    id: 'caller',
    position: { x: 0, y: 220 },
    data: {
      label: 'Caller',
      iconKey: 'phone-call',
      tone: 'neutral',
      hideTarget: true,
    },
  },
  {
    id: 'twilio',
    position: { x: 200, y: 220 },
    data: {
      label: 'Twilio inbound',
      description: 'Native EL import',
      iconKey: 'server',
      tone: 'primary',
    },
  },
  {
    id: 'agent',
    position: { x: 420, y: 220 },
    data: {
      label: 'EL Agent',
      description: 'Detects language · talks',
      iconKey: 'mic',
      tone: 'accent',
    },
  },
  {
    id: 'w2',
    position: { x: 640, y: 220 },
    data: {
      label: 'n8n W2',
      description: 'Tool router · <2s p99',
      iconKey: 'workflow',
      tone: 'warning',
    },
  },
  {
    id: 'check',
    position: { x: 880, y: 30 },
    data: {
      label: 'check_availability',
      description: 'Cal.com getSlots',
      iconKey: 'calendar',
      tone: 'success',
      hideSource: true,
    },
  },
  {
    id: 'book',
    position: { x: 880, y: 110 },
    data: {
      label: 'book_appointment',
      description: 'Cal.com create + WA send',
      iconKey: 'calendar-check',
      tone: 'success',
      hideSource: true,
    },
  },
  {
    id: 'kb',
    position: { x: 880, y: 190 },
    data: {
      label: 'get_business_info',
      description: 'Supabase knowledge_base',
      iconKey: 'book-open',
      tone: 'primary',
      hideSource: true,
    },
  },
  {
    id: 'escalate',
    position: { x: 880, y: 270 },
    data: {
      label: 'escalate_to_owner',
      description: 'Call forward + WA alert',
      iconKey: 'bell',
      tone: 'warning',
      hideSource: true,
    },
  },
  {
    id: 'callback',
    position: { x: 880, y: 350 },
    data: {
      label: 'send_callback_link',
      description: 'WhatsApp deep link',
      iconKey: 'message-circle',
      tone: 'success',
      hideSource: true,
    },
  },
  {
    id: 'lead',
    position: { x: 880, y: 430 },
    data: {
      label: 'log_lead',
      description: 'Supabase upsert leads',
      iconKey: 'list-checks',
      tone: 'primary',
      hideSource: true,
    },
  },
];

const liveCallEdges: Edge[] = [
  { id: '1', source: 'caller', target: 'twilio' },
  { id: '2', source: 'twilio', target: 'agent' },
  { id: '3', source: 'agent', target: 'w2', label: '6 tools' },
  { id: '4', source: 'w2', target: 'check' },
  { id: '5', source: 'w2', target: 'book' },
  { id: '6', source: 'w2', target: 'kb' },
  { id: '7', source: 'w2', target: 'escalate' },
  { id: '8', source: 'w2', target: 'callback' },
  { id: '9', source: 'w2', target: 'lead' },
];

// ---------------------------------------------------------------------------
// Diagram 4 — post-call processing (W3)
// ---------------------------------------------------------------------------

const postCallNodes: Node<ServiceNodeData>[] = [
  {
    id: 'hangup',
    position: { x: 0, y: 160 },
    data: {
      label: 'Caller hangs up',
      iconKey: 'phone-off',
      tone: 'neutral',
      hideTarget: true,
    },
  },
  {
    id: 'el-webhook',
    position: { x: 220, y: 160 },
    data: {
      label: 'EL post-call hook',
      description: '~5–15s after hangup',
      iconKey: 'sparkles',
      tone: 'accent',
    },
  },
  {
    id: 'next-webhook',
    position: { x: 450, y: 160 },
    data: {
      label: '/api/elevenlabs/webhook',
      description: 'Verify + forward',
      iconKey: 'server',
      tone: 'neutral',
    },
  },
  {
    id: 'w3',
    position: { x: 700, y: 160 },
    data: {
      label: 'n8n W3',
      description: 'Post-call workflow',
      iconKey: 'workflow',
      tone: 'warning',
    },
  },
  {
    id: 'stripe-meter',
    position: { x: 940, y: 0 },
    data: {
      label: 'Stripe Meter',
      description: 'meterEvents.create — ceil minutes',
      iconKey: 'banknote',
      tone: 'primary',
      hideSource: true,
    },
  },
  {
    id: 'claude-extract',
    position: { x: 940, y: 90 },
    data: {
      label: 'Claude extract',
      description: 'lead score · sentiment',
      iconKey: 'brain',
      tone: 'accent',
      hideSource: true,
    },
  },
  {
    id: 'supabase-insert',
    position: { x: 940, y: 180 },
    data: {
      label: 'Supabase write',
      description: 'calls + leads upsert',
      iconKey: 'database',
      tone: 'success',
      hideSource: true,
    },
  },
  {
    id: 'realtime-push',
    position: { x: 940, y: 270 },
    data: {
      label: 'Realtime push',
      description: 'Dashboard updates live',
      iconKey: 'zap',
      tone: 'primary',
      hideSource: true,
    },
  },
  {
    id: 'hot-alert',
    position: { x: 940, y: 360 },
    data: {
      label: 'Hot-lead alert',
      description: 'score ≥ 7 → owner WhatsApp',
      iconKey: 'bell',
      tone: 'warning',
      hideSource: true,
    },
  },
];

const postCallEdges: Edge[] = [
  { id: '1', source: 'hangup', target: 'el-webhook' },
  { id: '2', source: 'el-webhook', target: 'next-webhook' },
  { id: '3', source: 'next-webhook', target: 'w3' },
  { id: '4', source: 'w3', target: 'stripe-meter' },
  { id: '5', source: 'w3', target: 'claude-extract' },
  { id: '6', source: 'w3', target: 'supabase-insert' },
  { id: '7', source: 'w3', target: 'realtime-push' },
  { id: '8', source: 'w3', target: 'hot-alert' },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DocsArchitecturePage() {
  return (
    <article className="mx-auto max-w-4xl">
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-primary">
        Core concepts
      </p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">Architecture</h1>
      <p className="mt-4 text-base leading-relaxed text-foreground/70">
        Voxa is a Next.js app paired with a Supabase Postgres, an n8n
        orchestration backbone on Railway, and four external service
        providers (Twilio, ElevenLabs, Stripe, Anthropic). The four flows
        below are the only paths a request takes through the system —
        anything not on these diagrams is helper code.
      </p>

      <Callout variant="info" title="Interactive">
        Each diagram is rendered with{' '}
        <a href="https://reactflow.dev/" target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline">
          React Flow
        </a>{' '}
        — pan and zoom are disabled for legibility, but the node positions and
        edge animations are live.
      </Callout>

      <AnchorHeading level={2} id="system">
        System overview
      </AnchorHeading>
      <p className="text-[15px] leading-relaxed text-foreground/75">
        The browser talks to Next.js. Next.js verifies webhooks and forwards
        payloads to n8n. n8n owns every external API call from there — Stripe
        Meter Events, Twilio calls + WhatsApp, ElevenLabs Conv AI, Cal.com,
        Anthropic Claude. Supabase Postgres + Realtime is the single source of
        truth that the dashboard subscribes to.
      </p>
      <FlowDiagram
        title="System overview"
        description="Inbound calls fan into the n8n backbone; outbound writes land in Supabase, where Realtime pushes them to the dashboard."
        nodes={systemNodes}
        edges={systemEdges}
        height={500}
      />

      <AnchorHeading level={2} id="workflow-1">
        Workflow 1 — Onboarding
      </AnchorHeading>
      <p className="text-[15px] leading-relaxed text-foreground/75">
        Triggered by{' '}
        <code>checkout.session.completed</code> on the Stripe webhook.
        Provisions the Twilio number, clones the owner&apos;s voice on
        ElevenLabs, creates an EL agent with the canonical 6-tool template,
        imports the Twilio number into EL, and WhatsApps the owner an
        activation message — all in one workflow.
      </p>
      <FlowDiagram
        title="W1 — Onboarding"
        description="From Checkout completion to a live, callable AI receptionist in five n8n steps."
        nodes={onboardingNodes}
        edges={onboardingEdges}
        height={460}
      />

      <AnchorHeading level={2} id="workflow-2">
        Workflow 2 — Live tool calls
      </AnchorHeading>
      <p className="text-[15px] leading-relaxed text-foreground/75">
        The EL agent calls one of six webhook tools during a live call. Each
        branch in W2 must respond in &lt;2&nbsp;seconds — the EL tool timeout
        is ~5&nbsp;seconds, and a slow branch means dead air on the call.
      </p>
      <FlowDiagram
        title="W2 — Live tool calls"
        description="Six branches share a single Webhook trigger and a Switch node keyed on the tool name. Each branch ends in a Respond-to-Webhook node."
        nodes={liveCallNodes}
        edges={liveCallEdges}
        height={520}
      />

      <AnchorHeading level={2} id="workflow-3">
        Workflow 3 — Post-call processing
      </AnchorHeading>
      <p className="text-[15px] leading-relaxed text-foreground/75">
        ElevenLabs fires a post-call webhook 5–15 seconds after the caller
        hangs up. W3 computes the billable minutes, sends a Stripe Meter
        Event, runs Claude over the transcript for structured lead
        extraction, upserts the call + lead in Supabase, and (if the lead
        scored ≥&nbsp;7 or the sentiment is angry) WhatsApps the owner an
        alert.
      </p>
      <FlowDiagram
        title="W3 — Post-call"
        description="Single workflow handles billing, AI summary, persistence, and hot-lead alerts in parallel branches."
        nodes={postCallNodes}
        edges={postCallEdges}
        height={500}
      />

      <AnchorHeading level={2} id="workflow-4">
        Workflows 4 & 5
      </AnchorHeading>
      <p className="text-[15px] leading-relaxed text-foreground/75">
        <strong>W4 — Stripe events</strong> handles{' '}
        <code>invoice.payment_failed</code> (pauses the agent + WhatsApps the
        owner) and <code>customer.subscription.deleted</code> (releases the
        Twilio number, deletes the EL agent, archives the row).{' '}
        <strong>W5 — Daily digest</strong> runs on a cron at 18:00 IST and
        WhatsApps each business owner a one-line summary of their day. Both
        are simpler than W1–W3 and are documented inline in their respective
        JSON files (<code>n8n/04-stripe-webhooks.json</code>,{' '}
        <code>n8n/05-daily-digest.json</code>).
      </p>

      <Callout variant="tip" title="Why n8n?">
        n8n earns its place because <em>every external API call sits in one
        place</em>. Adding a new tool means dragging a node in. Swapping
        Twilio for Plivo means editing one HTTP node. Without n8n, every
        Voxa feature would require shipping a code change to Vercel.
      </Callout>
    </article>
  );
}
