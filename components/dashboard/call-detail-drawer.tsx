'use client';

import { Drawer } from 'vaul';
import dynamic from 'next/dynamic';
import { motion } from 'motion/react';
import { Clock, Phone, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  formatCallTime,
  formatDuration,
  formatPhone,
  languageFlag,
  languageLabel,
} from '@/lib/format';
import { Button } from '@/components/ui/button';
import type { CallRowWithLead } from '@/lib/dashboard-data';

// Wavesurfer audio player — lazy-load, client-only.
const CallAudioPlayer = dynamic(() => import('./call-audio-player'), {
  ssr: false,
  loading: () => (
    <div className="h-16 w-full animate-pulse rounded-lg bg-muted/60" />
  ),
});

interface TranscriptTurn {
  role: 'agent' | 'caller' | 'system';
  text: string;
  ts?: number;
}

interface CallDetailDrawerProps {
  call: CallRowWithLead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Vaul drawer (bottom on mobile, right side on desktop) showing the
 * full transcript and an audio player for a call.
 */
export function CallDetailDrawer({
  call,
  open,
  onOpenChange,
}: CallDetailDrawerProps) {
  const turns = parseTranscript(call?.transcript ?? null);

  return (
    <Drawer.Root
      open={open}
      onOpenChange={onOpenChange}
      direction="right"
      handleOnly
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <Drawer.Content
          aria-describedby={undefined}
          className={cn(
            'fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-popover',
            'shadow-2xl outline-none sm:w-[min(560px,92vw)]',
          )}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 border-b border-border/60 px-5 py-4">
            <div className="flex flex-col gap-1">
              <Drawer.Title className="font-heading text-lg font-semibold text-foreground">
                {call?.lead?.customer_name ?? 'Incoming call'}
              </Drawer.Title>
              <Drawer.Description className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Phone aria-hidden="true" className="size-3" />
                  {formatPhone(call?.caller_phone)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock aria-hidden="true" className="size-3" />
                  {formatDuration(call?.duration_seconds)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <span aria-hidden="true">
                    {languageFlag(call?.language_detected)}
                  </span>
                  {languageLabel(call?.language_detected)}
                </span>
                <span>{formatCallTime(call?.created_at)}</span>
              </Drawer.Description>
            </div>
            <Drawer.Close asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Close transcript"
              >
                <X />
              </Button>
            </Drawer.Close>
          </div>

          {/* Summary (if any) */}
          {call?.summary && (
            <div className="border-b border-border/60 bg-muted/30 px-5 py-3 text-sm text-foreground/90">
              {call.summary}
            </div>
          )}

          {/* Transcript */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <div className="flex flex-col gap-3">
              {turns.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Transcript is being processed…
                </p>
              ) : (
                turns.map((turn, idx) => (
                  <TranscriptBubble key={idx} turn={turn} delay={idx * 0.04} />
                ))
              )}
            </div>
          </div>

          {/* Audio player */}
          {call?.audio_url && (
            <div className="border-t border-border/60 p-4">
              <CallAudioPlayer url={call.audio_url} />
            </div>
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

interface TranscriptBubbleProps {
  turn: TranscriptTurn;
  delay: number;
}

function TranscriptBubble({ turn, delay }: TranscriptBubbleProps) {
  const isAgent = turn.role === 'agent';
  const isSystem = turn.role === 'system';
  return (
    <motion.div
      initial={{ opacity: 0, y: 6, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.35, delay, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'flex',
        isSystem
          ? 'justify-center'
          : isAgent
            ? 'justify-start'
            : 'justify-end',
      )}
    >
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-3.5 py-2 text-sm',
          isSystem &&
            'border border-dashed border-border/60 bg-transparent text-xs uppercase tracking-wider text-muted-foreground',
          isAgent &&
            !isSystem &&
            'bg-muted/60 text-foreground rounded-bl-md',
          !isAgent &&
            !isSystem &&
            'bg-gradient-to-br from-voxa-primary/15 to-voxa-accent/15 text-foreground rounded-br-md',
        )}
      >
        {turn.text}
      </div>
    </motion.div>
  );
}

/**
 * Normalize the JSON transcript stored on a call. We accept either:
 *  - an array of `{ role, text, ts? }` turns
 *  - an array of `{ speaker, message, ts? }` turns (ElevenLabs format)
 *  - a single string (fallback)
 */
function parseTranscript(raw: unknown): TranscriptTurn[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((item: unknown): TranscriptTurn | null => {
        if (typeof item !== 'object' || item === null) return null;
        const obj = item as Record<string, unknown>;
        const role =
          obj.role === 'agent' || obj.role === 'caller' || obj.role === 'system'
            ? obj.role
            : obj.speaker === 'agent' || obj.speaker === 'user'
              ? obj.speaker === 'user'
                ? 'caller'
                : 'agent'
              : 'system';
        const text =
          typeof obj.text === 'string'
            ? obj.text
            : typeof obj.message === 'string'
              ? obj.message
              : '';
        const ts = typeof obj.ts === 'number' ? obj.ts : undefined;
        if (!text) return null;
        return { role, text, ts };
      })
      .filter((t): t is TranscriptTurn => t !== null);
  }
  if (typeof raw === 'string') {
    return [{ role: 'system', text: raw }];
  }
  return [];
}
