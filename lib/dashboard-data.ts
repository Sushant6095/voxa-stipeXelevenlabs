import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { PRICING_TIERS } from '@/lib/pricing';
import type {
  Agent,
  AgentStatus,
  Business,
  Call,
  KnowledgeBaseEntry,
  Lead,
  Subscription,
  SubscriptionTier,
} from '@/lib/supabase/types';

/**
 * Voxa dashboard data layer.
 *
 * Server-only. All exported functions return shapes that the visual layer
 * (ui-virtuoso's components) renders directly. When the caller has no
 * business yet (fresh signup pre-onboarding), every function returns a
 * zero-state object so empty-state UI flows naturally — never throw.
 */

// ---------------------------------------------------------------------------
// Public types — STABLE. UI components depend on these field names.
// ---------------------------------------------------------------------------

export interface CallWithLead extends Call {
  lead?: Lead | null;
}

// Convenience alias for visual layer that wants the with-lead row shape.
export type CallRowWithLead = CallWithLead;

// Re-export orchestration types so visual components can import them from a
// single barrel rather than reaching into lib/realtime.
export type { OrchestrationEvent, OrchestrationEventType } from './realtime';

// Open string types — the React Flow component owns the canonical IDs;
// the data side just passes them as opaque tokens in OrchestrationEvent.meta.
export type OrchestrationNodeId = string;
export type OrchestrationEdgeId = string;

// KPI row data alias — UI passes the full DashboardData; this alias documents
// that the KPI row consumes the same shape (no separate sub-type needed).
export type KPIRowData = DashboardData;

export interface DashboardData {
  business: Business | null;
  todaysCalls: {
    count: number;
    /** Length-7 array of call counts for the last 7 calendar days, oldest first. */
    trend7d: number[];
  };
  minutesThisMonth: {
    used: number;
    included: number;
  };
  hotLeadsCount: number;
  estimatedInvoicePaise: number;
  /** Last 10 calls, newest first, optionally joined with the extracted lead. */
  recentCalls: CallWithLead[];
  agentStatus: AgentStatus | 'unknown';
  /** The caller's tier, or `null` if no subscription has been created yet. */
  tier: SubscriptionTier | null;
}

const ZERO_STATE: DashboardData = {
  business: null,
  todaysCalls: { count: 0, trend7d: [0, 0, 0, 0, 0, 0, 0] },
  minutesThisMonth: { used: 0, included: 0 },
  hotLeadsCount: 0,
  estimatedInvoicePaise: 0,
  recentCalls: [],
  agentStatus: 'unknown',
  tier: null,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function startOfTodayUtc(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function startOfSevenDaysAgoUtc(): Date {
  const d = startOfTodayUtc();
  d.setUTCDate(d.getUTCDate() - 6); // include today => 7 buckets total
  return d;
}

function startOfMonthUtc(): Date {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

/**
 * Estimated invoice in paise = flat + max(0, used - included) * overagePaise.
 * Pure function; the UI calls this same shape for billing previews.
 */
export function estimateInvoicePaise(
  tier: SubscriptionTier,
  minutesUsed: number,
): number {
  const t = PRICING_TIERS[tier];
  const overage = Math.max(0, Math.floor(minutesUsed) - t.includedMinutes);
  return t.flatPaise + overage * t.overagePaise;
}

// ---------------------------------------------------------------------------
// Dashboard aggregate
// ---------------------------------------------------------------------------

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = await createClient();

  // ---- 1. Resolve the caller's business via RLS-aware select -----------
  // We rely on RLS instead of joining `clerk_user_id` manually so this code
  // works identically for service-role callers and end users.
  const { data: businessRow } = await supabase
    .from('businesses')
    .select('*')
    .limit(1)
    .maybeSingle();

  if (!businessRow) {
    return ZERO_STATE;
  }

  const business: Business = businessRow;

  // ---- 2-5: fan out the remaining queries in parallel ------------------
  const sevenDaysAgo = startOfSevenDaysAgoUtc();
  const monthStart = startOfMonthUtc();
  const todayStart = startOfTodayUtc();

  const [
    callsForTrend,
    minutesAgg,
    hotLeadsAgg,
    subscriptionRow,
    agentRow,
    recentCallsResult,
    recentLeadsResult,
  ] = await Promise.all([
    supabase
      .from('calls')
      .select('id, created_at')
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: true }),
    supabase
      .from('meter_events')
      .select('minutes_billed')
      .gte('sent_at', monthStart.toISOString()),
    supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .gte('lead_score', 7),
    supabase
      .from('subscriptions')
      .select('*')
      .limit(1)
      .maybeSingle<Subscription>(),
    supabase
      .from('agents')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle<Agent>(),
    supabase
      .from('calls')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10),
    supabase.from('leads').select('*'),
  ]);

  // ---- 3. Build trend7d (length-7 ascending) ---------------------------
  const trend7d: number[] = Array(7).fill(0);
  const trendStartMs = sevenDaysAgo.getTime();
  for (const row of callsForTrend.data ?? []) {
    const dayIdx = Math.floor(
      (new Date(row.created_at).getTime() - trendStartMs) /
        (1000 * 60 * 60 * 24),
    );
    if (dayIdx >= 0 && dayIdx < 7) {
      trend7d[dayIdx] += 1;
    }
  }

  // ---- 4. Today's call count: last bucket of trend (today) -------------
  // Recompute separately to keep semantics clear when trend logic changes.
  const todaysCallsCount = (callsForTrend.data ?? []).filter(
    (r) => new Date(r.created_at).getTime() >= todayStart.getTime(),
  ).length;

  // ---- 5. Minutes used this month --------------------------------------
  const used = (minutesAgg.data ?? []).reduce(
    (sum, row) => sum + (row.minutes_billed ?? 0),
    0,
  );

  // ---- 6. Tier + included minutes + invoice ----------------------------
  const tier = subscriptionRow.data?.tier ?? null;
  const included = tier ? PRICING_TIERS[tier].includedMinutes : 0;
  const estimatedInvoicePaise = tier ? estimateInvoicePaise(tier, used) : 0;

  // ---- 7. Recent calls + LEFT JOIN leads (manual two-query stitch) -----
  // Supabase PostgREST's relational select can't express a true LEFT JOIN
  // from `calls` to `leads` because the FK direction is leads → calls. We
  // fetch both small sets and zip in memory.
  const recentCalls: CallWithLead[] = (recentCallsResult.data ?? []).map(
    (call): CallWithLead => {
      const lead =
        (recentLeadsResult.data ?? []).find((l) => l.call_id === call.id) ??
        null;
      return { ...call, lead };
    },
  );

  return {
    business,
    todaysCalls: { count: todaysCallsCount, trend7d },
    minutesThisMonth: { used, included },
    hotLeadsCount: hotLeadsAgg.count ?? 0,
    estimatedInvoicePaise,
    recentCalls,
    agentStatus: agentRow.data?.status ?? 'unknown',
    tier,
  };
}

