'use client';

import { Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCommandPalette } from './command-palette-provider';

interface CommandPaletteTriggerProps {
  /** When true, renders a single icon button instead of the wide pill. */
  compact?: boolean;
}

/**
 * Visual entry point to the cmdk command palette. The actual modal +
 * keyboard handler lives in `<CommandPaletteProvider />`. This component
 * only renders the visible trigger and opens the modal on click.
 */
export function CommandPaletteTrigger({
  compact = false,
}: CommandPaletteTriggerProps) {
  const { open } = useCommandPalette();

  if (compact) {
    return (
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Open command palette"
        onClick={() => open()}
      >
        <Search />
      </Button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => open()}
      aria-label="Open command palette"
      className={cn(
        'group flex w-full items-center gap-2 rounded-lg border border-border/60 bg-muted/40 px-3 py-1.5',
        'text-sm text-muted-foreground transition-colors',
        'hover:border-voxa-primary/30 hover:bg-muted/60 hover:text-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-voxa-primary/40',
      )}
    >
      <Search aria-hidden="true" className="size-3.5 shrink-0" />
      <span className="flex-1 text-left">Search calls, leads, settings…</span>
      <kbd
        className={cn(
          'pointer-events-none hidden h-5 select-none items-center gap-0.5 rounded border border-border/80 bg-background px-1.5',
          'font-mono text-[10px] font-medium text-muted-foreground sm:inline-flex',
        )}
      >
        <span className="text-xs">⌘</span>K
      </kbd>
    </button>
  );
}
