'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';

import { useSupabase } from '@/lib/supabase/client';
import type {
  Agent,
  Call,
  Lead,
  MeterEvent,
} from '@/lib/supabase/types';

/**
 * Voxa client-side realtime hooks.
 *
 * Every hook subscribes to a Supabase `postgres_changes` channel filtered by
 * business_id (so multi-tenant isolation is enforced both via the JWT-driven
 * RLS policy AND via the filter clause — belt and suspenders).
 *
 * The Clerk JWT is injected by `useSupabase()` in `lib/supabase/client.ts`,
 * which sets the `Authorization: Bearer <token>` header on every outgoing
 * request — including the Realtime websocket handshake.
 *
 * Pattern:
 *   1. Pass `businessId` (may be null pre-onboarding).
 *   2. Hook returns `{ items, isConnected }`. When `businessId` is null the
 *      hook is a no-op and `items` stays empty.
 *   3. Always passes `initial: T[]` so the caller's server-rendered initial
 *      state is preserved across mount.
 */

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

interface RealtimeListReturn<T> {
  items: T[];
  isConnected: boolean;
}

/**
 * Generic list-subscription primitive used by the public hooks below.
 *
 * Manages a single channel keyed on `(table, businessId)` and reconciles
 * INSERT / UPDATE / DELETE into the local `items` array. Listens to ALL
 * events because the dashboard needs lifecycle (e.g. in_progress → completed
 * transitions on `calls`).
 */
function useRealtimeTable<T extends { id: string; business_id: string }>(
  table: 'calls' | 'leads' | 'agents' | 'meter_events',
  businessId: string | null,
  initial: T[] = [],
  options: { maxItems?: number } = {},
): RealtimeListReturn<T> {
  const supabase = useSupabase();
  const [items, setItems] = useState<T[]>(initial);
  const [isConnected, setIsConnected] = useState(false);
  const maxItems = options.maxItems ?? 100;

  // Reset items whenever `initial` identity changes (e.g. server-side reload).
  // We intentionally only sync the *first* render — subsequent realtime events
  // own state to avoid clobbering optimistic updates.
  const initialRef = useRef(initial);
  useEffect(() => {
    if (initialRef.current !== initial) {
      initialRef.current = initial;
      setItems(initial);
    }
  }, [initial]);

  useEffect(() => {
    if (!businessId) {
      setIsConnected(false);
      return;
    }

    const channelName = `voxa:${table}:${businessId}`;
    const channel: RealtimeChannel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table,
          filter: `business_id=eq.${businessId}`,
        },
        (payload) => {
          const row = payload.new as T;
          setItems((prev) => {
            if (prev.some((p) => p.id === row.id)) return prev;
            return [row, ...prev].slice(0, maxItems);
          });
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table,
          filter: `business_id=eq.${businessId}`,
        },
        (payload) => {
          const row = payload.new as T;
          setItems((prev) => prev.map((p) => (p.id === row.id ? row : p)));
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table,
          filter: `business_id=eq.${businessId}`,
        },
        (payload) => {
          const old = payload.old as { id?: string };
          if (!old.id) return;
          setItems((prev) => prev.filter((p) => p.id !== old.id));
        },
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      void supabase.removeChannel(channel);
      setIsConnected(false);
    };
  }, [supabase, table, businessId, maxItems]);

  return { items, isConnected };
}

// ---------------------------------------------------------------------------
// Public hooks
// ---------------------------------------------------------------------------

export function useRealtimeCalls(
  businessId: string | null,
  initial: Call[] = [],
): RealtimeListReturn<Call> {
  return useRealtimeTable<Call>('calls', businessId, initial, { maxItems: 50 });
}

export function useRealtimeLeads(
  businessId: string | null,
  initial: Lead[] = [],
): RealtimeListReturn<Lead> {
  return useRealtimeTable<Lead>('leads', businessId, initial, { maxItems: 200 });
}

export function useRealtimeMeterEvents(
  businessId: string | null,
  initial: MeterEvent[] = [],
): RealtimeListReturn<MeterEvent> {
  return useRealtimeTable<MeterEvent>('meter_events', businessId, initial, {
    maxItems: 100,
  });
}

/**
 * Subscribe to status transitions on a specific agent row (provisioning →
 * active, etc.). Returns the latest known status string.
 */
