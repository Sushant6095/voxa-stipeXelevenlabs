import 'server-only';

import twilioFactory, { type Twilio } from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

if (!accountSid || !authToken) {
  throw new Error(
    'TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN is not configured',
  );
}

/**
 * Singleton Twilio REST client. Server-only — never import in a client component.
 *
 * Named `twilio` to keep parity with the canonical SDK convention used elsewhere
 * in the codebase. The factory import is renamed `twilioFactory` to avoid the
 * collision.
 */
export const twilio: Twilio = twilioFactory(accountSid, authToken);

/**
 * Returns the Twilio credentials this process is using. Server-only.
 *
 * `lib/telephony.ts` passes these into ElevenLabs' "Import number from Twilio"
 * API — ElevenLabs needs the SID + Auth Token to call Twilio on our behalf and
 * reconfigure the voice webhook to its native bridge.
 */
export function getTwilioCredentials(): {
  accountSid: string;
  authToken: string;
} {
  // The module-level guard above means we know these are defined at this point.
  return {
    accountSid: accountSid as string,
    authToken: authToken as string,
  };
}

// ---------------------------------------------------------------------------
// Phone number provisioning
// ---------------------------------------------------------------------------

export type CountryCode = 'IN' | 'US';

export interface TwilioNumberPurchase {
  /** Twilio Phone Number SID, e.g. "PN…" */
  sid: string;
  /** E.164 phone number, e.g. "+919876543210" */
  phoneNumberE164: string;
  /** Friendly name set on purchase — contains a timestamp for cleanup scripts. */
  friendlyName: string;
  countryCode: CountryCode;
}

export interface AvailableNumber {
  /** E.164 phone number */
  phoneNumber: string;
  friendlyName: string;
}

export interface ListAvailableIndianNumbersOpts {
  /** Optional area code to filter by, e.g. 80 for Bengaluru. */
  areaCode?: number;
  /** Default 20, max 100. */
  limit?: number;
}

/**
 * Search Twilio's IN local inventory for available numbers.
 *
 * Voice + SMS capability filter is on by default — ElevenLabs' native bridge
 * needs voice; we keep SMS so the same number can also be used for OTPs later.
 *
 * @example
 *   const numbers = await listAvailableIndianNumbers({ areaCode: 80, limit: 5 });
 */
export async function listAvailableIndianNumbers(
  opts: ListAvailableIndianNumbersOpts = {},
): Promise<AvailableNumber[]> {
  const { areaCode, limit = 20 } = opts;

  const results = await twilio
    .availablePhoneNumbers('IN')
    .local.list({
      voiceEnabled: true,
      smsEnabled: true,
      limit,
      ...(typeof areaCode === 'number' ? { areaCode } : {}),
    });

  return results.map((r) => ({
    phoneNumber: r.phoneNumber,
    friendlyName: r.friendlyName ?? r.phoneNumber,
  }));
}

export interface PurchaseNumberOpts {
  /** Optional area code (IN: e.g. 80 Bengaluru, 22 Mumbai). */
  areaCode?: number;
}

function buildFriendlyName(): string {
  // Timestamp-stamped friendly name lets cleanup scripts identify Voxa-owned
  // numbers without ambiguity. See operating rule #2 in the telephony brief.
  return `Voxa - ${new Date().toISOString()}`;
}

/**
 * Purchase a +91 Indian local number for inbound voice.
 *
 * CRITICAL: do NOT set `voiceUrl` during purchase. ElevenLabs' "Import number
 * from Twilio" flow (called immediately after, in `lib/telephony.ts`)
 * overwrites the voice webhook with its own native bridge. Setting `voiceUrl`
 * here causes EL's import to either fail or be silently overwritten — either
 * way the integration breaks. Leave voice routing to the EL native import.
 *
 * Hackathon scope: INBOUND only. Outbound +91 requires KYC + a verified caller
 * ID, neither of which is in scope.
 *
 * Throws `RestException` with `code === 21452` ("no numbers available") or
 * `code === 21422` ("regulatory / not allowed") when IN inventory is empty or
 * the account is not approved — `lib/telephony.ts` catches these to fall back
 * to a US number for the demo.
 */
