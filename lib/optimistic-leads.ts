'use client';

import { useCallback, useOptimistic, useTransition } from 'react';
import { toast } from 'sonner';

import { updateLeadStatus } from '@/app/(app)/leads/actions';
import type { Lead, LeadStatus } from '@/lib/supabase/types';

/**
 * Optimistic leads kanban hook.
 *
 * Consumes a `Lead[]` (server-supplied) and exposes:
 *   - `leads` — optimistic view of the array (instant updates on drag)
 *   - `moveLead(leadId, nextStatus)` — fires the server action; auto-reverts
 *     on failure and surfaces a Sonner toast.
 *   - `isPending` — true while a transition is in flight (lets the UI dim
 *     the dragged card if it wants).
 *
 * The component owning the kanban renders a column per status by filtering
 * `leads` on `status`. React's `useOptimistic` rolls the optimistic state
 * back automatically when the transition completes (success OR failure).
 */

export interface UseOptimisticLeadsResult {
  leads: Lead[];
  moveLead: (leadId: string, nextStatus: LeadStatus) => void;
  isPending: boolean;
}

interface MoveAction {
  type: 'move';
  leadId: string;
  status: LeadStatus;
}

function reducer(state: Lead[], action: MoveAction): Lead[] {
  if (action.type !== 'move') return state;
  return state.map((lead) =>
    lead.id === action.leadId
      ? { ...lead, status: action.status, updated_at: new Date().toISOString() }
      : lead,
  );
}

export function useOptimisticLeads(initial: Lead[]): UseOptimisticLeadsResult {
  const [optimistic, applyOptimistic] = useOptimistic(initial, reducer);
  const [isPending, startTransition] = useTransition();

  const moveLead = useCallback(
    (leadId: string, nextStatus: LeadStatus) => {
      startTransition(async () => {
        applyOptimistic({ type: 'move', leadId, status: nextStatus });
        const result = await updateLeadStatus(leadId, nextStatus);
        if (!result.ok) {
          toast.error(result.error ?? 'Failed to update lead');
          // useOptimistic auto-reverts when the transition completes.
        } else {
          toast.success(`Lead moved to ${nextStatus}`);
        }
      });
    },
    [applyOptimistic],
  );

  return { leads: optimistic, moveLead, isPending };
}
