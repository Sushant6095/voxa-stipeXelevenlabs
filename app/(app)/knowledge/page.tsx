import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { KnowledgeForm } from '@/components/dashboard/knowledge-form';
import { getKnowledgeSources } from '@/lib/dashboard-data';

export const dynamic = 'force-dynamic';

export default async function KnowledgePage() {
  const sources = await getKnowledgeSources();

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Knowledge"
        subtitle="Paste your website or menu URL. Voxa scrapes it and your receptionist can answer questions."
      />
      <KnowledgeForm initialSources={sources} />
    </div>
  );
}
