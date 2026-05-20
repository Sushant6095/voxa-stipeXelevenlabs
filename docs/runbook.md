# Voxa Runbook

> What to do when things break, during the hackathon and the demo.

## Demo day checklist (hour 0 of Day 4)

- [ ] Demo phone number rings through to AI agent (test it)
- [ ] Test agent has voice clone loaded
- [ ] All 4 languages confirmed working
- [ ] Stripe test mode active, customer + sub for test business
- [ ] WhatsApp sandbox: you, friend, demo recipients all opted in (re-confirm — 72h window)
- [ ] /dashboard loads cleanly in incognito
- [ ] Vercel deployment latest, no failing builds
- [ ] n8n production active, all 5 workflows green in execution log
- [ ] Phone charged + cable + lavalier mic
- [ ] Coffee shop scouted; lighting + audio OK

## During the video shoot

If something fails on camera:
1. **Don't panic. Don't stop the camera.** Keep rolling, do another take.
2. If the phone call drops: re-dial. The cut handles it.
3. If WhatsApp is slow: pre-stage one delivered message and shoot the "arriving" moment in a separate take.
4. If the dashboard is empty: have a screen recording of a past call ready as B-roll.

## After submitting

- [ ] Engage with comments on all 4 social posts for the first hour
- [ ] Reshare the X post 2 hours after the initial post
- [ ] DM 10-20 contacts asking them to react on the hackathon submission page
- [ ] Watch for tags from @stripe / @elevenlabsio teams — re-amplify any quote tweets

## Common failures

### Phone call doesn't connect

Most likely causes (in order):
1. EL agent paused (subscription failed, status='paused')
2. Twilio number not assigned to agent
3. Twilio account suspended (low balance — top up)
4. EL out of monthly minutes — switch agent to a backup voice ID

Fix:
```bash
# Check agent status
curl https://api.elevenlabs.io/v1/convai/agents/{AGENT_ID} \
  -H "xi-api-key: $ELEVENLABS_API_KEY"

# Re-assign number to agent
curl -X PATCH https://api.elevenlabs.io/v1/convai/phone-numbers/{PHONE_ID} \
  -H "xi-api-key: $ELEVENLABS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"agent_id":"{AGENT_ID}"}'
```

### WhatsApp not delivering

- Recipient's sandbox opt-in expired (72-hour rolling window). Have them text the join code again.
- Twilio account balance low. Top up.
- Sandbox rate-limited (>50 msgs/day). Wait 1 hour.

### Stripe meter event not landing

- Check `value` is a string of a whole integer (`"3"`, not `3`, not `"3.5"`).
- Check Stripe Dashboard → Developers → Logs → /v1/billing/meter_events for the request.
- Confirm the customer ID in payload matches an actual customer with the metered price subscribed.

### Dashboard shows no live updates

- Did you run `ALTER PUBLICATION supabase_realtime ADD TABLE calls;` ? Without it, Realtime is silent.
- Is the JWT being passed in the browser's Supabase client? Check Network tab for the `Authorization` header on the realtime WebSocket request.
- Clerk JWT template "supabase" exists and has `sub` claim?

### Vercel build OOM

```
NODE_OPTIONS=--max-old-space-size=4096
```
Set in Vercel project → Settings → Environment Variables.

### n8n workflow stuck "executing" forever

- Open the execution → find the hung node → cancel.
- Usually an HTTP Request without a timeout. Set Options → Response → Timeout to 8000ms.
- If a tool branch hangs >5s, the EL agent gives up on the call. Profile that branch.

## Emergency contacts

- ElevenLabs Discord: #elevenhacks channel — fast responses during the hackathon
- Stripe Developer Discord: https://stripe.com/discord
- Twilio Console → Help → Support ticket (paid plans get priority)
- Vercel Discord: https://vercel.com/discord

## n8n setup (one-time, end of build)

The 5 workflow JSONs live in `n8n/`. They are NOT deployed automatically —
import them into your Railway-hosted n8n at the end of build.

### Step-by-step

1. Deploy n8n on Railway (template `n8n-io/n8n`).
2. In Railway service settings, set the env vars listed in
   `n8n/credentials-checklist.md` (`TWILIO_*`, `ELEVENLABS_API_KEY`,
   `ANTHROPIC_API_KEY`, `NEXT_PUBLIC_APP_URL`, `VOXA_INTERNAL_SECRET`,
   `GENERIC_TIMEZONE=Asia/Kolkata`). Add `CAL_COM_API_KEY` if you have one;
   it is optional.
3. Mount a persistent volume at `/home/node/.n8n` so credentials survive
   restarts.
4. Open the n8n UI at the Railway public URL. Set basic auth user/password
   on first launch.
5. **Create credentials first** (NOT after import) — see
   `n8n/credentials-checklist.md`. Match the credential **name** exactly so the
   imported workflow JSON auto-links. There are 3 credentials to create:
   - `Voxa Supabase (service role)` — Supabase API type
   - `Voxa Stripe (Secret Key as Basic Auth user)` — Basic Auth, username = sk,
     password empty
   - `Voxa Twilio (Account SID / Auth Token)` — Basic Auth
6. Import each workflow JSON: ☰ → "Import from File" → pick
   `n8n/0X-*.json`. Repeat for all 5.
7. Open each imported workflow. Click any node that still has a red banner
   and re-link the credential. (n8n's auto-link by name is usually
   reliable — but double-check.)
8. **Smoke test each workflow using its test URL** (the play button on the
   Webhook node) before activating. Send the curl payloads from
   `n8n/README.md`.
9. After a green test, toggle the workflow to **Active**. The webhook URL
   switches from `/webhook-test/...` to `/webhook/...` — the one referenced
   by `N8N_WEBHOOK_BASE_URL` in your Next.js env.
10. Update Vercel's env: `N8N_WEBHOOK_BASE_URL=https://YOUR-N8N.up.railway.app`.
    Trigger a redeploy.

### Verifying end-to-end

After all 5 workflows are active:

```bash
# Should reach W1 onboarding
curl -X POST $N8N_WEBHOOK_BASE_URL/webhook/onboarding \
  -H "Content-Type: application/json" \
  -d '{"business_id":"00000000-0000-0000-0000-000000000001","tier":"starter","stripe_customer_id":"cus_test","stripe_subscription_id":"sub_test"}'

# Should reach W2 check_availability
curl -X POST $N8N_WEBHOOK_BASE_URL/webhook/tool/check_availability \
  -H "Content-Type: application/json" \
  -d '{"date":"2026-05-21","time_window":"morning"}'
```

Each should return JSON (or a structured error) within a few seconds. Watch
the n8n executions log for a green run.

## Post-hackathon cleanup (if you don't continue the project)

- Cancel Twilio subscription, release purchased numbers
- Delete ElevenLabs agents and cloned voices
- Cancel Stripe test mode subscription (free anyway)
- Stop n8n container on Railway
- Pause Supabase project (keeps data, stops billing)
- Pause Vercel deployment
