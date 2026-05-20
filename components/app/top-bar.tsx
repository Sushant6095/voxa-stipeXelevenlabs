'use client';

import { useState } from 'react';
import { Bell, Menu, Search } from 'lucide-react';

import { VoxaWordmark } from '@/components/brand/voxa-logo';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { Sidebar } from './sidebar';
import { CommandPaletteTrigger } from '@/components/cmdk/command-palette-trigger';

/**
 * Voxa app top bar — sticky header containing:
 *  - Mobile drawer trigger (visible <lg)
 *  - Wordmark (visible on mobile only; desktop has it in the sidebar)
 *  - Command palette ⌘K trigger (search-shaped, hover state)
 *  - Notification bell with a tiny indigo dot badge
 *  - Clerk `<UserButton />` for the avatar dropdown
 */
export function TopBar() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <header
      className={cn(
        'sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border/60',
        'bg-background/70 px-4 backdrop-blur-md sm:px-6',
      )}
    >
      {/* Mobile menu trigger */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Open navigation"
              className="lg:hidden"
            />
          }
        >
          <Menu />
        </SheetTrigger>
        <SheetContent side="left" className="max-w-[280px] p-0">
          <Sidebar onNavigate={() => setDrawerOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Mobile wordmark */}
      <div className="flex items-center lg:hidden">
        <VoxaWordmark size={22} />
      </div>

      <div className="ml-auto flex flex-1 items-center justify-end gap-2 sm:ml-0 sm:flex-1 sm:justify-between">
        {/* Command palette trigger — takes the space on desktop */}
        <div className="hidden flex-1 sm:flex sm:max-w-md">
          <CommandPaletteTrigger />
        </div>

        <div className="flex items-center gap-1.5">
          {/* Mobile search icon-only */}
          <div className="sm:hidden">
            <CommandPaletteTrigger compact />
          </div>

          {/* Bell with badge */}
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Notifications"
            className="relative"
          >
            <Bell />
            <span
              aria-hidden="true"
              className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-voxa-accent ring-2 ring-background"
            />
          </Button>

          {/* Demo user avatar — auth removed; static placeholder */}
          <div className="ml-1">
            <Avatar className="size-7">
              <AvatarFallback className="bg-primary/15 text-xs font-medium text-primary">
                D
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>

      {/* Hidden non-functional search icon for screen-reader hint on desktop */}
      <span className="sr-only">
        <Search aria-hidden="true" />
      </span>
    </header>
  );
}
