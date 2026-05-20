import 'server-only';

import { assignNumberToAgent, importTwilioNumber } from '@/lib/elevenlabs';
import {
  getTwilioCredentials,
  purchaseIndianNumber,
  purchaseUSNumber,
  releaseNumber,
  type CountryCode,
  type TwilioNumberPurchase,
} from '@/lib/twilio';

// Twilio REST error codes we react to during the IN→US fallback.
//   21452 — "No phone numbers found" (inventory empty for IN local search)
//   21422 — "Phone number is not available" / regulatory geographic restriction
// Source: https://www.twilio.com/docs/api/errors
const TWILIO_NO_NUMBERS_AVAILABLE = 21452;
const TWILIO_REGULATORY_BLOCK = 21422;

export interface ProvisionPhoneForAgentOpts {
  /** ElevenLabs Conversational AI agent ID to attach the number to. */
  agentId: string;
  /** Defaults to 'IN'. Falls back to 'US' on regulatory/inventory failure. */
  preferredCountry?: CountryCode;
  /**
   * Appended to the EL phone number label so the EL dashboard is greppable —
   * e.g. business name slug.
   */
  labelSuffix?: string;
}

export interface ProvisionResult {
  /** Twilio Phone Number SID. */
  twilioSid: string;
  /** E.164 phone number that callers dial. */
  phoneNumberE164: string;
  /** ElevenLabs phone_number_id (PN ID inside EL's data model). */
  elPhoneNumberId: string;
  /** Country the number was actually purchased in (post-fallback). */
  countryCode: CountryCode;
}

interface TwilioLikeError {
  code?: number;
  status?: number;
  message?: string;
}

function isFallbackEligible(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const err = error as TwilioLikeError;
  if (typeof err.code === 'number') {
    if (
      err.code === TWILIO_NO_NUMBERS_AVAILABLE ||
      err.code === TWILIO_REGULATORY_BLOCK
    ) {
      return true;
    }
  }
  // Our own pre-check error message from purchaseLocalNumber when search returns 0.
  if (
    typeof err.message === 'string' &&
    /No available IN local numbers/.test(err.message)
  ) {
    return true;
  }
  return false;
}

function buildLabel(suffix: string | undefined): string {
  const base = 'Voxa';
  if (!suffix) return `${base}-${Date.now()}`;
  const slug = suffix.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return slug ? `${base}-${slug}` : `${base}-${Date.now()}`;
}

async function purchaseFor(country: CountryCode): Promise<TwilioNumberPurchase> {
  return country === 'IN'
    ? await purchaseIndianNumber()
    : await purchaseUSNumber();
}

/**
 * Buy a Twilio number only — no ElevenLabs import or agent assignment.
 *
 * Used by smoke tests and any caller that wants to manage the EL side
 * separately. Production paths should prefer `provisionPhoneForAgent` for the
 * orphan-cleanup behavior.
 */
export async function provisionTwilioNumberOnly(
  country: CountryCode = 'IN',
): Promise<TwilioNumberPurchase> {
  return purchaseFor(country);
}

/**
 * End-to-end provisioning: buy a Twilio number, import it into ElevenLabs via
 * the native Twilio integration, and attach it to the supplied EL agent.
 *
 * Strategy:
 *  1. Try the preferred country (defaults to 'IN').
 *  2. If the IN purchase fails with a recognized regulatory or inventory error,
 *     log a warning and fall back to 'US' so the demo can still be filmed.
 *  3. After a successful Twilio purchase, call EL's import API (which also
 *     assigns the number to the agent in the current stub's signature).
 *  4. If the EL import or assignment fails for ANY reason, release the Twilio
 *     number we just bought — no orphan numbers burning $1/mo apiece.
 *
 * @throws If both IN and US purchases fail, or if EL import fails (after which
 *         the Twilio number is released before re-throwing).
 */
export async function provisionPhoneForAgent(
  opts: ProvisionPhoneForAgentOpts,
): Promise<ProvisionResult> {
  const preferred = opts.preferredCountry ?? 'IN';
  const label = buildLabel(opts.labelSuffix);

  // ---- Step 1+2: buy a Twilio number, with IN→US fallback. ----
  let purchase: TwilioNumberPurchase;
  try {
    purchase = await purchaseFor(preferred);
  } catch (primaryError: unknown) {
    if (preferred === 'IN' && isFallbackEligible(primaryError)) {
      // eslint-disable-next-line no-console
      console.warn(
        '[telephony] IN number purchase failed (likely regulatory/inventory).',
        'Falling back to US.',
        { reason: (primaryError as TwilioLikeError).message },
      );
      purchase = await purchaseFor('US');
    } else {
      throw primaryError;
    }
  }

  // ---- Step 3+4: import to ElevenLabs + assign agent, with orphan cleanup. ----
  try {
    const creds = getTwilioCredentials();
    const { phoneNumberId } = await importTwilioNumber({
      phoneNumber: purchase.phoneNumberE164,
      accountSid: creds.accountSid,
      authToken: creds.authToken,
      label,
    });
    await assignNumberToAgent({ phoneNumberId, agentId: opts.agentId });

    return {
      twilioSid: purchase.sid,
      phoneNumberE164: purchase.phoneNumberE164,
      elPhoneNumberId: phoneNumberId,
      countryCode: purchase.countryCode,
    };
  } catch (downstreamError: unknown) {
    // Orphan cleanup: do NOT leave a Twilio number around if the EL side blew
    // up. Best-effort release; surface the original error.
    try {
      await releaseNumber(purchase.sid);
    } catch (releaseError: unknown) {
      // eslint-disable-next-line no-console
      console.error(
        '[telephony] Orphan cleanup failed — Twilio number still owned.',
        { twilioSid: purchase.sid, releaseError },
      );
    }
    throw downstreamError;
  }
}
