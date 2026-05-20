import 'server-only';

import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

import {
  deriveProvisioningProgress,
  type ProvisioningProgress,
} from '@/lib/onboarding/state';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * GET /api/onboarding/status
 *
 * Polled by the provisioning page (every 2s) to drive the 6-item checklist
 * and auto-advance to /onboarding/success when the agent becomes active.
 *
 * Returns the canonical `ProvisioningProgress` shape from
 * `lib/onboarding/state.ts` so the same derivation runs server- and
 * client-side without drift.
 */

interface SuccessBody extends ProvisioningProgress {
  readonly hasBusiness: boolean;
}

interface ErrorBody {
  readonly error: string;
}

export const runtime = 'nodejs';

export async function GET(): Promise<
  NextResponse<SuccessBody | ErrorBody>
> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();

  // 1. Business
  const { data: business, error: businessErr } = await supabase
    .from('businesses')
    .select('id')
    .eq('clerk_user_id', userId)
    .maybeSingle();

  if (businessErr) {
    return NextResponse.json(
      { error: `business lookup failed: ${businessErr.message}` },
      { status: 500 },
    );
  }

  if (!business) {
    // Caller is signed in but never completed checkout — surface a zeroed
    // progress object instead of 404 so the page can render its "no
    // business yet" empty state if it ever lands here directly.
    return NextResponse.json(
      {
        hasBusiness: false,
        completedSteps: 0,
        status: null,
        phoneNumber: null,
      },
      { status: 200 },
    );
  }

  // 2. Latest agent for this business (we only ever have one in v1)
  const { data: agent, error: agentErr } = await supabase
    .from('agents')
    .select(
      'status, elevenlabs_agent_id, elevenlabs_voice_id, twilio_number_sid, twilio_phone_e164',
    )
    .eq('business_id', business.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (agentErr) {
    return NextResponse.json(
      { error: `agent lookup failed: ${agentErr.message}` },
      { status: 500 },
    );
  }

  const progress = deriveProvisioningProgress({
    hasBusiness: true,
    agent: agent ?? null,
  });

  return NextResponse.json(
    {
      hasBusiness: true,
      ...progress,
    },
    {
      status: 200,
      headers: {
        // The polling page hits this every 2s; tell intermediaries (and the
        // browser HTTP cache) not to cache.
        'cache-control': 'no-store, max-age=0',
      },
    },
  );
}