export function useRealtimeAgentStatus(
  businessId: string | null,
  agentId: string | null,
  initial: Agent['status'] | 'unknown' = 'unknown',
): Agent['status'] | 'unknown' {
  const supabase = useSupabase();
  const [status, setStatus] = useState<Agent['status'] | 'unknown'>(initial);

  useEffect(() => {
    if (!businessId || !agentId) {
      setStatus(initial);
      return;
    }

    const channel = supabase
      .channel(`voxa:agents:${agentId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'agents',
          filter: `id=eq.${agentId}`,
        },
        (payload) => {
          const next = (payload.new as Agent | null)?.status;
          if (next) setStatus(next);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, businessId, agentId, initial]);

  return status;
}

// ---------------------------------------------------------------------------
// Orchestration event stream
// ---------------------------------------------------------------------------

export type OrchestrationEventType =
  | 'call_started'
  | 'call_ended'
  | 'tool_called'
  | 'lead_logged'
  | 'meter_sent';

export interface OrchestrationEvent {
  /** Synthetic ID so callers can use stable React keys. */
  id: string;
  type: OrchestrationEventType;
  timestamp: number;
  /** React Flow node to pulse on this event, if any. */
  node_id?: string;
  /** React Flow edge to light up on this event, if any. */
  edge_id?: string;
  meta?: Record<string, unknown>;
}

const ORCHESTRATION_MAX = 30;

/**
 * Derived event stream powering the React Flow live orchestration view.
 *
 * Watches:
 *   - calls: INSERT → `call_started`; UPDATE to status==='completed' → `call_ended`
 *   - leads: INSERT → `lead_logged`
 *   - meter_events: INSERT → `meter_sent`
 *
 * Each new derived event is appended (most recent first) and the buffer is
 * capped at 30 events so React Flow never has to render an unbounded list.
 */
export function useOrchestrationEvents(
  businessId: string | null,
): OrchestrationEvent[] {
  const supabase = useSupabase();
  const [events, setEvents] = useState<OrchestrationEvent[]>([]);

  // De-dupe by ID per channel — Supabase Realtime can deliver duplicates
  // around reconnects.
  const seenIdsRef = useRef<Set<string>>(new Set());

  // Stable channel name so React's strict-mode double-mount doesn't open
  // two sockets and stack duplicate events.
  const channelName = useMemo(
    () => (businessId ? `voxa:orchestration:${businessId}` : null),
    [businessId],
  );

  useEffect(() => {
    if (!businessId || !channelName) return;
    seenIdsRef.current = new Set();

    const push = (evt: OrchestrationEvent) => {
      setEvents((prev) => [evt, ...prev].slice(0, ORCHESTRATION_MAX));
    };

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'calls',
          filter: `business_id=eq.${businessId}`,
        },
        (payload) => {
          const call = payload.new as Call;
          const key = `call_started:${call.id}`;
          if (seenIdsRef.current.has(key)) return;
          seenIdsRef.current.add(key);
          push({
            id: key,
            type: 'call_started',
            timestamp: Date.now(),
            meta: { callId: call.id, callerPhone: call.caller_phone },
          });
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'calls',
          filter: `business_id=eq.${businessId}`,
        },
        (payload) => {
          const call = payload.new as Call;
          if (call.status !== 'completed') return;
          const key = `call_ended:${call.id}`;
          if (seenIdsRef.current.has(key)) return;
          seenIdsRef.current.add(key);
          push({
            id: key,
            type: 'call_ended',
            timestamp: Date.now(),
            meta: {
              callId: call.id,
              durationSeconds: call.duration_seconds,
              language: call.language_detected,
            },
          });
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'leads',
          filter: `business_id=eq.${businessId}`,
        },
        (payload) => {
          const lead = payload.new as Lead;
          const key = `lead_logged:${lead.id}`;
          if (seenIdsRef.current.has(key)) return;
          seenIdsRef.current.add(key);
          push({
            id: key,
            type: 'lead_logged',
            timestamp: Date.now(),
            meta: {
              leadId: lead.id,
              score: lead.lead_score,
              sentiment: lead.sentiment,
            },
          });
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'meter_events',
          filter: `business_id=eq.${businessId}`,
        },
        (payload) => {
          const meter = payload.new as MeterEvent;
          const key = `meter_sent:${meter.id}`;
          if (seenIdsRef.current.has(key)) return;
          seenIdsRef.current.add(key);
          push({
            id: key,
            type: 'meter_sent',
            timestamp: Date.now(),
            meta: { callId: meter.call_id, minutes: meter.minutes_billed },
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, businessId, channelName]);

  return events;
}