// ---------------------------------------------------------------------------
// Auxiliary queries used by sub-pages
// ---------------------------------------------------------------------------

export interface CallsPageFilters {
  language?: string | null;
  hasLead?: boolean | null;
  page?: number;
  pageSize?: number;
}

export interface CallsPageResult {
  calls: CallWithLead[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Paginated calls list for /calls. Default 25 per page, newest first.
 */
export async function getCallsPage(
  filters: CallsPageFilters = {},
): Promise<CallsPageResult> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.max(1, Math.min(100, filters.pageSize ?? 25));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = await createClient();
  let query = supabase
    .from('calls')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (filters.language) {
    query = query.eq('language_detected', filters.language);
  }

  const { data, count } = await query;
  const callsRaw: Call[] = data ?? [];

  // Stitch leads onto the page
  const callIds = callsRaw.map((c) => c.id);
  const { data: leads } = callIds.length
    ? await supabase.from('leads').select('*').in('call_id', callIds)
    : { data: [] as Lead[] };

  let calls: CallWithLead[] = callsRaw.map((call): CallWithLead => {
    const lead = (leads ?? []).find((l) => l.call_id === call.id) ?? null;
    return { ...call, lead };
  });

  if (filters.hasLead === true) {
    calls = calls.filter((c) => c.lead);
  } else if (filters.hasLead === false) {
    calls = calls.filter((c) => !c.lead);
  }

  return { calls, total: count ?? 0, page, pageSize };
}

export async function getCallById(id: string): Promise<CallWithLead | null> {
  const supabase = await createClient();
  const { data: call } = await supabase
    .from('calls')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (!call) return null;
  const { data: lead } = await supabase
    .from('leads')
    .select('*')
    .eq('call_id', call.id)
    .maybeSingle();
  return { ...call, lead: lead ?? null };
}

/**
 * All leads for the current business, grouped by status. Powers /leads kanban.
 */
export interface LeadsBoard {
  new: Lead[];
  contacted: Lead[];
  won: Lead[];
  lost: Lead[];
}

export async function getLeadsBoard(): Promise<LeadsBoard> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });

  const board: LeadsBoard = { new: [], contacted: [], won: [], lost: [] };
  for (const lead of data ?? []) {
    board[lead.status].push(lead);
  }
  return board;
}

export async function getKnowledgeSources(): Promise<KnowledgeBaseEntry[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('knowledge_base')
    .select('*')
    .order('created_at', { ascending: false });
  return data ?? [];
}

/**
 * Resolves the agent (number, voice, status) for the current business — used
 * by /voice and /settings pages.
 */
export async function getPrimaryAgent(): Promise<Agent | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('agents')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle<Agent>();
  return data ?? null;
}

export interface BillingSummary {
  tier: SubscriptionTier | null;
  status: Subscription['status'] | null;
  currentPeriodEnd: string | null;
  minutesUsed: number;
  includedMinutes: number;
  estimatedInvoicePaise: number;
  hasSubscription: boolean;
}

export async function getBillingSummary(): Promise<BillingSummary> {
  const supabase = await createClient();
  const monthStart = startOfMonthUtc();

  const [{ data: sub }, { data: meters }] = await Promise.all([
    supabase
      .from('subscriptions')
      .select('*')
      .limit(1)
      .maybeSingle<Subscription>(),
    supabase
      .from('meter_events')
      .select('minutes_billed')
      .gte('sent_at', monthStart.toISOString()),
  ]);

  const minutesUsed = (meters ?? []).reduce(
    (sum, m) => sum + (m.minutes_billed ?? 0),
    0,
  );
  const tier = sub?.tier ?? null;
  const includedMinutes = tier ? PRICING_TIERS[tier].includedMinutes : 0;
  const estimatedInvoicePaise = tier ? estimateInvoicePaise(tier, minutesUsed) : 0;

  return {
    tier,
    status: sub?.status ?? null,
    currentPeriodEnd: sub?.current_period_end ?? null,
    minutesUsed,
    includedMinutes,
    estimatedInvoicePaise,
    hasSubscription: !!sub,
  };
}
