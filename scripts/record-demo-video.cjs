'use strict';

/**
 * Voxa demo video recorder.
 * Drives a headless Chromium through the live voxa-inky.vercel.app deploy,
 * paces a 5-shot tour, and writes a WebM master to the project root.
 *
 * Usage: pnpm exec node scripts/record-demo-video.cjs
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = process.env.VOXA_DEMO_BASE_URL || 'https://voxa-inky.vercel.app';
const PROJECT_ROOT = path.resolve(__dirname, '..');
const VIDEO_TMP_DIR = path.join(PROJECT_ROOT, '.demo-recording');
const OUTPUT_NAME = 'voxa-demo-master.webm';
const VIEWPORT = { width: 1920, height: 1080 };

fs.rmSync(VIDEO_TMP_DIR, { recursive: true, force: true });
fs.mkdirSync(VIDEO_TMP_DIR, { recursive: true });

// ---------------------------------------------------------------------------
// Cursor overlay
// ---------------------------------------------------------------------------

async function injectCursor(page) {
  await page.evaluate(() => {
    const existing = document.getElementById('demo-cursor');
    if (existing) existing.remove();
    const cursor = document.createElement('div');
    cursor.id = 'demo-cursor';
    cursor.innerHTML = `
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5 3L19 12L12 13L9 20L5 3Z" fill="white" stroke="#0f172a" stroke-width="1.5" stroke-linejoin="round"/>
      </svg>`;
    cursor.style.cssText = `
      position: fixed; z-index: 2147483647; pointer-events: none;
      width: 32px; height: 32px; left: 0; top: 0;
      transition: transform 80ms ease-out;
      filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.4));
      transform: translate(-9999px, -9999px);
    `;
    document.documentElement.appendChild(cursor);
    document.addEventListener('mousemove', (e) => {
      cursor.style.transform = `translate(${e.clientX - 4}px, ${e.clientY - 4}px)`;
    });
  });
}

// ---------------------------------------------------------------------------
// Subtitle bar
// ---------------------------------------------------------------------------

async function injectSubtitleBar(page) {
  await page.evaluate(() => {
    const existing = document.getElementById('demo-subtitle');
    if (existing) existing.remove();
    const bar = document.createElement('div');
    bar.id = 'demo-subtitle';
    bar.style.cssText = `
      position: fixed; left: 50%; bottom: 80px; transform: translateX(-50%);
      z-index: 2147483646; pointer-events: none;
      max-width: 80%; padding: 14px 28px;
      background: rgba(15, 17, 23, 0.85);
      color: #ffffff;
      font-family: -apple-system, "Segoe UI", sans-serif;
      font-size: 28px; font-weight: 600; letter-spacing: -0.01em;
      border-radius: 14px;
      backdrop-filter: blur(8px);
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
      transition: opacity 220ms ease;
      opacity: 0;
      text-align: center;
    `;
    document.documentElement.appendChild(bar);
  });
}

async function showSubtitle(page, text) {
  await page.evaluate((t) => {
    const bar = document.getElementById('demo-subtitle');
    if (!bar) return;
    if (t) {
      bar.textContent = t;
      bar.style.opacity = '1';
    } else {
      bar.style.opacity = '0';
    }
  }, text);
  if (text) await page.waitForTimeout(120);
}

// ---------------------------------------------------------------------------
// Smooth scroll helper
// ---------------------------------------------------------------------------

async function smoothScroll(page, targetY, duration = 1800) {
  await page.evaluate(({ targetY, duration }) => {
    return new Promise((resolve) => {
      const startY = window.scrollY;
      const dy = targetY - startY;
      const t0 = performance.now();
      function step(now) {
        const t = Math.min(1, (now - t0) / duration);
        // easeInOutCubic
        const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        window.scrollTo(0, startY + dy * e);
        if (t < 1) requestAnimationFrame(step);
        else resolve();
      }
      requestAnimationFrame(step);
    });
  }, { targetY, duration });
}

// ---------------------------------------------------------------------------
// Cursor movement helper
// ---------------------------------------------------------------------------

async function moveCursorTo(page, selector, opts = {}) {
  const { steps = 30, dwell = 1000 } = opts;
  const el = page.locator(selector).first();
  if (!(await el.isVisible().catch(() => false))) {
    console.warn(`  cursor skip: "${selector}" not visible`);
    return;
  }
  const box = await el.boundingBox();
  if (!box) return;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps });
  await page.waitForTimeout(dwell);
}

// ---------------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------------

(async () => {
  console.log(`Recording Voxa demo against ${BASE_URL} at ${VIEWPORT.width}×${VIEWPORT.height}`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    recordVideo: { dir: VIDEO_TMP_DIR, size: VIEWPORT },
    deviceScaleFactor: 1,
    colorScheme: 'dark',
  });
  const page = await context.newPage();

  try {
    // -----------------------------------------------------------------------
    // SHOT 1 — Landing hero (~14s)
    // -----------------------------------------------------------------------
    console.log('SHOT 1 — Landing');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await injectCursor(page);
    await injectSubtitleBar(page);
    await page.mouse.move(VIEWPORT.width / 2, VIEWPORT.height - 200, { steps: 1 });
    await page.waitForTimeout(800);

    await showSubtitle(page, 'Voxa — AI Receptionist for Indian SMBs');
    await page.waitForTimeout(2800); // let WordRotate cycle

    // Hover the live demo chip
    await moveCursorTo(page, 'a[href="tel:+19129126711"]', { steps: 40, dwell: 1500 });
    await showSubtitle(page, 'Call the live AI demo: +1 (912) 912-6711');
    await page.waitForTimeout(1800);

    await showSubtitle(page, '');
    await smoothScroll(page, 700, 2200);
    await page.waitForTimeout(2000);

    await showSubtitle(page, 'Caller → Twilio → ElevenLabs → n8n');
    await smoothScroll(page, 1500, 2800);
    await page.waitForTimeout(2200);

    // -----------------------------------------------------------------------
    // SHOT 2 — Pricing (~10s)
    // -----------------------------------------------------------------------
    console.log('SHOT 2 — Pricing');
    await page.goto(`${BASE_URL}/pricing`, { waitUntil: 'networkidle' });
    await injectCursor(page);
    await injectSubtitleBar(page);
    await page.mouse.move(VIEWPORT.width / 2, VIEWPORT.height - 200, { steps: 1 });
    await page.waitForTimeout(800);

    await showSubtitle(page, '₹999 · ₹2,999 · ₹7,999 per month');
    await page.waitForTimeout(2500);

    // hover middle Growth card
    const cards = page.locator('section[aria-label="Pricing tiers"] > div');
    const growthBox = await cards.nth(1).boundingBox().catch(() => null);
    if (growthBox) {
      await page.mouse.move(
        growthBox.x + growthBox.width / 2,
        growthBox.y + growthBox.height / 2,
        { steps: 30 },
      );
      await page.waitForTimeout(2200);
    }

    await showSubtitle(page, 'Stripe Meter Events — per-minute billing');
    await smoothScroll(page, 900, 2200);
    await page.waitForTimeout(2000);

    // -----------------------------------------------------------------------
    // SHOT 3 — Architecture (~15s, the money shot)
    // -----------------------------------------------------------------------
    console.log('SHOT 3 — Architecture');
    await page.goto(`${BASE_URL}/docs/architecture`, { waitUntil: 'networkidle' });
    await injectCursor(page);
    await injectSubtitleBar(page);
    await page.mouse.move(VIEWPORT.width / 2, VIEWPORT.height - 200, { steps: 1 });
    await page.waitForTimeout(800);

    await showSubtitle(page, 'System architecture');
    await page.waitForTimeout(2200);

    await showSubtitle(page, '');
    await smoothScroll(page, 700, 2800);
    await page.waitForTimeout(3500); // let edges animate

    await showSubtitle(page, 'Workflow 1: Onboarding (Stripe → n8n → Twilio → EL)');
    await smoothScroll(page, 1500, 2500);
    await page.waitForTimeout(3500);

    await showSubtitle(page, 'Workflow 2: 6 live tool calls');
    await smoothScroll(page, 2300, 2500);
    await page.waitForTimeout(3500);

    // -----------------------------------------------------------------------
    // SHOT 4 — Dashboard (~10s)
    // -----------------------------------------------------------------------
    console.log('SHOT 4 — Dashboard');
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
    await injectCursor(page);
    await injectSubtitleBar(page);
    await page.mouse.move(VIEWPORT.width / 2, VIEWPORT.height - 200, { steps: 1 });
    await page.waitForTimeout(1000);

    await showSubtitle(page, 'Live owner dashboard');
    await page.waitForTimeout(2500);

    await showSubtitle(page, 'Watch every call flow in real-time');
    await smoothScroll(page, 380, 2000);
    await page.waitForTimeout(4500);

    await showSubtitle(page, '');
    await smoothScroll(page, 900, 1800);
    await page.waitForTimeout(1800);

    // -----------------------------------------------------------------------
    // SHOT 5 — End card (~7s)
    // -----------------------------------------------------------------------
    console.log('SHOT 5 — End card');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await injectCursor(page);
    await injectSubtitleBar(page);
    await page.mouse.move(VIEWPORT.width / 2, VIEWPORT.height - 200, { steps: 1 });
    await page.waitForTimeout(1200);

    await showSubtitle(page, 'Voxa. Never miss a customer again.');
    await page.waitForTimeout(3500);

    await moveCursorTo(page, 'a[href="tel:+19129126711"]', { steps: 35, dwell: 800 });
    await showSubtitle(page, 'Call now: +1 (912) 912-6711');
    await page.waitForTimeout(3000);

    await showSubtitle(page, '');
    await page.waitForTimeout(800);

    console.log('Recording complete.');
  } catch (err) {
    console.error('DEMO ERROR:', err.message);
    console.error(err.stack);
  } finally {
    await context.close();
    const video = page.video();
    if (video) {
      const src = await video.path();
      const dest = path.join(PROJECT_ROOT, OUTPUT_NAME);
      fs.copyFileSync(src, dest);
      const stats = fs.statSync(dest);
      console.log(`\n✓ Saved: ${dest}`);
      console.log(`  Size:    ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  Viewport: ${VIEWPORT.width}×${VIEWPORT.height}`);
    } else {
      console.error('No video produced.');
    }
    await browser.close();
  }
})();
