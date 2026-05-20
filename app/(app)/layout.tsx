import { cn } from '@/lib/utils';

import { Sidebar } from '@/components/app/sidebar';
import { TopBar } from '@/components/app/top-bar';
import { CommandPaletteProvider } from '@/components/cmdk/command-palette-provider';
import { DotPattern } from '@/components/ui/dot-pattern';

/**
 * Voxa app shell — applies to every authenticated route under
 * `app/(app)/...`. The URL is unchanged by the route group parens, so
 * `/dashboard`, `/calls`, `/leads`, … are all wrapped by this layout.
 *
 * Composition:
 *  - Two-column desktop layout (sidebar 240px + main flex-1)
 *  - Mobile: sidebar collapses into a `<Sheet />` drawer (see TopBar)
 *  - `<DotPattern />` background with radial mask for brand depth
 *  - `<CommandPaletteProvider />` wraps so ⌘K works on every page
 */
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CommandPaletteProvider>
      <div
        className={cn(
          'voxa-bg-light dark:voxa-bg-dark relative min-h-screen w-full',
          'text-foreground',
        )}
      >
        {/* Background dot pattern with radial mask for atmospheric depth */}
        <DotPattern
          width={22}
          height={22}
          cr={1}
          className={cn(
            'fixed inset-0 -z-10',
            '[mask-image:radial-gradient(ellipse_80%_60%_at_50%_-10%,white,transparent_70%)]',
            'fill-slate-300/40 dark:fill-slate-500/20',
          )}
        />

        <div className="relative flex min-h-screen">
          {/* Desktop sidebar */}
          <div
            aria-label="Sidebar"
            className={cn(
              'sticky top-0 hidden h-screen w-60 shrink-0 border-r border-border/60',
              'bg-background/60 backdrop-blur-md lg:flex lg:flex-col',
            )}
          >
            <Sidebar />
          </div>

          {/* Main column */}
          <div className="flex min-w-0 flex-1 flex-col">
            <TopBar />
            <main className="relative flex-1">
              <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
                {children}
              </div>
            </main>
          </div>
        </div>
      </div>
    </CommandPaletteProvider>
  );
}
