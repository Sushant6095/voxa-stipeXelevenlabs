import Link from 'next/link';
import type { ReactNode } from 'react';

import { DotPattern } from '@/components/ui/dot-pattern';
import { cn } from '@/lib/utils';

/**
 * Onboarding wizard chrome. Server component — content slot is wrapped by
 * `app/onboarding/template.tsx` which re-runs its animation on every step
 * change so route transitions feel intentional, not abrupt.
 *
 * Background: dot pattern with a radial mask + the same `voxa-bg` gradient
 * the marketing pages use, so the wizard feels like one cohesive product
 * surface rather than a stripped-down post-purchase form.
 */
export default function OnboardingLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  return (
    <main className="voxa-bg-light dark:voxa-bg-dark relative isolate min-h-screen w-full overflow-hidden">
      <DotPattern
        width={22}
        height={22}
        cr={1.1}
        className={cn(
          '[mask-image:radial-gradient(ellipse_at_top,white,transparent_70%)]',
          'fill-slate-300/30 dark:fill-slate-500/25',
        )}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-1/2 -z-10 h-[36rem] w-[36rem] -translate-x-1/2 -translate-y-1/3 rounded-full opacity-50 blur-3xl dark:opacity-30"
        style={{
          backgroundImage:
            'radial-gradient(closest-side, rgba(99,102,241,0.45), rgba(236,72,153,0.25) 55%, transparent 75%)',
        }}
      />

      <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-6 py-10 sm:py-16">
        <header className="mb-10 flex items-center justify-center sm:mb-14">
          <Link
            href="/"
            aria-label="Voxa home"
            className="font-display text-2xl font-semibold tracking-tight text-slate-950 transition-colors hover:text-[#6366F1] dark:text-slate-50 dark:hover:text-[#A5B4FC]"
          >
            voxa<span className="text-[#EC4899]">.</span>
          </Link>
        </header>

        <div className="flex-1">{children}</div>

        <footer className="mt-12 text-center font-mono text-[10px] uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
          Made for Indian SMBs
        </footer>
      </div>
    </main>
  );
}
