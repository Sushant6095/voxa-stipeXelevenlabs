'use client';

import { motion } from 'motion/react';
import type { ComponentProps } from 'react';

import { BorderBeam } from '@/components/ui/border-beam';
import { MagicCard } from '@/components/ui/magic-card';
import { cn } from '@/lib/utils';
import type { Lead } from '@/lib/supabase/types';

interface LeadCardProps {
  lead: Lead;
  dndAttributes?: Record<string, unknown>;
  dndListeners?: Record<string, unknown>;
  isDragging?: boolean;
}

function scoreClasses(score: number): string {
  if (score >= 7) return 'from-emerald-500 to-emerald-600 text-white';
  if (score >= 4) return 'from-amber-400 to-amber-500 text-white';
  return 'from-slate-300 to-slate-400 text-slate-800';
}

function formatPhoneShort(p: string | null): string {
  if (!p) return '—';
  return p.length > 10 ? `${p.slice(0, 3)} ${p.slice(3, 8)}…` : p;
}

export function LeadCard({
  lead,
  dndAttributes,
  dndListeners,
  isDragging = false,
}: LeadCardProps) {
  const hot = (lead.lead_score ?? 0) >= 7;
  const motionProps = (dndListeners ?? {}) as ComponentProps<typeof motion.div>;

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      animate={{ opacity: isDragging ? 0.5 : 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 18 }}
      className={cn('relative cursor-grab active:cursor-grabbing select-none')}
      {...(dndAttributes ?? {})}
      {...motionProps}
    >
      <MagicCard className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-4">
        {hot && (
          <BorderBeam size={120} duration={9} colorFrom="#6366F1" colorTo="#EC4899" />
        )}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-foreground">
              {lead.customer_name ?? 'Unknown caller'}
            </div>
            <div className="mt-0.5 truncate text-xs text-muted-foreground">
              {formatPhoneShort(lead.customer_phone)}
            </div>
          </div>
          <span
            className={cn(
              'inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-gradient-to-br px-2 text-xs font-semibold tabular-nums',
              scoreClasses(lead.lead_score ?? 0),
            )}
            title={`Lead score: ${lead.lead_score ?? 0}`}
          >
            {lead.lead_score ?? 0}
          </span>
        </div>
        {lead.intent && (
          <div className="mt-2 truncate text-xs text-muted-foreground">
            <span className="text-foreground/70">Intent:</span> {lead.intent}
          </div>
        )}
      </MagicCard>
    </motion.div>
  );
}
