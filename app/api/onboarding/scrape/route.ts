import 'server-only';

import { auth } from '@/lib/auth';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { ingestWebsite } from '@/lib/onboarding/actions';

/**
 * POST /api/onboarding/scrape
 *
 * Body: { url: string }
 *
 * Triggers a website ingest into the EL knowledge base for the caller's
 * agent (and persists a knowledge_base row for the dashboard). Wraps
 * `ingestWebsite()` from `lib/onboarding/actions.ts`.
 *
 * Returns `{ ok, url, pagesFound? }`. `pagesFound` is best-effort — EL's
 * scraper does not expose a deterministic page count, so we omit it
 * unless we can fetch it cheaply. (Future: query EL KB docs endpoint
 * after the scrape settles.)
 */

const RequestSchema = z.object({
  url: z.string().trim().url('Must be a valid URL'),
});

interface SuccessBody {
  readonly ok: true;
  readonly url: string;
  readonly pagesFound?: number;
}

interface ErrorBody {
  readonly error: string;
}

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(
  request: NextRequest,
): Promise<NextResponse<SuccessBody | ErrorBody>> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid URL', issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const result = await ingestWebsite(parsed.data.url);
    return NextResponse.json({ ok: true, url: result.url }, { status: 200 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to ingest URL';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
