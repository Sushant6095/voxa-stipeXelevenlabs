'use client';

import { Phone } from 'lucide-react';
import { toast } from 'sonner';

import { ShimmerButton } from '@/components/ui/shimmer-button';

interface EmptyCallsStateProps {
  phoneNumber: string | null;
}

function formatPhone(e164: string | null): string {
  if (!e164) return '';
  // +91 80 4567 8910 — naive but works for hackathon demo
  const cc = e164.startsWith('+') ? e164.slice(0, 3) : '';
  const rest = e164.startsWith('+') ? e164.slice(3) : e164;
  const head = rest.slice(0, 2);
  const mid = rest.slice(2, 6);
  const tail = rest.slice(6);
  return [cc, head, mid, tail].filter(Boolean).join(' ');
}

export function EmptyCallsState({ phoneNumber }: EmptyCallsStateProps) {
  const onCopy = () => {
    if (!phoneNumber) return;
    navigator.clipboard.writeText(phoneNumber);
    toast.success('Number copied to clipboard', { description: phoneNumber });
  };

  return (
    <div className="mt-12 flex flex-col items-center justify-center text-center">
      <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
        <span className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
        <Phone aria-hidden className="size-9 text-primary" />
      </div>
      <h2 className="font-heading text-2xl font-semibold tracking-tight">
        No calls yet
      </h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {phoneNumber
          ? `Your AI receptionist is live at ${formatPhone(phoneNumber)}. Make a test call to see it in action.`
          : 'Complete onboarding to get your AI receptionist phone number.'}
      </p>
      {phoneNumber && (
        <ShimmerButton
          background="#6366F1"
          shimmerColor="#ffffff"
          className="mt-6"
          onClick={onCopy}
        >
          <span className="text-sm font-medium text-white">Copy number</span>
        </ShimmerButton>
      )}
    </div>
  );
}
