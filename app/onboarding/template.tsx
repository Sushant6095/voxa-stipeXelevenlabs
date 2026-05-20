'use client';

import { motion } from 'motion/react';
import type { ReactNode } from 'react';

/**
 * Next.js re-mounts `template.tsx` on every route change, so wrapping the
 * children in a Motion fade gives the wizard a soft page transition without
 * any LayoutGroup gymnastics.
 */
export default function OnboardingTemplate({
  children,
}: {
  readonly children: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}
