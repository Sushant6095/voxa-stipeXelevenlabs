'use client';

import '@xyflow/react/dist/style.css';

import {
  Background,
  BackgroundVariant,
  type Edge,
  Handle,
  type Node,
  type NodeProps,
  Position,
  ReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import {
  Banknote,
  Bell,
  BookOpen,
  Brain,
  Briefcase,
  Calendar,
  CalendarCheck,
  Database,
  ListChecks,
  type LucideIcon,
  MessageCircle,
  Mic,
  PhoneCall,
  PhoneOff,
  Receipt,
  Server,
  Sparkles,
  Workflow,
  Zap,
} from 'lucide-react';
import { useMemo } from 'react';

import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Custom node
// ---------------------------------------------------------------------------

export interface ServiceNodeData {
  label: string;
  description?: string;
  iconKey: IconKey;
  tone?: 'default' | 'primary' | 'accent' | 'success' | 'warning' | 'neutral';
  /** Optionally suppress the source/target handles for terminal nodes */
  hideSource?: boolean;
  hideTarget?: boolean;
  [key: string]: unknown;
}

export type IconKey =
  | 'phone-call'
  | 'phone-off'
  | 'mic'
  | 'sparkles'
  | 'workflow'
  | 'calendar'
  | 'calendar-check'
  | 'database'
  | 'banknote'
  | 'receipt'
  | 'brain'
  | 'message-circle'
  | 'book-open'
  | 'bell'
  | 'briefcase'
  | 'list-checks'
  | 'zap'
  | 'server';

const ICONS: Record<IconKey, LucideIcon> = {
  'phone-call': PhoneCall,
  'phone-off': PhoneOff,
  mic: Mic,
  sparkles: Sparkles,
  workflow: Workflow,
  calendar: Calendar,
  'calendar-check': CalendarCheck,
  database: Database,
  banknote: Banknote,
  receipt: Receipt,
  brain: Brain,
  'message-circle': MessageCircle,
  'book-open': BookOpen,
  bell: Bell,
  briefcase: Briefcase,
  'list-checks': ListChecks,
  zap: Zap,
  server: Server,
};

const TONE_CLASSES: Record<NonNullable<ServiceNodeData['tone']>, string> = {
  default:
    'border-black/10 bg-white text-foreground dark:border-white/15 dark:bg-white/[0.04]',
  primary:
    'border-primary/30 bg-primary/[0.06] text-foreground dark:bg-primary/[0.12]',
  accent:
    'border-fuchsia-500/30 bg-fuchsia-500/[0.06] text-foreground dark:bg-fuchsia-500/[0.12]',
  success:
    'border-emerald-500/30 bg-emerald-500/[0.06] text-foreground dark:bg-emerald-500/[0.12]',
  warning:
    'border-amber-500/30 bg-amber-500/[0.07] text-foreground dark:bg-amber-500/[0.12]',
  neutral:
    'border-slate-300/70 bg-slate-100 text-foreground dark:border-white/10 dark:bg-white/[0.04]',
};

const ICON_TONE: Record<NonNullable<ServiceNodeData['tone']>, string> = {
  default: 'bg-foreground/[0.08] text-foreground/70',
  primary: 'bg-primary/15 text-primary',
  accent: 'bg-fuchsia-500/15 text-fuchsia-500',
  success: 'bg-emerald-500/15 text-emerald-600',
  warning: 'bg-amber-500/15 text-amber-600',
  neutral: 'bg-slate-200 text-slate-700 dark:bg-white/[0.06] dark:text-white/70',
};

function ServiceNode({ data }: NodeProps<Node<ServiceNodeData>>) {
  const tone = data.tone ?? 'default';
  const Icon = ICONS[data.iconKey];
  return (
    <div
      className={cn(
        'min-w-[170px] rounded-xl border p-3 text-left shadow-sm transition-shadow',
        'backdrop-blur-md',
        TONE_CLASSES[tone],
      )}
    >
      {!data.hideTarget && (
        <Handle
          type="target"
          position={Position.Left}
          className="!size-1.5 !border-0 !bg-foreground/30"
        />
      )}
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'flex size-7 items-center justify-center rounded-lg',
            ICON_TONE[tone],
          )}
        >
          <Icon aria-hidden className="size-3.5" />
        </span>
        <span className="text-[13px] font-semibold leading-tight">
          {data.label}
        </span>
      </div>
      {data.description && (
        <p className="mt-1.5 text-[11px] leading-snug text-foreground/60">
          {data.description}
        </p>
      )}
      {!data.hideSource && (
        <Handle
          type="source"
          position={Position.Right}
          className="!size-1.5 !border-0 !bg-foreground/30"
        />
      )}
    </div>
  );
}

const nodeTypes = { service: ServiceNode } as const;

// ---------------------------------------------------------------------------
// FlowDiagram — the wrapper used by docs pages
// ---------------------------------------------------------------------------

interface FlowDiagramProps {
  title: string;
  description?: string;
  height?: number;
  nodes: Node<ServiceNodeData>[];
  edges: Edge[];
}

export function FlowDiagram({
  title,
  description,
  height = 460,
  nodes: nodesInput,
  edges: edgesInput,
}: FlowDiagramProps) {
  // Stamp the custom node type once so callers don't repeat it
  const nodes = useMemo<Node<ServiceNodeData>[]>(
    () => nodesInput.map((n) => ({ type: 'service', ...n })),
    [nodesInput],
  );
  const edges = useMemo<Edge[]>(
    () =>
      edgesInput.map((e) => ({
        animated: true,
        style: {
          stroke: 'url(#voxa-edge-grad)',
          strokeWidth: 2,
        },
        ...e,
      })),
    [edgesInput],
  );

  return (
    <div className="my-6 overflow-hidden rounded-2xl border border-black/[0.07] bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.02]">
      <div className="flex flex-col gap-1 border-b border-black/[0.06] px-5 py-4 dark:border-white/10">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {description && (
          <p className="text-[13px] leading-relaxed text-foreground/60">{description}</p>
        )}
      </div>
      <div style={{ height }}>
        <ReactFlowProvider>
          <svg className="absolute size-0">
            <defs>
              <linearGradient id="voxa-edge-grad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#6366F1" />
                <stop offset="100%" stopColor="#EC4899" />
              </linearGradient>
            </defs>
          </svg>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.22 }}
            proOptions={{ hideAttribution: true }}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            panOnDrag={false}
            zoomOnScroll={false}
            zoomOnPinch={false}
            zoomOnDoubleClick={false}
          >
            <Background variant={BackgroundVariant.Dots} gap={18} size={1} color="#cbd5e1" />
          </ReactFlow>
        </ReactFlowProvider>
      </div>
    </div>
  );
}
