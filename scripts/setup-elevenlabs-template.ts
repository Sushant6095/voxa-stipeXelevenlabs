/**
 * Voxa — bootstrap a demo ElevenLabs agent from the canonical template.
 *
 * Usage:
 *   pnpm setup:el-agent \
 *     --business-name "Sharma Dental" \
 *     --language hi \
 *     --voice-id JBFqnCBsd6RMkjVDRZzb \
 *     --n8n-url https://your-n8n.up.railway.app \
 *     [--city Bengaluru] \
 *     [--owner-name "Dr Sharma"] \
 *     [--write-env]
 *
 * Requires `ELEVENLABS_API_KEY` in the environment.
 * `--write-env` appends `DEMO_AGENT_ID=<id>` to .env.local.
 */
/* eslint-disable no-console */

import { appendFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { argv, env, exit } from 'node:process';

// ---------------------------------------------------------------------------
// Tiny CLI arg parser — avoid pulling in a dep.
// ---------------------------------------------------------------------------

interface CliArgs {
  businessName: string;
  language: 'en' | 'hi' | 'ta' | 'te';
  voiceId: string;
  n8nUrl: string;
  city: string | undefined;
  ownerName: string | undefined;
  servicesSummary: string | undefined;
  greeting: string | undefined;
  writeEnv: boolean;
}

function parseArgs(): CliArgs {
  const args = argv.slice(2);
  const map = new Map<string, string>();
  const flags = new Set<string>();

  for (let i = 0; i < args.length; i += 1) {
    const token = args[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = args[i + 1];
    if (next && !next.startsWith('--')) {
      map.set(key, next);
      i += 1;
    } else {
      flags.add(key);
    }
  }

  const required = (key: string): string => {
    const value = map.get(key);
    if (!value) {
      console.error(`[setup:el-agent] Missing required --${key} argument`);
      printUsage();
      exit(1);
    }
    return value;
  };

  const rawLanguage = required('language');
  if (!['en', 'hi', 'ta', 'te'].includes(rawLanguage)) {
    console.error(
      `[setup:el-agent] --language must be one of: en, hi, ta, te (got ${rawLanguage})`,
    );
    exit(1);
  }

  return {
    businessName: required('business-name'),
    language: rawLanguage as CliArgs['language'],
    voiceId: required('voice-id'),
    n8nUrl: required('n8n-url'),
    city: map.get('city'),
    ownerName: map.get('owner-name'),
    servicesSummary: map.get('services'),
    greeting: map.get('greeting'),
    writeEnv: flags.has('write-env'),
  };
}

function printUsage(): void {
  console.error(`
Usage:
  pnpm setup:el-agent \\
    --business-name "Sharma Dental" \\
    --language hi \\
    --voice-id JBFqnCBsd6RMkjVDRZzb \\
    --n8n-url https://your-n8n.up.railway.app \\
    [--city Bengaluru] \\
    [--owner-name "Dr Sharma"] \\
    [--services "Dental cleaning, root canal, braces. Mon-Sat 9-7."] \\
    [--greeting "Custom first message"] \\
    [--write-env]
`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  if (!env.ELEVENLABS_API_KEY) {
    console.error('[setup:el-agent] ELEVENLABS_API_KEY is not configured');
    exit(1);
  }

  const parsed = parseArgs();

  // n8n base URL → tool base URL. The live-tools workflow listens at
  // /webhook/tool/<tool_name>.
  const toolBaseUrl = `${parsed.n8nUrl.replace(/\/+$/, '')}/webhook/tool`;

  // Import lazily so the env check runs first and prints a clean error.
  const { createAgent } = await import('../lib/elevenlabs');

  console.log('[setup:el-agent] creating agent…', {
    businessName: parsed.businessName,
    language: parsed.language,
    voiceId: parsed.voiceId,
    toolBaseUrl,
  });

  const { agentId } = await createAgent({
    businessName: parsed.businessName,
    voiceId: parsed.voiceId,
    primaryLanguage: parsed.language,
    toolBaseUrl,
    city: parsed.city,
    ownerName: parsed.ownerName,
    greeting: parsed.greeting,
    servicesSummary: parsed.servicesSummary,
  });

  console.log('[setup:el-agent] OK');
  console.log(`agentId: ${agentId}`);

  if (parsed.writeEnv) {
    const envPath = resolve(process.cwd(), '.env.local');
    const line = `\nDEMO_AGENT_ID=${agentId}\n`;
    if (!existsSync(envPath)) {
      console.warn(
        `[setup:el-agent] .env.local does not exist — appending anyway at ${envPath}`,
      );
    }
    appendFileSync(envPath, line, 'utf8');
    console.log(`[setup:el-agent] wrote DEMO_AGENT_ID to ${envPath}`);
  } else {
    console.log(
      '\nAppend to .env.local manually, or re-run with --write-env:',
    );
    console.log(`DEMO_AGENT_ID=${agentId}`);
  }
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error('[setup:el-agent] failed:', message);
  exit(1);
});
