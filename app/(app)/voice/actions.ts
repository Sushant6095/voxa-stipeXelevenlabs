'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';

import { currentClerkUserId } from '@/lib/auth';

/**
 * /voice server action.
 *
 * The recorder component captures a Blob via MediaRecorder, wraps it in a
 * FormData with field `audio`, and submits via the `formAction` prop on a
 * <form>. This server action forwards that blob to the existing
 * /api/voice/clone route handler — which talks to ElevenLabs and persists
 * the resulting voice id on the business's primary agent.
 *
 * Kept thin so the EL upload logic stays in the route handler (and the
 * route is reusable from non-React clients like cURL or the smoke test).
 */

export interface VoiceCloneResult {
  ok: boolean;
  voiceId?: string;
  error?: string;
}

function appBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  ).replace(/\/$/, '');
}

export async function cloneVoiceAction(
  formData: FormData,
): Promise<VoiceCloneResult> {
  const userId = await currentClerkUserId();
  if (!userId) return { ok: false, error: 'Unauthorized' };

  const audio = formData.get('audio');
  if (!audio || typeof audio === 'string') {
    return { ok: false, error: 'Missing audio file' };
  }

  // Build a fresh FormData to forward — we strip any extraneous fields the
  // client may have attached.
  const forward = new FormData();
  forward.append('audio', audio, audio instanceof File ? audio.name : 'sample.webm');

  const h = await headers();
  const cookieHeader = h.get('cookie') ?? '';

  const res = await fetch(`${appBaseUrl()}/api/voice/clone`, {
    method: 'POST',
    headers: { cookie: cookieHeader },
    body: forward,
  });

  if (!res.ok) {
    let message = `clone failed: ${res.status}`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      // fall through
    }
    return { ok: false, error: message };
  }

  const body = (await res.json()) as { voiceId: string };
  revalidatePath('/voice');
  revalidatePath('/dashboard');
  return { ok: true, voiceId: body.voiceId };
}
