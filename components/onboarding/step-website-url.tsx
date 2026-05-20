'use client';

import { ProgressBar } from '@tremor/react';
import { CheckCircle2, Globe, Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { websiteUrlSchema } from '@/lib/onboarding/schemas';
import { cn } from '@/lib/utils';

/**
 * Step 4 — Website ingest.
 *
 * The parent's `onSubmit` runs the server action that pipes the URL into the
 * ElevenLabs knowledge base. We render an indeterminate Tremor progress bar
 * while pending, and a success affordance when the action resolves. The
 * parent navigates onward; we only show that the request landed.
 */
interface StepWebsiteUrlProps {
  readonly onSubmit: (url: string) => Promise<void>;
  readonly onSkip: () => void;
}

type LocalState = 'idle' | 'submitting' | 'success' | 'error';

const PROGRESS_TICK_MS = 120;
const PROGRESS_MAX_BEFORE_RESOLVE = 92;

export function StepWebsiteUrl({ onSubmit, onSkip }: StepWebsiteUrlProps) {
  const [url, setUrl] = useState('');
  const [state, setState] = useState<LocalState>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) clearInterval(timerRef.current);
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (state === 'submitting') return;

    const trimmed = url.trim();
    const parsed = websiteUrlSchema.safeParse({ url: trimmed });
    if (!parsed.success) {
      setErrorMsg(parsed.error.issues[0]?.message ?? 'Invalid URL');
      setState('error');
      return;
    }
    setErrorMsg(null);
    setState('submitting');
    setProgress(8);

    // Fake-ish progress so the user has visual feedback. Stops short of 100
    // until the server confirms, then jumps.
    timerRef.current = setInterval(() => {
      setProgress((p) =>
        p >= PROGRESS_MAX_BEFORE_RESOLVE ? p : p + (p < 60 ? 4 : 2),
      );
    }, PROGRESS_TICK_MS);

    try {
      await onSubmit(parsed.data.url);
      setProgress(100);
      setState('success');
    } catch (error: unknown) {
      setProgress(0);
      setState('error');
      setErrorMsg(
        error instanceof Error ? error.message : 'Could not ingest the URL',
      );
    } finally {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const isSubmitting = state === 'submitting';
  const isSuccess = state === 'success';

  return (
    <section
      aria-labelledby="website-heading"
      className="flex flex-col items-center text-center"
    >
      <header className="max-w-md">
        <h1
          id="website-heading"
          className="font-display text-2xl tracking-tight text-slate-950 sm:text-3xl dark:text-slate-50"
        >
          Teach Voxa your business
        </h1>
        <p className="mt-2 text-sm text-slate-600 sm:text-base dark:text-slate-400">
          Drop in your website and we&apos;ll ingest your hours, services, and
          pricing into the agent&apos;s knowledge base.
        </p>
      </header>

      <form
        noValidate
        onSubmit={handleSubmit}
        className="mt-8 w-full max-w-md space-y-3"
      >
        <Label htmlFor="website-input" className="sr-only">
          Website URL
        </Label>
        <div className="relative">
          <Globe
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500"
            aria-hidden="true"
          />
          <Input
            id="website-input"
            type="url"
            inputMode="url"
            autoComplete="url"
            placeholder="https://yourbusiness.in"
            value={url}
            onChange={(event) => {
              setUrl(event.target.value);
              if (state === 'error') setState('idle');
            }}
            disabled={isSubmitting || isSuccess}
            aria-invalid={state === 'error'}
            className="h-10 pl-9"
          />
        </div>

        <ShimmerButton
          type="submit"
          disabled={isSubmitting || isSuccess || url.trim().length === 0}
          background="#6366F1"
          shimmerColor="#ffffff"
          shimmerDuration="2.4s"
          borderRadius="12px"
          className="w-full px-6 py-3 text-sm font-semibold sm:text-base"
        >
          <span className="inline-flex items-center gap-2 text-white">
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : null}
            {isSubmitting ? 'Scraping…' : isSuccess ? 'Ingested' : 'Scrape'}
          </span>
        </ShimmerButton>

        <AnimatePresence mode="wait">
          {isSubmitting ? (
            <motion.div
              key="progress"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-left"
            >
              <ProgressBar value={progress} color="indigo" />
              <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                Reading your site
              </p>
            </motion.div>
          ) : null}

          {isSuccess ? (
            <motion.p
              key="success"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400"
              role="status"
            >
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              Website ingested
            </motion.p>
          ) : null}

          {errorMsg && state === 'error' ? (
            <motion.p
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              role="alert"
              className="text-sm text-destructive"
            >
              {errorMsg}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </form>

      <button
        type="button"
        onClick={onSkip}
        disabled={isSubmitting}
        className={cn(
          'mt-8 text-sm font-medium text-slate-500 underline-offset-4 transition hover:text-slate-700 hover:underline dark:text-slate-400 dark:hover:text-slate-200',
          isSubmitting && 'pointer-events-none opacity-40',
        )}
      >
        Skip for now
      </button>
    </section>
  );
}
