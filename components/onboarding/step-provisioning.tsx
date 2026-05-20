'use client';

import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

import { BlurFade } from '@/components/ui/blur-fade';
import { NumberTicker } from '@/components/ui/number-ticker';
import { cn } from '@/lib/utils';

/**
 * Step 5 — Provisioning.
 *
 * Driven entirely by `completedSteps` (0..6) so it stays in sync with the
 * `deriveProvisioningProgress()` output the page polls every 2s. The
 * NumberTicker is decorative — it counts visually down from 60 toward 0 to
 * give the screen tension while n8n is doing real work.
 *
 * Each line entrance uses BlurFade so checks materialise into the list
 * rather than flicking on.
 */
interface StepProvisioningProps {
  readonly completedSteps: number;
}

interface ChecklistItem {
  readonly id: number;
  readonly label: string;
}

const ITEMS: ReadonlyArray<ChecklistItem> = [
  { id: 1, label: 'Saving business details' },
  { id: 2, label: 'Cloning voice' },
  { id: 3, label: 'Creating AI agent' },
  { id: 4, label: 'Buying phone number' },
  { id: 5, label: 'Importing to ElevenLabs' },
  { id: 6, label: 'Sending WhatsApp activation' },
];

type ItemStatus = 'done' | 'active' | 'pending';

function statusOf(itemId: number, completed: number): ItemStatus {
  if (completed >= itemId) return 'done';
  if (completed + 1 === itemId) return 'active';
  return 'pending';
}

export function StepProvisioning({ completedSteps }: StepProvisioningProps) {
  const clamped = Math.max(0, Math.min(ITEMS.length, completedSteps));

  return (
    <section
      aria-labelledby="provisioning-heading"
      className="flex flex-col items-center text-center"
    >
      <header className="max-w-md">
        <h1
          id="provisioning-heading"
          className="font-display text-2xl tracking-tight text-slate-950 sm:text-3xl dark:text-slate-50"
        >
          Provisioning your AI receptionist…
        </h1>
        <p className="mt-2 text-sm text-slate-600 sm:text-base dark:text-slate-400">
          Keep this tab open. We&apos;re wiring Twilio, ElevenLabs, and your
          knowledge base in the background.
        </p>
      </header>

      {/* Big decorative countdown */}
      <div
        className="mt-10 grid place-items-center"
        aria-hidden="true"
      >
        <div className="relative grid size-44 place-items-center">
          <motion.div
            aria-hidden="true"
            className="absolute inset-0 rounded-full bg-gradient-to-br from-[#6366F1]/15 via-[#EC4899]/10 to-transparent blur-2xl"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{
              duration: 3.2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <div className="grid size-32 place-items-center rounded-full border border-slate-200/70 bg-white/70 backdrop-blur-sm dark:border-slate-800/60 dark:bg-slate-950/40">
            <NumberTicker
              startValue={60}
              value={0}
              direction="down"
              className="font-mono text-5xl font-semibold tracking-tight text-slate-900 dark:text-slate-50"
            />
          </div>
        </div>
        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
          ~60 seconds
        </p>
      </div>

      {/* Checklist */}
      <ul
        aria-live="polite"
        aria-label="Provisioning progress"
        className="mt-10 w-full max-w-md space-y-2 text-left"
      >
        {ITEMS.map((item) => {
          const status = statusOf(item.id, clamped);
          return (
            <BlurFade
              key={item.id}
              delay={status === 'pending' ? 0 : item.id * 0.04}
              offset={4}
              duration={0.32}
            >
              <li
                className={cn(
                  'flex items-center gap-3 rounded-xl border bg-white/60 px-4 py-3 backdrop-blur-sm transition-all dark:bg-slate-950/40',
                  status === 'done'
                    ? 'border-emerald-200/70 dark:border-emerald-900/60'
                    : status === 'active'
                      ? 'border-[#6366F1]/40 shadow-[0_0_0_3px_rgba(99,102,241,0.08)]'
                      : 'border-slate-200/70 dark:border-slate-800/60',
                )}
              >
                <span className="grid size-6 flex-none place-items-center">
                  {status === 'done' ? (
                    <CheckCircle2
                      className="h-5 w-5 text-emerald-500"
                      aria-hidden="true"
                    />
                  ) : status === 'active' ? (
                    <Loader2
                      className="h-4.5 w-4.5 animate-spin text-[#6366F1]"
                      aria-hidden="true"
                    />
                  ) : (
                    <Circle
                      className="h-4.5 w-4.5 text-slate-300 dark:text-slate-700"
                      aria-hidden="true"
                    />
                  )}
                </span>
                <span
                  className={cn(
                    'text-sm',
                    status === 'pending'
                      ? 'text-slate-400 dark:text-slate-500'
                      : 'text-slate-700 dark:text-slate-200',
                    status === 'done' && 'font-medium',
                  )}
                >
                  {item.label}
                </span>
              </li>
            </BlurFade>
          );
        })}
      </ul>
    </section>
  );
}
