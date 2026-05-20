---
name: n8n-workflow-design
description: Use whenever designing, building, or debugging n8n workflows — webhook triggers, Switch nodes, HTTP Request, Supabase nodes, Code nodes, Cron triggers, error handling. Covers the 5 Voxa workflows (onboarding, live tools, post-call, stripe webhooks, daily digest). Trigger on terms "n8n", "workflow", "webhook node", "Switch node", "automation".
---

# n8n Workflow Design

## Why n8n is the orchestration layer

Business logic that touches 3+ external services (Stripe, Twilio, ElevenLabs, Supabase, Cal.com, Anthropic) lives in n8n. The Next.js app only does auth, dashboard, and Stripe Checkout. Resist the urge to write API routes that duplicate workflows — judges like seeing the visual graph.

## Deployment

Railway template: `n8n-io/n8n`. After deploy:
1. Set environment variables: `N8N_BASIC_AUTH_USER`, `N8N_BASIC_AUTH_PASSWORD`, `WEBHOOK_URL=https://your-app.up.railway.app`, `GENERIC_TIMEZONE=Asia/Kolkata`.
2. Persist data with a Railway volume mounted at `/home/node/.n8n`.
3. The public URL is your `N8N_WEBHOOK_BASE_URL`.

## Webhook node anatomy

Every workflow starts with a Webhook node. Key settings:

- **HTTP Method:** POST (default for our use case)
- **Path:** unique slug, e.g. `onboarding`, `tool/check_availability`, `post-call`
- **Response Mode:**
  - `Respond Immediately` (default) — return 200 instantly, continue processing in background. Use for fire-and-forget (post-call, stripe webhooks).
  - `Last Node` — wait for the workflow, return the last node's data. Use for synchronous responses (EL tool calls).
- **Test URL vs Production URL:** test URL only fires when the editor is open in test mode. Production URL only fires when the workflow is ACTIVATED. Always test with test URL, then activate before going live.

## Switch node patterns

Use Switch to route by tool name or event type. Configure with:
- **Mode:** Expression
- **Output:** one output per case + a fallback "default" output

Example for the live tools workflow:
```
Expression: ={{ $json.headers["x-tool-name"] || $params.tool_name }}
Outputs:
  case "check_availability"   → output 0
  case "book_appointment"     → output 1
  case "get_business_info"    → output 2
  case "escalate_to_owner"    → output 3
  case "send_callback_link"   → output 4
  case "log_lead"             → output 5
  default                     → output 6 (error response)
```

## HTTP Request node — production patterns

For calling external APIs (Stripe, Twilio, ElevenLabs):

- **Authentication:** use n8n credentials, not inline tokens
- **Body Type:** Form-Urlencoded for Twilio/Stripe v1 API, JSON for ElevenLabs and Stripe v2
- **Send Headers:** add `Content-Type` only when sending JSON
- **Response:** include "Full Response" if you need status code, otherwise "Body" is fine
- **Options → Retry:** enable for idempotent calls (Stripe Meter Events, Twilio sends). 3 retries, exponential backoff.
- **Continue On Fail:** OFF by default — fail loud. Turn ON only for non-critical sends (analytics).

### Stripe Meter Event (HTTP Request)

```
URL: https://api.stripe.com/v1/billing/meter_events
Method: POST
Authentication: Basic Auth (user=STRIPE_SECRET_KEY, password=empty)
Body Type: Form-Urlencoded
Parameters:
  event_name = call_minutes
  payload[stripe_customer_id] = {{ $json.stripe_customer_id }}
  payload[value] = {{ String(Math.ceil($json.duration_seconds / 60)) }}
  identifier = {{ $json.conversation_id }}     # idempotency key
```

### Twilio WhatsApp (HTTP Request)

```
URL: https://api.twilio.com/2010-04-01/Accounts/{{$env.TWILIO_ACCOUNT_SID}}/Messages.json
Method: POST
Authentication: Basic Auth (user=SID, password=Auth Token)
Body Type: Form-Urlencoded
Parameters:
  From = whatsapp:+14155238886
  To = whatsapp:{{ $json.customer_phone }}
  Body = {{ $json.message }}
```

### Anthropic Claude (HTTP Request, for extraction in post-call)

```
URL: https://api.anthropic.com/v1/messages
Method: POST
Headers:
  x-api-key: {{ $env.ANTHROPIC_API_KEY }}
  anthropic-version: 2023-06-01
  content-type: application/json
Body Type: JSON
Body:
{
  "model": "claude-sonnet-4-5-20250929",
  "max_tokens": 500,
  "messages": [{
    "role": "user",
    "content": "Extract a JSON object from this call transcript. Schema: {lead_score: 1-10, intent: string, sentiment: 'positive'|'neutral'|'angry', customer_name: string|null, customer_phone: string|null, follow_up_action: string}. Return ONLY the JSON, no preamble.\n\nTranscript:\n{{ JSON.stringify($json.transcript) }}"
  }]
}
```

Follow with a Code node:
```javascript
const text = $input.first().json.content[0].text;
const extracted = JSON.parse(text);
return [{ json: extracted }];
```

## Supabase node patterns

Configure once: credential = "Supabase API", URL = your project URL, Service Role Key (not anon).

