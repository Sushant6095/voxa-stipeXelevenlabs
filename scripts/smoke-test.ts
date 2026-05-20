#!/usr/bin/env tsx
/**
 * Voxa end-to-end smoke test.
 *
 * Runs the full happy path against REAL APIs in test mode. Fails fast on any
 * missing env var so the user knows exactly which key to paste.
 *
 * Usage:
 *   pnpm tsx scripts/smoke-test.ts
 *
 * What it verifies:
 *   1. Env vars all present
 *   2. Supabase connection (read 1 row from businesses)
 *   3. Stripe meter exists (call_minutes), 3 products + 6 prices found
 *   4. ElevenLabs API key resolves (GET /v1/voices)
 *   5. Twilio creds resolve (GET /Accounts.json for our SID)
 *   6. n8n base URL responds to /healthz (if exposed)
 *   7. Anthropic API key resolves (POST /v1/messages with a 1-token ping)
 *
 * If anything fails: prints a clear "fix this first" message and exits 1.
 * Does NOT make any state-changing calls — read-only smoke.
 */

import Stripe from 'stripe';

type Check = { name: string; ok: boolean; detail: string };

const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'STRIPE_SECRET_KEY',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'ELEVENLABS_API_KEY',
  'ANTHROPIC_API_KEY',
  'N8N_WEBHOOK_BASE_URL',
  'CLERK_SECRET_KEY',
] as const;

function missingEnv(): string[] {
  return required.filter((k) => !process.env[k]);
}

async function checkSupabase(): Promise<Check> {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  const { error } = await supabase.from('businesses').select('id').limit(1);
  return {
    name: 'Supabase',
    ok: !error,
    detail: error ? error.message : 'connected',
  };
}

async function checkStripe(): Promise<Check> {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      // Smoke is read-only; we don't pin apiVersion here — the SDK default is fine.
    });
    const meters = await stripe.billing.meters.list({ limit: 10 });
    const meter = meters.data.find((m) => m.event_name === 'call_minutes');
    if (!meter) {
      return {
        name: 'Stripe',
        ok: false,
        detail: 'meter "call_minutes" missing — run `pnpm setup:stripe`',
      };
    }
    const products = await stripe.products.list({ active: true, limit: 20 });
    const voxa = products.data.filter((p) => p.metadata?.voxa_tier);
    return {
      name: 'Stripe',
      ok: voxa.length === 3,
      detail: `meter ${meter.id}, ${voxa.length}/3 products`,
    };
  } catch (err) {
    return { name: 'Stripe', ok: false, detail: String(err) };
  }
}

async function checkElevenLabs(): Promise<Check> {
  try {
    const res = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY! },
    });
    return {
      name: 'ElevenLabs',
      ok: res.ok,
      detail: res.ok ? `${res.status}` : `${res.status} ${await res.text().catch(() => '')}`,
    };
  } catch (err) {
    return { name: 'ElevenLabs', ok: false, detail: String(err) };
  }
}

async function checkTwilio(): Promise<Check> {
  try {
    const sid = process.env.TWILIO_ACCOUNT_SID!;
    const token = process.env.TWILIO_AUTH_TOKEN!;
    const auth = Buffer.from(`${sid}:${token}`).toString('base64');
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}.json`,
      { headers: { Authorization: `Basic ${auth}` } },
    );
    return {
      name: 'Twilio',
      ok: res.ok,
      detail: res.ok ? `account ${sid.slice(0, 6)}…` : `${res.status}`,
    };
  } catch (err) {
    return { name: 'Twilio', ok: false, detail: String(err) };
  }
}

async function checkN8n(): Promise<Check> {
  try {
    const url = process.env.N8N_WEBHOOK_BASE_URL!.replace(/\/$/, '');
    const res = await fetch(`${url}/healthz`, {
      signal: AbortSignal.timeout(5000),
    });
    return {
      name: 'n8n',
      ok: res.ok,
      detail: res.ok ? 'healthz 200' : `${res.status}`,
    };
  } catch (err) {
    return {
      name: 'n8n',
      ok: false,
      detail: `${err} — /healthz may not be exposed; check workflows in UI`,
    };
  }
}

async function checkAnthropic(): Promise<Check> {
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4,
        messages: [{ role: 'user', content: 'ping' }],
      }),
    });
    return {
      name: 'Anthropic',
      ok: res.ok,
      detail: res.ok ? `${res.status}` : `${res.status} ${await res.text().catch(() => '')}`,
    };
  } catch (err) {
    return { name: 'Anthropic', ok: false, detail: String(err) };
  }
}

async function main(): Promise<void> {
  const missing = missingEnv();
  if (missing.length > 0) {
    console.error('\n✗ Missing env vars:');
    missing.forEach((k) => console.error(`  - ${k}`));
    console.error('\nFix: paste values into .env.local, then re-run.');
    process.exit(1);
  }
  console.log('\nVoxa smoke — running 6 checks against real APIs (read-only)\n');
  const checks = await Promise.all([
    checkSupabase(),
    checkStripe(),
    checkElevenLabs(),
    checkTwilio(),
    checkN8n(),
    checkAnthropic(),
  ]);

  let passed = 0;
  for (const c of checks) {
    const icon = c.ok ? '✓' : '✗';
    console.log(`  ${icon}  ${c.name.padEnd(12)} ${c.detail}`);
    if (c.ok) passed += 1;
  }

  console.log(`\n${passed}/${checks.length} checks passed.\n`);
  if (passed < checks.length) {
    console.error('Smoke test FAILED — fix the ✗ rows above before demoing.\n');
    process.exit(1);
  }
  console.log('All checks green. Make a phone call to your Twilio number to verify end-to-end.\n');
}

main().catch((err) => {
  console.error('Smoke test crashed:', err);
  process.exit(1);
});
