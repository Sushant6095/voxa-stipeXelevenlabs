'use client';

import {
  DndContext,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import { useMemo } from 'react';

import { LeadCard } from './lead-card';
import { useOptimisticLeads } from '@/lib/optimistic-leads';
import { cn } from '@/lib/utils';
import type { LeadsBoard } from '@/lib/dashboard-data';
import type { Lead, LeadStatus } from '@/lib/supabase/types';

interface LeadsKanbanProps {
  initialBoard: LeadsBoard;
}

const COLUMNS: { id: LeadStatus; label: string }[] = [
  { id: 'new', label: 'New' },
  { id: 'contacted', label: 'Contacted' },
  { id: 'won', label: 'Won' },
  { id: 'lost', label: 'Lost' },
];

function flattenBoard(board: LeadsBoard): Lead[] {
  return [...board.new, ...board.contacted, ...board.won, ...board.lost];
}

interface ColumnProps {
  status: LeadStatus;
  label: string;
  leads: Lead[];
}

function DraggableLead({ lead }: { lead: Lead }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: lead.id,
  });
  return (
    <div ref={setNodeRef}>
      <LeadCard
        lead={lead}
        dndAttributes={attributes as unknown as Record<string, unknown>}
        dndListeners={listeners as unknown as Record<string, unknown>}
        isDragging={isDragging}
      />
    </div>
  );
}

function KanbanColumn({ status, label, leads }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-sm font-semibold text-foreground">
          {label}
        </h3>
        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-2 text-xs tabular-nums text-muted-foreground">
          {leads.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          'flex min-h-[200px] flex-col gap-2 rounded-2xl border border-dashed border-border/60 p-3 transition-colors',
          isOver && 'border-primary/60 bg-primary/5',
        )}
      >
        {leads.length === 0 ? (
          <div className="flex flex-1 items-center justify-center py-6 text-center text-xs text-muted-foreground">
            Drag leads here
          </div>
        ) : (
          leads.map((lead) => <DraggableLead key={lead.id} lead={lead} />)
        )}
      </div>
    </div>
  );
}

export function LeadsKanban({ initialBoard }: LeadsKanbanProps) {
  const initial = useMemo(() => flattenBoard(initialBoard), [initialBoard]);
  const { leads, moveLead } = useOptimisticLeads(initial);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const grouped = useMemo(() => {
    const board: Record<LeadStatus, Lead[]> = {
      new: [],
      contacted: [],
      won: [],
      lost: [],
    };
    for (const lead of leads) board[lead.status].push(lead);
    return board;
  }, [leads]);

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const nextStatus = over.id as LeadStatus;
    const leadId = String(active.id);
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.status === nextStatus) return;
    moveLead(leadId, nextStatus);
  };

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            status={col.id}
            label={col.label}
            leads={grouped[col.id]}
          />
        ))}
      </div>
    </DndContext>
  );
}
