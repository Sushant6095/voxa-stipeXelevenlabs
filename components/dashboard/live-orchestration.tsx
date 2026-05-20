'use client';

import {
  Background,
  BackgroundVariant,
  MarkerType,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Calendar,
  CreditCard,
  Database,
  MessageCircle,
  Mic,
  Phone,
  Workflow,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { useKeyboardShortcut } from '@/hooks/use-keyboard-shortcut';
import type {
  OrchestrationEdgeId,
  OrchestrationEvent,
  OrchestrationNodeId,
} from '@/lib/dashboard-data';

import {
  ServiceNode,
  type ServiceNodeData,
  type ServiceNodeType,
} from './service-node';

const nodeTypes = { service: ServiceNode };

const NODE_DEFINITIONS: Array<{
  id: OrchestrationNodeId;
  position: { x: number; y: number };
  data: ServiceNodeData;
}> = [
  {
    id: 'caller',
    position: { x: 0, y: 220 },
    data: {
      label: 'Caller',
      sublabel: '+91 customer',
      Icon: Phone,
      color: 'caller',
      isActive: false,
    },
  },
  {
    id: 'twilio',
    position: { x: 200, y: 220 },
    data: {
      label: 'Twilio',
      sublabel: 'Number',
      Icon: Phone,
      color: 'twilio',
      isActive: false,
    },
  },
  {
    id: 'agent',
    position: { x: 400, y: 220 },
    data: {
      label: 'ElevenLabs',
      sublabel: 'Voice agent',
      Icon: Mic,
      color: 'elevenlabs',
      isActive: false,
    },
  },
  {
    id: 'n8n',
    position: { x: 620, y: 220 },
    data: {
      label: 'n8n',
      sublabel: 'Tool router',
      Icon: Workflow,
      color: 'n8n',
      isActive: false,
    },
  },
  {
    id: 'calcom',
    position: { x: 860, y: 40 },
    data: {
      label: 'Cal.com',
      sublabel: 'Bookings',
      Icon: Calendar,
      color: 'calcom',
      isActive: false,
    },
  },
  {
    id: 'whatsapp',
    position: { x: 860, y: 140 },
    data: {
      label: 'WhatsApp',
      sublabel: 'Confirmations',
      Icon: MessageCircle,
      color: 'whatsapp',
      isActive: false,
    },
  },
  {
    id: 'supabase',
    position: { x: 860, y: 240 },
    data: {
      label: 'Supabase',
      sublabel: 'Database',
      Icon: Database,
      color: 'supabase',
      isActive: false,
    },
  },
  {
    id: 'stripe',
    position: { x: 860, y: 340 },
    data: {
      label: 'Stripe',
      sublabel: 'Meter event',
      Icon: CreditCard,
      color: 'stripe',
      isActive: false,
    },
  },
];

interface EdgeDef {
  id: OrchestrationEdgeId;
  source: OrchestrationNodeId;
  target: OrchestrationNodeId;
  label?: string;
}

const EDGE_DEFINITIONS: EdgeDef[] = [
  { id: 'e-caller-twilio', source: 'caller', target: 'twilio', label: 'phone' },
  { id: 'e-twilio-agent', source: 'twilio', target: 'agent' },
  { id: 'e-agent-n8n', source: 'agent', target: 'n8n', label: 'tool call' },
  { id: 'e-n8n-calcom', source: 'n8n', target: 'calcom' },
  { id: 'e-n8n-whatsapp', source: 'n8n', target: 'whatsapp' },
  { id: 'e-n8n-supabase', source: 'n8n', target: 'supabase' },
  { id: 'e-agent-stripe', source: 'agent', target: 'stripe', label: 'meter' },
];

const EDGE_STYLE_IDLE = { stroke: '#94A3B8', strokeWidth: 1.5 };
const EDGE_STYLE_ACTIVE = { stroke: '#6366F1', strokeWidth: 2.5 };

const MARKER_IDLE = {
  type: MarkerType.ArrowClosed,
  color: '#94A3B8',
  width: 18,
  height: 18,
};
const MARKER_ACTIVE = {
  type: MarkerType.ArrowClosed,
  color: '#6366F1',
  width: 20,
  height: 20,
};

function buildInitialNodes(): ServiceNodeType[] {
  return NODE_DEFINITIONS.map((def) => ({
    id: def.id,
    type: 'service',
    position: def.position,
    data: def.data,
    draggable: false,
    selectable: false,
  }));
}

function buildInitialEdges(): Edge[] {
  return EDGE_DEFINITIONS.map((def) => ({
    id: def.id,
    source: def.source,
    target: def.target,
    type: 'smoothstep',
    animated: false,
    label: def.label,
    style: EDGE_STYLE_IDLE,
    markerEnd: MARKER_IDLE,
    labelStyle: { fill: '#64748B', fontSize: 11, fontWeight: 500 },
    labelBgStyle: { fill: 'transparent' },
  }));
}

interface LiveOrchestrationProps {
  /** Stream of events to animate. Sorted oldest → newest. */
  events?: OrchestrationEvent[];
}

/**
 * THE centerpiece. A React Flow canvas of Voxa's architecture. Edges
 * pulse + nodes glow when an event flows through. Driven by:
 *
 *  - `events` prop (Phase 7 frontend-engineer wires Supabase Realtime
 *    into this from a parent client component).
 *  - `Cmd+Shift+D` (or Ctrl+Shift+D) keyboard shortcut, which fires
 *    `simulateCallFlow()` — used during the demo video recording to
 *    guarantee the animation runs exactly when the host says "watch
 *    the dashboard."
 */
export default function LiveOrchestration({
  events,
}: LiveOrchestrationProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<ServiceNodeType>(
    buildInitialNodes(),
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(
    buildInitialEdges(),
  );

  // ----------------------------------------------------------------------
  // Activation primitives — operate on node id and edge id with a TTL.
  // ----------------------------------------------------------------------
  const nodeTimers = useRef(new Map<OrchestrationNodeId, ReturnType<typeof setTimeout>>());
  const edgeTimers = useRef(new Map<OrchestrationEdgeId, ReturnType<typeof setTimeout>>());

  const activateNode = useCallback(
    (id: OrchestrationNodeId, ttlMs = 2500) => {
      setNodes((ns) =>
        ns.map((n) =>
          n.id === id
            ? ({
                ...n,
                data: { ...n.data, isActive: true },
              } as ServiceNodeType)
            : n,
        ),
      );
      const prev = nodeTimers.current.get(id);
      if (prev) clearTimeout(prev);
      const t = setTimeout(() => {
        setNodes((ns) =>
          ns.map((n) =>
            n.id === id
              ? ({
                  ...n,
                  data: { ...n.data, isActive: false },
                } as ServiceNodeType)
              : n,
          ),
        );
        nodeTimers.current.delete(id);
      }, ttlMs);
      nodeTimers.current.set(id, t);
    },
    [setNodes],
  );

  const activateEdge = useCallback(
    (id: OrchestrationEdgeId, ttlMs = 3000) => {
      setEdges((es) =>
        es.map((e) =>
          e.id === id
            ? {
                ...e,
                animated: true,
                style: EDGE_STYLE_ACTIVE,
                markerEnd: MARKER_ACTIVE,
              }
            : e,
        ),
      );
      const prev = edgeTimers.current.get(id);
      if (prev) clearTimeout(prev);
      const t = setTimeout(() => {
        setEdges((es) =>
          es.map((e) =>
            e.id === id
              ? {
                  ...e,
                  animated: false,
                  style: EDGE_STYLE_IDLE,
                  markerEnd: MARKER_IDLE,
                }
              : e,
          ),
        );
        edgeTimers.current.delete(id);
      }, ttlMs);
      edgeTimers.current.set(id, t);
    },
    [setEdges],
  );

  // ----------------------------------------------------------------------
  // Simulate a full call flow for the demo. Hooked to Cmd+Shift+D.
  // ----------------------------------------------------------------------
  const sequenceTimers = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const simulateCallFlow = useCallback(() => {
    // Cancel any in-flight simulation
    sequenceTimers.current.forEach((t) => clearTimeout(t));
    sequenceTimers.current = [];

    type Step = {
      nodeId?: OrchestrationNodeId;
      edgeId?: OrchestrationEdgeId;
      delay: number;
    };
    const steps: Step[] = [
      { nodeId: 'caller', edgeId: 'e-caller-twilio', delay: 0 },
      { nodeId: 'twilio', edgeId: 'e-twilio-agent', delay: 600 },
      { nodeId: 'agent', delay: 1200 },
      { nodeId: 'n8n', edgeId: 'e-agent-n8n', delay: 2400 },
      { nodeId: 'calcom', edgeId: 'e-n8n-calcom', delay: 3000 },
      { nodeId: 'whatsapp', edgeId: 'e-n8n-whatsapp', delay: 3800 },
      { nodeId: 'supabase', edgeId: 'e-n8n-supabase', delay: 4400 },
      { nodeId: 'stripe', edgeId: 'e-agent-stripe', delay: 5800 },
    ];
    for (const step of steps) {
      const t = setTimeout(() => {
        if (step.nodeId) activateNode(step.nodeId);
        if (step.edgeId) activateEdge(step.edgeId);
      }, step.delay);
      sequenceTimers.current.push(t);
    }
  }, [activateNode, activateEdge]);

  // Cmd+Shift+D — the "for camera" demo trigger
  useKeyboardShortcut(
    useMemo(() => ({ key: 'd', meta: true, shift: true }), []),
    useCallback(
      (event: KeyboardEvent) => {
        event.preventDefault();
        simulateCallFlow();
      },
      [simulateCallFlow],
    ),
  );

  // Replay incoming events
  const lastSeenEventId = useRef<string | null>(null);
  useEffect(() => {
    if (!events || events.length === 0) return;
    const last = events[events.length - 1];
    if (!last || last.id === lastSeenEventId.current) return;
    lastSeenEventId.current = last.id;
    if (last.node_id) activateNode(last.node_id);
    if (last.edge_id) activateEdge(last.edge_id);
  }, [events, activateNode, activateEdge]);

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      nodeTimers.current.forEach((t) => clearTimeout(t));
      edgeTimers.current.forEach((t) => clearTimeout(t));
      sequenceTimers.current.forEach((t) => clearTimeout(t));
      nodeTimers.current.clear();
      edgeTimers.current.clear();
      sequenceTimers.current = [];
    };
  }, []);

  return (
    <div
      className={cn(
        'relative h-[460px] w-full overflow-hidden rounded-2xl border border-border/60',
        'bg-gradient-to-br from-slate-50/80 via-indigo-50/30 to-pink-50/20',
        'dark:from-slate-950/80 dark:via-indigo-950/30 dark:to-pink-950/10',
      )}
    >
      <ReactFlow<ServiceNodeType, Edge>
        nodes={nodes as unknown as ServiceNodeType[]}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        fitViewOptions={{ padding: 0.22 }}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        panOnScroll={false}
        panOnDrag
        minZoom={0.5}
        maxZoom={1.5}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={16}
          size={1}
          color="#CBD5E1"
          className="dark:!opacity-30"
        />
      </ReactFlow>
      {/* Subtle vignette overlay to make the diagram pop on light bgs */}
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-0 rounded-2xl',
          'bg-gradient-to-t from-background/40 via-transparent to-transparent',
        )}
      />
    </div>
  );
}
