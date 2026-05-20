'use client';

import { motion } from 'motion/react';

import { ShimmerButton } from '@/components/ui/shimmer-button';
import { SparklesText } from '@/components/ui/sparkles-text';

/**
 * Step 1 — Welcome.
 *
 * Big sparkle headline confirming the Stripe subscription is live, calm
 * subcopy, single primary CTA wired to `onContinue`.
 */
interface StepWelcomeProps {
  readonly onContinue: () => void;
}

export function StepWelcome({ onContinue }: StepWelcomeProps) {
  return (
    <section
      aria-labelledby="welcome-heading"
      className="flex flex-col items-center text-center"
    >
      <SparklesText
        className="font-display text-3xl tracking-tight text-slate-950 sm:text-4xl dark:text-slate-50"
        colors={{ first: '#6366F1', second: '#EC4899' }}
        sparklesCount={12}
      >
        <span id="welcome-heading">Your subscription is active.</span>
      </SparklesText>

      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15, ease: 'easeOut' }}
        className="mt-6 max-w-md text-balance text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-300"
      >
        Let&apos;s get your AI receptionist ringing in 60 seconds.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3, ease: 'easeOut' }}
        className="mt-10"
      >
        <ShimmerButton
          onClick={onContinue}
          background="#6366F1"
          shimmerColor="#ffffff"
          shimmerDuration="2.4s"
          borderRadius="9999px"
          className="px-7 py-3 text-sm font-semibold sm:text-base"
          aria-label="Continue to business details"
        >
          <span className="text-white">Continue &rarr;</span>
        </ShimmerButton>
      </motion.div>

      <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
        Takes about 60 seconds
      </p>
    </section>
  );
}
