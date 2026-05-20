/**
 * scripts/test-telephony.ts
 *
 * Standalone smoke test for the Phase 4 telephony flow. Run AFTER env vars
 * (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, ELEVENLABS_API_KEY) are pasted into
 * `.env.local` and AFTER an ElevenLabs agent has been created.
 *
 * Usage (env is loaded via the `pnpm test:telephony` wrapper, which uses
 * `dotenv-cli` to expose `.env.local`):
 *   pnpm test:telephony <agent_id>                       # full provision flow
 *   pnpm test:telephony --purchase-only                  # Twilio only, no EL
 *   pnpm test:telephony --purchase-only --country=US     # US fallback test
 *   pnpm test:telephony --cleanup PN1234...              # release a number
 *
 * Manual invocation without the wrapper (export env yourself first):
 *   pnpm dlx tsx scripts/test-telephony.ts <agent_id>
 */
/* eslint-disable no-console */

interface ParsedArgs {
  positional: string[];
  flags: Set<string>;
  options: Map<string, string>;
}

function parseArgs(argv: string[]): ParsedArgs {
  const positional: string[] = [];
  const flags = new Set<string>();
  const options = new Map<string, string>();

  for (const arg of argv) {
    if (arg.startsWith('--')) {
      const eq = arg.indexOf('=');
      if (eq === -1) {
        flags.add(arg.slice(2));
      } else {
        options.set(arg.slice(2, eq), arg.slice(eq + 1));
      }
    } else {
      positional.push(arg);
    }
  }

  return { positional, flags, options };
}

function fail(message: string): never {
  console.error(`\n[test-telephony] ERROR: ${message}\n`);
  process.exit(1);
}

function requireEnv(name: string): void {
  if (!process.env[name]) {
    fail(`Missing required env var: ${name}. Did you paste .env.local?`);
  }
}

function printJson(label: string, value: unknown): void {
  console.log(`\n${label}:`);
  console.log(JSON.stringify(value, null, 2));
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  // Fail-fast on missing creds. EL is only needed for full provision.
  requireEnv('TWILIO_ACCOUNT_SID');
  requireEnv('TWILIO_AUTH_TOKEN');

  // Dynamic imports so we don't crash before the env check above runs.
  const { provisionPhoneForAgent, provisionTwilioNumberOnly } = await import(
    '../lib/telephony'
  );
  const { releaseNumber } = await import('../lib/twilio');

  // ----- --cleanup <sid> mode -----
  if (args.flags.has('cleanup')) {
    const sid = args.positional[0];
    if (!sid || !sid.startsWith('PN')) {
      fail('--cleanup requires a Twilio Phone Number SID (PN…) as positional arg');
    }
    console.log(`[test-telephony] Releasing ${sid}…`);
    await releaseNumber(sid);
    console.log('[test-telephony] Released.');
    return;
  }

  // ----- --purchase-only mode -----
  if (args.flags.has('purchase-only')) {
    const country = (args.options.get('country') ?? 'IN').toUpperCase();
    if (country !== 'IN' && country !== 'US') {
      fail(`--country must be IN or US, got: ${country}`);
    }
    console.log(`[test-telephony] Purchasing ${country} number (no EL import)…`);
    const purchase = await provisionTwilioNumberOnly(country as 'IN' | 'US');
    printJson('Twilio purchase', purchase);
    console.log(
      `\nNext: pnpm test:telephony --cleanup ${purchase.sid}   # to release`,
    );
    return;
  }

  // ----- Full provision mode (default) -----
  requireEnv('ELEVENLABS_API_KEY');

  const agentId = args.positional[0];
  if (!agentId) {
    fail(
      'Missing <agent_id>. Usage: pnpm test:telephony <agent_id> [--country=IN|US]',
    );
  }

  const country = (args.options.get('country') ?? 'IN').toUpperCase();
  if (country !== 'IN' && country !== 'US') {
    fail(`--country must be IN or US, got: ${country}`);
  }

  console.log(
    `[test-telephony] Provisioning ${country} number → EL agent ${agentId}…`,
  );

  const result = await provisionPhoneForAgent({
    agentId,
    preferredCountry: country as 'IN' | 'US',
    labelSuffix: 'smoke-test',
  });

  printJson('Provision result', result);

  console.log(
    '\nNext steps:',
    `\n  1. Call ${result.phoneNumberE164} from your phone.`,
    '\n  2. The EL agent should answer within ~2 rings.',
    `\n  3. To release: pnpm test:telephony --cleanup ${result.twilioSid}`,
  );
}

main().catch((err: unknown) => {
  console.error('\n[test-telephony] FAILED');
  console.error(err);
  process.exit(1);
});
