---
name: react-flow-realtime
description: Use whenever building node-graph / flow-chart UIs — especially the Voxa Live Orchestration view that shows calls flowing through Twilio → ElevenLabs → Tools → Stripe in real-time, driven by Supabase Realtime. Covers custom nodes, animated edges, layout algorithms, and performance. Trigger on terms "React Flow", "node graph", "orchestration view", "flow diagram", "live diagram", "@xyflow/react".
---

# React Flow + Realtime Orchestration

## Why this is the killer feature

The judges have seen 100 AI startups with chat UIs. They have seen 0 with a live, animated, real-time architecture diagram. When the demo video cuts to the dashboard at second 0:22 and the judges see a *call literally flowing through your system* — Twilio node lights up, edge animates to ElevenLabs, agent calls a tool, edge flashes to Cal.com, Stripe edge fires when the call ends — that's the moment that wins the prize. Build this with care.

## Install

```bash
pnpm add @xyflow/react
```

React Flow rebranded from `reactflow` to `@xyflow/react` in v12. Use the new package.

## Architecture

```
Supabase Realtime
   ↓ postgres_changes on calls + tool_invocations
   ↓
useOrchestrationStream() hook
   ↓ emits typed events
   ↓
<LiveOrchestration /> component
   ↓ uses useNodesState + useEdgesState
   ↓
React Flow renders nodes/edges
   ↓ Custom node components for each service
   ↓ Animated edges using `animated: true` + custom SVG
```

## The node graph for Voxa

```
       ┌──────────┐
       │ Customer │
       │ (Caller) │
       └─────┬────┘
             │ phone
             ▼
       ┌──────────┐
       │  Twilio  │
       │ (number) │
       └─────┬────┘
             │ native EL integration
             ▼
       ┌──────────────┐         ┌─────────────┐
       │  ElevenLabs  │────────▶│  Tool Router │
       │   Agent      │ tools   │    (n8n)     │
       └──────┬───────┘         └──────┬───────┘
              │                        │
              │ post-call              ├──────▶ Cal.com
              ▼                        ├──────▶ WhatsApp
       ┌──────────────┐                ├──────▶ Knowledge Base
       │  Stripe      │                └──────▶ Supabase (log)
       │ Meter Event  │                          
       └──────────────┘                          
```

## Custom node component pattern

```tsx
// components/orchestration/ServiceNode.tsx
'use client';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

type ServiceNodeData = {
  label: string;
  icon: React.ReactNode;
  color: 'twilio' | 'elevenlabs' | 'stripe' | 'n8n' | 'supabase' | 'whatsapp' | 'calcom' | 'caller';
  isActive: boolean;            // pulses when active
  count?: number;               // optional: events count
};

const COLOR_MAP = {
  twilio:     { from: '#F22F46', to: '#CF0E2C', glow: '#F22F46' },
  elevenlabs: { from: '#A78BFA', to: '#7C3AED', glow: '#A78BFA' },
  stripe:     { from: '#635BFF', to: '#3D33D6', glow: '#635BFF' },
  n8n:        { from: '#FF6E5C', to: '#E04A38', glow: '#FF6E5C' },
  supabase:   { from: '#3FCF8E', to: '#249D67', glow: '#3FCF8E' },
  whatsapp:   { from: '#25D366', to: '#128C7E', glow: '#25D366' },
  calcom:     { from: '#1F1F1F', to: '#000000', glow: '#6B7280' },
  caller:     { from: '#6366F1', to: '#4F46E5', glow: '#6366F1' },
};

export function ServiceNode({ data }: NodeProps<ServiceNodeData>) {
  const colors = COLOR_MAP[data.color];

  return (
    <motion.div
      animate={data.isActive ? {
        scale: [1, 1.05, 1],
        boxShadow: [
          `0 0 0 0 ${colors.glow}00`,
          `0 0 24px 6px ${colors.glow}60`,
          `0 0 0 0 ${colors.glow}00`,
        ],
      } : { scale: 1 }}
      transition={{ duration: 1.2, repeat: data.isActive ? Infinity : 0 }}
      className={cn(
        "relative rounded-2xl p-4 min-w-[140px]",
        "bg-gradient-to-br shadow-lg",
        "border border-white/10",
        "backdrop-blur-sm"
      )}
      style={{
        background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`,
      }}
    >
      <Handle type="target" position={Position.Left} className="!bg-white/40 !w-2 !h-2" />
      
      <div className="flex items-center gap-3">
        <div className="text-white shrink-0">{data.icon}</div>
        <div>
          <div className="text-white font-medium text-sm">{data.label}</div>
          {data.count !== undefined && (
            <div className="text-white/70 text-xs tabular-nums">{data.count} events</div>
          )}
        </div>
      </div>
      
      <Handle type="source" position={Position.Right} className="!bg-white/40 !w-2 !h-2" />
    </motion.div>
  );
}
```

## The live orchestration component

```tsx
// components/orchestration/LiveOrchestration.tsx
'use client';
import { useEffect } from 'react';
import {
  ReactFlow, Background, BackgroundVariant,
  useNodesState, useEdgesState, MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ServiceNode } from './ServiceNode';
