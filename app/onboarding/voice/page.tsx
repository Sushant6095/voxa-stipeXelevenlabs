'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import { ProgressDots } from '@/components/onboarding/progress-dots';
import { StepVoiceClone } from '@/components/onboarding/step-voice-clone';
import { uploadVoiceClone } from '@/lib/onboarding/actions';
import { stepIndex } from '@/lib/onboarding/state';

/**
 * Step 3 — Voice clone.
 *
 * Receives a `Blob` from the MediaRecorder, packs it into FormData, and
 * passes it through to the `uploadVoiceClone` server action. The action
 * proxies to EL's IVC endpoint and persists the resulting voiceId on the
 * agent row.
 *
 * "Skip" is non-destructive — the EL agent falls back to the default voice
 * configured in the agent template until the user re-records from
 * /voice settings later.
 */
export default function OnboardingVoicePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleComplete = useCallback(
    async (blob: Blob) => {
      if (isSubmitting) return;
      setIsSubmitting(true);
      try {
        const formData = new FormData();
        // EL accepts most audio MIMEs; webm/opus from MediaRecorder is fine.
        const filename =
          blob.type.includes('webm')
            ? 'voxa-voice-sample.webm'
            : blob.type.includes('mp4')
              ? 'voxa-voice-sample.mp4'
              : 'voxa-voice-sample.audio';
        formData.append('audio', blob, filename);

        await uploadVoiceClone(formData);
        toast.success('Voice cloned');
        router.push('/onboarding/website');
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Voice clone failed';
        toast.error('Could not clone voice', { description: message });
      } finally {
        setIsSubmitting(false);
      }
    },
    [isSubmitting, router],
  );

  const handleSkip = useCallback(() => {
    router.push('/onboarding/website');
  }, [router]);

  return (
    <>
      <ProgressDots currentStep={stepIndex('voice')} />
      <StepVoiceClone onComplete={handleComplete} onSkip={handleSkip} />
    </>
  );
}
