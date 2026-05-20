'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

import { ProgressDots } from '@/components/onboarding/progress-dots';
import { StepWelcome } from '@/components/onboarding/step-welcome';
import { stepIndex } from '@/lib/onboarding/state';

/**
 * Step 1 — Welcome.
 *
 * Pure client component because ui-virtuoso's <StepWelcome /> needs an
 * `onContinue` callback. Navigation is local and synchronous so no server
 * action is needed here.
 */
export default function OnboardingWelcomePage() {
  const router = useRouter();

  const handleContinue = useCallback(() => {
    router.push('/onboarding/business');
  }, [router]);

  return (
    <>
      <ProgressDots currentStep={stepIndex('welcome')} />
      <StepWelcome onContinue={handleContinue} />
    </>
  );
}
