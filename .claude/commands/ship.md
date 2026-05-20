---
description: Deploy current state to production. Vercel for app, Railway for n8n.
---

You are deploying Voxa to production.

1. Verify we're on the main branch and working tree is clean. If not, abort with the diff.
2. Verify all required env vars are set in Vercel (use `vercel env ls`).
3. Run `pnpm build` locally to catch type errors / build failures BEFORE deploying.
4. If build passes: `vercel --prod` to deploy.
5. After deploy, run `/smoke` to verify production is healthy.
6. Update `docs/status.md` with the new deploy timestamp.

Refuse to deploy if:
- There are uncommitted changes (other than .env.local)
- The build fails
- The last smoke test in the previous hour failed
- We're past hour 42 (code freeze) AND the change isn't a critical bug fix

If we're past code freeze and this is a critical fix, require the user to confirm with the phrase: "Yes, ship this fix."
