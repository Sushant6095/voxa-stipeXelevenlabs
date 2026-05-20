---
description: Debugging triage when something is broken. Analyzes recent errors and suggests fixes.
---

You are debugging. The user is stuck. Do NOT guess.

Process:

1. Ask the user to describe the failure in one sentence. If they already have, skip this.
2. Categorize the failure:
   - Build/type error
   - Runtime error (server)
   - Runtime error (client)
   - Integration failure (Stripe/Twilio/EL/n8n/Supabase)
   - Configuration error (env vars, accounts)
   - Logic error (wrong behavior, not an error)

3. For each category, run these checks in order:

### Build/type errors
- Run `pnpm tsc --noEmit` and read the first error
- Check recent commits for the offending file
- Suggest the minimal fix

### Server runtime
- Read Vercel function logs: `vercel logs --since=10m`
- Check for stack traces; identify the file:line
- Suggest fix or ask for more context

### Integration failures
- For Stripe: check the Stripe Dashboard → Developers → Logs
- For Twilio: check Twilio Console → Monitor → Logs
- For ElevenLabs: check EL Dashboard → Conversations → recent
- For n8n: check Railway logs + n8n execution history
- For Supabase: check Supabase Dashboard → Logs → API

### Configuration errors
- Check .env.local exists and is populated
- Check Vercel env vars match local
- Check that all 3rd-party webhooks point to the current Vercel URL (not localhost)

4. The fix prescription template:

```
DIAGNOSIS
─────────
[One sentence: what's wrong and why]

EVIDENCE
────────
[Stack trace, log entry, or config diff]

FIX
───
[Specific change, with file:line]

VERIFICATION
────────────
[Command or test to confirm it's fixed]
```

5. Common Voxa-specific failures (check these first):

| Symptom | Likely cause | Fix |
|---|---|---|
| Stripe webhook 401 | Wrong webhook secret OR webhook handler called `req.json()` | Use `req.text()` before `constructEvent` |
| Supabase RLS blocking | Clerk JWT template not configured | Clerk Dashboard → JWT Templates → Supabase |
| Twilio call goes to voicemail | Agent not assigned OR agent.status='paused' | Re-assign in EL dashboard |
| EL agent silent | Tool webhook returned non-200 OR took >5s | Check n8n execution log |
| WhatsApp 400 | Recipient not opted into sandbox | Have them text the join code |
| Realtime subscription dead | Forgot ALTER PUBLICATION | Run the migration |
| Vercel build OOM | Tailwind v4 + large component tree | Set `NODE_OPTIONS=--max-old-space-size=4096` |
| Clerk 401 in middleware | Middleware matcher misconfigured | Use `clerkMiddleware()` + correct matcher |

6. If the issue isn't in the table, escalate: "I'm not sure. Try posting to ElevenLabs Discord #elevenhacks channel with this exact context: [auto-generate context dump]."

Do NOT speculate. Do NOT try random fixes. Diagnose, then prescribe.
