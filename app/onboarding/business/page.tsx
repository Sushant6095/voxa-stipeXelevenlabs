'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import { ProgressDots } from '@/components/onboarding/progress-dots';
import { StepBusinessForm } from '@/components/onboarding/step-business-form';
import { saveBusinessDetails } from '@/lib/onboarding/actions';
import type { BusinessFormValues } from '@/lib/onboarding/schemas';
import { stepIndex } from '@/lib/onboarding/state';

/**
 * Step 2 — Business details.
 *
 * Calls the `saveBusinessDetails` server action then navigates forward.
 * On error we surface a Sonner toast and keep the user on the page so
 * they can correct + retry.
 */
export default function OnboardingBusinessPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (values: BusinessFormValues) => {
      if (isSubmitting) return;
      setIsSubmitting(true);
      try {
        await saveBusinessDetails(values);
        toast.success('Business saved');
        router.push('/onboarding/voice');
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : 'Failed to save your business details';
        toast.error('Could not save', { description: message });
      } finally {
        setIsSubmitting(false);
      }
    },
    [isSubmitting, router],
  );

  return (
    <>
      <ProgressDots currentStep={stepIndex('business')} />
      <StepBusinessForm onSubmit={handleSubmit} />
    </>
  );
}
