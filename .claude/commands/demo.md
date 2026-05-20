---
description: Day 4 video shoot + posting prep. Usage: /demo prep | /demo record | /demo post
---

You are helping the user execute Day 4: video and posting. Code freeze is in effect.

Mode is determined by $ARGUMENTS:

# /demo prep

Pre-flight checklist before shooting:

```
DEMO DAY PRE-FLIGHT
═══════════════════

📱 Hardware
[ ] iPhone 13+ / equivalent fully charged + cable
[ ] Lavalier mic (or rely on phone mic in a quiet coffee shop)
[ ] Laptop charged + Stripe Dashboard + Voxa dashboard open
[ ] Backup phone for the test call

📞 Test calls
[ ] Demo phone number works (call it now to verify)
[ ] Backup demo number ready
[ ] Voice clone of "Dr. Sharma" loaded on test agent
[ ] All 4 languages (en/hi/ta/te) tested

💬 WhatsApp
[ ] Friend's WhatsApp opted into Twilio sandbox
[ ] Owner WhatsApp opted in (for hot-lead alert demo)
[ ] Sample appointment booking pre-staged

💳 Stripe
[ ] Stripe Dashboard open in incognito (visible meter event later)
[ ] Test customer created with active subscription
[ ] Customer Portal verified accessible

🎬 Locations
[ ] Coffee shop scouted (good lighting, low background noise)
[ ] Backup outdoor location
[ ] Friend confirmed for "customer" role

🎵 Assets
[ ] ElevenLabs Music track generated (90s, "upbeat tech, synth, 90 bpm")
[ ] Voxa logo / cover image draft ready
[ ] Stripe + ElevenLabs logos as PNG (for end card)

Print this checklist. Resolve everything BEFORE filming.
```

# /demo record

Shot list reminder:

```
SHOT LIST (60s target)
══════════════════════

0:00-0:05 — Hook (handheld, walking)
  Line: "Every small business in India misses calls. I built an AI receptionist that fixes that — and bills by the minute via Stripe."
  Visual: you walking, phone in hand

0:05-0:22 — Demo Act 1 (close-up on phone screen)
  Action: dial number, agent picks up in cloned Hindi voice
  Customer: "Kal subah 11 baje appointment chahiye, root canal ke liye"
  Agent: confirms, books
  Visual: WhatsApp message arrives on phone

0:22-0:38 — Demo Act 2 (split-screen laptop)
  Left: Voxa dashboard, call live, transcript streaming
  Right: Stripe dashboard, meter event lands at 0:25
  Cut to: lead score appearing on screen

0:38-0:52 — Demo Act 3 (onboarding speed-run)
  Voiceover: "Setup takes 60 seconds"
  Visuals (time-lapse):
    - Stripe Checkout completed
    - 60s voice sample recorded
    - Phone number provisioned (30s)
    - Call rings through in cloned voice

0:52-0:60 — Close
  Voiceover: "Voxa. AI receptionist for Indian SMBs. Stripe usage-based billing, ElevenLabs voice. Try it at voxa.app."
  On-screen text: @stripe @elevenlabsio #ElevenHacks

EDITING RULES:
- 60s max. Cut ruthlessly.
- Captions on every line (CapCut Auto Captions)
- Background music at 15% volume
- Vertical cut (9:16) for IG/TikTok, horizontal (16:9) for X/LinkedIn
```

# /demo post

Generate platform-specific social copy:

```
═══════════════ X (TWITTER) ═══════════════

[Tweet 1 — main]
I built Voxa: an AI receptionist that books appointments in Hindi, then bills you per minute via Stripe.

For every Indian small business that misses calls.

60 seconds to set up. Your own voice cloned.

Demo ↓

@stripe @elevenlabsio #ElevenHacks
[Attach: 60s horizontal video]

[Tweet 2 — reply with details]
Stack:
- ElevenLabs Conv AI (multilingual: hi/ta/te/en)
- Stripe Meter Events for per-minute billing
- Twilio (native EL integration)
- n8n for orchestration
- Next.js 15 + Supabase

Built in 3 days for #ElevenHacks. Github: [link]

═══════════════ LINKEDIN ═══════════════

I built an AI phone receptionist in 3 days. Here's what surprised me.

🇮🇳 Every Indian small business — dentists, salons, clinics, real estate brokers — misses calls. There's no Western "AI receptionist" startup that speaks Hindi well or understands the local context.

So I built Voxa for the #ElevenHacks hackathon by @ElevenLabs and @Stripe:
✅ Cloned-voice AI receptionist
✅ Books appointments in Hindi, Tamil, Telugu, English
✅ Sends WhatsApp confirmations
✅ Bills per minute via Stripe's new Meter Events API
✅ 60-second setup via Stripe Checkout

What surprised me:
1. ElevenLabs' native Twilio integration is so clean that "AI phone agent" is now a weekend project, not a moonshot.
2. Stripe's new Meter API (post 2025-03-31) makes usage-based billing trivial — you don't need a custom billing layer anymore.
3. n8n as orchestration backbone saved me 20+ hours vs writing custom API routes.

This is the kind of product 50% of Indian SMBs would pay ₹999/mo for. Building tomorrow's distribution play.

Try it: voxa.app
Code: [github]

[Attach: 60s horizontal video]
#ElevenHacks #BuildInPublic

═══════════════ INSTAGRAM REELS ═══════════════

[Caption only — keep tight]
60 seconds to give your business an AI receptionist 📞
Speaks Hindi. Books appointments. Sends WhatsApp confirmations.
Built with @elevenlabsio + @stripe in 3 days.
Link in bio 🔗

#ElevenHacks #AI #IndianStartup #SaaS #VoiceAI #SmallBusiness #BuiltInPublic
[Attach: 60s vertical video, captions burned in]

═══════════════ TIKTOK ═══════════════

[Caption]
POV: every small business in India now has an AI receptionist 🇮🇳
Built in 3 days with @elevenlabs + @stripe
Speaks Hindi, Tamil, Telugu, English
Books appointments. Sends WhatsApp. Bills per minute.

#ElevenHacks #AI #TechTok #Startup #IndianTech #VoiceAI #BuildInPublic

[Attach: 60s vertical video, hooky opening text overlay: "what if your AI took your calls?"]
```

After posting, remind the user to:
1. Reply to every comment in the first 60 minutes (algo boost)
2. DM 10-20 friends asking them to react on the hackathon submissions page (Most Popular voting)
3. Re-share their own X post 2 hours later
4. Post the LinkedIn version to relevant founder communities
