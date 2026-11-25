import { test, expect } from '@playwright/test';
import { CDN, mockWorkspace, property, uploadFile } from '../fixtures/workspace-api';

/**
 * Agent & Brand (rev-2 spec §8): one draft, atomic save with expected version, live preview, Cancel,
 * uploads, HEX validation, and isolation from account identity and existing listings.
 * Mocked: Vite only, /api answered by e2e/fixtures/workspace-api.ts.
 */
test('first save sends version 0, persists after reload, and the preview follows the draft', async ({ page }) => {
  const state = await mockWorkspace(page);
  await page.goto('/agent-brand');
  await expect(page.getByText('Used when starting new listings. Existing listings and designs keep their saved content.')).toBeVisible();
  const preview = page.getByRole('complementary', { name: /Preview/ });
  await expect(preview).toContainText('Agent name');
  await page.getByLabel('Name', { exact: true }).fill('Priya Shah');
  await page.getByLabel('Agency').fill('Harbour Realty');
  await page.getByLabel('Brand name').fill('Harbour');
  await page.getByLabel('Accent colour', { exact: true }).fill('#0a7');
  await expect(preview).toContainText('Priya Shah');
  await expect(preview).toContainText('Harbour Realty');
  expect(state.requests.filter(r => r.method === 'PUT')).toHaveLength(0);
  await page.getByRole('button', { name: 'Save Agent & Brand' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Agent & Brand saved' })).toBeVisible();
  const put = state.requests.find(r => r.method === 'PUT')!;
  expect(put.body.expectedVersion).toBe(0);
  expect(put.body.record.brand.accent).toBe('#00AA77');
  await page.reload();
  await expect(page.getByLabel('Name', { exact: true })).toHaveValue('Priya Shah');
  expect(state.profile.version).toBe(1);
});

test('Cancel restores the saved profile and nothing is written', async ({ page }) => {
  const state = await mockWorkspace(page, { profile: { version: 4, record: { agent: { name: 'Saved Name', phone: '', email: '', agency: '', license: '', photo: '' }, brand: { name: '', logo: '', tagline: '', accent: '' } } } });
  await page.goto('/agent-brand');
  await page.getByLabel('Name', { exact: true }).fill('Draft Name');
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByLabel('Name', { exact: true })).toHaveValue('Saved Name');
  await page.reload();
  await expect(page.getByLabel('Name', { exact: true })).toHaveValue('Saved Name');
  expect(state.requests.filter(r => r.method === 'PUT')).toHaveLength(0);
});

test('invalid e-mail and HEX are shown beside their fields and block the save', async ({ page }) => {
  const state = await mockWorkspace(page);
  await page.goto('/agent-brand');
  await page.getByLabel('Email').fill('priya@');
  await page.getByLabel('Accent colour', { exact: true }).fill('teal');
  await page.getByRole('button', { name: 'Save Agent & Brand' }).click();
  await expect(page.getByText('Enter an e-mail address like name@agency.com.')).toBeVisible();
  await expect(page.getByText('Enter a HEX colour like #087E78.')).toBeVisible();
  await expect(page.getByLabel('Email')).toHaveAttribute('aria-invalid', 'true');
  expect(state.requests.filter(r => r.method === 'PUT')).toHaveLength(0);
});

test('portrait and logo upload, replace and remove; https URLs only', async ({ page }) => {
  const state = await mockWorkspace(page);
  await page.goto('/agent-brand');
  await page.getByLabel('Upload portrait').setInputFiles(uploadFile('me.png'));
  await expect(page.getByRole('img', { name: 'Portrait preview' })).toHaveAttribute('src', /^blob:/);
  await page.getByLabel('Upload logo').setInputFiles(uploadFile('logo.png'));
  await expect(page.getByRole('img', { name: 'Logo preview' })).toHaveAttribute('src', /^blob:/);
  await page.getByRole('button', { name: 'Remove' }).first().click();
  await expect(page.getByRole('img', { name: 'Portrait preview' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Save Agent & Brand' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'saved' })).toBeVisible();
  expect(state.profile.record.agent.photo).toBe('');
  expect(state.profile.record.brand.logo).toBe(`${CDN}/upload-1.png`);
  expect(state.uploads).toBe(1);
});

test('a stale save is a conflict: nothing is overwritten and Reload latest restores the server copy', async ({ page }) => {
  const state = await mockWorkspace(page, { profile: { version: 1, record: { agent: { name: 'Server Name', phone: '', email: '', agency: '', license: '', photo: '' }, brand: { name: '', logo: '', tagline: '', accent: '' } } } });
  await page.goto('/agent-brand');
  await page.getByLabel('Name', { exact: true }).fill('My Draft');
  state.profile = { version: 2, record: { ...state.profile.record, agent: { ...state.profile.record.agent, name: 'Saved Elsewhere' } } };
  await page.getByRole('button', { name: 'Save Agent & Brand' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'saved somewhere else' })).toBeVisible();
  expect(state.profile.record.agent.name).toBe('Saved Elsewhere');
  await page.getByRole('button', { name: 'Reload latest' }).click();
  await expect(page.getByLabel('Name', { exact: true })).toHaveValue('Saved Elsewhere');
});

test('saving the profile leaves the account identity and existing listings unchanged', async ({ page }) => {
  const existing = property(1);
  const state = await mockWorkspace(page, { properties: [existing] });
  await page.goto('/agent-brand');
  await page.getByLabel('Name', { exact: true }).fill('Brand New Agent');
  await page.getByRole('button', { name: 'Save Agent & Brand' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'saved' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Account menu for Dana Account' })).toBeVisible();
  expect(state.properties[0].record.agent.name).toBe('Saved Agent');
  expect(state.requests.filter(r => r.path.startsWith('/properties') && r.method !== 'GET')).toHaveLength(0);
  await page.goto(`/listings/${existing.id}`);
  await expect(page.getByText('Saved Agent', { exact: true })).toBeVisible();
});

test('a new property starts with the saved profile', async ({ page }) => {
  const state = await mockWorkspace(page, { profile: { version: 1, record: { agent: { name: 'Profile Agent', phone: '', email: '', agency: 'Profile Agency', license: '', photo: '' }, brand: { name: 'Profile Brand', logo: '', tagline: '', accent: '' } } } });
  await page.goto('/listings/new');
  await page.getByRole('button', { name: 'Enter manually' }).click();
  await page.getByLabel('Address').fill('9 Palm Street');
  await page.getByRole('button', { name: 'Create property' }).click();
  await expect(page.getByRole('heading', { level: 1, name: '9 Palm Street' })).toBeVisible();
  const created = state.requests.find(r => r.method === 'POST' && r.path === '/properties')!.body.record;
  expect(created.agent).toMatchObject({ name: 'Profile Agent', agency: 'Profile Agency' });
  expect(created.brand.name).toBe('Profile Brand');
});


for (const theme of ['light', 'dark'] as const) {
  test(`brand swatches follow edits, Cancel and persisted values in ${theme} theme`, async ({ page }) => {
    const state = await mockWorkspace(page, { theme });
    await page.goto('/agent-brand');
    const swatches = page.locator('.ab-swatches .ab-swatch');
    await page.getByLabel('Accent colour', { exact: true }).fill('#f00');
    await expect(swatches).toHaveCount(3);
    await expect(swatches.nth(0)).toHaveCSS('background-color', 'rgb(255, 0, 0)');
    await expect(swatches.nth(1)).toHaveCSS('background-color', 'rgb(115, 0, 0)');
    await expect(swatches.nth(2)).toHaveCSS('background-color', 'rgb(255, 230, 230)');
    await page.getByRole('button', { name: 'Save Agent & Brand' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Agent & Brand saved' })).toBeVisible();
    await page.getByLabel('Accent colour', { exact: true }).fill('#00f');
    await expect(swatches.nth(1)).toHaveCSS('background-color', 'rgb(0, 0, 115)');
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(swatches.nth(0)).toHaveCSS('background-color', 'rgb(255, 0, 0)');
    await page.reload();
    await expect(swatches.nth(2)).toHaveCSS('background-color', 'rgb(255, 230, 230)');
    expect(state.profile.record.brand.accent).toBe('#FF0000');
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: `.e2e-artifacts/mocked/brand-palette-${theme}-mobile.png`, fullPage: true });
  });
}

test('discarding an agent/brand image draft leaves no uploaded objects', async ({ page }) => {
  const state = await mockWorkspace(page);
  await page.goto('/agent-brand');
  await page.getByLabel('Upload portrait').setInputFiles(uploadFile('portrait.png'));
  await expect(page.getByRole('img', { name: 'Portrait preview' })).toHaveAttribute('src', /^blob:/);
  expect(state.uploads).toBe(0);
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  expect(state.uploads).toBe(0);
  expect(state.requests.filter(r => r.method === 'PUT')).toHaveLength(0);
});
