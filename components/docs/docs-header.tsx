'use client';

import { IconBrandGithub } from '@tabler/icons-react';
import { ExternalLink, Menu, Search, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { VoxaWordmark } from '@/components/brand/voxa-logo';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { DocsSidebar } from './docs-nav';

interface DocsHeaderProps {
  /** Optional right-side breadcrumb element (e.g. "API reference / Voice clone"). */
  breadcrumb?: React.ReactNode;
}

export function DocsHeader({ breadcrumb }: DocsHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header
      className={cn(
        'sticky top-0 z-40 border-b border-black/[0.06] bg-white/85 backdrop-blur-2xl backdrop-saturate-150',
        'dark:border-white/10 dark:bg-black/70',
      )}
    >
      <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-3 px-4 sm:px-6">
        <Link href="/" aria-label="Voxa home" className="shrink-0">
          <VoxaWordmark size={26} />
        </Link>
        <span className="hidden text-xs font-medium text-foreground/40 lg:inline">
          /
        </span>
        <Link
          href="/docs"
          className="hidden text-[13px] font-semibold text-foreground lg:inline"
        >
          API docs
        </Link>

        {breadcrumb && (
          <span className="hidden truncate text-[13px] text-foreground/60 lg:inline">
            <span className="mx-2 text-foreground/30">/</span>
            {breadcrumb}
          </span>
        )}

        {/* Mock search — Stripe-like ⌘K placeholder */}
        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            disabled
            className={cn(
              'hidden h-8 items-center gap-2 rounded-lg border border-black/[0.08] bg-foreground/[0.02] px-3 text-xs text-foreground/55',
              'transition-colors hover:bg-foreground/[0.04] sm:flex',
              'dark:border-white/10 dark:bg-white/[0.03]',
            )}
            aria-label="Search the docs"
          >
            <Search aria-hidden className="size-3.5" />
            <span>Search docs</span>
            <kbd className="ml-3 hidden rounded border border-black/[0.06] bg-white px-1.5 py-px font-mono text-[10px] text-foreground/55 sm:inline dark:border-white/10 dark:bg-white/[0.04]">
              ⌘K
            </kbd>
          </button>

          <Link
            href="https://github.com/voxa-ai/voxa"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-foreground/75 hover:bg-foreground/[0.04] sm:flex"
            aria-label="GitHub"
          >
            <IconBrandGithub aria-hidden className="size-3.5" stroke={2} />
            <span className="hidden md:inline">GitHub</span>
          </Link>

          <Link
            href="/dashboard"
            className="hidden h-8 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 sm:flex"
          >
            Sign in
            <ExternalLink aria-hidden className="size-3" />
          </Link>

          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Open docs navigation"
                  className="lg:hidden"
                />
              }
            >
              {mobileOpen ? <X /> : <Menu />}
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] p-0">
              <div className="h-full overflow-y-auto px-4">
                <DocsSidebar onNavigate={() => setMobileOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
