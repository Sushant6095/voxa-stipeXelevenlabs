import 'server-only';

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

import type { Database } from './types';

/**
 * Refresh Supabase auth tokens during middleware execution.
 *
 * Must be called inside Next.js middleware so that token refreshes can be
 * written back to the response cookies. Skipping this leads to random
 * logouts, JSON parsing errors, and expired session bugs.
 *
 * TODO (Phase 2): once Clerk's "Supabase" JWT template is configured, pass
 * the Clerk-issued token via `global.headers.Authorization` so RLS policies
 * can read `auth.jwt() ->> 'sub'` and join through `businesses.clerk_user_id`.
 */
export async function updateSession(
  request: NextRequest,
): Promise<NextResponse> {
  let response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase isn't configured yet (e.g. local first-run), pass through.
  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Touch the session so the SDK refreshes tokens if needed. Result is ignored.
  await supabase.auth.getUser();

  return response;
}
