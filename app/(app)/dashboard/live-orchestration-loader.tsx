'use client';

import dynamic from 'next/dynamic';

import { Skeleton } from '@/components/ui/skeleton';
import type { OrchestrationEvent } from '@/lib/dashboard-data';

/**
 * Client-side wrapper that lazily imports `<LiveOrchestration />`.
 *
 * The React Flow bundle is ~80KB gzipped — we don't want it in the
 * initial dashboard JS payload. `dynamic(..., { ssr: false })` keeps
 * the diagram out of SSR (it touches `window` for layout calc) and out
 * of the entry chunk.
 */
const LiveOrchestration = dynamic(
  () => import('@/components/dashboard/live-orchestration'),
  {
    ssr: false,
    loading: () => (
      <Skeleton className="h-[460px] w-full rounded-2xl" aria-label="Loading live orchestration" />
    ),
  },
);

interface LiveOrchestrationLoaderProps {
  events?: OrchestrationEvent[];
}

export function LiveOrchestrationLoader(props: LiveOrchestrationLoaderProps) {
  return <LiveOrchestration {...props} />;
}
