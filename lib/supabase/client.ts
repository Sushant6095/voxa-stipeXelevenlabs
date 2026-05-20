'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useMemo } from 'react';

import type { Database } from './types';

/**
 * Supabase client for Client Components.
 *
 * Auth has been removed from Voxa — no Clerk JWT injection. The browser
 * client uses the anon key, so RLS sees an anonymous request. Realtime
 * subscriptions to `calls` / `leads` will require either disabled RLS on
 * those tables, a permissive policy for anon, or the service-role
 * (server-side fetch + push to a websocket the browser subscribes to).
 */
export function useSupabase() {
  return useMemo(() => createClient(), []);
}

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY',
    );
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