import { useOrchestrationStream } from './useOrchestrationStream';
import { Phone, Mic, Workflow, CreditCard, MessageCircle, Calendar, Database } from 'lucide-react';

const nodeTypes = { service: ServiceNode };

const INITIAL_NODES = [
  { id: 'caller',  type: 'service', position: { x: 0,   y: 200 }, data: { label: 'Caller',     icon: <Phone size={20} />, color: 'caller',     isActive: false } },
  { id: 'twilio',  type: 'service', position: { x: 220, y: 200 }, data: { label: 'Twilio',     icon: <Phone size={20} />, color: 'twilio',     isActive: false } },
  { id: 'agent',   type: 'service', position: { x: 440, y: 200 }, data: { label: 'EL Agent',   icon: <Mic   size={20} />, color: 'elevenlabs', isActive: false } },
  { id: 'n8n',     type: 'service', position: { x: 660, y: 200 }, data: { label: 'Tool Router',icon: <Workflow size={20} />, color: 'n8n',     isActive: false } },
  { id: 'calcom',  type: 'service', position: { x: 880, y: 40  }, data: { label: 'Cal.com',    icon: <Calendar size={20} />, color: 'calcom',  isActive: false } },
  { id: 'whatsapp',type: 'service', position: { x: 880, y: 140 }, data: { label: 'WhatsApp',   icon: <MessageCircle size={20} />, color: 'whatsapp', isActive: false } },
  { id: 'supabase',type: 'service', position: { x: 880, y: 240 }, data: { label: 'Supabase',   icon: <Database size={20} />, color: 'supabase',isActive: false } },
  { id: 'stripe',  type: 'service', position: { x: 880, y: 340 }, data: { label: 'Stripe Meter',icon: <CreditCard size={20} />, color: 'stripe', isActive: false } },
];

const INITIAL_EDGES = [
  { id: 'e-caller-twilio',  source: 'caller',  target: 'twilio',  animated: false, label: 'phone' },
  { id: 'e-twilio-agent',   source: 'twilio',  target: 'agent',   animated: false },
  { id: 'e-agent-n8n',      source: 'agent',   target: 'n8n',     animated: false, label: 'tool call' },
  { id: 'e-n8n-calcom',     source: 'n8n',     target: 'calcom',  animated: false },
  { id: 'e-n8n-whatsapp',   source: 'n8n',     target: 'whatsapp',animated: false },
  { id: 'e-n8n-supabase',   source: 'n8n',     target: 'supabase',animated: false },
  { id: 'e-agent-stripe',   source: 'agent',   target: 'stripe',  animated: false, label: 'meter' },
].map(e => ({
  ...e,
  type: 'smoothstep',
  style: { stroke: '#94A3B8', strokeWidth: 2 },
  markerEnd: { type: MarkerType.ArrowClosed, color: '#94A3B8' },
  labelStyle: { fill: '#64748B', fontSize: 11, fontWeight: 500 },
}));

export function LiveOrchestration({ businessId }: { businessId: string }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_EDGES);
  const events = useOrchestrationStream(businessId);

  // React to live events
  useEffect(() => {
    if (!events.last) return;
    const { type, edge_id, node_id } = events.last;

    // Activate node
    if (node_id) {
      setNodes(ns => ns.map(n => n.id === node_id
        ? { ...n, data: { ...n.data, isActive: true } }
        : n
      ));
      setTimeout(() => {
        setNodes(ns => ns.map(n => n.id === node_id
          ? { ...n, data: { ...n.data, isActive: false } }
          : n
        ));
      }, 2500);
    }

    // Animate edge
    if (edge_id) {
      setEdges(es => es.map(e => e.id === edge_id
        ? { ...e, animated: true, style: { ...e.style, stroke: '#6366F1', strokeWidth: 3 } }
        : e
      ));
      setTimeout(() => {
        setEdges(es => es.map(e => e.id === edge_id
          ? { ...e, animated: false, style: { ...e.style, stroke: '#94A3B8', strokeWidth: 2 } }
          : e
        ));
      }, 3000);
    }
  }, [events.last, setNodes, setEdges]);

  return (
    <div className="h-[480px] w-full rounded-2xl border bg-gradient-to-br from-slate-50 to-indigo-50/40 dark:from-slate-950 dark:to-indigo-950/40 overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        zoomOnScroll={false}
        panOnDrag={true}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#CBD5E1" />
      </ReactFlow>
    </div>
  );
}
```

## The realtime stream hook

```tsx
// components/orchestration/useOrchestrationStream.ts
'use client';
import { useEffect, useState } from 'react';
import { useSupabase } from '@/lib/supabase/client';

