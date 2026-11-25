import { test, expect, type Page } from '@playwright/test';
import { mockWorkspace, property } from '../fixtures/workspace-api';

/**
 * Workspace shell (rev-2 spec §2–§4): navigation order and active state, deep links, Back, account menu,
 * shared V3 theme on existing pages, responsive navigation and the unsaved-work guard.
 * Mocked: Vite only, /api answered by e2e/fixtures/workspace-api.ts.
 */
const nav = (page: Page) => page.getByRole('navigation', { name: 'Workspace' }).first();
const noHorizontalScroll = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

test('menu lists Home, Listings, Templates, Designs, Agent & brand, How it works in order', async ({ page }) => {
  await mockWorkspace(page);
  await page.goto('/listings');
  await expect(nav(page).getByRole('link')).toHaveText(['Home', 'Listings', 'Templates', 'Designs', 'Agent & brand', 'How it works']);
  await expect(nav(page).getByRole('link', { name: 'Listings' })).toHaveAttribute('aria-current', 'page');
});

test('signed-in root and Home both land on Listings', async ({ page }) => {
  await mockWorkspace(page);
  await page.goto('/');
  await expect(page).toHaveURL(/\/listings$/);
  await page.goto('/workspace');
  await expect(page).toHaveURL(/\/listings$/);
});

test('deep link to a listing survives refresh, keeps Listings active and Back returns to the library', async ({ page }) => {
  const saved = property(1);
  await mockWorkspace(page, { properties: [saved] });
  await page.goto('/listings');
  await page.getByTestId('property-card').first().click();
  await expect(page).toHaveURL(new RegExp(`/listings/${saved.id}$`));
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'Lakeview 1' })).toBeVisible();
  await expect(nav(page).getByRole('link', { name: 'Listings' })).toHaveAttribute('aria-current', 'page');
  await page.goBack();
  await expect(page).toHaveURL(/\/listings$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Good marketing starts with one listing.' })).toBeVisible();
});

test('existing pages keep their routes and render inside the themed workspace shell', async ({ page }) => {
  await mockWorkspace(page);
  for (const [route, item] of [['/templates', 'Templates'], ['/my-designs', 'Designs'], ['/workspace/how-it-works', 'How it works']] as const) {
    await page.goto(route);
    await expect(page).toHaveURL(new RegExp(`${route}$`));
    await expect(nav(page)).toBeVisible();
    const current = nav(page).locator('[aria-current=page]');
    if (item) await expect(current).toHaveText(item); else await expect(current).toHaveCount(0);
    // One shell header only (the legacy AppHeader is gone) and V3 tokens are applied.
    await expect(page.locator('header')).toHaveCount(1);
    await expect(page.locator('.ws-root')).toHaveCSS('background-color', 'rgb(245, 247, 249)') // design.md §4.1 background #f5f7f9;
  }
});

test('dark theme applies the workspace dark tokens to the shell', async ({ page }) => {
  await mockWorkspace(page, { theme: 'dark' });
  await page.goto('/listings');
  await expect(page.locator('.ws-root')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('.ws-root')).toHaveCSS('background-color', 'rgb(17, 19, 24)'); // Shared V3 dark canvas palette.
});

test('account menu shows the account identity, not the marketing agent, and is keyboard operable', async ({ page }) => {
  await mockWorkspace(page, { profile: { version: 1, record: { agent: { name: 'Marketing Agent', phone: '', email: '', agency: '', license: '', photo: 'https://cdn.example.test/agent.png' }, brand: { name: '', logo: '', tagline: '', accent: '' } } } });
  await page.goto('/listings');
  const trigger = page.getByRole('button', { name: 'Account menu for Dana Account' });
  await expect(trigger).toContainText('DA');
  await expect(trigger).toContainText('Dana Account');
  await expect(trigger.locator('img')).toHaveCount(0);
  await trigger.focus();
  await page.keyboard.press('Enter');
  const menu = page.getByRole('menu');
  // Spec §3 grouping: everyday account actions → commercial → session.
  await expect(menu.getByRole('menuitem')).toHaveText(['Settings' + (process.platform === 'darwin' ? '⌘⇧,' : 'Ctrl+Shift+,'), 'Usage', 'Get help', 'Upgrade plan', 'Sign out']);
  // Radix hides the page from the accessibility tree while the menu is open, so read the trigger by class.
  await expect(page.locator('.ws-account-trigger')).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(menu).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.getByRole('menuitem', { name: 'Usage' }).click();
  await expect(page).toHaveURL(/\/listings#settings\/usage$/);
  await expect(page.getByRole('dialog', { name: 'Settings' })).toBeVisible();
});

test('sign out returns to the auth page', async ({ page }) => {
  await mockWorkspace(page);
  await page.goto('/listings');
  await page.getByRole('button', { name: /Account menu/ }).click();
  await page.getByRole('menuitem', { name: 'Sign out' }).click();
  await expect(page).toHaveURL(/\/auth/);
});

test('768–1023px shows icon navigation with accessible names', async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 800 });
  await mockWorkspace(page);
  await page.goto('/listings');
  const link = nav(page).getByRole('link', { name: 'Templates' });
  await expect(link).toBeVisible();
  expect((await link.boundingBox())!.width).toBeLessThan(60);
  expect(await noHorizontalScroll(page)).toBe(true);
});

