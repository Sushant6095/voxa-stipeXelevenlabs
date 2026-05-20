'use client';

import { Check, Copy, Phone } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';

import { ShimmerButton } from '@/components/ui/shimmer-button';
import { SparklesText } from '@/components/ui/sparkles-text';
import { cn } from '@/lib/utils';

/**
 * Step 6 — Success.
 *
 * Sparkles headline, the freshly provisioned number in big mono type with a
 * copy-to-clipboard control, and a primary CTA that opens the dialer on
 * mobile. A subtle WhatsApp affordance reminds the owner that activation has
 * already been sent.
 */
interface StepSuccessProps {
  readonly phoneNumber: string;
}

/**
 * Format an E.164 number into a readable Voxa wordmark. Examples:
 *  - +918045678910 → "+91 80 4567 8910"
 *  - +14155552671  → "+1 415 555 2671"
 *  - +9180456789   → "+91 80456789"      (best-effort fallback)
 *
 * We do not want to ship `libphonenumber-js` here — the runtime cost is
 * disproportionate to the one place we render a number on this surface.
 */
function formatPhoneNumber(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed.startsWith('+')) return trimmed;

  // India fast-path (+91 then STD+local): "+91 80 4567 8910"
  if (trimmed.startsWith('+91') && trimmed.length === 13) {
    const cc = trimmed.slice(0, 3);
    const std = trimmed.slice(3, 5);
    const part1 = trimmed.slice(5, 9);
    const part2 = trimmed.slice(9);
    return `${cc} ${std} ${part1} ${part2}`;
  }

  // US/CA fast-path (+1 NXX NXX XXXX)
  if (trimmed.startsWith('+1') && trimmed.length === 12) {
    return `${trimmed.slice(0, 2)} ${trimmed.slice(2, 5)} ${trimmed.slice(5, 8)} ${trimmed.slice(8)}`;
  }

  // Generic fallback — chunk in groups of 3 after the country code.
  const country = trimmed.slice(0, 3);
  const rest = trimmed.slice(3);
  const groups: string[] = [];
  for (let i = 0; i < rest.length; i += 3) {
    groups.push(rest.slice(i, i + 3));
  }
  return `${country} ${groups.join(' ')}`.trim();
}

export function StepSuccess({ phoneNumber }: StepSuccessProps) {
  const [copied, setCopied] = useState(false);

  const formatted = formatPhoneNumber(phoneNumber);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(phoneNumber);
      setCopied(true);
      toast.success('Number copied');
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error('Could not copy — try selecting the number instead');
    }
  };

  return (
    <section
      aria-labelledby="success-heading"
      className="flex flex-col items-center text-center"
    >
      <SparklesText
        className="font-display text-3xl tracking-tight text-slate-950 sm:text-4xl dark:text-slate-50"
        colors={{ first: '#6366F1', second: '#10B981' }}
        sparklesCount={16}
      >
        <span id="success-heading">You&apos;re live!</span>
      </SparklesText>

      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
        className="mt-4 max-w-md text-sm text-slate-600 sm:text-base dark:text-slate-400"
      >
        Your AI receptionist is ready. Call this number to hear it in action.
      </motion.p>

      {/* Phone number — the screenshot moment */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="mt-10"
      >
        <div className="relative inline-flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white/70 px-6 py-5 backdrop-blur-sm dark:border-slate-800/60 dark:bg-slate-950/40">
          <Phone
            className="h-5 w-5 text-[#6366F1] sm:h-6 sm:w-6"
            aria-hidden="true"
          />
          <span
            className="select-all font-mono text-2xl font-semibold tracking-tight text-slate-950 sm:text-4xl dark:text-slate-50"
            aria-label={`Your AI receptionist phone number ${formatted}`}
          >
            {formatted}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className={cn(
              'ml-1 grid size-9 place-items-center rounded-lg border transition-colors',
              'border-slate-200/70 bg-white/70 hover:bg-white dark:border-slate-700 dark:bg-slate-900/60 dark:hover:bg-slate-900',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]/40',
            )}
            aria-label="Copy phone number"
          >
            {copied ? (
              <Check
                className="h-4 w-4 text-emerald-500"
                aria-hidden="true"
              />
            ) : (
              <Copy
                className="h-4 w-4 text-slate-500 dark:text-slate-400"
                aria-hidden="true"
              />
            )}
          </button>
        </div>
      </motion.div>

      {/* Call now CTA */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35, ease: 'easeOut' }}
        className="mt-8"
      >
        <Link href={`tel:${phoneNumber}`} aria-label="Call your AI receptionist">
          <ShimmerButton
            background="#10B981"
            shimmerColor="#ffffff"
            shimmerDuration="2.4s"
            borderRadius="9999px"
            className="px-7 py-3 text-sm font-semibold sm:text-base"
          >
            <span className="inline-flex items-center gap-2 text-white">
              <Phone className="h-4 w-4" aria-hidden="true" />
              Call your AI receptionist now
            </span>
          </ShimmerButton>
        </Link>
      </motion.div>

      <p className="mt-6 max-w-md text-sm text-slate-600 dark:text-slate-400">
        We just sent you a WhatsApp confirmation.
      </p>

      <Link
        href="/dashboard"
        className="group/dash mt-8 inline-flex items-center gap-1 text-sm font-medium text-[#6366F1] underline-offset-4 transition hover:underline dark:text-[#A5B4FC]"
      >
        Go to dashboard
        <span
          aria-hidden="true"
          className="transition-transform group-hover/dash:translate-x-0.5"
        >
          &rarr;
        </span>
      </Link>
    </section>
  );
}
