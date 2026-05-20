'use client';

import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { motion, useReducedMotion } from 'motion/react';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

export type ServiceColor =
  | 'caller'
  | 'twilio'
  | 'elevenlabs'
  | 'n8n'
  | 'calcom'
  | 'whatsapp'
  | 'supabase'
  | 'stripe';

export interface ServiceNodeData extends Record<string, unknown> {
  label: string;
  sublabel?: string;
  Icon: LucideIcon;
  color: ServiceColor;
  isActive: boolean;
  /** Optional event counter shown beneath the label. */
  count?: number;
}

/** Brand colors per service. Indigo is reserved for Voxa primary (caller). */
const COLOR_MAP: Record<
  ServiceColor,
  { from: string; to: string; glow: string }
> = {
  caller: { from: '#6366F1', to: '#4F46E5', glow: '#6366F1' },
  twilio: { from: '#F22F46', to: '#CF0E2C', glow: '#F22F46' },
  elevenlabs: { from: '#A78BFA', to: '#7C3AED', glow: '#A78BFA' },
  n8n: { from: '#FF6E5C', to: '#E04A38', glow: '#FF6E5C' },
  calcom: { from: '#1F2937', to: '#111827', glow: '#6B7280' },
  whatsapp: { from: '#25D366', to: '#128C7E', glow: '#25D366' },
  supabase: { from: '#3FCF8E', to: '#249D67', glow: '#3FCF8E' },
  stripe: { from: '#635BFF', to: '#3D33D6', glow: '#635BFF' },
};

/**
 * Custom React Flow node used by `<LiveOrchestration />`. Renders a
 * branded gradient pill with an icon, label, optional sublabel, and an
 * event counter. When `isActive` flips true the node breathes (pulsing
 * scale + glow shadow) until reset.
 */
export type ServiceNodeType = Node<ServiceNodeData, 'service'>;

export function ServiceNode({ data }: NodeProps<ServiceNodeType>) {
  const reduceMotion = useReducedMotion();
  const colors = COLOR_MAP[data.color];
  const Icon = data.Icon;

  return (
    <motion.div
      animate={
        data.isActive && !reduceMotion
          ? {
              scale: [1, 1.06, 1],
              boxShadow: [
                `0 0 0 0 ${colors.glow}00`,
                `0 0 24px 6px ${colors.glow}80`,
                `0 0 0 0 ${colors.glow}00`,
              ],
            }
          : {
              scale: 1,
              boxShadow: `0 4px 12px -2px ${colors.glow}30`,
            }
      }
      transition={{
        duration: 1.2,
        repeat: data.isActive && !reduceMotion ? Infinity : 0,
        ease: 'easeInOut',
      }}
      className={cn(
        'relative min-w-[140px] overflow-hidden rounded-2xl border border-white/15 px-3 py-2.5',
        'shadow-lg backdrop-blur-sm',
      )}
      style={{
        background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`,
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!size-2 !border-0 !bg-white/40"
      />

      <div className="flex items-center gap-2.5">
        <div
          className={cn(
            'flex size-7 shrink-0 items-center justify-center rounded-lg',
            'bg-white/15 ring-1 ring-inset ring-white/20',
          )}
        >
          <Icon aria-hidden="true" className="size-3.5 text-white" />
        </div>
        <div className="flex min-w-0 flex-col">
          <div className="truncate text-[13px] font-medium leading-tight text-white">
            {data.label}
          </div>
          {data.sublabel && (
            <div className="truncate text-[10.5px] text-white/70 tabular-nums">
              {data.sublabel}
            </div>
          )}
          {data.count !== undefined && (
            <div className="text-[10.5px] text-white/70 tabular-nums">
              {data.count} events
            </div>
          )}
        </div>
      </div>

      {/* Active indicator pulse — tiny dot at the corner */}
      {data.isActive && (
        <span className="absolute right-2 top-2 flex size-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/70" />
          <span className="relative inline-flex size-2 rounded-full bg-white" />
        </span>
      )}

      <Handle
        type="source"
        position={Position.Right}
        className="!size-2 !border-0 !bg-white/40"
      />
    </motion.div>
  );
}
