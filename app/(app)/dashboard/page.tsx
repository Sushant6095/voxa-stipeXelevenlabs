import { Suspense } from 'react';

import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { EmptyCallsState } from '@/components/dashboard/empty-calls-state';
import { KPIRow } from '@/components/dashboard/kpi-row';
import { RecentCallsCard } from '@/components/dashboard/recent-calls-card';
import { LiveOrchestrationLoader } from './live-orchestration-loader';
import { BlurFade } from '@/components/ui/blur-fade';
import { Skeleton } from '@/components/ui/skeleton';
import { getDashboardData } from '@/lib/dashboard-data';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const data = await getDashboardData();
  const phoneNumber = null; // populated post-onboarding; the agent row carries it
  const hasCalls = data.recentCalls.length > 0;

  return (
    <div className="space-y-8">
      <BlurFade delay={0}>
        <DashboardHeader
          title="Dashboard"
          subtitle={data.business?.name ?? 'Set up your business in onboarding to see live data.'}
          isLive={hasCalls}
        />
      </BlurFade>

      <BlurFade delay={0.08}>
        <KPIRow data={data} />
      </BlurFade>

      <BlurFade delay={0.16}>
        <Suspense fallback={<Skeleton className="h-[460px] w-full rounded-2xl" />}>
          <LiveOrchestrationLoader />
        </Suspense>
      </BlurFade>

      <BlurFade delay={0.24}>
        {hasCalls ? (
          <RecentCallsCard calls={data.recentCalls} variant="compact" />
        ) : (
          <EmptyCallsState phoneNumber={phoneNumber} />
        )}
      </BlurFade>
    </div>
  );
}
