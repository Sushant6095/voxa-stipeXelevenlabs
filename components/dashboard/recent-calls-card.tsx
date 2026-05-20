'use client';

import { Eye } from 'lucide-react';
import { useState } from 'react';

import { AnimatedShinyText } from '@/components/ui/animated-shiny-text';
import { BlurFade } from '@/components/ui/blur-fade';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CallDetailDrawer } from './call-detail-drawer';
import { cn } from '@/lib/utils';
import type { CallWithLead } from '@/lib/dashboard-data';

interface RecentCallsCardProps {
  calls: CallWithLead[];
  variant?: 'compact' | 'full';
}

const LANG_FLAG: Record<string, string> = {
  en: '🇬🇧',
  hi: '🇮🇳',
  ta: '🇮🇳',
  te: '🇮🇳',
};

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffSec = Math.max(0, Math.round((now - then) / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  const m = Math.round(diffSec / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function scoreColor(score: number): string {
  if (score >= 7) return 'from-emerald-500 to-emerald-600 text-white';
  if (score >= 4) return 'from-amber-400 to-amber-500 text-white';
  return 'from-slate-300 to-slate-400 text-slate-800';
}

export function RecentCallsCard({
  calls,
  variant = 'compact',
}: RecentCallsCardProps) {
  const [openCall, setOpenCall] = useState<CallWithLead | null>(null);
  const max = variant === 'full' ? 50 : 10;
  const visible = calls.slice(0, max);

  return (
    <>
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
          <div className="flex items-center gap-2">
            <h2 className="font-heading text-lg font-semibold tracking-tight">
              Recent calls
            </h2>
            <AnimatedShinyText className="text-xs font-medium">
              Live
            </AnimatedShinyText>
            <span className="relative ml-1 inline-flex">
              <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/60" />
              <span className="relative inline-block size-2 rounded-full bg-emerald-500" />
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {visible.length} of {calls.length}
          </span>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Time</TableHead>
              <TableHead>From</TableHead>
              <TableHead className="w-[80px]">Lang</TableHead>
              <TableHead className="w-[100px]">Duration</TableHead>
              <TableHead className="w-[100px]">Score</TableHead>
              <TableHead className="w-[80px] text-right">View</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  No calls yet.
                </TableCell>
              </TableRow>
            ) : (
              visible.map((call, i) => {
                const isLive = call.status === 'in_progress';
                const score = call.lead?.lead_score ?? 0;
                return (
                  <BlurFade
                    key={call.id}
                    delay={Math.min(i * 0.04, 0.4)}
                    offset={4}
                    inView={false}
                  >
                    <TableRow
                      className="cursor-pointer"
                      onClick={() => setOpenCall(call)}
                    >
                      <TableCell className="text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          {isLive && (
                            <span className="relative inline-flex">
                              <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/60" />
                              <span className="relative inline-block size-2 rounded-full bg-emerald-500" />
                            </span>
                          )}
                          <span className="tabular-nums">
                            {relativeTime(call.created_at)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {call.caller_phone ?? '—'}
                      </TableCell>
                      <TableCell aria-label={call.language_detected ?? 'unknown'}>
                        <span className="text-lg">
                          {LANG_FLAG[call.language_detected ?? ''] ?? '🌐'}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {formatDuration(call.duration_seconds)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            'inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-gradient-to-br px-2 text-xs font-semibold tabular-nums',
                            scoreColor(score),
                          )}
                        >
                          {score}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="View call detail"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenCall(call);
                          }}
                        >
                          <Eye aria-hidden className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  </BlurFade>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      <CallDetailDrawer
        call={openCall}
        open={openCall !== null}
        onOpenChange={(open) => {
          if (!open) setOpenCall(null);
        }}
      />
    </>
  );
}
