import { test as plain, expect } from '@playwright/test';
import { test as legacy } from '../fixtures/legacy-editor';
import { mockWorkspace } from '../fixtures/workspace-api';

/**
 * Guards the temporary legacy-editor E2E fixture (e2e/fixtures/legacy-editor.ts) that keeps the old-editor suites in
 * e2e/editor-legacy, e2e/ai-generation, … pointed at /editor?editor=legacy, while real users get V3 (the default editor).
 */
plain('without the fixture, Templates → New design opens V3', async ({ page }) => {
  await mockWorkspace(page);
  await page.goto('/templates');
  await page.getByRole('button', { name: 'New Template', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Just Listed', exact: true }).click();
  await expect(page).toHaveURL(/\/editor\?(width|templateId)=/);
  await expect(page.locator('.v3-editor')).toBeVisible();
});

legacy('with the fixture, the same journey and direct /editor links open the legacy editor', async ({ page }) => {
  await mockWorkspace(page);
  await page.goto('/templates');
  await page.getByRole('button', { name: 'New Template', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Just Listed', exact: true }).click();
  await expect(page).toHaveURL(/\/editor\?.*editor=legacy/);
  await expect(page.locator('.v3-editor')).toHaveCount(0);
  await expect(page.getByTestId('design-canvas')).toBeVisible();
  await page.goto('/editor?templateId=anything');
  await expect(page).toHaveURL(/editor=legacy/);
  await expect(page.locator('.v3-editor')).toHaveCount(0);
});