- **Insert:** straightforward, map fields. Returns inserted row.
- **Upsert:** set "On Conflict" with the unique column (e.g., `elevenlabs_conversation_id`).
- **Select:** "Get All" with filters. Use `match` for equality, `filter` for advanced.
- **Update:** "Update" operation, match by primary key.

For RLS to be bypassed (which is what we want from n8n), use the service role key. Never put service role in the Next.js client.

## Code node — survival kit

n8n's Code node runs in a sandboxed JavaScript environment. Key gotchas:

```javascript
// Access input from previous node
const items = $input.all();           // Array of all input items
const first = $input.first().json;    // First item's JSON

// Return must be an array of items
return items.map(item => ({
  json: { ...item.json, new_field: 'value' }
}));

// Access workflow variables
const customerId = $node["Set"].json.stripe_customer_id;
const envVar = $env.SOMETHING;

// No access to: fs, network, child_process. Pure JS only.
// Lodash, Moment, crypto-js available as globals.
```

## The 5 Voxa workflows — node graphs

### W1 — Onboarding (sync, Last Node response)

```
Webhook (POST /onboarding)
  → Set [extract metadata: stripe_customer_id, business_id, etc.]
  → HTTP Request [Twilio: buy IN number]
  → IF [voice_sample_url present]
      → HTTP Request [EL voices/add]
      → Set [voice_id from response]
    ELSE
      → Set [voice_id = default]
  → HTTP Request [EL agents/create with voice_id + system prompt]
  → HTTP Request [EL phone-numbers (import Twilio)]
  → HTTP Request [EL phone-numbers/:id (assign agent)]
  → Supabase [Insert into agents]
  → HTTP Request [Twilio WhatsApp activation msg]
  → Respond to Webhook [{ success: true, twilio_phone, agent_id }]
```

### W2 — Live Tools (sync, must respond <2s)

```
Webhook (POST /tool/:tool_name) [Response: Last Node]
  → Switch on $params.tool_name
      ├─ check_availability  → HTTP[Cal.com getSlots] → Respond
      ├─ book_appointment    → HTTP[Cal.com booking] → HTTP[WhatsApp confirm] → Supabase[Insert lead] → Respond
      ├─ get_business_info   → Supabase[Select knowledge_base] → Code[keyword match] → Respond
      ├─ escalate_to_owner   → HTTP[Twilio update call forward] → HTTP[WhatsApp owner] → Respond
      ├─ send_callback_link  → HTTP[WhatsApp with Cal.com URL] → Respond
      └─ log_lead            → Supabase[Insert lead] → Respond
```

### W3 — Post-Call (async, Respond Immediately)

```
Webhook (POST /post-call) [Response: Immediately, 200]
  → Code [compute minutes = ceil(duration/60)]
  → Supabase [Get business by agent_id]
  → HTTP Request [Stripe meter_events.create]
  → HTTP Request [Claude extraction]
  → Code [parse JSON from Claude]
  → Supabase [Insert into calls]
  → Supabase [Upsert into leads]
  → IF [lead_score >= 7 OR sentiment = 'angry']
      → HTTP Request [Twilio WhatsApp hot-lead alert]
```

### W4 — Stripe Webhooks (async)

```
Webhook (POST /stripe) [Response: Immediately, 200]
  → Switch on $json.type
      ├─ invoice.payment_failed       → Supabase[update agents.status=paused] → HTTP[WhatsApp owner]
      ├─ customer.subscription.deleted → HTTP[Twilio release] → HTTP[EL delete] → Supabase[archive]
      └─ customer.subscription.updated → Supabase[upsert subscriptions]
```

### W5 — Daily Digest (Cron)

```
Cron (0 18 * * *) [TZ: Asia/Kolkata]
  → Supabase [Select calls + leads grouped by business, today]
  → SplitInBatches [one per business]
  → Code [format markdown summary]
  → HTTP Request [Twilio WhatsApp to business.owner_whatsapp]
```

## Critical gotchas

1. **Tool branches MUST respond in <5s** (EL agent's hard timeout). Profile every HTTP call. If Cal.com is slow, cache slots or precompute.
2. **`$env` only works in n8n's process**, not in HTTP body templates by default. Set them on the Webhook node's "Options → Allow Env Variables".
3. **Webhook URL changes when you toggle test → production.** Don't paste test URLs into ElevenLabs tool configs — use production URL.
4. **Cron timezone:** set `GENERIC_TIMEZONE=Asia/Kolkata` in Railway env. Cron strings then evaluate in IST.
5. **Supabase node "Service Role" key bypasses RLS** — that's intentional. NEVER use the anon key in n8n.
6. **HTTP Request 'Body Parameters' UI sometimes URL-encodes wrong.** When sending JSON, switch Body Type to "JSON" and write the body as a raw template — don't use the form fields for JSON.
7. **Importing workflow JSON across environments:** node IDs and credential references must match. Re-link credentials after import.

## Version control

Always export workflows as JSON to `n8n/0X-name.json` and commit. After every edit:
1. n8n UI → workflow → ⋯ menu → Download.
2. Replace the file in `n8n/`.
3. Commit with a descriptive message.

## Don't do these

- Don't put secrets in Set nodes (use credentials or env)
- Don't use the legacy n8n webhook URL pattern (always use Production URL on active workflows)
- Don't skip the IF guards on async paths (one bad payload can fan out 100 retries)
- Don't build complex Code nodes — extract to a Function set up as a sub-workflow if it's more than ~30 lines
