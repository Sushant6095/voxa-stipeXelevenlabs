'use client';

import {
  BarChart3,
  BookOpen,
  Building2,
  Calendar,
  ChevronDown,
  ExternalLink,
  Flame,
  Globe,
  GraduationCap,
  Heart,
  HeartPulse,
  LayoutDashboard,
  type LucideIcon,
  Menu,
  MessageCircle,
  Mic,
  PartyPopper,
  Phone,
  PlayCircle,
  Scissors,
  Sparkles,
  UtensilsCrossed,
  Video,
  Workflow,
  X,
  Zap,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import { VoxaWordmark } from '@/components/brand/voxa-logo';
import { Button } from '@/components/ui/button';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { cn } from '@/lib/utils';

interface NavLeafItem {
  label: string;
  description?: string;
  href: string;
  icon: LucideIcon;
  external?: boolean;
}

interface NavMegaColumn {
  heading: string;
  items: NavLeafItem[];
}

interface NavGroup {
  id: string;
  label: string;
  href?: string;
  columns?: NavMegaColumn[];
  footer?: { label: string; href: string; description: string };
}

const NAV: readonly NavGroup[] = [
  {
    id: 'product',
    label: 'Product',
    columns: [
      {
        heading: 'Core',
        items: [
          {
            label: 'Voice cloning',
            description: 'Your AI sounds like you in 60 seconds',
            href: '/#features',
            icon: Mic,
          },
          {
            label: 'Multilingual',
            description: 'English, Hindi, Tamil, Telugu',
            href: '/#features',
            icon: Globe,
          },
          {
            label: 'Knowledge base',
            description: 'Paste a URL, the agent answers from it',
            href: '/#features',
            icon: BookOpen,
          },
        ],
      },
      {
        heading: 'Workflow',
        items: [
          {
            label: 'Calendar booking',
            description: 'Cal.com integration, double-confirm',
            href: '/#features',
            icon: Calendar,
          },
          {
            label: 'WhatsApp follow-up',
            description: 'Auto-confirmations after every booking',
            href: '/#features',
            icon: MessageCircle,
          },
          {
            label: 'Smart escalation',
            description: 'Forward angry callers to a human',
            href: '/#features',
            icon: Flame,
          },
        ],
      },
      {
        heading: 'For owners',
        items: [
          {
            label: 'Live dashboard',
            description: 'Watch calls flow through your stack',
            href: '/dashboard',
            icon: LayoutDashboard,
          },
          {
            label: 'Daily digest',
            description: '6 PM WhatsApp summary of every call',
            href: '/#features',
            icon: BarChart3,
          },
          {
            label: 'Stripe billing',
            description: 'Per-minute metering, no surprises',
            href: '/pricing',
            icon: Zap,
          },
        ],
      },
    ],
    footer: {
      label: 'Watch the 60-second demo',
      description: 'See Voxa take a real call from a customer',
      href: '/#demo',
    },
  },
  {
    id: 'solutions',
    label: 'Solutions',
    columns: [
      {
        heading: 'By industry',
        items: [
          {
            label: 'Dental & medical',
            description: 'Appointment-heavy, urgent intake',
            href: '/pricing',
            icon: HeartPulse,
          },
          {
            label: 'Salons & spas',
            description: 'High call volume, low-margin bookings',
            href: '/pricing',
            icon: Scissors,
          },
          {
            label: 'Real estate',
            description: 'Pre-qualify leads, route serious buyers',
            href: '/pricing',
            icon: Building2,
          },
        ],
      },
      {
        heading: 'More verticals',
        items: [
          {
            label: 'Healthcare',
            description: 'Clinics, diagnostics, pharmacy',
            href: '/pricing',
            icon: Heart,
          },
          {
            label: 'Tutors & coaches',
            description: 'Parent inquiries, demo class scheduling',
            href: '/pricing',
            icon: GraduationCap,
          },
          {
            label: 'Restaurants & cafés',
            description: 'Reservations, menu Q&A',
            href: '/pricing',
            icon: UtensilsCrossed,
          },
        ],
      },
    ],
    footer: {
      label: "Don't see your industry?",
      description: 'Voxa adapts to any front-desk workflow.',
      href: '/pricing',
    },
  },
  { id: 'pricing', label: 'Pricing', href: '/pricing' },
  { id: 'docs', label: 'API docs', href: '/docs' },
  {
    id: 'resources',
    label: 'Resources',
    columns: [
      {
        heading: 'Learn',
        items: [
          {
            label: 'Demo video',
            description: 'Watch a real call in 60 seconds',
            href: '/#demo',
            icon: PlayCircle,
          },
          {
            label: 'How it works',
            description: 'The 3-step flow under the hood',
            href: '/#how',
            icon: Workflow,
          },
          {
            label: 'Changelog',
            description: 'What shipped this week',
            href: '/#changelog',
            icon: Sparkles,
          },
        ],
      },
      {
        heading: 'Try it',
        items: [
          {
            label: 'Live dashboard',
            description: 'Open the operator UI',
            href: '/dashboard',
            icon: LayoutDashboard,
          },
          {
            label: 'Start onboarding',
            description: 'The 6-step setup wizard',
            href: '/onboarding/welcome',
            icon: PartyPopper,
          },
          {
            label: 'Health check',
            description: 'Service status JSON',
            href: '/api/health',
            icon: Phone,
            external: true,
          },
        ],
      },
    ],
    footer: {
      label: 'Sample a video walkthrough',
      description: 'Three minutes, no signup.',
      href: '/#demo',
    },
  },
];

// ---- Component ------------------------------------------------------------

interface MarketingNavbarProps {
  /** When true, the navbar starts transparent and gains a glass background
   *  only after the user scrolls past ~40px. Default true for landing pages. */
  hydrateScroll?: boolean;
}

export function MarketingNavbar({ hydrateScroll = true }: MarketingNavbarProps) {
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(!hydrateScroll);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const closeTimer = useRef<number | null>(null);
  const pathname = usePathname();

  // Close menus on route change
  useEffect(() => {
    setOpenGroup(null);
    setMobileOpen(false);
  }, [pathname]);

  // Close on Escape
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpenGroup(null);
        setMobileOpen(false);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Click outside closes
  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) {
        setOpenGroup(null);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // Scroll → frosted background
  useEffect(() => {
    if (!hydrateScroll) return;
    function onScroll() {
      setScrolled(window.scrollY > 24);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [hydrateScroll]);

  const scheduleClose = useCallback(() => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpenGroup(null), 120);
  }, []);

  const cancelClose = useCallback(() => {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const activeGroup = NAV.find((g) => g.id === openGroup) ?? null;

  return (
    <div ref={rootRef} className="relative">
      <header
        className={cn(
          'sticky top-0 z-50 transition-all duration-300',
          scrolled
            ? 'border-b border-black/[0.06] bg-white/72 backdrop-blur-2xl backdrop-saturate-150 dark:border-white/10 dark:bg-black/60'
            : 'border-b border-transparent bg-white/40 backdrop-blur-md dark:bg-black/30',
        )}
        onMouseLeave={scheduleClose}
      >
        <nav
          aria-label="Primary"
          className="mx-auto flex h-12 max-w-6xl items-center justify-between px-4 sm:px-6"
        >
          {/* Logo */}
          <Link href="/" aria-label="Voxa home">
            <VoxaWordmark size={26} />
          </Link>

          {/* Desktop nav */}
          <ul
            className="hidden items-center gap-1 lg:flex"
            onMouseEnter={cancelClose}
          >
            {NAV.map((group) => {
              const isOpen = openGroup === group.id;
              if (group.href && !group.columns) {
                return (
                  <li key={group.id}>
                    <Link
                      href={group.href}
                      className={cn(
                        'inline-flex h-8 items-center rounded-full px-3 text-[13px] font-medium text-foreground/80 transition-colors',
                        'hover:bg-foreground/[0.06] hover:text-foreground',
                        pathname === group.href && 'text-foreground',
                      )}
                    >
                      {group.label}
                    </Link>
                  </li>
                );
              }
              return (
                <li key={group.id}>
                  <button
                    type="button"
                    onMouseEnter={() => {
                      cancelClose();
                      setOpenGroup(group.id);
                    }}
                    onFocus={() => setOpenGroup(group.id)}
                    onClick={() => setOpenGroup(isOpen ? null : group.id)}
                    aria-expanded={isOpen}
                    aria-haspopup="true"
                    className={cn(
                      'inline-flex h-8 items-center gap-1 rounded-full px-3 text-[13px] font-medium text-foreground/80 transition-colors',
                      'hover:bg-foreground/[0.06] hover:text-foreground',
                      isOpen && 'bg-foreground/[0.06] text-foreground',
                    )}
                  >
                    {group.label}
                    <ChevronDown
                      aria-hidden="true"
                      className={cn(
                        'size-3 transition-transform',
                        isOpen && 'rotate-180',
                      )}
                    />
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Right CTAs */}
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="hidden text-[13px] font-medium text-foreground/80 transition-colors hover:text-foreground lg:inline-flex"
            >
              Dashboard
            </Link>
            <a
              href="tel:+19129126711"
              className="hidden lg:inline-flex"
              aria-label="Call the live AI demo at +1 (912) 912-6711"
            >
              <ShimmerButton
                background="#1d1d1f"
                shimmerColor="#ffffff"
                className="h-8 px-4"
              >
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-white">
                  <Phone aria-hidden className="size-3" />
                  Call AI demo
                </span>
              </ShimmerButton>
            </a>
            {/* Mobile trigger */}
            <Button
              variant="ghost"
              size="icon-sm"
              className="lg:hidden"
              aria-label="Open menu"
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? (
                <X aria-hidden className="size-4" />
              ) : (
                <Menu aria-hidden className="size-4" />
              )}
            </Button>
          </div>
        </nav>

        {/* Mega menu panel — desktop */}
        <AnimatePresence>
          {activeGroup?.columns && (
            <motion.div
              key={activeGroup.id}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              onMouseEnter={cancelClose}
              onMouseLeave={scheduleClose}
              className="absolute inset-x-0 top-full hidden lg:block"
            >
              <div className="border-b border-black/[0.06] bg-white/85 backdrop-blur-2xl backdrop-saturate-150 dark:border-white/10 dark:bg-black/75">
                <div className="mx-auto grid max-w-6xl gap-10 px-6 py-8 lg:grid-cols-[1.6fr_1fr]">
                  <div
                    className={cn(
                      'grid gap-x-10 gap-y-6',
                      activeGroup.columns.length === 3
                        ? 'sm:grid-cols-3'
                        : 'sm:grid-cols-2',
                    )}
                  >
                    {activeGroup.columns.map((col) => (
                      <div key={col.heading}>
                        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-foreground/45">
                          {col.heading}
                        </p>
                        <ul className="mt-3 space-y-1.5">
                          {col.items.map((item) => (
                            <MegaItem key={item.label} item={item} />
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>

                  {activeGroup.footer && (
                    <Link
                      href={activeGroup.footer.href}
                      className={cn(
                        'group relative flex flex-col justify-end overflow-hidden rounded-2xl border border-black/[0.06] p-6',
                        'bg-gradient-to-br from-indigo-500/[0.07] via-fuchsia-500/[0.06] to-pink-500/[0.07]',
                        'dark:border-white/10 dark:from-indigo-500/[0.18] dark:via-fuchsia-500/[0.12] dark:to-pink-500/[0.18]',
                      )}
                    >
                      <div className="absolute -right-6 -top-6 size-32 rounded-full bg-pink-500/20 blur-3xl transition-opacity group-hover:opacity-75" />
                      <div className="relative">
                        <Video
                          aria-hidden
                          className="mb-3 size-7 text-foreground/70 transition-transform group-hover:scale-110"
                        />
                        <p className="text-sm font-semibold text-foreground">
                          {activeGroup.footer.label}
                        </p>
                        <p className="mt-1 text-xs text-foreground/65">
                          {activeGroup.footer.description}
                        </p>
                      </div>
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 top-12 z-40 overflow-y-auto bg-white/95 backdrop-blur-xl dark:bg-black/95 lg:hidden"
          >
            <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
              <ul className="divide-y divide-black/[0.06] dark:divide-white/10">
                {NAV.map((group) => (
                  <li key={group.id} className="py-2">
                    <MobileGroup group={group} />
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex flex-col gap-3 px-1">
                <Link
                  href="/dashboard"
                  className="text-center text-sm font-medium text-foreground/80"
                >
                  Dashboard
                </Link>
                <a
                  href="tel:+19129126711"
                  className="inline-flex w-full justify-center"
                  aria-label="Call the live AI demo at +1 (912) 912-6711"
                >
                  <ShimmerButton
                    background="#1d1d1f"
                    shimmerColor="#ffffff"
                    className="w-full h-10"
                  >
                    <span className="inline-flex items-center gap-2 text-sm font-medium text-white">
                      <Phone aria-hidden className="size-4" />
                      Call AI demo: +1 (912) 912-6711
                    </span>
                  </ShimmerButton>
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---- Inner pieces --------------------------------------------------------

function MegaItem({ item }: { item: NavLeafItem }) {
  const Icon = item.icon;
  return (
    <li>
      <Link
        href={item.href}
        {...(item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        className={cn(
          'group/item flex items-start gap-3 rounded-xl p-2 -mx-2 transition-colors',
          'hover:bg-foreground/[0.04] dark:hover:bg-white/[0.05]',
        )}
      >
        <span
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-lg',
            'bg-foreground/[0.06] text-foreground/70 group-hover/item:bg-primary/12 group-hover/item:text-primary',
            'transition-colors',
          )}
        >
          <Icon aria-hidden className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1 text-sm font-medium text-foreground">
            {item.label}
            {item.external && (
              <ExternalLink aria-hidden className="size-3 text-foreground/40" />
            )}
          </span>
          {item.description && (
            <span className="mt-0.5 block text-xs leading-snug text-foreground/60">
              {item.description}
            </span>
          )}
        </span>
      </Link>
    </li>
  );
}

function MobileGroup({ group }: { group: NavGroup }) {
  const [open, setOpen] = useState(false);
  if (group.href && !group.columns) {
    return (
      <Link
        href={group.href}
        className="flex items-center justify-between px-1 py-3 text-base font-medium text-foreground"
      >
        {group.label}
      </Link>
    );
  }
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-1 py-3 text-base font-medium text-foreground"
      >
        {group.label}
        <ChevronDown
          aria-hidden
          className={cn(
            'size-4 text-foreground/50 transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>
      <AnimatePresence>
        {open && group.columns && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="space-y-4 pb-3 pl-1">
              {group.columns.map((col) => (
                <div key={col.heading}>
                  <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-foreground/45">
                    {col.heading}
                  </p>
                  <ul className="mt-1 space-y-0.5">
                    {col.items.map((item) => (
                      <MegaItem key={item.label} item={item} />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
