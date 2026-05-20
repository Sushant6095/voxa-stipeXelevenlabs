---
description: Run the end-to-end smoke test. Verifies every integration is alive.
---

Use the integration-tester agent.

Read `.claude/agents/integration-tester.md` for the canonical smoke test.

Execute:

1. Run scripts/verify-stripe.ts — confirms Meter + 3 Products + 6 Prices.
2. Run scripts/verify-n8n.ts — confirms all 5 workflows reachable.
3. curl the app, the dashboard, and the API routes — confirm 200s.
4. Print the manual checklist for the human to run:
   - Stripe Checkout end-to-end
   - Real phone call to demo number
   - WhatsApp confirmation delivery
   - Dashboard transcript appearance
   - Meter event in Stripe dashboard

After automated checks pass, output:

```
VOXA SMOKE TEST
===============
[✓] App reachable: https://voxa.app
[✓] n8n reachable: https://voxa-n8n.up.railway.app
[✓] Stripe Meter active: mtr_xxx
[✓] Stripe Products: 3
[✓] Stripe Prices: 6
[✓] n8n Workflow 1 (onboarding): active
[✓] n8n Workflow 2 (tools): active
[✓] n8n Workflow 3 (post-call): active
[✓] n8n Workflow 4 (stripe): active
[✓] n8n Workflow 5 (digest): active

MANUAL CHECKS REQUIRED:
[ ] Complete a fresh Checkout in incognito
[ ] Onboard a new business (fill form, record voice, paste URL)
[ ] Wait <60s for provisioning
[ ] Call the assigned number from your phone
[ ] Book an appointment via voice
[ ] Verify WhatsApp confirmation within 10s
[ ] Check Stripe dashboard for meter event
[ ] Verify lead appears in /leads with score

If all manual checks pass: you're ready to ship.
If any fails: add to docs/bug-log.md.
```
