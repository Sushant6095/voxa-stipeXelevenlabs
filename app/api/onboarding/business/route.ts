import 'server-only';

import { auth } from '@/lib/auth';
import { NextResponse, type NextRequest } from 'next/server';

import { saveBusinessDetails } from '@/lib/onboarding/actions';
import { businessFormSchema } from '@/lib/onboarding/schemas';

/**
 * POST /api/onboarding/business
 *
 * Fallback endpoint for the business details form when a client cannot use
 * the server action directly (e.g. older browser, scripted client). The
 * canonical path is `saveBusinessDetails()` invoked from the form action
 * prop in `app/onboarding/business/page.tsx`.
 */

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
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

  const parsed = businessFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid business details', issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const result = await saveBusinessDetails(parsed.data);
    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to save business';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
