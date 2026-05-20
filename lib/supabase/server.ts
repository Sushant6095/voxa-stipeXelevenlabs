import 'server-only';

import { createServerClient } from '@supabase/ssr';
import { createClient as createPlainClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

import type { Database } from './types';

/**
 * Supabase client for Server Components, Route Handlers, and Server Actions.
 *
 * Always create a NEW client per request — never share across requests.
 * Uses the App Router `cookies()` API from `next/headers`.
 *
 * Auth has been removed from Voxa — RLS is bypassed for the demo user via
 * `current_business_id()` returning the first business row. For now, server
 * reads use the anon key + cookies; service role is used for writes.
 */
export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY',
    );
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components cannot set cookies — middleware handles refresh.
        }
      },
    },
  });
}

/**
 * Service-role Supabase client. Bypasses RLS entirely.
 *
 * Used everywhere now that Clerk JWT injection has been removed — the data
 * layer always has full table access.
 *
 * NEVER expose this client (or the key it reads) to a client component or
 * client-side bundle.
 */
export function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY',
    );
  }

  return createPlainClient<Database>(supabaseUrl, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
