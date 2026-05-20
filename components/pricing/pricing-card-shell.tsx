'use client';

import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import Tilt from 'react-parallax-tilt';

import { BorderBeam } from '@/components/ui/border-beam';
import { MagicCard } from '@/components/ui/magic-card';
import { cn } from '@/lib/utils';

/**
 * Client wrapper that adds parallax tilt + MagicCard cursor-spotlight to a
 * pricing card. The Growth tier additionally renders a BorderBeam and a
 * pulsing "Most popular" badge.
 *
 * `children` is the static card content (price, features, server-action
 * form). We keep that server-rendered upstream so the Stripe Checkout form
 * action stays a true server action, not a fetch wrapper.
 */
interface PricingCardShellProps {
  readonly highlighted?: boolean;
  readonly children: ReactNode;
}

export function PricingCardShell({
  highlighted = false,
  children,
}: PricingCardShellProps) {
  return (
    <Tilt
      tiltMaxAngleX={6}
      tiltMaxAngleY={6}
      scale={1.02}
      glareEnable={false}
      transitionSpeed={1200}
      perspective={1400}
      className="h-full"
    >
      <div
        className={cn(
          'relative h-full rounded-2xl',
          highlighted ? 'ring-1 ring-[#6366F1]/30' : '',
        )}
      >
        {highlighted ? (
          <motion.span
            aria-hidden="true"
            className="absolute -top-3 left-1/2 z-30 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#6366F1] to-[#EC4899] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white shadow-[0_8px_24px_-8px_rgba(236,72,153,0.6)]"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{
              repeat: Infinity,
              duration: 2,
              ease: 'easeInOut',
            }}
          >
            Most popular
          </motion.span>
        ) : null}

        <MagicCard
          className="h-full rounded-2xl"
          gradientFrom={highlighted ? '#6366F1' : '#9E7AFF'}
          gradientTo={highlighted ? '#EC4899' : '#FE8BBB'}
          gradientSize={240}
        >
          {children}
        </MagicCard>

        {highlighted ? (
          <BorderBeam
            size={250}
            duration={12}
            colorFrom="#6366F1"
            colorTo="#EC4899"
          />
        ) : null}
      </div>
    </Tilt>
  );
}
