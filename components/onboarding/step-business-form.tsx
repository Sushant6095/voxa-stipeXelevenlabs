'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm, type Resolver } from 'react-hook-form';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import {
  businessFormSchema,
  type BusinessFormValues,
} from '@/lib/onboarding/schemas';
import { cn } from '@/lib/utils';

/**
 * Step 2 — Business details.
 *
 * Pure presentation: react-hook-form validates against the shared zod schema
 * and forwards parsed values to `onSubmit`. The parent owns the network call
 * and toasts; we only manage local UX state (focused field, pending spinner).
 *
 * Submit button is a ShimmerButton with an inline Loader2 while
 * `onSubmit(values)` is in-flight.
 */
interface StepBusinessFormProps {
  readonly onSubmit: (values: BusinessFormValues) => Promise<void>;
  readonly defaultValues?: Partial<BusinessFormValues>;
}

interface LanguageOption {
  readonly code: BusinessFormValues['language'];
  readonly label: string;
  readonly native: string;
}

const LANGUAGE_OPTIONS: ReadonlyArray<LanguageOption> = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు' },
];

export function StepBusinessForm({
  onSubmit,
  defaultValues,
}: StepBusinessFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // `@hookform/resolvers@5.2.2` bundles its own `zod/v4/core` types whose
  // patch version disagrees with the project's `zod@4.4.3` (`version.minor`
  // 4 vs 0). The schema is structurally identical at runtime; we cast at the
  // call boundary so the rest of the form stays fully typed against
  // BusinessFormValues.
  const businessResolver = zodResolver(
    businessFormSchema as unknown as Parameters<typeof zodResolver>[0],
  ) as unknown as Resolver<BusinessFormValues>;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<BusinessFormValues>({
    resolver: businessResolver,
    defaultValues: {
      name: defaultValues?.name ?? '',
      ownerWhatsApp: defaultValues?.ownerWhatsApp ?? '',
      language: defaultValues?.language ?? 'en',
      websiteUrl: defaultValues?.websiteUrl ?? '',
    },
    mode: 'onBlur',
  });

  const submit = handleSubmit(async (values) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <section aria-labelledby="business-form-heading">
      <header className="text-center">
        <h1
          id="business-form-heading"
          className="font-display text-2xl tracking-tight text-slate-950 sm:text-3xl dark:text-slate-50"
        >
          Tell us about your business
        </h1>
        <p className="mt-2 text-sm text-slate-600 sm:text-base dark:text-slate-400">
          We&apos;ll use these to brief your AI receptionist.
        </p>
      </header>

      <form noValidate onSubmit={submit} className="mt-10 space-y-6">
        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="business-name">Business name</Label>
          <Input
            id="business-name"
            type="text"
            autoComplete="organization"
            placeholder="Sharma Dental Clinic"
            aria-invalid={errors.name ? 'true' : 'false'}
            disabled={isSubmitting}
            {...register('name')}
          />
          {errors.name ? (
            <p role="alert" className="text-xs text-destructive">
              {errors.name.message}
            </p>
          ) : null}
        </div>

        {/* WhatsApp */}
        <div className="space-y-2">
          <Label htmlFor="owner-whatsapp">Your WhatsApp number</Label>
          <Input
            id="owner-whatsapp"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+919876543210"
            aria-invalid={errors.ownerWhatsApp ? 'true' : 'false'}
            disabled={isSubmitting}
            {...register('ownerWhatsApp')}
          />
          <p className="font-mono text-[11px] text-slate-400 dark:text-slate-500">
            We&apos;ll send the daily lead digest here.
          </p>
          {errors.ownerWhatsApp ? (
            <p role="alert" className="text-xs text-destructive">
              {errors.ownerWhatsApp.message}
            </p>
          ) : null}
        </div>

        {/* Language */}
        <div className="space-y-2">
          <Label>Primary language</Label>
          <Controller
            name="language"
            control={control}
            render={({ field }) => (
              <div
                role="radiogroup"
                aria-label="Primary language"
                className="grid grid-cols-2 gap-2 sm:grid-cols-4"
              >
                {LANGUAGE_OPTIONS.map((option) => {
                  const isSelected = field.value === option.code;
                  return (
                    <button
                      key={option.code}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => field.onChange(option.code)}
                      disabled={isSubmitting}
                      className={cn(
                        'group/lang relative flex flex-col items-center gap-1 rounded-xl border bg-white/70 px-3 py-3 text-sm transition-all dark:bg-slate-950/40',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]/50',
                        isSelected
                          ? 'border-[#6366F1] shadow-[0_0_0_3px_rgba(99,102,241,0.12),0_8px_24px_-12px_rgba(236,72,153,0.45)]'
                          : 'border-slate-200/70 hover:border-slate-300 dark:border-slate-800/60 dark:hover:border-slate-700',
                      )}
                    >
                      <span
                        className={cn(
                          'font-display text-base font-semibold',
                          isSelected
                            ? 'text-slate-950 dark:text-slate-50'
                            : 'text-slate-700 dark:text-slate-200',
                        )}
                      >
                        {option.native}
                      </span>
                      <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        {option.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          />
          {errors.language ? (
            <p role="alert" className="text-xs text-destructive">
              {errors.language.message}
            </p>
          ) : null}
        </div>

        {/* Website (optional) */}
        <div className="space-y-2">
          <Label htmlFor="website-url">
            Website{' '}
            <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
              optional
            </span>
          </Label>
          <Input
            id="website-url"
            type="url"
            inputMode="url"
            autoComplete="url"
            placeholder="https://sharmadental.in"
            aria-invalid={errors.websiteUrl ? 'true' : 'false'}
            disabled={isSubmitting}
            {...register('websiteUrl')}
          />
          {errors.websiteUrl ? (
            <p role="alert" className="text-xs text-destructive">
              {errors.websiteUrl.message}
            </p>
          ) : null}
        </div>

        <div className="pt-2">
          <ShimmerButton
            type="submit"
            disabled={isSubmitting}
            background="#6366F1"
            shimmerColor="#ffffff"
            shimmerDuration="2.4s"
            borderRadius="12px"
            className="w-full px-6 py-3 text-sm font-semibold sm:text-base"
            aria-label="Save business details and continue"
          >
            <span className="inline-flex items-center gap-2 text-white">
              {isSubmitting ? (
                <Loader2
                  className="h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
              ) : null}
              {isSubmitting ? 'Saving…' : 'Save and continue'}
            </span>
          </ShimmerButton>
        </div>
      </form>
    </section>
  );
}
