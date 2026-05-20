'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import { ProgressDots } from '@/components/onboarding/progress-dots';
import { StepWebsiteUrl } from '@/components/onboarding/step-website-url';
import { ingestWebsite } from '@/lib/onboarding/actions';
import { stepIndex } from '@/lib/onboarding/state';

/**
 * Step 4 — Website ingest.
 *
 * Calls `ingestWebsite` server action which:
 *   - Persists the URL on the business row
 *   - Pushes the URL into the agent's EL knowledge base (if the agent
 *     already exists)
 *   - Records a placeholder row in `knowledge_base`
 *
 * Skip is supported — the agent will start without RAG, the owner can add
 * sources from /knowledge later.
 */
export default function OnboardingWebsitePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (url: string) => {
      if (isSubmitting) return;
      setIsSubmitting(true);
      try {
        await ingestWebsite(url);
        toast.success('Website queued for ingest');
        router.push('/onboarding/provisioning');
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Failed to ingest URL';
        toast.error('Could not ingest', { description: message });
      } finally {
        setIsSubmitting(false);
      }
    },
    [isSubmitting, router],
  );

  const handleSkip = useCallback(() => {
    router.push('/onboarding/provisioning');
  }, [router]);

  return (
    <>
      <ProgressDots currentStep={stepIndex('website')} />
      <StepWebsiteUrl onSubmit={handleSubmit} onSkip={handleSkip} />
    </>
  );
}