export async function purchaseIndianNumber(
  opts: PurchaseNumberOpts = {},
): Promise<TwilioNumberPurchase> {
  return purchaseLocalNumber('IN', opts);
}

/**
 * Purchase a US local number for inbound voice. Used as a fallback when IN
 * purchase is blocked by regulatory / inventory issues so the hackathon demo
 * can still be filmed.
 *
 * Same `voiceUrl` warning as `purchaseIndianNumber`: do not set it here.
 */
export async function purchaseUSNumber(
  opts: PurchaseNumberOpts = {},
): Promise<TwilioNumberPurchase> {
  return purchaseLocalNumber('US', opts);
}

async function purchaseLocalNumber(
  country: CountryCode,
  opts: PurchaseNumberOpts,
): Promise<TwilioNumberPurchase> {
  const { areaCode } = opts;

  const available = await twilio
    .availablePhoneNumbers(country)
    .local.list({
      voiceEnabled: true,
      smsEnabled: true,
      limit: 1,
      ...(typeof areaCode === 'number' ? { areaCode } : {}),
    });

  if (available.length === 0) {
    throw new Error(
      `No available ${country} local numbers matched the search criteria`,
    );
  }

  const friendlyName = buildFriendlyName();

  const purchased = await twilio.incomingPhoneNumbers.create({
    phoneNumber: available[0].phoneNumber,
    friendlyName,
    // INTENTIONALLY no voiceUrl — EL's native import takes over routing.
  });

  return {
    sid: purchased.sid,
    phoneNumberE164: purchased.phoneNumber,
    friendlyName,
    countryCode: country,
  };
}

/**
 * Release (delete) a previously-purchased Twilio number. Used by
 * `lib/telephony.ts` to self-clean orphaned purchases when the downstream EL
 * import / assignment fails, and by cleanup scripts.
 */
export async function releaseNumber(sid: string): Promise<void> {
  await twilio.incomingPhoneNumbers(sid).remove();
}

// ---------------------------------------------------------------------------
// Messaging
// ---------------------------------------------------------------------------

export interface SendSMSInput {
  /** Recipient in E.164, e.g. "+919876543210" */
  to: string;
  body: string;
  /**
   * Override the sender. Defaults to `process.env.TWILIO_SMS_FROM`, which must
   * be a Twilio-owned, SMS-capable number in E.164.
   */
  from?: string;
}

/**
 * Send a transactional SMS. Used for escalation fallbacks when WhatsApp opt-in
 * has lapsed and we still need to reach the business owner.
 */
export async function sendSMS(
  input: SendSMSInput,
): Promise<{ sid: string }> {
  const from = input.from ?? process.env.TWILIO_SMS_FROM;
  if (!from) {
    throw new Error(
      'TWILIO_SMS_FROM is not configured and no `from` was provided to sendSMS',
    );
  }

  const message = await twilio.messages.create({
    to: input.to,
    from,
    body: input.body,
  });

  return { sid: message.sid };
}

export interface SendWhatsAppMessageInput {
  /**
   * Recipient phone number in E.164 — the helper auto-prefixes `whatsapp:`.
   * Recipient MUST have opted into the Twilio sandbox by texting the join
   * code first, otherwise Twilio returns 400.
   */
  to: string;
  body: string;
}

/**
 * Send a WhatsApp message via Twilio's Business sandbox. Reads the sender from
 * `process.env.TWILIO_WHATSAPP_FROM` (e.g. `whatsapp:+14155238886` for the
 * default sandbox). Both `to` and the configured `from` are normalized with
 * the `whatsapp:` prefix automatically.
 */
export async function sendWhatsAppMessage(
  input: SendWhatsAppMessageInput,
): Promise<{ sid: string }> {
  const rawFrom = process.env.TWILIO_WHATSAPP_FROM;
  if (!rawFrom) {
    throw new Error('TWILIO_WHATSAPP_FROM is not configured');
  }

  const from = rawFrom.startsWith('whatsapp:') ? rawFrom : `whatsapp:${rawFrom}`;
  const to = input.to.startsWith('whatsapp:')
    ? input.to
    : `whatsapp:${input.to}`;

  const message = await twilio.messages.create({
    to,
    from,
    body: input.body,
  });

  return { sid: message.sid };
}
