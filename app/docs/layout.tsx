import type { ReactNode } from 'react';

import { DocsHeader } from '@/components/docs/docs-header';
import { DocsSidebar } from '@/components/docs/docs-nav';

/**
 * /docs layout — Stripe-style three-column shell.
 *
 * - Fixed top header with brand + search + sign-in CTA
 * - Sticky left sidebar (collapses to mobile sheet via header)
 * - Main content column flexes to fill, individual pages decide whether to
 *   show a right-rail (code samples) by composing their own grid.
 */
export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="voxa-bg-light dark:voxa-bg-dark min-h-screen w-full">
      <DocsHeader />
      <div className="mx-auto flex w-full max-w-[1400px] gap-8 px-4 sm:px-6">
        <div className="hidden w-60 shrink-0 lg:block">
          <div className="sticky top-14 max-h-[calc(100vh-3.5rem)] overflow-y-auto pr-1">
            <DocsSidebar />
          </div>
        </div>
        <main className="min-w-0 flex-1 py-10 pb-32">{children}</main>
      </div>
    </div>
  );
}
