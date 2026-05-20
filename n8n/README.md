# Voxa n8n Workflows

The five workflows that make up Voxa's orchestration backbone. Each file is a
self-contained, importable n8n workflow JSON exported in n8n 1.x format.

| # | File | Trigger | Sync? | Purpose |
|---|------|---------|-------|---------|
| 1 | `01-onboarding.json` | `POST /webhook/onboarding` | sync (Respond node) | After Stripe Checkout — buy Twilio number, create EL agent (via `/api/agent/create`), import + assign number, WhatsApp owner |
| 2 | `02-live-tools.json` | `POST /webhook/tool/:tool_name` | sync (<2s per branch) | The 6 EL Conv AI server tools |
| 3 | `03-post-call.json` | `POST /webhook/post-call` | async (200 first, then process) | Stripe meter event + Claude extraction + lead upsert + hot-lead alert |
| 4 | `04-stripe-webhooks.json` | `POST /webhook/stripe-webhook` | async | `subscription_deleted` cleanup + `invoice_payment_failed` pause |
| 5 | `05-daily-digest.json` | Cron `0 18 * * *` IST | n/a | Per-business WhatsApp summary at 6 PM IST |

## Import order

1. In n8n, **first create the credentials** listed in
   [`credentials-checklist.md`](./credentials-checklist.md). The workflow JSONs
   reference credentials by `name` — n8n will auto-attach matching ones on
   import. If names differ, you re-link them once per HTTP/Supabase node.
2. **Set environment variables** in your Railway n8n deployment:
   - `NEXT_PUBLIC_APP_URL` — your Vercel URL (e.g. `https://voxa.app`)
   - `VOXA_INTERNAL_SECRET` — shared with the Next.js `/api/agent/create` route
   - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM`
   - `ELEVENLABS_API_KEY`
   - `ANTHROPIC_API_KEY`
   - `CAL_COM_API_KEY` (optional — `book_appointment` + `check_availability`
     gracefully degrade if unset)
   - `GENERIC_TIMEZONE=Asia/Kolkata` (so cron strings evaluate in IST)
3. **Import each workflow JSON** via n8n UI → ☰ → "Import from File".
4. **Re-link credentials** on each HTTP/Supabase node if n8n flags missing ones.
5. **Test with the test URL** (the play icon on the Webhook node) before
   activating. Use curl or the n8n built-in `Test workflow` button.
6. **Activate** by flipping the workflow toggle to "Active". This switches the
   webhook URL from the test URL to the production URL — the one referenced by
   `N8N_WEBHOOK_BASE_URL` in your Next.js env.

## Webhook URLs after activation

When `N8N_WEBHOOK_BASE_URL=https://voxa-n8n.up.railway.app`:

| Workflow | Production URL |
|---|---|
| W1 onboarding | `https://voxa-n8n.up.railway.app/webhook/onboarding` |
| W2 live tools | `https://voxa-n8n.up.railway.app/webhook/tool/:tool_name` |
| W3 post-call | `https://voxa-n8n.up.railway.app/webhook/post-call` |
| W4 stripe webhooks | `https://voxa-n8n.up.railway.app/webhook/stripe-webhook` |
| W5 daily digest | cron only — no URL |

These paths line up with `lib/n8n.ts → N8N_WORKFLOWS`.

## Re-exporting after edits

After editing a workflow in the n8n UI:

```bash
# In the workflow editor: ☰ → Download
# Save the file over the existing n8n/0X-*.json
# Commit:
git add n8n/0X-*.json
git commit -m "chore(n8n): update workflow X — <reason>"
```

This is our version control for n8n.

## Smoke-testing each workflow

### W1 Onboarding

```bash
curl -X POST https://YOUR_N8N/webhook/onboarding \
  -H "Content-Type: application/json" \
  -d '{
    "business_id": "00000000-0000-0000-0000-000000000001",
    "tier": "starter",
    "stripe_customer_id": "cus_test123",
    "stripe_subscription_id": "sub_test123"
  }'
```

Watch the n8n execution log; you should see a green path through Twilio
purchase → EL import → EL assign → Supabase update → WhatsApp.

### W2 Live Tools

```bash
curl -X POST https://YOUR_N8N/webhook/tool/check_availability \
  -H "Content-Type: application/json" \
  -H "x-elevenlabs-agent-id: agent_test123" \
  -d '{"date": "2026-05-21", "time_window": "morning"}'
```

Expected response: `{"slots":[...],"source":"cal.com"}` or
`{"slots":[...],"source":"fallback"}`.

### W3 Post-Call

```bash
curl -X POST https://YOUR_N8N/webhook/post-call \
  -H "Content-Type: application/json" \
  -d '{
    "type": "post_call_transcription",
    "data": {
      "conversation_id": "conv_test_001",
      "agent_id": "agent_test123",
      "started_at": "2026-05-20T10:00:00Z",
      "ended_at": "2026-05-20T10:03:30Z",
      "transcript": [{"role":"user","message":"book me at 5pm tomorrow"}],
      "summary": "Caller wants 5pm booking tomorrow"
    }
  }'
```

n8n responds 200 immediately; subsequent nodes finalise in the background.

### W4 Stripe Webhooks

```bash
curl -X POST https://YOUR_N8N/webhook/stripe-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "invoice_payment_failed",
    "event": {"data":{"object":{"subscription":"sub_test123","customer":"cus_test123"}}}
  }'
```

### W5 Daily Digest

Manually trigger via the n8n UI: open the workflow → "Execute Workflow" → it
runs the cron path immediately.

## Why these workflows live here, not in Next.js API routes

Per `CLAUDE.md`:
> n8n is the orchestration backbone, not the application layer. Business
> logic lives in n8n workflows. The Next.js app is auth, dashboard, and
> Stripe Checkout. Resist the urge to write API routes that duplicate n8n.

Judges see the visual graph in the demo video. Keep it visible.
