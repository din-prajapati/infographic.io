import { test, expect, request as playwrightRequest, type APIRequestContext, type Page, type Response } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * US-EDIT-022 T5 — real-backend, black-box V3 listing journey with linked fields.
 * No page.route / no mocked /api/**: every request goes Express :5000 -> NestJS /api/v1 -> Prisma dev DB (shared with
 * staging) and Cloudflare R2. Every created record is prefixed E2E-HZN-<runId> and logged to
 * .agent-logs/real-backend/created.txt because designs/templates/properties have no DELETE route.
 */

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixtures = path.join(root, 'e2e', 'fixtures', 'horizon');
const shots = path.join(root, '.e2e-artifacts', 'v3-real-backend', 'shots');
const ledger = path.join(root, '.agent-logs', 'real-backend', 'created.txt');
const runId = `${Date.now().toString(36)}`;
const prefix = `E2E-HZN-${runId}`;
const designName = `${prefix} The Horizon Residences`;
const HERO = path.join(fixtures, 'hero-building.jpg');
const LOGO = path.join(fixtures, 'logo-horizon.png');

const SOURCE = { headline: 'Elevated Urban Living', sub: 'A new address for contemporary lifestyle', brand: 'THE HORIZON', cta: 'BOOK A PRIVATE TOUR' };
const LISTING = { name: `${prefix} Horizon Tower`, headline: 'Skyline Urban Living', price: '2450000', address: `${prefix} 1 Harbour Crescent, Sydney`, description: 'Sky-high residences with harbour views', beds: '3', baths: '2', area: '1850' };
const AGENT = { name: 'Ava Horizon', phone: '+61 2 5550 0199', agency: 'Horizon Realty' };
const BRAND = { name: 'THE HORIZON', signature: 'BOOK A PRIVATE VIEWING' };
const AMENITIES = [/Prime\s*Location/, /Luxury\s*Interiors/, /Smart\s*Amenities/, /Private\s*Residence\s*Club/];
const LINKS: [layer: string, slot: string, badge: string][] = [
  ['Headline', 'property.headline', 'Property · Headline'],
  ['Subheading', 'property.description', 'Property · Description'],
  ['Brand name', 'brand.name', 'Brand · Name'],
  ['CTA text', 'agent.cta', 'Agent · Call to action'],
  ['Brand logo', 'brand.logo', 'Brand · Logo'],
  ['Hero photograph', 'property.heroImage', 'Property · Photo'],
];

let api: APIRequestContext;
let session: { token: string; user: Record<string, unknown> };
let seedCanvas: any;
let designId = '';

