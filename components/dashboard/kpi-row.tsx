'use client';

import { Clock, Flame, Phone, Receipt } from 'lucide-react';

import { KPICard } from './kpi-card';
import { BlurFade } from '@/components/ui/blur-fade';
import type { KPIRowData } from '@/lib/dashboard-data';

interface KPIRowProps {
  data: KPIRowData;
}

/**
 * Four-up KPI grid for the dashboard top. Each card staggers in with
 * `<BlurFade />` for the "alive" feel.
 */
export function KPIRow({ data }: KPIRowProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <BlurFade delay={0} className="h-full">
        <KPICard
          label="Today's calls"
          value={data.todaysCalls.count}
          trend={data.todaysCalls.trend7d}
          livePulse
          Icon={Phone}
        />
      </BlurFade>
      <BlurFade delay={0.08} className="h-full">
        <KPICard
          label="Minutes this month"
          value={data.minutesThisMonth.used}
          progress={{
            used: data.minutesThisMonth.used,
            total: data.minutesThisMonth.included,
          }}
          Icon={Clock}
        />
      </BlurFade>
      <BlurFade delay={0.16} className="h-full">
        <KPICard
          label="Hot leads"
          value={data.hotLeadsCount}
          caption="score ≥ 7"
          hot={data.hotLeadsCount > 0}
          Icon={Flame}
        />
      </BlurFade>
      <BlurFade delay={0.24} className="h-full">
        <KPICard
          label="Estimated invoice"
          value={data.estimatedInvoicePaise}
          isCurrency
          Icon={Receipt}
        />
      </BlurFade>
    </div>
  );
}
