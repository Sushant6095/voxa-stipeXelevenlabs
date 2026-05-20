# Phase 4 — Manual Telephony Test

Run this checklist at the end of the build session, after pasting real env vars
into `.env.local`. The goal is a single confirmed phone call that proves the
Twilio + ElevenLabs native integration is wired end-to-end.

> **Cost note:** one Twilio IN number is ~$1/month. Buy exactly one per build
> session. Re-use it for all tests. Clean up at the end with `--cleanup`.

---

## Pre-flight

Confirm `.env.local` contains real values for:

- [ ] `TWILIO_ACCOUNT_SID`
- [ ] `TWILIO_AUTH_TOKEN`
- [ ] `ELEVENLABS_API_KEY`

Confirm dependencies are installed:

```bash
pnpm install
```

---

## Step 1 — Stripe foundation (Phase 3 output, prerequisite)

```bash
pnpm setup:stripe
```

Confirms Meter + Products + Prices exist and Price IDs are appended to
`.env.local`. Skip if Phase 3 already ran cleanly.

## Step 2 — Create an ElevenLabs agent (Phase 5 output, prerequisite)

```bash
pnpm tsx scripts/setup-elevenlabs-template.ts
```

Note the `agent_id` printed at the end. Copy it. You'll pass it to the
telephony script below.

> If Phase 5 hasn't run yet, manually create a test agent in the ElevenLabs
> dashboard ("Voxa Test", default voice, any system prompt) and use that
> `agent_id`.

## Step 3 — Provision a Twilio number and wire it to the agent

```bash
pnpm test:telephony <agent_id>
```

Expected output:

```json
{
  "twilioSid": "PN...",
  "phoneNumberE164": "+91...",
  "elPhoneNumberId": "...",
  "countryCode": "IN"
}
```

If IN inventory is empty or your Twilio account isn't approved for IN, the
script logs a warning and automatically falls back to a US number — the demo
still works.

## Step 4 — Call the number

From your own phone, dial the `phoneNumberE164` value printed in Step 3.

Success criteria:

- [ ] The agent answers within ~2 rings.
- [ ] You hear the agent's first message in the configured voice.
- [ ] The agent responds to a basic spoken question.

Do **not** declare Phase 4 done until this works.

## Step 5 — Cleanup (when finished testing)

```bash
pnpm test:telephony --cleanup <twilioSid>
```

Releases the Twilio number. EL's import record auto-orphans; clean it up via
the EL dashboard if needed.

---

## Troubleshooting

If the call doesn't connect, check in this order:

1. **EL agent is published.** ElevenLabs dashboard → Conversational AI → your
   agent → status badge. If "Draft", click Publish.
2. **Number is imported under "Phone Numbers" in EL.** ElevenLabs dashboard →
   Conversational AI → Phone Numbers. The number should appear with the
   `Voxa-smoke-test` label.
3. **Number is assigned to the agent.** Same screen — the row's "Agent" column
   should show your agent's name. If empty, re-PATCH via the EL UI dropdown.
4. **Twilio voice webhook is set by EL, not blank.** Twilio Console → Phone
   Numbers → your number → "A call comes in" should point at an EL
   `api.elevenlabs.io` URL. If blank or pointing elsewhere, the native
   integration was overridden — delete the number from EL and re-import.
   **Do not** manually set `voiceUrl` on the Twilio side.
5. **Calls aren't blocked at the carrier.** From India, mobile carriers sometimes
   reject non-KYC inbound to +91 numbers. Try a different SIM. If still
   blocked, rerun with `--country=US`:

   ```bash
   pnpm test:telephony <agent_id> --country=US
   ```

6. **Auth Token correct.** EL stores the Twilio Auth Token at import time. If
   you rotated the Twilio token after import, delete + re-import.

### Common error signatures

| Error / symptom | Cause | Fix |
|---|---|---|
| Twilio code 21452 at purchase | No IN numbers in inventory | Re-run; or `--country=US` |
| Twilio code 21422 at purchase | Account not approved for IN | `--country=US` |
| EL import 401 | Wrong SID/Token | Re-copy from Twilio Console |
| EL import 409 | Number already imported | Delete prior import in EL dashboard |
| Phone rings but silence | Audio format mismatch | Agent settings → `asr.user_input_audio_format: 'ulaw_8000'` |

---

## Why we don't write custom TwiML

ElevenLabs' native Twilio import auto-configures the voice webhook on Twilio
to point at EL's bridge. Any manual `voiceUrl` setting — at purchase or after —
overrides the integration and the agent stops answering. `lib/twilio.ts`
purchases numbers with NO `voiceUrl`, by design. See JSDoc on
`purchaseIndianNumber` for the inline warning.