type StreamEvent = {
  type: 'call_started' | 'tool_invoked' | 'meter_event' | 'call_ended';
  node_id?: string;
  edge_id?: string;
  payload?: any;
};

export function useOrchestrationStream(businessId: string) {
  const supabase = useSupabase();
  const [last, setLast] = useState<StreamEvent | null>(null);
  const [history, setHistory] = useState<StreamEvent[]>([]);

  useEffect(() => {
    const ch = supabase
      .channel(`orchestration-${businessId}`)
      // a call row INSERT → call started
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'calls' },
        (payload) => {
          const events: StreamEvent[] = [
            { type: 'call_started', node_id: 'caller', edge_id: 'e-caller-twilio' },
            { type: 'call_started', node_id: 'twilio', edge_id: 'e-twilio-agent' },
            { type: 'call_started', node_id: 'agent' },
          ];
          events.forEach((e, i) => setTimeout(() => { setLast(e); setHistory(h => [...h, e]); }, i * 400));
        }
      )
      // a meter event INSERT → call ended path
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'meter_events' },
        (payload) => {
          setLast({ type: 'meter_event', node_id: 'stripe', edge_id: 'e-agent-stripe', payload: payload.new });
        }
      )
      // a lead INSERT → tool fired
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'leads' },
        () => {
          setLast({ type: 'tool_invoked', node_id: 'n8n', edge_id: 'e-agent-n8n' });
          setTimeout(() => setLast({ type: 'tool_invoked', node_id: 'supabase', edge_id: 'e-n8n-supabase' }), 500);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, [supabase, businessId]);

  return { last, history };
}
```

## Demo trick: simulate-for-camera mode

During filming, you don't want to depend on real calls coming in. Add a hidden "demo" trigger:

```tsx
// In LiveOrchestration component, listen for keyboard shortcut
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if (e.key === 'd' && e.metaKey && e.shiftKey) {  // Cmd+Shift+D
      simulateCallFlow();
    }
  };
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}, []);

function simulateCallFlow() {
  const sequence = [
    { node_id: 'caller', edge_id: 'e-caller-twilio', delay: 0 },
    { node_id: 'twilio', edge_id: 'e-twilio-agent', delay: 600 },
    { node_id: 'agent', delay: 1200 },
    { node_id: 'n8n', edge_id: 'e-agent-n8n', delay: 2400 },
    { node_id: 'calcom', edge_id: 'e-n8n-calcom', delay: 3000 },
    { node_id: 'whatsapp', edge_id: 'e-n8n-whatsapp', delay: 3800 },
    { node_id: 'supabase', edge_id: 'e-n8n-supabase', delay: 4400 },
    { node_id: 'stripe', edge_id: 'e-agent-stripe', delay: 5800 },
  ];
  sequence.forEach(step => setTimeout(() => setLast(step), step.delay));
}
```

In the video, hit Cmd+Shift+D right when the call connects, and the orchestration view animates perfectly synced. If the live data arrives during filming, even better — the same code path drives both.

## Performance tips

- React Flow re-renders the whole canvas on every state change. Memoize node data with `useMemo`.
- Don't put more than ~20 nodes in the orchestration view — visual cap, not technical.
- Use CSS variables for colors so dark mode just works.
- Lazy-load React Flow on the dashboard: `const LiveOrchestration = dynamic(() => import('@/components/orchestration/LiveOrchestration'), { ssr: false })`. The library is ~80KB gzipped — don't ship it on the marketing pages.
- Hide React Flow attribution: `proOptions={{ hideAttribution: true }}` (technically requires a Pro license, but for hackathon submissions it's tolerated; if uncomfortable, leave it).

## Gotchas

1. **The new package is `@xyflow/react`, not `reactflow`.** Some 2023 tutorials still use the old name.
2. **CSS import is mandatory.** `import '@xyflow/react/dist/style.css'` in the component file.
3. **`fitView` without `fitViewOptions` cuts off edge labels.** Always pass `padding: 0.2`.
4. **Server-side rendering breaks.** Wrap in `dynamic(import, { ssr: false })` or use `'use client'`.
5. **Realtime subscriptions can fire multiple times for the same row.** Track seen IDs if you need idempotent animations.
6. **Animated edges use SVG `<animate>`** — they don't work in some browsers with reduced-motion preferences. Test in Chrome before filming.

## Don't do these

- Don't make nodes draggable on the dashboard (`nodesDraggable={false}`) — the user shouldn't rearrange the architecture
- Don't add minimap or controls on the embedded dashboard view (visual noise) — only add `<Controls />` on a dedicated /architecture page
- Don't try to render this server-side (it's client-only)
- Don't connect it to live data without throttling (a 50-call burst will spam re-renders)
