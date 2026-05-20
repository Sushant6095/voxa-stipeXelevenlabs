'use client';

import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';

export interface DocsNavItem {
  label: string;
  href: string;
  /** Optional pill — e.g. "Beta", "New", or a method (GET/POST) */
  badge?: string;
  badgeTone?: 'info' | 'success' | 'warning';
}
export interface DocsNavGroup {
  heading: string;
  items: DocsNavItem[];
}

export const DOCS_NAV: readonly DocsNavGroup[] = [
  {
    heading: 'Get started',
    items: [
      { label: 'Overview', href: '/docs' },
      { label: 'Quickstart', href: '/docs#quickstart' },
      { label: 'Architecture', href: '/docs/architecture' },
    ],
  },
  {
    heading: 'Core concepts',
    items: [
      { label: 'Authentication', href: '/docs/api#authentication' },
      { label: 'Errors', href: '/docs/api#errors' },
      { label: 'Rate limits', href: '/docs/api#rate-limits' },
      { label: 'Idempotency', href: '/docs/api#idempotency' },
    ],
  },
  {
    heading: 'API reference',
    items: [
      { label: 'Health', href: '/docs/api#health', badge: 'GET', badgeTone: 'info' },
      { label: 'Voice clone', href: '/docs/api#voice-clone', badge: 'POST', badgeTone: 'success' },
      { label: 'Knowledge ingest', href: '/docs/api#knowledge-ingest', badge: 'POST', badgeTone: 'success' },
      { label: 'Agent create', href: '/docs/api#agent-create', badge: 'POST', badgeTone: 'success' },
      { label: 'Onboarding status', href: '/docs/api#onboarding-status', badge: 'GET', badgeTone: 'info' },
      { label: 'Stripe checkout', href: '/docs/api#stripe-checkout', badge: 'POST', badgeTone: 'success' },
      { label: 'Stripe portal', href: '/docs/api#stripe-portal', badge: 'POST', badgeTone: 'success' },
    ],
  },
  {
    heading: 'Webhooks',
    items: [
      { label: 'Stripe events', href: '/docs/webhooks#stripe', badge: 'POST', badgeTone: 'success' },
      { label: 'ElevenLabs post-call', href: '/docs/webhooks#elevenlabs', badge: 'POST', badgeTone: 'success' },
      { label: 'Verifying signatures', href: '/docs/webhooks#signatures' },
    ],
  },
  {
    heading: 'n8n workflows',
    items: [
      { label: 'Onboarding (W1)', href: '/docs/architecture#workflow-1' },
      { label: 'Live tools (W2)', href: '/docs/architecture#workflow-2' },
      { label: 'Post-call (W3)', href: '/docs/architecture#workflow-3' },
      { label: 'Stripe events (W4)', href: '/docs/architecture#workflow-4' },
      { label: 'Daily digest (W5)', href: '/docs/architecture#workflow-5' },
    ],
  },
];

interface DocsSidebarProps {
  onNavigate?: () => void;
  className?: string;
}

function badgeClasses(tone: DocsNavItem['badgeTone']): string {
  switch (tone) {
    case 'success':
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
    case 'warning':
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
    case 'info':
    default:
      return 'bg-primary/10 text-primary';
  }
}

export function DocsSidebar({ onNavigate, className }: DocsSidebarProps) {
  const pathname = usePathname();
  return (
    <aside
      aria-label="Documentation navigation"
      className={cn('flex h-full w-full flex-col gap-7 py-8 pr-2', className)}
    >
      {DOCS_NAV.map((group) => (
        <div key={group.heading}>
          <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
            {group.heading}
          </p>
          <ul className="mt-2 space-y-0.5">
            {group.items.map((item) => {
              const [hrefPath, hash] = item.href.split('#');
              const isActive =
                pathname === hrefPath && (!hash || typeof window !== 'undefined' && window.location.hash === `#${hash}`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      'group flex items-center gap-2 rounded-md px-3 py-1.5 text-[13px] transition-colors',
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 font-medium dark:bg-indigo-500/15 dark:text-indigo-300'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/[0.04] dark:hover:text-white',
                    )}
                  >
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge && (
                      <span
                        className={cn(
                          'rounded-md px-1.5 py-0.5 font-mono text-[10px] font-medium tracking-wide',
                          badgeClasses(item.badgeTone),
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                    <ChevronRight
                      aria-hidden
                      className={cn(
                        'size-3 shrink-0 text-foreground/30 opacity-0 transition-opacity',
                        'group-hover:opacity-100',
                      )}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      <div className="mt-auto rounded-xl border border-black/[0.06] bg-foreground/[0.02] p-4 text-xs text-foreground/70 dark:border-white/10">
        <p className="font-semibold text-foreground">Need help?</p>
        <p className="mt-1 leading-snug">
          Voxa is in active development. Email{' '}
          <a
            href="mailto:dev@voxa.in"
            className="text-primary underline-offset-2 hover:underline"
          >
            dev@voxa.in
          </a>{' '}
          or open an issue on GitHub.
        </p>
      </div>
    </aside>
  );
}
