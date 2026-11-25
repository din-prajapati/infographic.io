/** Real API/Prisma/browser round-trip audit. No HTTP mocks or canvas-store injection.
 * Creates only uniquely marked disposable account/design fixtures, then removes them.
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID, createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { chromium, expect } = require('@playwright/test');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, '.e2e-artifacts/v3-persistence-live-2026-11-08');
fs.mkdirSync(out, { recursive: true });
const origin = process.env.V3_SMOKE_ORIGIN || 'http://127.0.0.1:5000';
const prisma = new PrismaClient({ log: [] });
const marker = `v3-persistence-${randomUUID()}`;
const email = `${marker}@example.test`, password = randomUUID();
const result = { outcome: 'RUNNING', origin, checks: [], trace: [], comparisons: [], browserErrors: [] };
let organization, browser, login;
const contexts = [];
async function api(route, method = 'GET', body) {
  const response = await fetch(`${origin}/api/v1${route}`, {
    method, headers: { 'Content-Type': 'application/json', ...(login ? { Authorization: `Bearer ${login.token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(60000),
  });
  result.trace.push({ source: 'independent-http', method, path: route, status: response.status });
  assert.ok(response.ok, `${method} ${route}: ${response.status}`);
  return response.json();
}
async function pageFor(theme = 'light') {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  contexts.push(context);
  await context.addInitScript(({ token, user, theme }) => {
    localStorage.setItem('auth_token', token); localStorage.setItem('auth_user', JSON.stringify(user));
    localStorage.setItem('theme', theme);
  }, { token: login.token, user: login.user, theme });
  const page = await context.newPage();
  page.on('pageerror', error => result.browserErrors.push(error.message));
  page.on('response', response => {
    const url = new URL(response.url());
    if (url.pathname.startsWith('/api/v1/designs')) result.trace.push({ source: 'real-browser', method: response.request().method(), path: url.pathname, status: response.status() });
  });
  return page;
}
async function ready(page) {
  await expect(page.getByRole('textbox', { name: 'Design title', exact: true })).toBeEnabled({ timeout: 60000 });
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map(image => image.decode().catch(() => {})));
  });
}
async function capture(page) {
  // Read-only audit of the exact serializer used by the real save path.
  return page.evaluate(async () => JSON.parse(JSON.stringify((await import('/src/lib/canvasState.ts')).captureCanvasData())));
}
function artwork(data) {
  const { timestamp, zoom, ...document } = data; return document;
}
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
async function dbDocument(id) {
  const record = await prisma.infographic.findUnique({ where: { id } });
  assert.ok(record && record.userId === organization.users[0].id && record.organizationId === organization.id);
  assert.equal(record.aiModel, 'canvas-editor');
  return record.propertyData.canvasDesign;
}
async function save(page, method, suffix) {
  const response = page.waitForResponse(r => new URL(r.url()).pathname === `/api/v1/designs${suffix || ''}` && r.request().method() === method, { timeout: 60000 });
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  const acknowledged = await response; assert.ok(acknowledged.ok(), `browser ${method} save acknowledged`);
  const data = await acknowledged.json();
  await expect(page.getByRole('status').filter({ hasText: /^Saved$/ })).toBeVisible({ timeout: 60000 });
  return data;
}
async function pixels(page, before, after, label) {
  const comparison = await page.evaluate(async ({ a, b }) => {
    async function decode(src) {
      const image = new Image(); image.src = `data:image/png;base64,${src}`; await image.decode();
      const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
      const context = canvas.getContext('2d'); context.drawImage(image, 0, 0);
      return { width: image.width, height: image.height, data: context.getImageData(0, 0, image.width, image.height).data };
    }
    const [first, second] = await Promise.all([decode(a), decode(b)]);
    if (first.width !== second.width || first.height !== second.height) return { sameDimensions: false, before: [first.width, first.height], after: [second.width, second.height] };
    let differentPixels = 0;
    for (let i = 0; i < first.data.length; i += 4) {
      if (first.data[i] !== second.data[i] || first.data[i + 1] !== second.data[i + 1] || first.data[i + 2] !== second.data[i + 2] || first.data[i + 3] !== second.data[i + 3]) differentPixels++;
    }
    return { sameDimensions: true, width: first.width, height: first.height, differentPixels, totalPixels: first.width * first.height };
  }, { a: before.toString('base64'), b: after.toString('base64') });
  result.comparisons.push({ label, ...comparison });
  assert.equal(comparison.sameDimensions, true, `${label}: dimensions`);
  assert.equal(comparison.differentPixels, 0, `${label}: exact RGBA equality`);
}
async function snapshots(page, label) {
  await ready(page);
  const downloadEvent = page.waitForEvent('download', { timeout: 60000 });
  await page.getByRole('button', { name: 'Export', exact: true }).click();
  const download = await downloadEvent, exportPath = path.join(out, `${label}-export.png`);
  await download.saveAs(exportPath);
  await page.getByRole('button', { name: 'Preview', exact: true }).click();
  await expect(page.getByTestId('design-canvas')).toHaveAttribute('data-preview', 'true');
  await page.evaluate(async () => { await document.fonts.ready; await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))); });
  // Auto-fit is scheduled on preview transition. Wait for the artboard bounds to settle.
  let previous = '', stable = 0;
  for (let i = 0; i < 30 && stable < 3; i++) {
    const current = JSON.stringify(await page.getByTestId('design-canvas').boundingBox());
    stable = current === previous ? stable + 1 : 0; previous = current; await page.waitForTimeout(100);
  }
  const screenshot = await page.getByTestId('design-canvas').screenshot({ path: path.join(out, `${label}-editor.png`), animations: 'disabled', caret: 'hide' });
  await page.getByRole('button', { name: 'Exit preview', exact: true }).click();
  return { screenshot, exported: fs.readFileSync(exportPath) };
}
async function verifyRoundTrip(page, id, label) {
  const before = artwork(await capture(page));
  const fetched = await api(`/designs/${id}`), stored = await dbDocument(id);
  assert.deepEqual(artwork(fetched.canvasData), before, `${label}: independent HTTP document`);
  assert.deepEqual(artwork(stored.canvasData), before, `${label}: Prisma DB document`);
  assert.equal(stored.name, await page.getByRole('textbox', { name: 'Design title', exact: true }).inputValue());
  const first = await snapshots(page, `${label}-before`);
  const fresh = await pageFor();
  const response = fresh.waitForResponse(r => new URL(r.url()).pathname === `/api/v1/designs/${id}` && r.request().method() === 'GET');
  await fresh.goto(`${origin}/editor?editor=v3&designId=${id}`, { waitUntil: 'domcontentloaded' });
  assert.equal((await response).status(), 200); await ready(fresh);
  assert.deepEqual(artwork(await capture(fresh)), before, `${label}: fresh-context restored document`);
  const second = await snapshots(fresh, `${label}-reopened`);
  await pixels(fresh, first.screenshot, second.screenshot, `${label}: editor artboard before/reopened`);
  await pixels(fresh, first.exported, second.exported, `${label}: PNG export before/reopened`);
  result.checks.push({ label, id, artworkSha256: digest(before), exactDatabaseAndApiDocument: true, freshContextNoDraftOrQueryCache: true });
  return fresh;
}
try {
  await api('/health');
  const source = await fetch(`${origin}/src/lib/v3NavigationGuard.ts`).then(r => r.text());
  assert.ok(source.includes('__buildographicV3History') && source.includes('previous.owner'), 'serving current V3 branch guard');
  organization = await prisma.organization.create({ data: { name: marker, users: { create: { email, password: await bcrypt.hash(password, 10), name: 'Disposable persistence audit', emailVerified: true } } }, include: { users: true } });
  login = await api('/auth/login', 'POST', { email, password }); assert.ok(login.token);
  console.log('Real login and disposable database account ready');
  browser = await chromium.launch({ channel: 'chrome', headless: true });

  // Journey 1: create a brand-new design entirely through the actual V3 UI.
  const newPage = await pageFor(); await newPage.goto(`${origin}/editor?editor=v3`, { waitUntil: 'domcontentloaded' }); await ready(newPage);
  await newPage.getByRole('button', { name: 'Text', exact: true }).click();
  await newPage.getByRole('button', { name: 'Add text', exact: true }).click();
  const text = newPage.getByRole('textbox', { name: 'Text content', exact: true });
  await text.fill('REAL DATABASE — CREATED IN V3'); await text.press('Tab');
  await newPage.getByRole('textbox', { name: 'Design title', exact: true }).fill(`${marker}-ui-created`);
  const created = await save(newPage, 'POST'); assert.match(created.id, /^c[a-z0-9]{24}$/);
  console.log('New V3 design saved through real POST');
  await expect(newPage).toHaveURL(new RegExp(`designId=${created.id}`));
  const reopened = await verifyRoundTrip(newPage, created.id, 'ui-created');
  console.log('UI-created design database, fresh-session and pixel comparisons passed');
  // Actual idle autosave must update the same DB row without another Save click.
  const auto = reopened.waitForResponse(r => new URL(r.url()).pathname === `/api/v1/designs/${created.id}` && r.request().method() === 'PUT', { timeout: 60000 });
  await reopened.getByRole('textbox', { name: 'Design title', exact: true }).fill(`${marker}-autosaved`);
  assert.ok((await auto).ok());
  await expect.poll(async () => (await dbDocument(created.id)).name, { timeout: 60000 }).toBe(`${marker}-autosaved`);
  assert.equal(await prisma.infographic.count({ where: { userId: organization.users[0].id } }), 1);
  result.checks.push('Real two-second idle autosave updates the same database row; no duplicate design');

  // Journey 2: a richer API-created specimen, edited and saved using the real V3 UI.
  const base = { rotation: 0, opacity: 1, locked: false, visible: true };
  const gradient = { type: 'linear', angle: 0, stops: [{ color: '#123E62', opacity: 1 }, { color: '#14B8A6', opacity: 0.8 }] };
  const canvasData = { version: '1.0', canvasWidth: 800, canvasHeight: 600, backgroundColor: '#F2F6FA', backgroundPaint: { type: 'solid', color: '#F2F6FA', opacity: 1 }, zoom: 1,
    listing: { property: { headline: 'Persistence specimen', price: '₹4.20 Cr', address: '14 Verification Lane', description: 'Unrendered fact must survive' }, agent: { name: 'Audit Agent', brokerage: 'Test Realty', website: 'https://example.test' } },
    elements: [
      { ...base, id: 'audit-text', name: 'Headline', type: 'text', x: 42, y: 40, width: 650, height: 100, zIndex: 5, rotation: 3, content: 'REAL BACKEND ROUND TRIP', fontFamily: 'Arial', fontSize: 32, fontWeight: 700, bold: true, italic: false, underline: true, strikethrough: false, color: '#123E62', align: 'left', lineHeight: 1.2, letterSpacing: 12, textAnchor: 'middle', textTransform: 'none', listStyle: 'none' },
      { ...base, id: 'audit-shape', name: 'Gradient card', type: 'shape', x: 64, y: 190, width: 250, height: 170, zIndex: 1, rotation: 12, opacity: 0.85, shapeType: 'rectangle', fill: '#14B8A6', paints: { fill: gradient }, stroke: '#123E62', strokeWidth: 4, strokeStyle: 'dashed', cornerRadius: 18, shadow: { color: '#000000', opacity: 0.3, blur: 12, offsetX: 6, offsetY: 8 } },
      { ...base, id: 'audit-image', name: 'Embedded image', type: 'image', x: 420, y: 210, width: 240, height: 170, zIndex: 2, rotation: -8, src: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="240" height="170"><rect width="240" height="170" fill="#D9E7ED"/><circle cx="70" cy="65" r="46" fill="#F97316"/><path d="M100 160L180 25L230 160Z" fill="#123E62"/></svg>'), objectFit: 'cover', cornerRadius: 16, flipHorizontal: true, flipVertical: false, colorOverlay: { color: '#14B8A6', opacity: 0.15 }, filters: { brightness: 110, contrast: 105, saturation: 80 } },
      { ...base, id: 'audit-line', name: 'Curved arrow', type: 'line', x: 95, y: 430, width: 510, height: 100, zIndex: 3, lineType: 'curved', start: { x: 0, y: 75 }, end: { x: 510, y: 25 }, control: { x: 255, y: -60 }, elbowAxis: 'horizontal', elbowOffset: 255, stroke: '#123E62', strokeWidth: 5, strokeStyle: 'dotted', startDecoration: 'circle', endDecoration: 'arrow' },
      { ...base, id: 'audit-hidden', name: 'Hidden shape', type: 'shape', x: 50, y: 50, width: 50, height: 50, zIndex: 9, visible: false, locked: true, shapeType: 'circle', fill: '#EF4444', stroke: '#000000', strokeWidth: 0, cornerRadius: 0 },
    ] };
  const complex = await api('/designs', 'POST', { name: `${marker}-rich`, type: 'design', category: 'real-estate', tags: ['disposable-persistence-audit'], canvasData });
  const rich = await pageFor(); await rich.goto(`${origin}/editor?editor=v3&designId=${complex.id}`, { waitUntil: 'domcontentloaded' }); await ready(rich);
  await rich.getByRole('button', { name: 'Text', exact: true }).click();
  await rich.locator('[data-element-id="audit-text"]').click();
  const editor = rich.getByRole('textbox', { name: 'Text content', exact: true });
  await editor.fill('SAVED & REOPENED — ₹4.20 Cr'); await editor.press('Tab');
  await save(rich, 'PUT', `/${complex.id}`);
  await verifyRoundTrip(rich, complex.id, 'rich-design');
  console.log('Rich design database, fresh-session and pixel comparisons passed');
  const list = await api('/designs'); assert.ok(list.some(design => design.id === created.id) && list.some(design => design.id === complex.id));
  result.checks.push('Both designs listed by the real authenticated Projects API');
  result.galleryRouting = 'Existing My Designs handler opens /editor?designId=… (legacy default). V3 reopen was verified explicitly with editor=v3; default routing was not changed.';
  assert.deepEqual(result.browserErrors, []);
  result.outcome = 'PASS';
} catch (error) {
  result.outcome = 'FAIL'; result.error = error.message; console.error(error.stack); process.exitCode = 1;
} finally {
  for (const context of contexts) await context.close().catch(() => {});
  if (browser) await browser.close();
  if (organization) {
    const owned = await prisma.organization.findUnique({ where: { id: organization.id }, include: { users: true } });
    assert.ok(owned?.name === marker && owned.users.length === 1 && owned.users[0].email === email, 'cleanup owns only disposable fixtures');
    await prisma.user.delete({ where: { id: owned.users[0].id } });
    await prisma.organization.delete({ where: { id: organization.id } });
    assert.equal(await prisma.infographic.count({ where: { organizationId: organization.id } }), 0);
    result.cleanup = 'Disposable account, organization and their designs removed; existing user data untouched';
  }
  await prisma.$disconnect();
  result.finishedAt = new Date().toISOString();
  fs.writeFileSync(path.join(out, 'result.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
}
