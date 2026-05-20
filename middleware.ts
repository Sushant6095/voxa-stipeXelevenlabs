import type { NextRequest } from 'next/server';

import { updateSession } from '@/lib/supabase/middleware';

/**
 * Voxa middleware — auth-free. Every route is public. The only work done
 * here is the Supabase cookie refresh so anonymous sessions don't churn.
 */
export default async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     *  - Next.js internals (_next, static assets)
     *  - Files with extensions (images, fonts, sitemap.xml, etc.)
     *  - Always run for API + tRPC routes for cookie freshness.
     */
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
