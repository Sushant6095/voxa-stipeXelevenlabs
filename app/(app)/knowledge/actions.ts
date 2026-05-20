'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { currentClerkUserId } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

/**
 * /knowledge server actions.
 *
 * The ingest pipeline lives in /api/knowledge/ingest (which handles the
 * ElevenLabs upload + scraping). This action is a thin wrapper that forwards
 * the URL into that route handler so the existing server-side scrape logic
 * is the single source of truth.
 */

const UrlSchema = z.object({
  url: z
    .string()
    .url()
    .refine((raw) => {
      try {
        const parsed = new URL(raw);
        return parsed.protocol === 'https:' || parsed.protocol === 'http:';
      } catch {
        return false;
      }
    }, 'URL must use http or https'),
});

const UuidSchema = z.string().uuid();

export interface IngestResult {
  ok: boolean;
  error?: string;
}

function appBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  ).replace(/\/$/, '');
}

async function buildForwardCookieHeader(): Promise<string> {
  const h = await headers();
  return h.get('cookie') ?? '';
}

export async function ingestKnowledgeUrl(url: string): Promise<IngestResult> {
  const userId = await currentClerkUserId();
  if (!userId) return { ok: false, error: 'Unauthorized' };

  const parsed = UrlSchema.safeParse({ url });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid URL' };
  }

  // Forward to the existing ingest route handler so we don't duplicate the
  // ElevenLabs upload logic. We forward the user's cookies so Clerk middleware
  // can authenticate the call.
  const cookieHeader = await buildForwardCookieHeader();
  const res = await fetch(`${appBaseUrl()}/api/knowledge/ingest`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      cookie: cookieHeader,
    },
    body: JSON.stringify({ url: parsed.data.url }),
  });

  if (!res.ok) {
    let message = `ingest failed: ${res.status}`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      // fall through to status-code message
    }
    return { ok: false, error: message };
  }

  revalidatePath('/knowledge');
  return { ok: true };
}

export async function deleteKnowledgeSource(
  sourceId: string,
): Promise<IngestResult> {
  const parsedId = UuidSchema.safeParse(sourceId);
  if (!parsedId.success) return { ok: false, error: 'Invalid source id' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('knowledge_base')
    .delete()
    .eq('id', parsedId.data);

  if (error) return { ok: false, error: error.message };
  revalidatePath('/knowledge');
  return { ok: true };
}
