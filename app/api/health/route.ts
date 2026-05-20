import { NextResponse } from 'next/server';

/**
 * Liveness probe. No auth, no DB hits — used by Vercel + the smoke-test
 * script in `scripts/smoke-test.ts`.
 */
export function GET() {
  return NextResponse.json({
    ok: true,
    service: 'voxa',
    time: new Date().toISOString(),
  });
}

export const runtime = 'nodejs';
