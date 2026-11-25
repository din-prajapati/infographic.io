import { test, expect } from '@playwright/test';
import { mockWorkspace, property, CDN } from '../fixtures/workspace-api';

for (const theme of ['light', 'dark'] as const) {
  test(`${theme}: listing empty-state control and summary actions keep their hierarchy`, async ({ page }) => {
    const listing = property(1);
    await mockWorkspace(page, { theme, properties: [listing], profile: { version: 1, record: { agent: { ...listing.record.agent, name: 'My Saved Profile' }, brand: { ...listing.record.brand, name: 'My Saved Brand' } } } });
    await page.setViewportSize({ width: 1242, height: 668 });
    await page.goto(`/listings/${listing.id}`);
    const empty = page.locator('#lst-panel-assets .ws-empty');
    await expect(empty.getByRole('button', { name: 'Create design' })).toHaveCSS('min-height', '40px');
    await expect(empty.locator('button svg')).toHaveCSS('width', '16px');
    await expect(empty).toHaveCSS('align-items', 'center');
    for (const label of ['Agent on this listing', 'Brand on this listing']) {
      const card = page.getByRole('region', { name: label });
      await expect(card.locator('.lst-summary-actions').getByRole('button', { name: label === 'Agent on this listing' ? 'Use saved profile' : 'Use saved brand', exact: true })).toBeVisible();
      const identity = await card.locator('.lst-identity').boundingBox();
      const actions = await card.locator('.lst-summary-actions').boundingBox();
      expect(actions!.y).toBeGreaterThan(identity!.y + identity!.height);
    }
    await empty.getByRole('button', { name: 'Create design' }).click();
    await expect(page.getByRole('dialog', { name: 'Choose a format' })).toBeVisible();
  });

  test(`${theme}: gallery previews have separate metadata and an explicit failed-image state`, async ({ page }) => {
    await mockWorkspace(page, { theme });
    const records = [
      { id: 'good', name: 'A long saved marketing asset title', thumbnail: `${CDN}/good.png` },
      { id: 'broken', name: 'Unavailable preview', thumbnail: `${CDN}/broken.png` },
    ].map(item => ({ ...item, type: 'design', category: 'real-estate', createdAt: '2026-11-18T12:00:00Z', updatedAt: '2026-11-18T12:00:00Z', canvasData: {} }));
    await page.route(`${CDN}/broken.png`, route => route.fulfill({ status: 404, body: '' }));
    await page.route('**/api/v1/designs', route => route.fulfill({ json: records }));
    await page.route('**/api/v1/canvas-templates', route => route.fulfill({ json: records.map(item => ({ ...item, type: 'template' })) }));
    for (const width of [1242, 390]) {
      await page.setViewportSize({ width, height: 844 });
      for (const route of ['/templates', '/my-designs']) {
        await page.goto(route);
        await expect(page.getByRole('img', { name: 'Preview unavailable for Unavailable preview', exact: true })).toBeVisible();
        const image = page.getByRole('img', { name: records[0].name, exact: true }).first();
        await expect(image).toHaveCSS('object-fit', 'contain');
        const card = image.locator('..').locator('..');
        const preview = await image.locator('..').boundingBox();
        const badges = await card.locator('.ws-gallery-badges').boundingBox();
        expect(badges!.y).toBeGreaterThanOrEqual(preview!.y + preview!.height - 1);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      }
    }
  });
}
