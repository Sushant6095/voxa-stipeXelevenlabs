import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { LeadsKanban } from '@/components/dashboard/leads-kanban';
import { getLeadsBoard } from '@/lib/dashboard-data';

export const dynamic = 'force-dynamic';

export default async function LeadsPage() {
  const board = await getLeadsBoard();
  const total =
    board.new.length + board.contacted.length + board.won.length + board.lost.length;

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Leads"
        subtitle={`${total} lead${total === 1 ? '' : 's'} across the pipeline.`}
      />
      <LeadsKanban initialBoard={board} />
    </div>
  );
}
