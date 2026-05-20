import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { RecentCallsCard } from '@/components/dashboard/recent-calls-card';
import { Button } from '@/components/ui/button';
import { getCallsPage } from '@/lib/dashboard-data';

export const dynamic = 'force-dynamic';

const LANGUAGES = ['EN', 'HI', 'TA', 'TE'] as const;

export default async function CallsPage() {
  const result = await getCallsPage({ page: 1 });

  return (
    <div className="space-y-6">
      <DashboardHeader title="Calls" subtitle="Every call your AI receptionist has answered." />

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-card p-3">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          Filters
        </span>
        <Button variant="outline" size="sm" disabled>
          Last 7 days
        </Button>
        {LANGUAGES.map((lang) => (
          <Button key={lang} variant="outline" size="sm" disabled>
            {lang}
          </Button>
        ))}
        <Button variant="outline" size="sm" disabled>
          Has lead
        </Button>
      </div>

      <RecentCallsCard calls={result.calls} variant="full" />

      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-muted-foreground">
          Page {result.page} of {Math.max(1, Math.ceil(result.total / result.pageSize))}
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled>
            Prev
          </Button>
          <Button variant="outline" size="sm" disabled>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
