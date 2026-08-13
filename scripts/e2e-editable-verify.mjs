/**
 * Editable-mode browser verification — headed, watchable. US-AI-047 / M-AI-18.
 *
 * Drives Quick Generate end to end with renderMode='editable' and reports the
 * exact link where the chain degrades to flat (the degrade is silent by design
 * — planVariationLoad never throws — so only this instrumentation reveals it).
 *
 * Usage:
 *   PROBE_TOKEN=<jwt> node scripts/e2e-editable-verify.mjs
 *
 * Requires `npm run dev` running on :5000. Spends real provider money:
 * one generation (3 variations) + one $0.09 extraction call per "Use This".
 * Screenshots land in E2E_OUT (default ./.e2e-artifacts).
 */
import { chromium } from 'playwright';
import fs from 'fs';

const SP = process.env.E2E_OUT || './.e2e-artifacts';
fs.mkdirSync(SP + '/photos', { recursive: true });
const TOKEN = process.env.PROBE_TOKEN;
if (!TOKEN) { console.error('PROBE_TOKEN env var is required (a valid JWT).'); process.exit(1); }
const log = (...a) => console.log('>', ...a);

const browser = await chromium.launch({ headless: false, slowMo: 200 });
const page = await browser.newPage({ viewport: { width: 1680, height: 1000 } });

const errors = [];
const traces = [];
page.on('console', m => {
  const t = m.text();
  if (m.type() === 'error') errors.push(t.slice(0, 200));
  if (/loadVariation|compose|renderMode|editable/i.test(t)) traces.push(`[${m.type()}] ${t.slice(0, 300)}`);
});
page.on('pageerror', e => errors.push('PAGEERROR: ' + String(e).slice(0, 200)));

// Capture the compose endpoint round-trip verbatim.
page.on('response', async (r) => {
  if (r.url().includes('/compose')) {
    let body = '';
    try { body = (await r.text()).slice(0, 1500); } catch { body = '<unreadable>'; }
    log(`COMPOSE ${r.status()} ${r.url()}`);
    log(`COMPOSE BODY: ${body}`);
  }
  if (r.url().includes('/generate') && r.request().method() === 'POST') {
    log(`GENERATE ${r.status()} ${r.url()}`);
  }
});

await page.addInitScript((t) => {
  localStorage.setItem('auth_token', t);
  localStorage.setItem('auth_user', JSON.stringify({ id: 'probe', email: 'probe@test.local', name: 'Probe User' }));
}, TOKEN);

await page.goto('http://localhost:5000/editor', { waitUntil: 'domcontentloaded', timeout: 90000 });
await page.waitForTimeout(5000);
log('editor loaded');

await page.getByRole('button', { name: 'Property', exact: true }).first().click();
await page.waitForTimeout(1200);
log('property tab open');

const fill = async (id, value) => {
  const el = page.locator('#' + id);
  if (await el.count()) { await el.fill(value); log('  ' + id + ' = ' + value); }
  else log('  [warn] #' + id + ' not found');
};
await fill('headline', 'SPACIOUS 3 BHK VILLA');
await fill('price', '18500000');
await fill('sqft', '2450');
await fill('address', 'Shela, Ahmedabad');
await page.waitForTimeout(600);
await page.screenshot({ path: SP + '/photos/e2e-0-form.png' });

// Check the toggle exists BEFORE generating and set it to Editable up front.
const preToggle = await page.locator('text=Load as:').count();
log('"Load as:" toggle visible pre-generation: ' + (preToggle > 0 ? 'YES' : 'NO'));
if (preToggle) {
  await page.getByRole('button', { name: 'Editable', exact: true }).first().click();
  log('renderMode set to Editable BEFORE generation');
}

await page.getByRole('button', { name: /quick generate/i }).first().click();
log('Quick Generate clicked - waiting for variations (up to 4 min)...');

// Variations appear as cards with a "Use" action.
await page.waitForSelector('button:has-text("Use")', { timeout: 240000 }).catch(() => null);
const useBtns = await page.locator('button:has-text("Use")').count();
log('variation "Use" buttons: ' + useBtns);
const postToggle = await page.locator('text=Load as:').count();
log('"Load as:" toggle present post-generation: ' + (postToggle > 0 ? 'YES' : 'NO'));
await page.screenshot({ path: SP + '/photos/e2e-1-variations.png' });

if (postToggle) {
  // Make sure Editable is the active choice (persisted pref may already have it).
  await page.getByRole('button', { name: 'Editable', exact: true }).first().click().catch(() => {});
  log('Editable selected');
  await page.waitForTimeout(400);
}

if (useBtns) {
  await page.locator('button:has-text("Use")').first().click();
  log('loading onto canvas...');
  await page.waitForTimeout(12000);
  await page.screenshot({ path: SP + '/photos/e2e-2-canvas.png' });

  // What did the canvas actually get? Count draggable canvas elements and text.
  const state = await page.evaluate(() => {
    const rnd = document.querySelectorAll('.react-draggable, [data-element-id]');
    const texts = [...document.querySelectorAll('.react-draggable, [data-element-id]')]
      .map(n => (n.textContent || '').trim().slice(0, 40)).filter(Boolean);
    return { draggableCount: rnd.length, texts: texts.slice(0, 12) };
  });
  log('canvas elements: ' + JSON.stringify(state));

  // Try selecting a text block: click centre-left where the scrim column sits.
  const canvasBox = await page.locator('canvas, [class*="canvas"]').first().boundingBox().catch(() => null);
  if (canvasBox) {
    await page.mouse.click(canvasBox.x + canvasBox.width * 0.2, canvasBox.y + canvasBox.height * 0.3);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: SP + '/photos/e2e-3-selected.png' });
  }
}

log('trace lines:');
for (const t of traces.slice(0, 20)) log('  ' + t);
log('console errors: ' + (errors.length ? JSON.stringify(errors.slice(0, 6)) : 'none'));
log('DONE - browser left open for inspection.');
await page.waitForTimeout(120000);
await browser.close();
