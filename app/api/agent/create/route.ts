import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { createAgent } from '@/lib/elevenlabs';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * POST /api/agent/create
 *
 * Internal endpoint called by n8n's onboarding workflow (W1). NOT
 * Clerk-authed — gated by a shared secret in the `x-voxa-internal-secret`
 * header.
 *
 * Body: { business_id: <uuid> }
 *
 * Steps:
 *   1. Verify shared secret
 *   2. Look up the business (service role)
 *   3. Build an agent from the canonical template + business defaults
 *   4. Call EL `agents.create` via lib/elevenlabs.ts
 *   5. Upsert the agents row with the new agent_id
 *   6. Return { agentId }
 */

const INTERNAL_HEADER = 'x-voxa-internal-secret';

const RequestSchema = z.object({
  business_id: z.string().uuid(),
});

interface SuccessBody {
  agentId: string;
}

interface ErrorBody {
  error: string;
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse<SuccessBody | ErrorBody>> {
  // ---- 1. Auth via shared secret --------------------------------------
  const expectedSecret = process.env.VOXA_INTERNAL_SECRET;
  if (!expectedSecret) {
    return NextResponse.json(
      { error: 'VOXA_INTERNAL_SECRET not configured' },
      { status: 500 },
    );
  }
  const providedSecret = request.headers.get(INTERNAL_HEADER);
  if (providedSecret !== expectedSecret) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // ---- 2. Parse body --------------------------------------------------
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 },
    );
  }

  const parsed = RequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: `Invalid body: ${parsed.error.message}` },
      { status: 400 },
    );
  }
  const { business_id: businessId } = parsed.data;

  // ---- 3. n8n base URL ------------------------------------------------
  const n8nBase = process.env.N8N_WEBHOOK_BASE_URL;
  if (!n8nBase) {
    return NextResponse.json(
      { error: 'N8N_WEBHOOK_BASE_URL not configured' },
      { status: 500 },
    );
  }
  const toolBaseUrl = `${n8nBase.replace(/\/+$/, '')}/webhook/tool`;

  // ---- 4. Load business + (optional) existing voiceId from agents -----
  const supabase = createServiceClient();
  const { data: business, error: businessErr } = await supabase
    .from('businesses')
    .select('id, name, language, website_url')
    .eq('id', businessId)
    .maybeSingle();

  if (businessErr) {
    return NextResponse.json(
      { error: `business lookup failed: ${businessErr.message}` },
      { status: 500 },
    );
  }
  if (!business) {
    return NextResponse.json(
      { error: 'Business not found' },
      { status: 404 },
    );
  }

  // Use the pre-cloned voiceId if Phase 4/5 voice clone already ran;
  // otherwise fall back to an EL default voice.
  const { data: existingAgent } = await supabase
    .from('agents')
    .select('id, elevenlabs_voice_id')
    .eq('business_id', businessId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  // ElevenLabs default voice "Aria" — used until the owner clones theirs.
  const DEFAULT_VOICE_ID = '9BWtsMINqrJLrRacOk9x';
  const voiceId = existingAgent?.elevenlabs_voice_id ?? DEFAULT_VOICE_ID;

  // ---- 5. Create the agent in ElevenLabs ------------------------------
  let agentId: string;
  try {
    const result = await createAgent({
      businessName: business.name,
      voiceId,
      primaryLanguage: business.language,
      toolBaseUrl,
    });
    agentId = result.agentId;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'unknown error';
    return NextResponse.json(
      { error: `EL agent create failed: ${message}` },
      { status: 502 },
    );
  }

  // ---- 6. Persist agentId on the agents row ---------------------------
  if (existingAgent) {
    const { error: updateErr } = await supabase
      .from('agents')
      .update({
        elevenlabs_agent_id: agentId,
        status: 'provisioning',
      })
      .eq('id', existingAgent.id);
    if (updateErr) {
      return NextResponse.json(
        { error: `agent row update failed: ${updateErr.message}` },
        { status: 500 },
      );
    }
  } else {
    const { error: insertErr } = await supabase.from('agents').insert({
      business_id: businessId,
      elevenlabs_agent_id: agentId,
      elevenlabs_voice_id: voiceId,
      status: 'provisioning',
    });
    if (insertErr) {
      return NextResponse.json(
        { error: `agent row insert failed: ${insertErr.message}` },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ agentId });
}

export const runtime = 'nodejs';
