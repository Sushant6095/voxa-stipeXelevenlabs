'use client';

import { Command } from 'cmdk';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  CreditCard,
  LayoutDashboard,
  Mic,
  Moon,
  Phone,
  Settings,
  Sparkles,
  SunMedium,
  type LucideIcon,
} from 'lucide-react';
import { useTheme } from 'next-themes';

import { cn } from '@/lib/utils';
import { NAV_ITEMS_PRIMARY, NAV_ITEMS_SECONDARY } from '@/components/app/sidebar';

interface CommandPaletteContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(
  null,
);

export function useCommandPalette(): CommandPaletteContextValue {
  const ctx = useContext(CommandPaletteContext);
  if (!ctx) {
    throw new Error(
      'useCommandPalette must be used inside <CommandPaletteProvider />',
    );
  }
  return ctx;
}

interface ActionItem {
  id: string;
  label: string;
  description?: string;
  icon: LucideIcon;
  shortcut?: string[];
  onSelect: () => void;
  keywords?: string[];
}

interface ActionGroup {
  heading: string;
  items: ActionItem[];
}

/**
 * Wraps app shell children and provides:
 *  - the ⌘K / Ctrl+K open shortcut (window-level keydown)
 *  - the imperative open/close API via `useCommandPalette()`
 *  - the rendered `<Command.Dialog />` itself
 *
 * Mount once in `app/(app)/layout.tsx`. Mounting multiple times will
 * cause the keyboard handler to fire twice.
 */
export function CommandPaletteProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);

  // ⌘K / Ctrl+K toggles the palette
  useEffect(() => {
    function handler(event: KeyboardEvent) {
      const isMac = typeof navigator !== 'undefined' &&
        /Mac|iPhone|iPad/.test(navigator.platform);
      const modifier = isMac ? event.metaKey : event.ctrlKey;
      if (modifier && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        toggle();
      }
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggle]);

  const groups: ActionGroup[] = useMemo(() => {
    const navIcons: Record<string, LucideIcon> = {
      '/dashboard': LayoutDashboard,
      '/calls': Phone,
      '/leads': Sparkles,
      '/knowledge': BookOpen,
      '/voice': Mic,
      '/billing': CreditCard,
      '/settings': Settings,
    };

    const navItems: ActionItem[] = [
      ...NAV_ITEMS_PRIMARY,
      ...NAV_ITEMS_SECONDARY,
    ].map((nav) => ({
      id: `nav-${nav.href}`,
      label: nav.label,
      icon: navIcons[nav.href] ?? LayoutDashboard,
      onSelect: () => {
        router.push(nav.href);
        close();
      },
      keywords: ['navigate', 'go to', nav.label.toLowerCase()],
    }));

    const themeItems: ActionItem[] = [
      {
        id: 'theme-light',
        label: 'Switch to light mode',
        icon: SunMedium,
        onSelect: () => {
          setTheme('light');
          close();
        },
        keywords: ['theme', 'light', 'day'],
      },
      {
        id: 'theme-dark',
        label: 'Switch to dark mode',
        icon: Moon,
        onSelect: () => {
          setTheme('dark');
          close();
        },
        keywords: ['theme', 'dark', 'night'],
      },
    ].filter((item) => {
      if (resolvedTheme === 'light' && item.id === 'theme-light') return false;
      if (resolvedTheme === 'dark' && item.id === 'theme-dark') return false;
      return true;
    });

    return [
      { heading: 'Navigate', items: navItems },
      {
        heading: 'Search',
        items: [
          {
            id: 'search-calls',
            label: 'Search calls…',
            description: 'Filter by caller, language, or lead',
            icon: Phone,
            onSelect: () => {
              router.push('/calls');
              close();
            },
            keywords: ['call', 'transcript', 'recording'],
          },
          {
            id: 'search-leads',
            label: 'Search leads…',
            description: 'Hot, contacted, won, lost',
            icon: Sparkles,
            onSelect: () => {
              router.push('/leads');
              close();
            },
            keywords: ['lead', 'customer', 'opportunity'],
          },
        ],
      },
      { heading: 'Settings', items: themeItems },
    ];
  }, [router, setTheme, resolvedTheme, close]);

  const value: CommandPaletteContextValue = useMemo(
    () => ({ isOpen, open, close, toggle }),
    [isOpen, open, close, toggle],
  );

  return (
    <CommandPaletteContext.Provider value={value}>
      {children}
      <Command.Dialog
        open={isOpen}
        onOpenChange={setIsOpen}
        label="Command palette"
        className={cn(
          'fixed inset-0 z-50 flex items-start justify-center p-4 sm:pt-[18vh]',
          'data-[state=closed]:pointer-events-none',
        )}
        overlayClassName="fixed inset-0 bg-black/40 backdrop-blur-sm"
      >
        <div
          className={cn(
            'relative w-full max-w-xl overflow-hidden rounded-2xl border border-border/60',
            'bg-popover shadow-2xl ring-1 ring-foreground/10',
          )}
        >
          <Command label="Voxa commands" className="flex flex-col">
            <div className="border-b border-border/60 px-4 py-3">
              <Command.Input
                placeholder="Search commands, navigate, or settings…"
                className={cn(
                  'w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground',
                )}
              />
            </div>
            <Command.List className="max-h-[55vh] overflow-y-auto p-2">
              <Command.Empty className="px-3 py-6 text-center text-sm text-muted-foreground">
                No results found.
              </Command.Empty>
              {groups.map((group) => (
                <Command.Group
                  key={group.heading}
                  heading={group.heading}
                  className="px-1 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5"
                >
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Command.Item
                        key={item.id}
                        value={`${item.label} ${item.keywords?.join(' ') ?? ''}`}
                        onSelect={item.onSelect}
                        className={cn(
                          'group flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 text-sm',
                          'aria-selected:bg-voxa-primary/10 aria-selected:text-foreground',
                          'data-[selected=true]:bg-voxa-primary/10 data-[selected=true]:text-foreground',
                        )}
                      >
                        <Icon
                          aria-hidden="true"
                          className="size-4 shrink-0 text-muted-foreground group-aria-selected:text-voxa-primary"
                        />
                        <div className="flex flex-1 flex-col">
                          <span className="font-medium leading-none text-foreground">
                            {item.label}
                          </span>
                          {item.description && (
                            <span className="mt-0.5 text-xs text-muted-foreground">
                              {item.description}
                            </span>
                          )}
                        </div>
                      </Command.Item>
                    );
                  })}
                </Command.Group>
              ))}
            </Command.List>
          </Command>
        </div>
      </Command.Dialog>
    </CommandPaletteContext.Provider>
  );
}
