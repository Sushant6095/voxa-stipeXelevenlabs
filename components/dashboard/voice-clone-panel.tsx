import { CheckCircle2, MicOff } from 'lucide-react';

import { VoiceRecorder } from '@/components/voice/voice-recorder';
import type { Agent } from '@/lib/supabase/types';

interface VoiceClonePanelProps {
  agent: Agent | null;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function VoiceClonePanel({ agent }: VoiceClonePanelProps) {
  const hasClone = !!agent?.elevenlabs_voice_id;
  return (
    <div className="space-y-6">
      <section>
        <h2 className="font-heading text-lg font-semibold tracking-tight">
          Record a new voice
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Record 60 seconds of natural speech. Your AI receptionist will use
          this voice on every call.
        </p>
        <div className="mt-4">
          <VoiceRecorder />
        </div>
      </section>

      <section className="rounded-2xl border border-border/60 bg-card p-6">
        <div className="flex items-start gap-3">
          {hasClone ? (
            <CheckCircle2 aria-hidden className="size-5 text-emerald-500" />
          ) : (
            <MicOff aria-hidden className="size-5 text-muted-foreground" />
          )}
          <div className="flex-1">
            <h3 className="font-heading text-base font-semibold">
              {hasClone ? 'Voice cloned' : 'No voice cloned yet'}
            </h3>
            {hasClone ? (
              <p className="mt-1 text-sm text-muted-foreground">
                Voice ID: <span className="font-mono">{agent.elevenlabs_voice_id}</span>
                {' · '}
                Saved {formatDate(agent.updated_at ?? agent.created_at)}
              </p>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">
                Record above to give your receptionist a personal voice.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
