'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { ProgressDots } from '@/components/onboarding/progress-dots';
import { StepProvisioning } from '@/components/onboarding/step-provisioning';
import { startProvisioning } from '@/lib/onboarding/actions';
import {
  PROVISIONING_TOTAL_STEPS,
  stepIndex,
  type ProvisioningProgress,
} from '@/lib/onboarding/state';

/**
 * Step 5 — Provisioning.
 *
 * Polls `/api/onboarding/status` every 2 seconds to drive the 6-item
 * checklist. When the agent becomes active we navigate to /success.
 *
 * If progress stalls at the same `completedSteps` value for > 30s we
 * fire `startProvisioning()` once as a manual retry against n8n W1.
 */

const POLL_INTERVAL_MS = 2_000;
const STALL_THRESHOLD_MS = 30_000;

interface StatusResponse extends ProvisioningProgress {
  readonly hasBusiness: boolean;
}

export default function OnboardingProvisioningPage() {
  const router = useRouter();

  const [completedSteps, setCompletedSteps] = useState(0);
  const stalledRetryFiredRef = useRef(false);
  const lastChangeAtRef = useRef<number>(Date.now());
  const lastProgressRef = useRef<number>(0);

  useEffect(() => {
    let cancelled = false;

    async function tick() {
      try {
        const response = await fetch('/api/onboarding/status', {
          cache: 'no-store',
          credentials: 'same-origin',
        });
        if (!response.ok) return;
        const data = (await response.json()) as StatusResponse;
        if (cancelled) return;

        setCompletedSteps((prev) => {
          if (data.completedSteps !== prev) {
            lastChangeAtRef.current = Date.now();
            lastProgressRef.current = data.completedSteps;
          }
          return data.completedSteps;
        });

        // Done — auto-advance.
        if (
          data.status === 'active' &&
          data.completedSteps >= PROVISIONING_TOTAL_STEPS
        ) {
          router.push('/onboarding/success');
          return;
        }

        // Stalled — try kicking n8n once, then keep polling.
        const stalledFor = Date.now() - lastChangeAtRef.current;
        if (
          !stalledRetryFiredRef.current &&
          stalledFor > STALL_THRESHOLD_MS &&
          data.hasBusiness
        ) {
          stalledRetryFiredRef.current = true;
          try {
            await startProvisioning();
            toast.message('Retrying provisioning…', {
              description: 'This usually takes under a minute.',
            });
          } catch {
            // Best-effort; swallow.
          }
        }
      } catch {
        // Network blip — next interval will retry.
      }
    }

    // Kick once immediately so we don't wait 2s for the first paint.
    tick();
    const handle = window.setInterval(tick, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(handle);
    };
  }, [router]);

  return (
    <>
      <ProgressDots currentStep={stepIndex('provisioning')} />
      <StepProvisioning completedSteps={completedSteps} />
    </>
  );
}
