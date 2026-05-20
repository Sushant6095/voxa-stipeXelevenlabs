import { auth } from '@/lib/auth';
import { NextResponse, type NextRequest } from 'next/server';

import { cloneVoice } from '@/lib/elevenlabs';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * POST /api/voice/clone
 *
 * Owner records a 60s voice sample, browser submits as multipart/form-data
 * with field `audio`. We push the sample to ElevenLabs IVC, get back a
 * voiceId, and persist it on the business's primary agent (or stage it on
 * the business row if no agent exists yet).
 *
 * Validation:
 *   - Clerk auth required
 *   - Field name must be `audio`
 *   - MIME type must start with "audio/"
 *   - Size <= 10MB
 *
 * Returns: { voiceId, name }
 */

const MAX_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_PREFIX = 'audio/';

interface SuccessBody {
  voiceId: string;
  name: string;
}

interface ErrorBody {
  error: string;
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse<SuccessBody | ErrorBody>> {
  // ---- 1. Auth --------------------------------------------------------
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ---- 2. Parse multipart ---------------------------------------------
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: 'Expected multipart/form-data with field "audio"' },
      { status: 400 },
    );
  }

  const audio = formData.get('audio');
  // FormData entries are `File | string`. We only accept File.
  if (audio === null || typeof audio === 'string') {
    return NextResponse.json(
      { error: 'Field "audio" is required and must be a file' },
      { status: 400 },
    );
  }
  const blob: File = audio;

  if (blob.size === 0) {
    return NextResponse.json(
      { error: 'Audio file is empty' },
      { status: 400 },
    );
  }
  if (blob.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `Audio file exceeds ${MAX_BYTES} bytes` },
      { status: 413 },
    );
  }
  if (!blob.type.startsWith(ALLOWED_MIME_PREFIX)) {
    return NextResponse.json(
      { error: `Unsupported MIME type: ${blob.type || 'unknown'}` },
      { status: 415 },
    );
  }

  // ---- 3. Look up the caller's business -------------------------------
  const supabase = createServiceClient();

  const { data: business, error: businessErr } = await supabase
    .from('businesses')
    .select('id, name')
    .eq('clerk_user_id', userId)
    .maybeSingle();

  if (businessErr) {
    return NextResponse.json(
      { error: `business lookup failed: ${businessErr.message}` },
      { status: 500 },
    );
  }
  if (!business) {
    return NextResponse.json(
      { error: 'No business associated with this account' },
      { status: 400 },
    );
  }

  // ---- 4. Clone the voice ---------------------------------------------
  let result: { voiceId: string; name: string };
  try {
    const voiceName = `voxa-${userId.slice(0, 8)}`;
    result = await cloneVoice({
      name: voiceName,
      description: `Voxa receptionist voice for ${business.name}`,
      files: [blob],
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'unknown clone error';
    return NextResponse.json(
      { error: `Voice clone failed: ${message}` },
      { status: 502 },
    );
  }

  // ---- 5. Persist the voiceId on the business's primary agent ---------
  // Prefer to attach to the existing agent. If none exists, no-op — the
  // onboarding flow will pick this up when it provisions the agent next.
  const { data: agent, error: agentLookupErr } = await supabase
    .from('agents')
    .select('id')
    .eq('business_id', business.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (agentLookupErr) {
    return NextResponse.json(
      { error: `agent lookup failed: ${agentLookupErr.message}` },
      { status: 500 },
    );
  }

  if (agent) {
    const { error: updateErr } = await supabase
      .from('agents')
      .update({ elevenlabs_voice_id: result.voiceId })
      .eq('id', agent.id);
    if (updateErr) {
      return NextResponse.json(
        { error: `voice persistence failed: ${updateErr.message}` },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({
    voiceId: result.voiceId,
    name: result.name,
  });
}

export const runtime = 'nodejs';
export const maxDuration = 60;
