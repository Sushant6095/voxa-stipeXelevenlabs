'use client';

import { motion } from 'motion/react';

import { cn } from '@/lib/utils';

/**
 * Six-step pill progress indicator for the onboarding wizard. Each step is a
 * fixed-width rounded bar; completed steps fill solid, the active step gets a
 * `motion.layoutId` so the indigo→pink wash slides smoothly between routes.
 *
 * The wizard pages share this component, so the layoutId animation is what
 * makes route transitions feel continuous instead of "page A unmounts /
 * page B mounts".
 *
 * The page-level `stepIndex()` helper returns `number`; we clamp to 1..6 here
 * so a stray value can't corrupt the indicator.
 */
interface ProgressDotsProps {
  readonly currentStep: number;
}

const STEPS: ReadonlyArray<number> = [1, 2, 3, 4, 5, 6];

export function ProgressDots({ currentStep }: ProgressDotsProps) {
  const clamped = Math.max(1, Math.min(6, Math.round(currentStep)));
  return (
    <div
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={6}
      aria-valuenow={clamped}
      aria-label={`Onboarding step ${clamped} of 6`}
      className="mb-8 flex items-center justify-center gap-2"
    >
      {STEPS.map((step) => {
        const isComplete = step < clamped;
        const isActive = step === clamped;
        return (
          <div
            key={step}
            className={cn(
              'relative h-2 w-10 overflow-hidden rounded-full',
              'bg-slate-200 dark:bg-slate-800',
            )}
          >
            {isComplete ? (
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-[#6366F1]/85"
              />
            ) : null}
            {isActive ? (
              <motion.div
                layoutId="onboarding-progress"
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-r from-[#6366F1] to-[#EC4899]"
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
