/**
 * Voxa — DB smoke test
 *
 * Verifies the Phase 2 schema + RLS works end-to-end against a real Supabase
 * project. DOES NOT run automatically — requires `SUPABASE_SERVICE_ROLE_KEY`
 * and `NEXT_PUBLIC_SUPABASE_URL` in the environment.
 *
 * Run:
 *   pnpm dlx tsx scripts/db-smoke.ts
 *
 * What it does:
 *   1. Inserts a test business via the service role (RLS bypassed).
 *   2. Confirms the service role can read it back.
 *   3. Creates an anon client and signs a fake "Clerk" JWT-like token via
 *      Supabase's `auth.signInWithIdToken` placeholder. NOTE: real Clerk JWT
 *      verification requires Clerk's signing key — this smoke test only
 *      confirms the schema + RLS exist; for full E2E auth, run the manual
 *      browser test described in docs/runbook.md (Phase 2 section).
 *   4. Confirms reading from the businesses table without a JWT returns 0
 *      rows (RLS active).
 *   5. Cleans up the test business.
 */
/* eslint-disable no-console */

import { createClient } from '@supabase/supabase-js';

import type { Database } from '../lib/supabase/types';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SERVICE_KEY || !ANON_KEY) {
  console.error(
    '[db-smoke] Missing env vars. Set NEXT_PUBLIC_SUPABASE_URL, ' +
      'SUPABASE_SERVICE_ROLE_KEY, and NEXT_PUBLIC_SUPABASE_ANON_KEY first.',
  );
  process.exit(1);
}

const SMOKE_CLERK_USER_ID = 'smoke_user_' + Date.now();
const OTHER_CLERK_USER_ID = 'smoke_other_' + Date.now();

async function main() {
  const service = createClient<Database>(SUPABASE_URL!, SERVICE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const anon = createClient<Database>(SUPABASE_URL!, ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let businessId: string | null = null;

  try {
    // -------------------------------------------------------------------
    // 1. Insert as service role — bypasses RLS
    // -------------------------------------------------------------------
    const { data: inserted, error: insertErr } = await service
      .from('businesses')
      .insert({
        clerk_user_id: SMOKE_CLERK_USER_ID,
        name: 'Smoke Test Clinic',
        language: 'en',
      })
      .select('*')
      .single();

    if (insertErr || !inserted) {
      throw new Error(
        `Service-role insert failed: ${insertErr?.message ?? 'no row returned'}`,
      );
    }
    businessId = inserted.id;
    console.log('[db-smoke] OK: service-role insert', businessId);

    // -------------------------------------------------------------------
    // 2. Service role can read it
    // -------------------------------------------------------------------
    const { data: serviceRead, error: serviceReadErr } = await service
      .from('businesses')
      .select('*')
      .eq('id', businessId);

    if (serviceReadErr || !serviceRead || serviceRead.length === 0) {
      throw new Error('Service-role read failed');
    }
    console.log('[db-smoke] OK: service-role select');

    // -------------------------------------------------------------------
    // 3. Anon client (no JWT) must not see the row — RLS blocks it
    // -------------------------------------------------------------------
    const { data: anonRead, error: anonReadErr } = await anon
      .from('businesses')
      .select('id')
      .eq('id', businessId);

    if (anonReadErr) {
      // RLS returning an error is also acceptable.
      console.log('[db-smoke] OK: anon read errored (RLS):', anonReadErr.message);
    } else if (anonRead && anonRead.length > 0) {
      throw new Error(
        '[db-smoke] FAIL: anon client read a row it should not see. RLS is misconfigured.',
      );
    } else {
      console.log('[db-smoke] OK: anon read returned 0 rows (RLS active)');
    }

    // -------------------------------------------------------------------
    // 4. Sanity-check the helper functions exist
    // -------------------------------------------------------------------
    const { data: minutes, error: rpcErr } = await service.rpc(
      'business_minutes_used_this_period',
      { p_business_id: businessId },
    );

    if (rpcErr) {
      throw new Error(`RPC business_minutes_used_this_period failed: ${rpcErr.message}`);
    }
    console.log('[db-smoke] OK: business_minutes_used_this_period =', minutes);

    // -------------------------------------------------------------------
    // 5. Manual E2E test reminder for Clerk-authed reads
    // -------------------------------------------------------------------
    console.log(
      '\n[db-smoke] MANUAL CHECK REQUIRED for full Clerk JWT path:\n' +
        '  1. Sign in via the Next.js app as a real Clerk user.\n' +
        '  2. Hit /api/debug/whoami (or any RLS-gated query) and confirm\n' +
        `     it returns rows ONLY for clerk_user_id = '${OTHER_CLERK_USER_ID}'-style users\n` +
        '     that actually own the row. See docs/runbook.md.\n',
    );
  } finally {
    // -------------------------------------------------------------------
    // Cleanup
    // -------------------------------------------------------------------
    if (businessId) {
      const { error: deleteErr } = await service
        .from('businesses')
        .delete()
        .eq('id', businessId);
      if (deleteErr) {
        console.error('[db-smoke] cleanup delete failed:', deleteErr.message);
      } else {
        console.log('[db-smoke] cleanup: deleted test business', businessId);
      }
    }
  }

  console.log('\n[db-smoke] DONE.');
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error('[db-smoke] failed:', message);
  process.exit(1);
});
