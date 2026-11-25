import { test, expect } from '@playwright/test';
import { mockWorkspace } from '../fixtures/workspace-api';

for (const theme of ['light', 'dark'] as const) {
  test(`${theme}: authenticated pages share V3 branding and the reference type scale`, async ({ page }) => {
    await mockWorkspace(page, { theme });
    await page.setViewportSize({ width: 1242, height: 668 });
    // /account and /usage are Settings dialog tabs now (e2e/settings/), not pages.
    for (const route of ['/listings', '/agent-brand', '/templates', '/my-designs', '/workspace/how-it-works']) {
      await page.goto(route);
      await expect(page.locator('.ws-topbar')).toHaveCSS('background-image', 'linear-gradient(110deg, rgb(18, 62, 98), rgb(25, 105, 101))');
      await expect(page.locator('.ws-wordmark img')).toHaveAttribute('src', '/logo-icon-option6-light.png');
      await expect(page.locator('.ws-wordmark')).toHaveCSS('font-size', '13px');
      await expect(page.locator('.ws-nav-item').first()).toHaveCSS('font-size', '12px');
      await expect(page.locator('.ws-nav-label-group').first()).toHaveCSS('font-size', '9px');
      await expect(page.locator('.ws-main h1')).toHaveCSS('font-size', '28px');
    }
  });

  test(`${theme}: Listings, Templates and Designs have the same search treatment`, async ({ page }) => {
    await mockWorkspace(page, { theme });
    await page.setViewportSize({ width: 1242, height: 668 });
    for (const route of ['/listings', '/templates', '/my-designs']) {
      await page.goto(route);
      const search = page.locator('.ws-search input');
      await expect(search).toHaveCSS('height', '44px');
      await expect(search).toHaveCSS('font-size', '12px');
      await expect(search).toHaveCSS('border-radius', '8px');
      await expect(search).toHaveCSS('padding-left', '44px');
      await expect(search).toHaveCSS('background-color', theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(30, 34, 40)');
      await search.focus();
      await expect(search).toHaveCSS('outline-color', theme === 'light' ? 'rgb(7, 107, 108)' : 'rgb(122, 219, 203)');
    }
    await page.goto('/listings');
    await expect(page.locator('.lst-search')).toHaveCSS('max-width', 'none');
  });
}

// Visual contract: the existing format flow inherits V3 colours even though
// Radix renders its dialog outside the workspace wrapper. No new product flow.
for (const [route, trigger] of [['/templates', 'New Template'], ['/my-designs', 'New Design']] as const) {
  test(`${trigger}: portalled formats use the light product palette`, async ({ page }) => {
    await mockWorkspace(page);
    await page.setViewportSize({ width: 1242, height: 668 });
    await page.goto(route);
    await page.getByRole('button', { name: trigger, exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Choose a format' });
    await expect(dialog).toHaveCSS('color', 'rgb(32, 42, 53)');
    await expect(dialog).toHaveCSS('background-color', 'rgb(255, 255, 255)');
    await expect(dialog).toHaveCSS('border-radius', '14px');
    await expect(dialog.locator('h2')).toHaveCSS('font-size', '20px');
    // New users have no remembered format tile; the active category is For you.
    await expect(dialog.locator('.format-picker-categories [aria-pressed=true]')).toHaveCSS('color', 'rgb(7, 107, 108)');
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(page.getByRole('button', { name: trigger, exact: true })).toBeFocused();
  });
}

test('dark menus and format dialog share the V3 surface, and public pages release that theme', async ({ page }) => {
  await mockWorkspace(page, { theme: 'dark' });
  await page.goto('/templates');
  await page.getByRole('button', { name: 'Account menu for Dana Account' }).click();
  await expect(page.getByRole('menu')).toHaveCSS('background-color', 'rgb(30, 34, 40)');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'New Template', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Choose a format' })).toHaveCSS('background-color', 'rgb(30, 34, 40)');
  await expect(page.getByRole('dialog').locator('.format-picker-categories [aria-pressed=true]')).toHaveCSS('color', 'rgb(122, 219, 203)');
  await page.keyboard.press('Escape');
  // Normal navigation unmounts the workspace, unlike a new page load which would hide a cleanup defect.
  await page.getByRole('button', { name: 'Account menu for Dana Account' }).click();
  await page.getByRole('menuitem', { name: 'Sign out' }).click();
  await expect(page).toHaveURL(/\/auth$/);
  await expect(page.locator('body')).not.toHaveAttribute('data-product-theme');
});

test('mobile format categories and custom dimensions remain inside the viewport', async ({ page }) => {
  await mockWorkspace(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/templates');
  await page.getByRole('button', { name: 'New Template', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Choose a format' });
  await dialog.getByRole('button', { name: 'Custom size', exact: true }).click();
  await expect(dialog.locator('input').first()).toBeVisible();
  const bounds = await dialog.boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390);
  expect(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
});
