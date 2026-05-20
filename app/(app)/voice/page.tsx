import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { VoiceClonePanel } from '@/components/dashboard/voice-clone-panel';
import { getPrimaryAgent } from '@/lib/dashboard-data';

export const dynamic = 'force-dynamic';

export default async function VoicePage() {
  const agent = await getPrimaryAgent();

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Voice"
        subtitle="Clone your voice once. Your AI receptionist uses it on every call."
      />
      <VoiceClonePanel agent={agent} />
    </div>
  );
}
