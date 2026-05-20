import { auth } from '@/lib/auth';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { ingestKnowledgeBaseFromUrl } from '@/lib/elevenlabs';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * POST /api/knowledge/ingest
 *
 * Owner-facing endpoint. Takes a single URL, scrapes it via EL's hosted
 * scraper, attaches the document to the business's agent, and records a
 * placeholder row in `knowledge_base` (full content backfilled async by
 * n8n's post-call workflow or a future scraper job).
 *
 * Body: { url: <https-url> }
 */

const RequestSchema = z.object({
  url: z
    .string()
    .url()
    .refine(
      (raw) => {
        try {
          const parsed = new URL(raw);
          return parsed.protocol === 'https:' || parsed.protocol === 'http:';
        } catch {
          return false;
        }
      },
      { message: 'URL must use http or https' },
    ),
});

interface SuccessBody {
  ok: true;
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

  // ---- 2. Body --------------------------------------------------------
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
  const { url } = parsed.data;

  // ---- 3. Look up business + agent ------------------------------------
  const supabase = createServiceClient();
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
    return NextResponse.json(
      { error: 'No business associated with this account' },
      { status: 400 },
    );
  }

  const { data: agent, error: agentErr } = await supabase
    .from('agents')
    .select('id, elevenlabs_agent_id')
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
  if (!agent?.elevenlabs_agent_id) {
    return NextResponse.json(
      {
        error:
          'No ElevenLabs agent provisioned yet for this business. Finish onboarding first.',
      },
      { status: 400 },
    );
  }

  // ---- 4. Push to ElevenLabs ------------------------------------------
  try {
    await ingestKnowledgeBaseFromUrl({
      agentId: agent.elevenlabs_agent_id,
      url,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'unknown error';
    return NextResponse.json(
      { error: `EL ingest failed: ${message}` },
      { status: 502 },
    );
  }

  // ---- 5. Record placeholder in Supabase ------------------------------
  const { error: kbErr } = await supabase.from('knowledge_base').insert({
    business_id: business.id,
    source_url: url,
    // EL keeps the canonical content; we record a marker for the dashboard.
    // A future scraper job (n8n) can backfill the full text here.
    content: '[Pending scrape — content lives in ElevenLabs KB]',
  });
  if (kbErr) {
    return NextResponse.json(
      { error: `knowledge_base insert failed: ${kbErr.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}

export const runtime = 'nodejs';
