# n8n Credentials Checklist

Create these credentials in the n8n UI **before** importing the workflow JSONs.
Match the credential `name` exactly so n8n auto-links them on import.

## 1. Voxa Supabase (service role)

- **Credential type:** Supabase API
- **Credential name (must match):** `Voxa Supabase (service role)`
- **Host:** `https://YOUR_PROJECT.supabase.co`
- **Service role secret:** the **service_role** key (NOT the anon key —
  workflows must bypass RLS)
- **Schema:** `public`

Used by every workflow.

## 2. Voxa Stripe (Secret Key as Basic Auth user)

- **Credential type:** Basic Auth (HTTP Request)
- **Credential name (must match):** `Voxa Stripe (Secret Key as Basic Auth user)`
- **Username:** your `STRIPE_SECRET_KEY` (`sk_live_…` or `sk_test_…`)
- **Password:** leave empty

Used by W3 for `POST https://api.stripe.com/v1/billing/meter_events`.

> Stripe's v1 REST API uses Basic Auth where the **secret key is the
> username** and the password is empty. Do NOT put the key in the password
> field.

## 3. Voxa Twilio (Account SID / Auth Token)

- **Credential type:** Basic Auth (HTTP Request)
- **Credential name (must match):** `Voxa Twilio (Account SID / Auth Token)`
- **Username:** `TWILIO_ACCOUNT_SID`
- **Password:** `TWILIO_AUTH_TOKEN`

Used by W1, W2, W3, W4, W5 for purchasing numbers, releasing numbers, sending
WhatsApp messages.

## 4. ElevenLabs (header auth)

For ElevenLabs HTTP calls in W1 and W4, the JSONs send the `xi-api-key` header
directly via the `headerParameters` field and reference `{{ $env.ELEVENLABS_API_KEY }}`.
No n8n credential record is required — just make sure `ELEVENLABS_API_KEY` is
set as an n8n environment variable on the Railway service.

If you prefer a credential object, create one as **Header Auth** type:
- **Name:** ElevenLabs
- **Header name:** `xi-api-key`
- **Header value:** `xi_xxxxxxxxxxxxxxxxxxxx`

Then re-link nodes that currently use the `$env.ELEVENLABS_API_KEY` header.

## 5. Anthropic (header auth)

Same pattern as ElevenLabs — W3 uses `{{ $env.ANTHROPIC_API_KEY }}` in the
header. Just set `ANTHROPIC_API_KEY` on the Railway n8n service.

If you prefer a credential:
- **Name:** Anthropic
- **Type:** Header Auth
- **Header name:** `x-api-key`
- **Header value:** `sk-ant-…`

## 6. Cal.com Bearer (optional)

W2 `check_availability` and `book_appointment` branches use
`Authorization: Bearer {{ $env.CAL_COM_API_KEY }}`. If `CAL_COM_API_KEY` is
unset, both branches **gracefully degrade** — `check_availability` returns
canned fallback slots so the live call never breaks.

If you want real Cal.com, set the env var on Railway. No credential object is
required.

## Environment variables checklist (set on Railway n8n service)

| Variable | Required? | Used by |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | yes | W1 (`/api/agent/create`), W4 (billing link in WhatsApp), W5 (digest link) |
| `VOXA_INTERNAL_SECRET` | yes | W1 (auth header for `/api/agent/create`) |
| `TWILIO_ACCOUNT_SID` | yes | W1, W2, W3, W4, W5 |
| `TWILIO_AUTH_TOKEN` | yes | every Twilio call (lives inside the Basic Auth credential too) |
| `TWILIO_WHATSAPP_FROM` | yes | every WhatsApp send (`+14155238886` for the sandbox) |
| `ELEVENLABS_API_KEY` | yes | W1, W4 |
| `ANTHROPIC_API_KEY` | yes | W3 (extraction) |
| `CAL_COM_API_KEY` | optional | W2 (falls back if unset) |
| `GENERIC_TIMEZONE` | yes | W5 cron evaluation (set to `Asia/Kolkata`) |

## Verifying after import

1. Open each workflow in the n8n UI.
2. Look for red error banners on nodes — these indicate missing credentials or
   env vars.
3. Click into each Supabase node → confirm "Credential" shows
   `Voxa Supabase (service role)`.
4. Click into each Twilio HTTP node → confirm "Authentication" is set to
   "Generic Credential Type → HTTP Basic Auth → Voxa Twilio…".
5. Click into the Stripe meter node (W3) → confirm Basic Auth uses
   `Voxa Stripe (Secret Key as Basic Auth user)`.

Once all 5 workflows show no red banners, run a test from the n8n UI for each
(see `README.md` smoke-test section). Only after green tests should you flip
the workflow toggle to **Active**.