function record(kind: string, id: string, note: string) {
  fs.mkdirSync(path.dirname(ledger), { recursive: true });
  fs.appendFileSync(ledger, `${kind} ${id} ${note}\n`);
}
const shot = (page: Page, name: string) => page.screenshot({ path: path.join(shots, `${name}.png`) });
const isMedia = (method: string) => (r: Response) => r.request().method() === method && new URL(r.url()).pathname === '/api/v1/media';
const r2Key = (url: string) => new URL(url).pathname.replace(/^\//, '');

test.describe.configure({ mode: 'serial' });

test.beforeAll(async ({ baseURL }) => {
  const account = JSON.parse(fs.readFileSync(path.join(root, '.agent-logs', 'real-backend', 'account.json'), 'utf8'));
  const anon = await playwrightRequest.newContext({ baseURL });
  const login = await anon.post('/api/v1/auth/login', { data: { email: account.email, password: account.password } });
  expect(login.status(), 'login against the real auth module').toBeLessThan(300);
  session = await login.json();
  await anon.dispose();
  api = await playwrightRequest.newContext({ baseURL, extraHTTPHeaders: { Authorization: `Bearer ${session.token}` } });
  seedCanvas = JSON.parse(fs.readFileSync(path.join(fixtures, 'horizon-seed.sample.json'), 'utf8')).canvasData;
  const created = await api.post('/api/v1/designs', { data: { name: designName, type: 'design', canvasData: seedCanvas, thumbnail: '', tags: ['e2e-horizon'] } });
  expect(created.status()).toBe(201);
  designId = (await created.json()).id;
  expect(designId).toMatch(/^c[a-z0-9]{24}$/);
  record('design', designId, `${prefix} seed (original)`);
  fs.mkdirSync(shots, { recursive: true });
});
test.afterAll(async () => { await api?.dispose(); });

async function authenticate(page: Page) {
  await page.addInitScript(([token, user]) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', user);
    localStorage.setItem('theme', 'light');
  }, [session.token, JSON.stringify(session.user)] as const);
}
async function openDesign(page: Page, id: string, expectText: string) {
  await page.goto(`/editor?editor=v3&designId=${id}`);
  await expect(page.getByTestId('design-canvas')).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId('design-canvas').getByText(expectText, { exact: true })).toBeVisible({ timeout: 30_000 });
}
const canvas = (page: Page) => page.getByTestId('design-canvas');
const fields = (page: Page) => page.getByRole('complementary', { name: 'Template Fields panel', exact: true });
const layersPanel = (page: Page) => page.getByRole('complementary', { name: 'Layers panel', exact: true });
async function ensureLayers(page: Page) {
  if (!(await layersPanel(page).isVisible())) await page.getByRole('button', { name: 'Layers', exact: true }).click();
  await expect(layersPanel(page)).toBeVisible();
}
async function selectLayer(page: Page, name: string) {
  await ensureLayers(page);
  await layersPanel(page).getByRole('button', { name: `Select layer ${name}`, exact: true }).click();
}
async function railTo(page: Page, name: string) {
  const button = page.getByRole('navigation', { name: 'Editor sections' }).getByRole('button', { name, exact: true });
  if ((await button.getAttribute('aria-pressed')) !== 'true') await button.click();
  await expect(button).toHaveAttribute('aria-pressed', 'true');
}
async function linkSelection(page: Page, type: 'text' | 'image', slot: string) {
  const toolbar = page.getByRole('toolbar', { name: `${type} formatting`, exact: true });
  await toolbar.getByRole('button', { name: 'Link field', exact: true }).click();
  await expect(fields(page)).toBeVisible();
  await fields(page).locator('select[aria-label="Linked field"]').selectOption(slot);
  await expect(fields(page).locator('select[aria-label="Linked field"]')).toHaveValue(slot);
}
async function pngSize(file: string) {
  const bytes = fs.readFileSync(file);
  expect(bytes.subarray(1, 4).toString('ascii')).toBe('PNG');
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

test('V3 listing workflow with linked fields against the real backend and R2', async ({ page }) => {
  const r2Keys: string[] = [];
  let templateId = '';
  let propertyId = '';
  let photoUrl = '';
  await authenticate(page);
  page.on('pageerror', error => console.log(`[pageerror] ${error.message}`));

  await test.step('R2: POST /api/v1/media stores the hero photo publicly', async () => {
    const upload = await api.post('/api/v1/media', { multipart: { file: { name: 'hero-building.jpg', mimeType: 'image/jpeg', buffer: fs.readFileSync(HERO) } } });
    expect(upload.status()).toBe(201);
    const body = await upload.json();
    expect(body.url).toMatch(/^https:\/\//);
    r2Keys.push(body.key); record('r2', body.key, `${prefix} direct api upload`);
    const pub = await playwrightRequest.newContext();
    const fetched = await pub.get(body.url);
    expect(fetched.status()).toBe(200);
    expect(fetched.headers()['content-type']).toContain('image/jpeg');
    await pub.dispose();
  });

  await test.step('Open the seeded Horizon design in the V3 editor', async () => {
    await openDesign(page, designId, SOURCE.headline);
    await expect(page.getByRole('textbox', { name: 'Design title' })).toHaveValue(designName);
    await shot(page, '00-opened');
  });

  await test.step('1. Link fields through the element toolbar and Template Fields', async () => {
    // Headline selected by clicking its text on the canvas, the rest through the Layers sidebar.
    await canvas(page).getByText(SOURCE.headline, { exact: true }).click();
    await linkSelection(page, 'text', 'property.headline');
    await expect(fields(page).getByRole('status')).toContainText('Linked field');
    for (const [layer, slot] of LINKS.slice(1)) {
      await selectLayer(page, layer);
      await linkSelection(page, slot.endsWith('Image') || slot === 'brand.logo' ? 'image' : 'text', slot);
    }
    await selectLayer(page, 'Amenity label 1');
    await page.getByRole('toolbar', { name: 'text formatting', exact: true }).getByRole('button', { name: 'Link field', exact: true }).click();
    await expect(fields(page).locator('select[aria-label="Linked field"]')).toHaveValue('');
    await expect(fields(page).getByRole('status')).toContainText('Independent element');
    await selectLayer(page, 'CTA button');
    await expect(page.getByRole('toolbar', { name: 'shape formatting', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Link field', exact: true })).toHaveCount(0);
    await shot(page, '01-linked-fields');
  });

  await test.step('2. Show links overlays one badge per linked element', async () => {
    const toggle = page.getByRole('button', { name: 'Show links', exact: true });
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    const badges = page.locator('[data-testid="link-overlay"] [data-link-for]');
    await expect(badges).toHaveCount(LINKS.length);
    for (const [, , badge] of LINKS) await expect(badges.filter({ hasText: badge })).toHaveCount(1);
    await shot(page, '02-show-links');
  });

  await test.step('3. Save as Template stores placeholders, not listing facts', async () => {
    await page.getByRole('button', { name: 'Save as Template', exact: true }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Reusable template saved' })).toBeVisible();
    const list = await (await api.get('/api/v1/canvas-templates')).json();
    const match = list.filter((t: any) => t.name === designName);
    expect(match).toHaveLength(1);
    templateId = match[0].id; record('template', templateId, `${prefix} save as template`);
    const template = await (await api.get(`/api/v1/canvas-templates/${templateId}`)).json();
    const byName = (n: string) => template.canvasData.elements.find((e: any) => e.name === n);
    expect(template.canvasData.v3Listing).toBeUndefined();
    expect(byName('Headline').content).toBe('[Headline]');
    expect(byName('Subheading').content).toBe('[Description]');
    expect(byName('Brand name').content).toBe('[Brand name]');
    expect(byName('CTA text').content).toBe('[Call to action]');
    expect(byName('Hero photograph').src).toBe('');
    for (let i = 1; i <= 4; i++) expect(byName(`Amenity label ${i}`).content).toBe(seedCanvas.elements.find((e: any) => e.name === `Amenity label ${i}`).content);
    await shot(page, '03-template-saved');
  });

  await test.step('4. Enter the property manually; saving stays pending', async () => {
    await railTo(page, 'Listing');
    const panel = page.getByRole('complementary', { name: 'Listing panel', exact: true });
    await panel.getByRole('button', { name: 'Enter manually', exact: true }).click();
    await panel.getByLabel('Listing name', { exact: true }).fill(LISTING.name);
    await panel.getByLabel('Marketing headline', { exact: true }).fill(LISTING.headline);
    await panel.getByRole('spinbutton', { name: 'Asking price', exact: true }).fill(LISTING.price);
    await panel.getByLabel('Address', { exact: true }).fill(LISTING.address);
    await panel.getByLabel('Description', { exact: true }).fill(LISTING.description);
    await panel.getByRole('spinbutton', { name: 'Beds', exact: true }).fill(LISTING.beds);
    await panel.getByRole('spinbutton', { name: 'Baths', exact: true }).fill(LISTING.baths);
    await panel.getByRole('spinbutton', { name: /^Area ·/ }).fill(LISTING.area);
    const saved = page.waitForResponse(r => r.request().method() === 'POST' && new URL(r.url()).pathname === '/api/v1/properties');
    await panel.getByRole('button', { name: 'Save property', exact: true }).click();
    const response = await saved;
    expect(response.status()).toBe(201);
    propertyId = (await response.json()).id; record('property', propertyId, `${prefix} manual property`);
    await expect(panel.getByRole('heading', { name: LISTING.address })).toBeVisible();
    await expect(canvas(page).getByText(SOURCE.headline, { exact: true })).toBeVisible();
    await expect(page.getByText(/pending update/)).toBeVisible();
    await shot(page, '04-property-pending');
  });

  await test.step('5. Agent and Brand profiles (logo stored in R2)', async () => {
    let panel = page.getByRole('complementary', { name: 'Listing panel', exact: true });
    await panel.getByRole('button', { name: /^Agent / }).click();
    panel = page.getByRole('complementary', { name: 'Details panel', exact: true });
    await expect(panel.getByLabel('Full name', { exact: true })).toBeEditable();
    await panel.getByLabel('Full name', { exact: true }).fill(AGENT.name);
    await panel.getByLabel('Phone', { exact: true }).fill(AGENT.phone);
    await panel.getByLabel('Agency', { exact: true }).fill(AGENT.agency);
    const agentSaved = page.waitForResponse(r => r.request().method() === 'PUT' && new URL(r.url()).pathname === '/api/v1/listing-profiles');
    await panel.getByRole('button', { name: 'Save changes', exact: true }).click();
    expect((await agentSaved).status()).toBe(200);
    await railTo(page, 'Listing');

    panel = page.getByRole('complementary', { name: 'Listing panel', exact: true });
    await panel.getByRole('button', { name: /^Brand / }).click();
    panel = page.getByRole('complementary', { name: 'Brand panel', exact: true });
    await expect(panel.getByLabel('Brand name', { exact: true })).toBeEditable();
    await panel.getByLabel('Brand name', { exact: true }).fill(BRAND.name);
    await panel.getByLabel('Brand signature', { exact: true }).fill(BRAND.signature);
    const logoUpload = page.waitForResponse(isMedia('POST'));
    await panel.getByLabel('Upload brand logo', { exact: true }).setInputFiles(LOGO);
    const logoResponse = await logoUpload;
    expect(logoResponse.status()).toBe(201);
    const logo = await logoResponse.json();
    r2Keys.push(logo.key); record('r2', logo.key, `${prefix} brand logo (ui)`);
    await expect(panel.getByRole('img', { name: 'Brand logo' })).toHaveAttribute('src', logo.url);
    const brandSaved = page.waitForResponse(r => r.request().method() === 'PUT' && new URL(r.url()).pathname === '/api/v1/listing-profiles');
    await panel.getByRole('button', { name: 'Save Brand', exact: true }).click();
    expect((await brandSaved).status()).toBe(200);
    const profile = await (await api.get('/api/v1/listing-profiles')).json();
    expect(profile.record.brand.logo).toMatch(/^https:\/\//);
    expect(profile.record.brand.logo).toBe(logo.url);
    expect(profile.record.agent.name).toBe(AGENT.name);
    await shot(page, '05-agent-brand-saved');
  });

  await test.step('6. Upload a listing photo to R2 and customize the hero frame', async () => {
    await railTo(page, 'Uploads');
    const panel = page.getByRole('complementary', { name: 'Uploads panel', exact: true });
    const photoUpload = page.waitForResponse(isMedia('POST'));
    await panel.getByLabel('Upload listing photo', { exact: true }).setInputFiles(HERO);
    const response = await photoUpload;
    expect(response.status()).toBe(201);
    const body = await response.json();
    photoUrl = body.url; r2Keys.push(body.key); record('r2', body.key, `${prefix} listing photo (ui)`);
    const pendingPhoto = panel.getByRole('img', { name: 'hero-building.jpg' });
    await expect(pendingPhoto).toHaveAttribute('src', /^https:\/\//);
    await selectLayer(page, 'Hero photograph');
    await page.getByRole('toolbar', { name: 'image formatting', exact: true }).getByRole('button', { name: 'Link field', exact: true }).click();
    await expect(fields(page).locator('select[aria-label="Linked field"]')).toHaveValue('property.heroImage');
    await fields(page).getByRole('button', { name: 'Customize this design' }).click();
    await fields(page).getByRole('button', { name: 'Use hero-building.jpg for this frame', exact: true }).click();
    await expect(fields(page).getByRole('status')).toContainText('Customized for this design');
    await shot(page, '06-hero-customized');
  });

  await test.step('7. Apply to design, undo last apply, apply again', async () => {
    await railTo(page, 'Listing');
    const panel = page.getByRole('complementary', { name: 'Listing panel', exact: true });
    await panel.getByRole('button', { name: 'Apply to design', exact: true }).click();
    await expect(canvas(page).getByText(LISTING.headline, { exact: true })).toBeVisible();
    await expect(canvas(page).getByText(LISTING.description, { exact: true })).toBeVisible();
    await expect(canvas(page).getByText(BRAND.signature, { exact: true })).toBeVisible();
    for (const label of AMENITIES) await expect(canvas(page).getByText(label)).toBeVisible();
    await shot(page, '07-applied');
    await page.getByRole('button', { name: 'Undo last apply', exact: true }).click();
    await expect(canvas(page).getByText(SOURCE.headline, { exact: true })).toBeVisible();
    await expect(canvas(page).getByText(LISTING.headline, { exact: true })).toHaveCount(0);
    await panel.getByRole('button', { name: 'Apply to design', exact: true }).click();
    await expect(canvas(page).getByText(LISTING.headline, { exact: true })).toBeVisible();
  });

  await test.step('8. Save as Design, reload, verify persisted listing and R2-only media', async () => {
    await page.getByRole('button', { name: 'Save as Design', exact: true }).click();
    await expect(page.getByRole('status').filter({ hasText: /^Saved$/ })).toHaveCount(1, { timeout: 30_000 });
    await expect.poll(async () => (await (await api.get(`/api/v1/designs/${designId}`)).json()).canvasData?.v3Listing?.applied?.property?.headline, { timeout: 30_000 }).toBe(LISTING.headline);
    await page.reload();
    await expect(canvas(page).getByText(LISTING.headline, { exact: true })).toBeVisible({ timeout: 60_000 });
    await expect(canvas(page).getByText(BRAND.signature, { exact: true })).toBeVisible();
    const toggle = page.getByRole('button', { name: 'Show links', exact: true });
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await toggle.click();
    const badges = page.locator('[data-testid="link-overlay"] [data-link-for]');
    await expect(badges).toHaveCount(LINKS.length);
    for (const [, , badge] of LINKS.slice(0, 5)) await expect(badges.filter({ hasText: badge })).toHaveCount(1);
    await expect(badges.filter({ hasText: 'Custom · Photo' })).toHaveCount(1);
    await shot(page, '08-reloaded-links');
    const design = await (await api.get(`/api/v1/designs/${designId}`)).json();
    const v3 = design.canvasData.v3Listing;
    expect(v3.applied.property.headline).toBe(LISTING.headline);
    expect(Object.keys(v3.bindings).length).toBeGreaterThanOrEqual(6);
    const hero = design.canvasData.elements.find((e: any) => e.name === 'Hero photograph');
    expect(hero.src).toBe(photoUrl);
    const dataSrc = design.canvasData.elements.filter((e: any) => e.type === 'image' && !e.icon && typeof e.src === 'string' && e.src.startsWith('data:')).map((e: any) => e.name);
    expect(dataSrc, 'photo/logo elements must reference R2, not inline data').toEqual([]);
    for (const photo of [...v3.pending.photos, ...v3.applied.photos]) expect(photo.src).toMatch(/^https:\/\//);
    expect(v3.applied.brand.logo).toMatch(/^https:\/\//);
    // Dark-theme evidence of the linked canvas (view preference only; the design is untouched).
    await page.getByRole('button', { name: 'Canvas settings', exact: true }).click();
    await page.getByRole('button', { name: 'Toggle theme', exact: true }).click();
    await page.keyboard.press('Escape');
    await shot(page, '08b-reloaded-links-dark');
    await page.getByRole('button', { name: 'Canvas settings', exact: true }).click();
    await page.getByRole('button', { name: 'Toggle theme', exact: true }).click();
    await page.keyboard.press('Escape');
  });

  await test.step('9. Use the saved Template: Create Design creates a separate design', async () => {
    const before = await (await api.get(`/api/v1/designs/${designId}`)).json();
    await railTo(page, 'Templates');
    const panel = page.getByRole('complementary', { name: 'Templates panel', exact: true });
    await panel.getByRole('button', { name: new RegExp(designName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) }).first().click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Create Design', exact: true }).click();
    await expect(page).not.toHaveURL(new RegExp(`designId=${designId}(&|$)`), { timeout: 30_000 });
    const newId = new URL(page.url()).searchParams.get('designId')!;
    expect(newId).toMatch(/^c[a-z0-9]{24}$/);
    record('design', newId, `${prefix} created from template ${templateId}`);
    await expect(canvas(page).getByText(LISTING.headline, { exact: true })).toBeVisible({ timeout: 30_000 });
    await shot(page, '09-design-from-template');
    const after = await (await api.get(`/api/v1/designs/${designId}`)).json();
    expect(after.canvasData.v3Listing.applied).toEqual(before.canvasData.v3Listing.applied);
    expect(after.canvasData.elements.map((e: any) => [e.id, e.content ?? e.src])).toEqual(before.canvasData.elements.map((e: any) => [e.id, e.content ?? e.src]));
  });

  await test.step('10. Review & export the original design as a 1080×1080 PNG', async () => {
    await openDesign(page, designId, LISTING.headline);
    await page.getByRole('button', { name: 'Review & export', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Review & export', exact: true });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('Automated checks passed', { exact: false }).or(dialog.getByRole('region', { name: 'Export findings' }))).toBeVisible();
    const findings = dialog.getByRole('region', { name: 'Export findings' });
    if (await findings.isVisible()) {
      const text = await findings.innerText();
      console.log(`[export findings] ${text.replace(/\n/g, ' | ')}`);
      await shot(page, '10-export-findings');
      test.info().annotations.push({ type: 'export-findings', description: text });
      expect(text, 'export review must pass for an applied, linked listing design').toBe('');
    }
    await dialog.getByRole('checkbox').check();
    const download = page.waitForEvent('download');
    await dialog.getByRole('button', { name: 'Download PNG', exact: true }).click();
    const file = await download;
    const target = path.join(shots, '10-export.png');
    await file.saveAs(target);
    expect(await pngSize(target)).toEqual({ width: 1080, height: 1080 });
    // The hero photo is an R2 URL drawn through /api/proxy-image; prove it rendered (photo detail, not a flat frame).
    const heroStats = await page.evaluate(async data => {
      const image = new Image(); image.src = `data:image/png;base64,${data}`; await image.decode();
      const c = document.createElement('canvas'); c.width = image.width; c.height = image.height; const ctx = c.getContext('2d')!; ctx.drawImage(image, 0, 0);
      const lum: number[] = [];
      for (let y = 80; y < 1000; y += 40) for (let x = 700; x < 1060; x += 30) { const [r, g, b] = ctx.getImageData(x, y, 1, 1).data; lum.push(0.2126 * r + 0.7152 * g + 0.0722 * b); }
      const mean = lum.reduce((a, b) => a + b, 0) / lum.length;
      return { mean, sd: Math.sqrt(lum.reduce((a, b) => a + (b - mean) ** 2, 0) / lum.length) };
    }, fs.readFileSync(target).toString('base64'));
    expect(heroStats.sd, `hero region must show photographic detail (mean ${heroStats.mean.toFixed(1)})`).toBeGreaterThan(15);
    await expect(dialog.getByText('PNG downloaded.', { exact: true })).toBeVisible();
    await shot(page, '10-export-done');
  });

  console.log(`[created] design ${designId} template ${templateId} property ${propertyId} r2 ${r2Keys.join(',')} key(photo)=${photoUrl && r2Key(photoUrl)}`);
});
