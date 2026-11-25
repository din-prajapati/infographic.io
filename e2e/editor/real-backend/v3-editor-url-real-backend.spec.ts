import { test, expect, request as playwrightRequest, type APIRequestContext, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * V3 editor deep links against the real backend (no mocked /api). Contract: client/src/lib/v3EditorUrl.ts.
 * Uses a Horizon template saved by an earlier v3-listing-real-backend run in the same dev test account, and the
 * Unlimited QA user's Horizon template id as a template owned by someone else.
 *
 * Prerequisites (fresh environment): run e2e/v3-listing-real-backend.spec.ts once (it saves the E2E-HZN template in the
 * test account), and provision the QA sample with .agent-logs/real-backend/provision-horizon.cjs qa. If the QA template
 * id below no longer exists, the "foreign template" test still passes (missing and not-shared read the same).
 */
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const ledger = path.join(root, '.agent-logs', 'real-backend', 'created.txt');
const shots = path.join(root, '.e2e-artifacts', 'v3-real-backend', 'shots');
const FOREIGN_TEMPLATE = 'cmwfas257000dgpocxe3avn7h';
const UNAVAILABLE = 'This template could not be opened. It may have been deleted, or it is not shared with your account.';

let api: APIRequestContext;
let session: { token: string; user: Record<string, unknown> };
let ownTemplate: { id: string; name: string };

test.describe.configure({ mode: 'serial' });

test.beforeAll(async ({ baseURL }) => {
  const account = JSON.parse(fs.readFileSync(path.join(root, '.agent-logs', 'real-backend', 'account.json'), 'utf8'));
  const anon = await playwrightRequest.newContext({ baseURL });
  const login = await anon.post('/api/v1/auth/login', { data: { email: account.email, password: account.password } });
  expect(login.status()).toBeLessThan(300);
  session = await login.json();
  await anon.dispose();
  api = await playwrightRequest.newContext({ baseURL, extraHTTPHeaders: { Authorization: `Bearer ${session.token}` } });
  const templates = await (await api.get('/api/v1/canvas-templates')).json();
  const horizon = templates.filter((t: any) => /^E2E-HZN-.* The Horizon Residences$/.test(t.name)).sort((a: any, b: any) => String(b.createdAt).localeCompare(String(a.createdAt)));
  expect(horizon.length, 'run e2e/v3-listing-real-backend.spec.ts once first').toBeGreaterThan(0);
  ownTemplate = horizon[0];
  fs.mkdirSync(shots, { recursive: true });
});
test.afterAll(async () => { await api?.dispose(); });

async function signIn(page: Page) {
  await page.addInitScript(([token, user]) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', user);
    localStorage.setItem('theme', 'light');
  }, [session.token, JSON.stringify(session.user)] as const);
}
const designCount = async () => (await (await api.get('/api/v1/designs')).json()).filter((d: any) => d.type !== 'template').length;

test('templateId link starts a separate design from my template, keeps its links, and replaces the history entry', async ({ page }) => {
  await signIn(page);
  await page.goto('/my-designs');
  await page.goto(`/editor?editor=v3&&templateId=${ownTemplate.id}`);
  await expect(page).toHaveURL(/[?&]designId=c[a-z0-9]{24}/, { timeout: 60_000 });
  const designId = new URL(page.url()).searchParams.get('designId')!;
  expect(new URL(page.url()).searchParams.get('templateId')).toBeNull();
  fs.appendFileSync(ledger, `design ${designId} url-test created from template ${ownTemplate.id}\n`);
  const canvas = page.getByTestId('design-canvas');
  await expect(canvas.getByText(/Prime\s*Location/)).toBeVisible({ timeout: 60_000 });
  await expect(page.getByRole('status').filter({ hasText: 'A separate Design was created from the template.' })).toBeVisible();
  await page.getByRole('button', { name: 'Show links', exact: true }).click();
  await expect(page.locator('[data-testid="link-overlay"] [data-link-for]')).toHaveCount(6);
  await page.screenshot({ path: path.join(shots, 'url-01-template-link.png') });
  const design = await (await api.get(`/api/v1/designs/${designId}`)).json();
  expect(design.type).toBe('design');
  expect(Object.keys(design.canvasData.v3Listing.bindings)).toHaveLength(6);
  const template = await (await api.get(`/api/v1/canvas-templates/${ownTemplate.id}`)).json();
  expect(template.canvasData.v3Template).toBeTruthy();
  await page.goBack();
  await expect(page).toHaveURL(/\/my-designs$/);
});

test('a template owned by another account shows a clear message and creates nothing', async ({ page }) => {
  await signIn(page);
  const before = await designCount();
  await page.goto(`/editor?editor=v3&templateId=${FOREIGN_TEMPLATE}`);
  await expect(page.getByRole('alert').filter({ hasText: UNAVAILABLE })).toBeVisible({ timeout: 60_000 });
  await expect(page).toHaveURL(new RegExp(`templateId=${FOREIGN_TEMPLATE}`));
  await page.screenshot({ path: path.join(shots, 'url-02-foreign-template.png') });
  expect(await designCount()).toBe(before);
});

test('an AI variation id is refused without calling the template API', async ({ page }) => {
  await signIn(page);
  const calls: string[] = [];
  page.on('request', r => { if (r.url().includes('/api/v1/canvas-templates/')) calls.push(r.url()); });
  await page.goto('/editor?editor=v3&templateId=cmabcdefabcdefabcdefabcd_var_1');
  await expect(page.getByRole('alert').filter({ hasText: 'AI designs open from the AI Assistant, not from a template link.' })).toBeVisible({ timeout: 60_000 });
  expect(calls).toEqual([]);
});

test('width and height start a blank design at that size', async ({ page }) => {
  await signIn(page);
  await page.goto('/editor?editor=v3&width=1080&height=1350');
  await expect(page.getByTestId('design-canvas')).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText('1080 × 1350', { exact: true })).toBeVisible();
  expect(new URL(page.url()).searchParams.get('designId')).toBeNull();
});

test('leaving the editor while a template link is still opening does not pull the user back', async ({ page }) => {
  await signIn(page);
  // The real response is only delayed (route.continue), never replaced.
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route(`**/api/v1/canvas-templates/${ownTemplate.id}`, async route => { await gate; await route.continue(); });
  page.on('dialog', dialog => void dialog.accept());
  await page.goto('/my-designs');
  await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 60_000 });
  // In-app navigation (same document), as a link click would do; page.goto would reload and hide the race.
  await page.evaluate(url => { history.pushState(null, '', url); dispatchEvent(new PopStateEvent('popstate')); }, `/editor?editor=v3&templateId=${ownTemplate.id}`);
  await expect(page.getByRole('status').filter({ hasText: 'Opening template…' })).toBeVisible({ timeout: 60_000 });
  await page.evaluate(() => history.back());
  await expect(page).toHaveURL(/\/my-designs$/);
  release();
  await page.waitForTimeout(4000);
  await expect(page).toHaveURL(/\/my-designs$/);
});
