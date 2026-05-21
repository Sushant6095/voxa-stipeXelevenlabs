# Voxa demo video — submission kit

Generated automatically by `scripts/record-demo-video.cjs` against the live deploy at https://voxa-inky.vercel.app.

## Files in this repo (project root)

| File | Dimensions | Duration | Use for |
|---|---|---|---|
| `voxa-demo-master.mp4` | 1920×1080 (16:9) | 87s | Hackathon submission form, YouTube, X main, LinkedIn |
| `voxa-demo-vertical.mp4` | 1080×1920 (9:16) | 87s | TikTok, Instagram Reels, YouTube Shorts |
| `voxa-demo-square.mp4` | 1080×1080 (1:1) | 87s | Instagram main feed |
| `voxa-demo-master.webm` | 1920×1080 (VP8) | 87s | Source for re-encoding |
| `voxa-demo-cover.jpg` | 1920×1080 | — | Hackathon cover image (architecture frame) |
| `voxa-demo-cover-alt.jpg` | 1920×1080 | — | Alternate cover (dashboard frame) |

The MP4s are H.264 + AAC-ready, `+faststart` for fast browser-stream load, CRF 18 (high quality).

## What's in the video

5 shots, all from the live Vercel deployment:

| Beat | Time | Content |
|---|---|---|
| 1 — Landing hero | 0:00 – 0:14 | Hero with rotating language word, hover on green "Live demo: +1 (912) 912-6711" chip, scroll past how-it-works to bento grid |
| 2 — Pricing | 0:14 – 0:24 | Three pricing cards with animated BorderBeam on Growth tier, parallax tilt on hover, scroll to comparison table |
| 3 — Architecture (the money shot) | 0:24 – 0:50 | React Flow diagrams: System overview → Workflow 1 (Onboarding) → Workflow 2 (Live tool calls) — animated indigo→pink edges |
| 4 — Dashboard | 0:50 – 1:14 | KPI cards + live orchestration React Flow graph (8 service nodes) + empty calls table |
| 5 — End card | 1:14 – 1:27 | Back to hero, cursor zoom on the live demo phone number |

Captions burned in throughout the video (visible during recording — `showSubtitle()` overlays).

## Adding voice narration (60s in EL Studio — optional polish)

The ElevenLabs API blocks library voices on the free tier, but the Studio web UI **does** work. To add the cinematic narration:

1. Open https://elevenlabs.io/app/speech-synthesis
2. Pick a voice: **Ash** (Magnetic Narrative Male) or **Sarah** (Mature, Reassuring) — both are great for product VO
3. Paste each clip below, generate, download

**Clip 1 — Problem (place at 0:02)**
> Every missed call is a customer who chose someone else. In India, that's forty thousand crore a year. Walking away.

**Clip 2 — Product (place at 0:30)**
> Voxa is the AI receptionist that picks up. In your voice. In your customer's language. Every time.

**Clip 3 — CTA (place at 1:15)**
> Now your phone keeps ringing — and you keep working. Voxa. Nine hundred and ninety-nine rupees a month. Call our live demo at +1 (912) 912-6711.

Voice settings to mirror the script: **Stability 35 · Similarity 75 · Style 25 · Speaker Boost ON**.

## Adding music + narration via FFmpeg (when you have the audio)

```bash
# Drop the 3 narration MP3s into ./audio-narration/ first.
# Then optionally add a music bed (royalty-free track from Pixabay, etc.)
# Run this to mux everything into a final master:

ffmpeg -i voxa-demo-master.mp4 \
  -itsoffset 2  -i audio-narration/narr-01-problem.mp3 \
  -itsoffset 30 -i audio-narration/narr-02-product.mp3 \
  -itsoffset 75 -i audio-narration/narr-03-cta.mp3 \
  -filter_complex "[1:a][2:a][3:a]amix=inputs=3:duration=longest[narr]" \
  -map 0:v -map "[narr]" \
  -c:v copy -c:a aac -b:a 192k \
  voxa-demo-final-with-narration.mp4
```

## Adding kinetic captions in post (Submagic, Captions.ai)

The video already has subtitle overlays. For Apple-keynote-level kinetic typography:

1. Upload `voxa-demo-master.mp4` to https://app.submagic.co
2. Pick the "Beast" template (large, weighted, word-by-word)
3. Set emphasis color to `#6366F1` (Voxa indigo)
4. Highlight trigger words: `Voxa`, `₹999`, `Tamil`, `Hindi`, `crore`, `AI`, `Stripe`, `ElevenLabs`
5. Export at the target aspect ratio

## Re-running the recorder

To re-record the master (e.g. after UI tweaks):

```bash
pnpm add -D playwright   # only if not already installed
pnpm exec playwright install chromium
node scripts/record-demo-video.cjs
```

The script lives at `scripts/record-demo-video.cjs` and re-targets the env var `VOXA_DEMO_BASE_URL` (defaults to `https://voxa-inky.vercel.app`).
