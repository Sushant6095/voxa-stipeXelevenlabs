/**
 * scripts/setup-stripe.ts — idempotent provisioner for Voxa's Stripe shape.
 *
 * Creates (or reuses) one Billing Meter, three Products (starter/growth/scale),
 * and six Prices (one flat + one metered per tier). Re-running is safe — every
 * resource is looked up by stable metadata before creation.
 *
 * Usage:
 *   pnpm setup:stripe              # apply
 *   pnpm setup:stripe --dry-run    # plan only, no API writes
 *
 * Requires `STRIPE_SECRET_KEY` in the environment. Use a `sk_test_...` key.
 * The script prints a dotenv block to stdout AND appends new lines to
 * `.env.local` (idempotently — pre-existing keys are skipped).
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';

import Stripe from 'stripe';

import {
  PRICING_TIERS,
  STRIPE_TIERS,
  type StripeTier,
} from '../lib/pricing';

const STRIPE_API_VERSION = '2025-03-31.basil';
const METER_EVENT_NAME = 'call_minutes';
const METADATA_KEY_TIER = 'voxa_tier';
const METADATA_KEY_KIND = 'voxa_kind';
const ENV_FILE_REL = '.env.local';

type PriceKind = 'flat' | 'metered';

interface ProvisionOutcome {
  tier: StripeTier;
  productId: string;
  flatPriceId: string;
  meteredPriceId: string;
}

interface ScriptArgs {
  dryRun: boolean;
}

function parseArgs(argv: readonly string[]): ScriptArgs {
  return { dryRun: argv.includes('--dry-run') };
}

function logSection(title: string): void {
  // eslint-disable-next-line no-console
  console.log(`\n=== ${title} ===`);
}

function logKv(label: string, value: string): void {
  // eslint-disable-next-line no-console
  console.log(`  ${label}: ${value}`);
}

function logInfo(message: string): void {
  // eslint-disable-next-line no-console
  console.log(message);
}

function logError(message: string): void {
  // eslint-disable-next-line no-console
  console.error(message);
}

// ---------------------------------------------------------------------------
// Meter
// ---------------------------------------------------------------------------

async function ensureMeter(
  stripe: Stripe,
  dryRun: boolean,
): Promise<Stripe.Billing.Meter | { id: string; event_name: string }> {
  const list = await stripe.billing.meters.list({ status: 'active', limit: 100 });
  const existing = list.data.find((m) => m.event_name === METER_EVENT_NAME);
  if (existing) {
    logInfo(`[meter] reusing existing meter ${existing.id} (${existing.event_name})`);
    return existing;
  }

  if (dryRun) {
    logInfo(`[meter] DRY-RUN would create meter event_name="${METER_EVENT_NAME}"`);
    return { id: 'mtr_dryrun', event_name: METER_EVENT_NAME };
  }

  const created = await stripe.billing.meters.create({
    display_name: 'Call minutes',
    event_name: METER_EVENT_NAME,
    default_aggregation: { formula: 'sum' },
    customer_mapping: {
      type: 'by_id',
      event_payload_key: 'stripe_customer_id',
    },
    value_settings: { event_payload_key: 'value' },
  });
  logInfo(`[meter] created ${created.id}`);
  return created;
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

async function ensureProduct(
  stripe: Stripe,
  tier: StripeTier,
  dryRun: boolean,
): Promise<Stripe.Product | { id: string }> {
  const tierConfig = PRICING_TIERS[tier];
  // We list with a generous limit and filter client-side because the search
  // API needs metadata indexing to settle which is unreliable on fresh test
  // accounts.
  const list = await stripe.products.list({ active: true, limit: 100 });
  const existing = list.data.find((p) => p.metadata[METADATA_KEY_TIER] === tier);
  if (existing) {
    logInfo(`[product:${tier}] reusing ${existing.id}`);
    return existing;
  }

  if (dryRun) {
    logInfo(`[product:${tier}] DRY-RUN would create "Voxa ${tierConfig.name}"`);
    return { id: `prod_dryrun_${tier}` };
  }

  const created = await stripe.products.create({
    name: `Voxa ${tierConfig.name}`,
    description: tierConfig.tagline,
    metadata: { [METADATA_KEY_TIER]: tier },
  });
  logInfo(`[product:${tier}] created ${created.id}`);
  return created;
}

// ---------------------------------------------------------------------------
// Prices
// ---------------------------------------------------------------------------

interface EnsurePriceOpts {
  stripe: Stripe;
  productId: string;
  tier: StripeTier;
  kind: PriceKind;
  unitAmountPaise: number;
  meterId?: string;
  dryRun: boolean;
}

async function ensurePrice({
  stripe,
  productId,
  tier,
  kind,
  unitAmountPaise,
  meterId,
  dryRun,
}: EnsurePriceOpts): Promise<Stripe.Price | { id: string }> {
  const list = await stripe.prices.list({
    product: productId,
    active: true,
    limit: 100,
  });
  const existing = list.data.find(
    (p) =>
      p.metadata[METADATA_KEY_TIER] === tier &&
      p.metadata[METADATA_KEY_KIND] === kind,
  );
  if (existing) {
    logInfo(`[price:${tier}:${kind}] reusing ${existing.id}`);
    return existing;
  }

  if (dryRun) {
    logInfo(
      `[price:${tier}:${kind}] DRY-RUN would create unit_amount=${unitAmountPaise} paise`,
    );
    return { id: `price_dryrun_${tier}_${kind}` };
  }

  const baseParams: Stripe.PriceCreateParams = {
    product: productId,
    currency: 'inr',
    unit_amount: unitAmountPaise,
    metadata: {
      [METADATA_KEY_TIER]: tier,
      [METADATA_KEY_KIND]: kind,
    },
  };

  if (kind === 'flat') {
    baseParams.recurring = {
      interval: 'month',
      usage_type: 'licensed',
    };
  } else {
    if (!meterId) {
      throw new Error(`Cannot create metered price for ${tier} without meter ID`);
    }
    baseParams.billing_scheme = 'per_unit';
    baseParams.recurring = {
      interval: 'month',
      usage_type: 'metered',
      meter: meterId,
    };
  }

  const created = await stripe.prices.create(baseParams);
  logInfo(`[price:${tier}:${kind}] created ${created.id}`);
  return created;
}

// ---------------------------------------------------------------------------
// .env.local idempotent writer
// ---------------------------------------------------------------------------

async function appendEnvVars(
  cwd: string,
  pairs: ReadonlyArray<readonly [string, string]>,
): Promise<{ written: number; skipped: number; path: string }> {
  const envPath = path.join(cwd, ENV_FILE_REL);
  let existing = '';
  try {
    existing = await fs.readFile(envPath, 'utf8');
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code !== 'ENOENT') throw err;
    // No .env.local yet — start with an empty buffer.
  }

  const existingLines = new Set(
    existing
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean),
  );

  const toAdd: string[] = [];
  let skipped = 0;
  for (const [key, value] of pairs) {
    const line = `${key}=${value}`;
    // Skip if either the exact line or any line starting with KEY= already exists.
    const alreadyPresent = [...existingLines].some(
      (l) => l === line || l.startsWith(`${key}=`),
    );
    if (alreadyPresent) {
      skipped += 1;
      continue;
    }
    toAdd.push(line);
  }

  if (toAdd.length === 0) {
    return { written: 0, skipped, path: envPath };
  }

  const prefix = existing.length === 0 || existing.endsWith('\n') ? '' : '\n';
  const block = `${prefix}\n# --- Voxa Stripe IDs (added by scripts/setup-stripe.ts) ---\n${toAdd.join('\n')}\n`;
  await fs.appendFile(envPath, block, 'utf8');
  return { written: toAdd.length, skipped, path: envPath };
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  if (!process.env.STRIPE_SECRET_KEY) {
    logError('Set STRIPE_SECRET_KEY first');
    process.exit(1);
  }

  const args = parseArgs(process.argv.slice(2));
  if (args.dryRun) {
    logInfo('Running in DRY-RUN mode — no Stripe writes will occur.');
  }

  type LockedApiVersion = NonNullable<
    ConstructorParameters<typeof Stripe>[1]
  >['apiVersion'];
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: STRIPE_API_VERSION as unknown as LockedApiVersion,
    typescript: true,
    appInfo: { name: 'voxa-setup', version: '0.1.0' },
  });

  logSection('Meter');
  const meter = await ensureMeter(stripe, args.dryRun);

  const outcomes: ProvisionOutcome[] = [];
  for (const tier of STRIPE_TIERS) {
    const tierConfig = PRICING_TIERS[tier];
    logSection(`Tier: ${tier}`);
    const product = await ensureProduct(stripe, tier, args.dryRun);
    const flat = await ensurePrice({
      stripe,
      productId: product.id,
      tier,
      kind: 'flat',
      unitAmountPaise: tierConfig.flatPaise,
      dryRun: args.dryRun,
    });
    const metered = await ensurePrice({
      stripe,
      productId: product.id,
      tier,
      kind: 'metered',
      unitAmountPaise: tierConfig.overagePaise,
      meterId: meter.id,
      dryRun: args.dryRun,
    });
    outcomes.push({
      tier,
      productId: product.id,
      flatPriceId: flat.id,
      meteredPriceId: metered.id,
    });
  }

  logSection('Result');
  for (const o of outcomes) {
    logInfo(`Voxa ${PRICING_TIERS[o.tier].name}:`);
    logKv(`STRIPE_PRICE_${o.tier.toUpperCase()}_FLAT`, o.flatPriceId);
    logKv(`STRIPE_PRICE_${o.tier.toUpperCase()}_METER`, o.meteredPriceId);
  }
  logKv('STRIPE_METER_ID', meter.id);

  // Build the dotenv block — convenient for copy/paste even when writing
  // succeeded.
  const envPairs: Array<readonly [string, string]> = [];
  for (const o of outcomes) {
    envPairs.push([`STRIPE_PRICE_${o.tier.toUpperCase()}_FLAT`, o.flatPriceId]);
    envPairs.push([`STRIPE_PRICE_${o.tier.toUpperCase()}_METER`, o.meteredPriceId]);
  }
  envPairs.push(['STRIPE_METER_ID', meter.id]);

  logSection('dotenv block');
  for (const [k, v] of envPairs) {
    logInfo(`${k}=${v}`);
  }

  if (args.dryRun) {
    logInfo('\nDry-run complete — nothing written to .env.local.');
    return;
  }

  const writeResult = await appendEnvVars(process.cwd(), envPairs);
  logInfo(
    `\n.env.local: wrote ${writeResult.written} new var(s), skipped ${writeResult.skipped} pre-existing (${writeResult.path}).`,
  );
}

main().catch((err) => {
  logError(err instanceof Error ? err.stack ?? err.message : String(err));
  process.exit(1);
});