test('390px: navigation is a drawer, opened from the top bar; no horizontal scroll', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockWorkspace(page, { properties: [property(1), property(2)] });
  await page.goto('/listings');
  await expect(page.locator('.ws-sidebar')).toBeHidden();
  await page.getByRole('button', { name: 'Open navigation' }).click();
  const drawer = page.getByRole('dialog', { name: 'Navigation' });
  await expect(drawer).toBeVisible();
  await drawer.getByRole('link', { name: 'Agent & brand' }).click();
  await expect(page).toHaveURL(/\/agent-brand$/);
  await expect(drawer).toHaveCount(0);
  expect(await noHorizontalScroll(page)).toBe(true);
  await page.goto('/listings');
  expect(await noHorizontalScroll(page)).toBe(true);
});

test('1242×668 desktop layout fits without horizontal scroll', async ({ page }) => {
  await page.setViewportSize({ width: 1242, height: 668 });
  await mockWorkspace(page, { properties: [property(1), property(2), property(3)] });
  for (const route of ['/listings', `/listings/${property(1).id}`, '/agent-brand', '/templates']) {
    await page.goto(route);
    await expect(nav(page)).toBeVisible();
    expect(await noHorizontalScroll(page)).toBe(true);
  }
});

test.describe('unsaved-work guard', () => {
  async function dirtyAgentBrand(page: Page) {
    const state = await mockWorkspace(page);
    await page.goto('/agent-brand');
    await page.getByLabel('Name', { exact: true }).fill('Unsaved Name');
    return state;
  }
  test('Stay keeps the draft; Discard leaves without saving', async ({ page }) => {
    const state = await dirtyAgentBrand(page);
    await nav(page).getByRole('link', { name: 'Listings' }).click();
    const dialog = page.getByRole('alertdialog', { name: 'You have unsaved changes' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Stay' }).click();
    await expect(page).toHaveURL(/\/agent-brand$/);
    await expect(page.getByLabel('Name', { exact: true })).toHaveValue('Unsaved Name');
    await nav(page).getByRole('link', { name: 'Listings' }).click();
    await page.getByRole('button', { name: 'Discard' }).click();
    await expect(page).toHaveURL(/\/listings$/);
    expect(state.requests.filter(r => r.method === 'PUT')).toHaveLength(0);
  });
  test('Save writes the profile, then continues', async ({ page }) => {
    const state = await dirtyAgentBrand(page);
    await nav(page).getByRole('link', { name: 'Templates' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Save' }).click();
    await expect(page).toHaveURL(/\/templates$/);
    expect(state.profile.record.agent.name).toBe('Unsaved Name');
  });
  test('browser Back and Sign out are guarded too', async ({ page }) => {
    await mockWorkspace(page);
    await page.goto('/listings');
    await nav(page).getByRole('link', { name: 'Agent & brand' }).click();
    await page.getByLabel('Name', { exact: true }).fill('Unsaved Name');
    await page.goBack();
    await expect(page.getByRole('alertdialog')).toBeVisible();
    await page.getByRole('button', { name: 'Stay' }).click();
    await expect(page).toHaveURL(/\/agent-brand$/);
    await page.getByRole('button', { name: /Account menu/ }).click();
    await page.getByRole('menuitem', { name: 'Sign out' }).click();
    await expect(page.getByRole('alertdialog')).toBeVisible();
    await page.getByRole('button', { name: 'Stay' }).click();
    await expect(page).toHaveURL(/\/agent-brand$/);
  });
});
