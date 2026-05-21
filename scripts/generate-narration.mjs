/**
 * Generate the 3 narration clips for the Voxa demo video via ElevenLabs TTS.
 * Run: node scripts/generate-narration.mjs
 */
import fs from 'node:fs/promises';
import path from 'node:path';

const EL_KEY = process.env.ELEVENLABS_API_KEY;
if (!EL_KEY) throw new Error('ELEVENLABS_API_KEY missing');

// Ash — "Calm, Soothing, Magnetic Narrative Male Voice" — professional narration voice
// from the user's EL account (not a free-tier-blocked library voice).
const VOICE_ID = 'VU16byTywsWv5JpI8rbc';
const MODEL_ID = 'eleven_multilingual_v2';

const CLIPS = [
  {
    name: 'narr-01-problem.mp3',
    text:
      'Every missed call is a customer who chose someone else. In India, that\'s forty thousand crore a year. Walking away.',
  },
  {
    name: 'narr-02-product.mp3',
    text:
      'Voxa is the AI receptionist that picks up. In your voice. In your customer\'s language. Every time.',
  },
  {
    name: 'narr-03-cta.mp3',
    text:
      'Now your phone keeps ringing — and you keep working. Voxa. Nine hundred and ninety-nine rupees a month. Call our live demo at +1 9 1 2  9 1 2  6 7 1 1.',
  },
];

const VOICE_SETTINGS = {
  stability: 0.35,
  similarity_boost: 0.75,
  style: 0.25,
  use_speaker_boost: true,
};

const OUT_DIR = path.resolve('audio-narration');
await fs.mkdir(OUT_DIR, { recursive: true });

for (const clip of CLIPS) {
  process.stdout.write(`generating ${clip.name} (${clip.text.length} chars)… `);
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
    method: 'POST',
    headers: {
      'xi-api-key': EL_KEY,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text: clip.text,
      model_id: MODEL_ID,
      voice_settings: VOICE_SETTINGS,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error(`FAILED HTTP ${res.status}: ${err.slice(0, 200)}`);
    process.exit(1);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  const out = path.join(OUT_DIR, clip.name);
  await fs.writeFile(out, buf);
  console.log(`✓ ${(buf.length / 1024).toFixed(1)} KB`);
}

console.log(`\nDone. Files in ${OUT_DIR}/`);
