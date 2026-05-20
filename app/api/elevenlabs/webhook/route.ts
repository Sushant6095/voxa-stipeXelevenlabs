import { NextResponse, type NextRequest } from 'next/server';

import { N8N_WORKFLOWS, triggerN8nWorkflow } from '@/lib/n8n';

/**
 * ElevenLabs Conv AI post-call webhook sink.
 *
 * Fires ~5–15s after hangup once analysis completes. Forwards the full
 * payload (transcript, audio_url, language_detected, sentiment, etc.) to
 * the n8n post-call workflow which:
 *
 *   1. persists calls + leads to Supabase
 *   2. calls Anthropic for lead scoring + intent extraction
 *   3. emits Stripe meter event for call_minutes
 *   4. queues the daily WhatsApp digest entry
 *
 * TODO (Phase 5): verify ElevenLabs signing secret on the request headers.
 */
export async function POST(request: NextRequest) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON payload' },
      { status: 400 },
    );
  }

  try {
    await triggerN8nWorkflow(N8N_WORKFLOWS.POST_CALL, payload, {
      timeoutMs: 8_000,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'unknown error';
    console.error(`[elevenlabs-webhook] n8n forward failed: ${message}`);
    return NextResponse.json(
      { error: 'Downstream workflow failed' },
      { status: 502 },
    );
  }

  return NextResponse.json({ received: true });
}

export const runtime = 'nodejs';
