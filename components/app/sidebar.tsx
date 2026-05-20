'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'motion/react';
import {
  LayoutDashboard,
  Phone,
  Sparkles,
  BookOpen,
  Mic,
  CreditCard,
  Settings,
  type LucideIcon,
} from 'lucide-react';

import { VoxaWordmark } from '@/components/brand/voxa-logo';
import { cn } from '@/lib/utils';

/**
 * Voxa sidebar navigation — used inside `(app)/layout.tsx` for the
 * persistent left rail (desktop) and the mobile drawer.
 *
 * Active route detection uses `usePathname()`. The active pill rides a
 * shared `layoutId="nav-indicator"` motion node so the gradient
 * background slides smoothly when the user navigates.
 */

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const NAV_ITEMS_PRIMARY: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Calls', href: '/calls', icon: Phone },
  { label: 'Leads', href: '/leads', icon: Sparkles },
  { label: 'Knowledge', href: '/knowledge', icon: BookOpen },
  { label: 'Voice', href: '/voice', icon: Mic },
  { label: 'Billing', href: '/billing', icon: CreditCard },
];

export const NAV_ITEMS_SECONDARY: NavItem[] = [
  { label: 'Settings', href: '/settings', icon: Settings },
];

interface SidebarProps {
  /** Optional callback when the user taps a link — used to close the
   * mobile drawer. */
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      aria-label="Primary"
      className="flex h-full w-full flex-col gap-6 px-3 py-6"
    >
      {/* Wordmark — VoxaLogo crab + "voxa." */}
      <Link
        href="/dashboard"
        onClick={onNavigate}
        aria-label="Voxa dashboard"
        className="flex items-center px-3"
      >
        <VoxaWordmark size={30} />
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS_PRIMARY.map((item) => (
          <SidebarLink
            key={item.href}
            item={item}
            isActive={isPathActive(pathname, item.href)}
            onClick={onNavigate}
          />
        ))}

        <div className="mt-auto flex flex-col gap-1 border-t border-border/60 pt-3">
          {NAV_ITEMS_SECONDARY.map((item) => (
            <SidebarLink
              key={item.href}
              item={item}
              isActive={isPathActive(pathname, item.href)}
              onClick={onNavigate}
            />
          ))}
        </div>
      </nav>
    </aside>
  );
}

function isPathActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (href === '/dashboard') {
    return pathname === '/dashboard' || pathname === '/';
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

interface SidebarLinkProps {
  item: NavItem;
  isActive: boolean;
  onClick?: () => void;
}

function SidebarLink({ item, isActive, onClick }: SidebarLinkProps) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
        'text-muted-foreground hover:text-foreground',
        isActive && 'text-foreground',
      )}
    >
      {isActive && (
        <motion.span
          layoutId="nav-indicator"
          className={cn(
            'absolute inset-0 rounded-xl',
            'bg-gradient-to-r from-voxa-primary/15 via-voxa-primary/10 to-voxa-accent/10',
            'ring-1 ring-inset ring-voxa-primary/20',
          )}
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        />
      )}
      <span className="relative z-10 flex items-center gap-3">
        <Icon
          aria-hidden="true"
          className={cn(
            'size-4 shrink-0 transition-colors',
            isActive ? 'text-voxa-primary' : '',
          )}
        />
        <span className="relative z-10">{item.label}</span>
      </span>
    </Link>
  );
}
