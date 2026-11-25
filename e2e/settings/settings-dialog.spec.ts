import { test, expect, type Page } from '@playwright/test';
import { mockWorkspace, uploadFile, CDN } from '../fixtures/workspace-api';

/**
 * Settings dialog — docs/research/2026-11-18-ACCOUNT-MENU-SETTINGS-STRUCTURE-SPEC.md.
 * Mocked API (e2e/mocked.config.ts). Run alone: npm run test:module -- settings --e2e
 */
const dialog = (page: Page) => page.getByRole('dialog', { name: 'Settings' });
const tabs = (page: Page) => dialog(page).getByRole('navigation', { name: 'Settings' });
const SOLO = { tier: 'SOLO', design: { current: 42, limit: 50 }, editable: { used: 3, limit: 20 } };
const TEAM = { tier: 'TEAM', design: { current: 12, limit: 200 }, editable: { used: 1, limit: 60 } };

async function openFromMenu(page: Page) {
  await page.getByRole('button', { name: /Account menu/ }).click();
  await page.getByRole('menuitem', { name: /^Settings/ }).click();
  await expect(dialog(page)).toBeVisible();
}

test.describe('opening, routing and closing', () => {
  test('account menu → Settings opens a fixed-size dialog over the current page on the Account tab', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await mockWorkspace(page, { plan: SOLO });
    await page.goto('/listings');
    await openFromMenu(page);
    await expect(page).toHaveURL(/\/listings#settings\/account$/);
    // The page underneath stays mounted.
    await expect(page.locator('.ws-main h1')).toHaveText('Good marketing starts with one listing.');
    await expect(tabs(page).getByRole('button')).toHaveText(['Account', 'Billing', 'Usage', 'Organization', 'Appearance', 'Privacy']);
    await expect(tabs(page).getByRole('button', { name: 'Account' })).toHaveAttribute('aria-current', 'page');
    await expect(dialog(page).getByRole('combobox', { name: 'Search settings' })).toBeFocused();
    const size = await dialog(page).boundingBox();
    expect(size?.width).toBe(1024);
    await tabs(page).getByRole('button', { name: 'Privacy' }).click();
    await expect(page).toHaveURL(/#settings\/privacy$/);
    expect(await dialog(page).boundingBox()).toEqual(size); // same size on every tab
  });

  test('switching tabs replaces history, so one Back closes the dialog', async ({ page }) => {
    await mockWorkspace(page, { plan: SOLO });
    await page.goto('/listings');
    await openFromMenu(page);
    await tabs(page).getByRole('button', { name: 'Billing' }).click();
    await expect(page).toHaveURL(/#settings\/billing$/);
    await tabs(page).getByRole('button', { name: 'Usage' }).click();
    await expect(page).toHaveURL(/#settings\/usage$/);
    await page.goBack();
    await expect(page).toHaveURL(/\/listings$/);
    await expect(dialog(page)).toHaveCount(0);
  });

  test('Escape, the close button and Ctrl+Shift+, close and reopen it', async ({ page }) => {
    await mockWorkspace(page);
    await page.goto('/agent-brand');
    await page.keyboard.press('Control+Shift+Comma');
    await expect(dialog(page)).toBeVisible();
    await expect(page).toHaveURL(/\/agent-brand#settings\/account$/);
    await page.keyboard.press('Escape');
    await expect(dialog(page)).toHaveCount(0);
    await expect(page).toHaveURL(/\/agent-brand$/);
    await openFromMenu(page);
    await dialog(page).getByRole('button', { name: 'Close settings' }).click();
    await expect(dialog(page)).toHaveCount(0);
  });

  test('deep links open the named tab, and the retired /account and /usage pages redirect into the dialog', async ({ page }) => {
    await mockWorkspace(page, { plan: SOLO });
    await page.goto('/listings#settings/privacy');
    await expect(tabs(page).getByRole('button', { name: 'Privacy' })).toHaveAttribute('aria-current', 'page');
    await page.goto('/account');
    await expect(page).toHaveURL(/\/listings#settings\/account$/);
    await expect(tabs(page).getByRole('button', { name: 'Account' })).toHaveAttribute('aria-current', 'page');
    await page.goto('/usage');
    await expect(page).toHaveURL(/\/listings#settings\/usage$/);
    await expect(dialog(page).getByRole('progressbar', { name: 'Design credits used' })).toBeVisible();
  });
});

test.describe('search settings', () => {
  test('finds a setting on another tab, opens it and highlights the row', async ({ page }) => {
    await mockWorkspace(page, { plan: SOLO });
    await page.goto('/listings#settings/account');
    const search = dialog(page).getByRole('combobox', { name: 'Search settings' });
    await search.fill('dark');
    const results = dialog(page).getByRole('listbox', { name: 'Matching settings' });
    await expect(results.getByRole('option')).toHaveCount(1);
    await expect(results.getByRole('option').first()).toContainText('Theme');
    await expect(results.getByRole('option').first()).toContainText('Appearance · Theme');
    await expect(search).toHaveAttribute('aria-expanded', 'true');
    await search.press('Enter');
    await expect(page).toHaveURL(/#settings\/appearance\/theme$/);
    await expect(search).toHaveValue('');
    const row = dialog(page).locator('[data-setting-id="theme"]');
    await expect(row).toHaveAttribute('data-highlight', '');
    await expect(row).toBeFocused();
  });

  test('arrow keys move through results; Escape clears the query before it closes the dialog', async ({ page }) => {
    await mockWorkspace(page, { plan: SOLO });
    await page.goto('/listings#settings/account');
    const search = dialog(page).getByRole('combobox', { name: 'Search settings' });
    await search.fill('billing');
    const options = dialog(page).getByRole('option');
    await expect(options).toHaveText([/Current plan/, /Payment history/, /Cancel subscription/]);
    await expect(options.nth(0)).toHaveAttribute('aria-selected', 'true');
    await search.press('ArrowDown');
    await expect(options.nth(1)).toHaveAttribute('aria-selected', 'true');
    await search.press('Escape');
    await expect(search).toHaveValue('');
    await expect(dialog(page)).toBeVisible();
    await expect(tabs(page).getByRole('button', { name: 'Billing' })).toBeVisible();
    await search.press('Escape');
    await expect(dialog(page)).toHaveCount(0);
  });

  test('shows an empty state, and "team" still finds the renamed Organization tab', async ({ page }) => {
    await mockWorkspace(page, { plan: SOLO });
    await page.goto('/listings#settings/account');
    const search = dialog(page).getByRole('combobox', { name: 'Search settings' });
    await search.fill('zzzz');
    await expect(dialog(page).getByRole('status').filter({ hasText: 'No settings match “zzzz”.' })).toBeVisible();
    await search.fill('team');
    await expect(dialog(page).getByRole('option').first()).toContainText('Organization · Organization');
  });
});

test.describe('Account tab', () => {
  test('name saves on blur without a Save button and updates the account menu', async ({ page }) => {
    const state = await mockWorkspace(page);
    await page.goto('/listings#settings/account');
    const name = dialog(page).getByRole('textbox', { name: 'Full name' });
    await expect(name).toHaveValue('Dana Account');
    await name.fill('  Dana Q. Account ');
    await name.press('Enter');
    await expect(dialog(page).getByText('Saved')).toBeVisible();
    await expect(name).toHaveValue('Dana Q. Account');
    expect(state.requests.filter(r => r.method === 'PATCH' && r.path === '/users/me').map(r => r.body)).toEqual([{ name: 'Dana Q. Account' }]);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'Account menu for Dana Q. Account' })).toBeVisible();
    // The cached session is updated too, so a reload keeps the new name (the fixture's init script would overwrite it on reload).
    expect(JSON.parse(await page.evaluate(() => localStorage.getItem('auth_user') ?? '{}')).name).toBe('Dana Q. Account');
  });

  test('first Escape reverts an unsaved name edit and keeps the dialog open; blank names and failures are explained', async ({ page }) => {
    const state = await mockWorkspace(page);
    await page.goto('/listings#settings/account');
    const name = dialog(page).getByRole('textbox', { name: 'Full name' });
    await expect(name).toHaveValue('Dana Account');
    await name.fill('Typo');
    await name.press('Escape');
    await expect(name).toHaveValue('Dana Account');
    await expect(dialog(page)).toBeVisible();
    await name.fill('   ');
    await name.press('Enter');
    await expect(dialog(page).getByRole('alert')).toHaveText('Enter your name.');
    state.failProfileSave = 1;
    await name.fill('Dana B');
    await name.press('Enter');
    await expect(dialog(page).getByRole('alert')).toContainText('could not be saved');
    expect(state.requests.filter(r => r.method === 'PATCH' && r.path === '/users/me')).toHaveLength(1);
  });

  test('profile photo uploads to media storage, saves the https address, and appears in the account menu', async ({ page }) => {
    const state = await mockWorkspace(page);
    await page.goto('/listings#settings/account');
    await expect(dialog(page).getByRole('button', { name: 'Upload photo' })).toBeEnabled();
    await dialog(page).getByLabel('Upload profile photo').setInputFiles(uploadFile('me.png'));
    await expect(dialog(page).getByRole('img', { name: 'Your profile photo' })).toHaveAttribute('src', `${CDN}/upload-1.png`);
    expect(state.requests.filter(r => r.method === 'PATCH' && r.path === '/users/me').map(r => r.body)).toEqual([{ avatarUrl: `${CDN}/upload-1.png` }]);
    await expect(page.locator('.ws-account-trigger img')).toHaveAttribute('src', `${CDN}/upload-1.png`);
    await dialog(page).getByRole('button', { name: 'Remove' }).click();
    await expect(dialog(page).getByRole('img', { name: 'Your profile photo' })).toHaveCount(0);
    expect(state.account.avatarUrl).toBeNull();
  });

  test('password row sends a reset link to the account email; Google-only accounts get no button', async ({ page }) => {
    const state = await mockWorkspace(page);
    await page.goto('/listings#settings/account');
    await dialog(page).getByRole('button', { name: 'Send reset link' }).click();
    await expect(dialog(page).getByRole('status').filter({ hasText: 'We sent a link to dana@account.test' })).toBeVisible();
    expect(state.requests.find(r => r.path === '/auth/forgot-password')?.body).toEqual({ email: 'dana@account.test' });
  });

  test('Google-only account: no password to reset', async ({ page }) => {
    await mockWorkspace(page, { account: { hasPassword: false, hasGoogle: true } });
    await page.goto('/listings#settings/account');
    await expect(dialog(page).getByText('You sign in with Google, so there’s no password to change here.')).toBeVisible();
    await expect(dialog(page).getByRole('button', { name: 'Send reset link' })).toHaveCount(0);
    await expect(dialog(page).locator('[data-setting-id="sign-in-method"]')).toContainText('Google');
  });
});

test.describe('Usage, Billing, Team, Appearance, Privacy', () => {
  test('Usage is simple: two credit meters with the reset date, six months of history, export — no model names or AI cost', async ({ page }) => {
    await mockWorkspace(page, { plan: SOLO });
    await page.goto('/listings#settings/usage');
    await expect(dialog(page).getByRole('progressbar', { name: 'Design credits used' })).toHaveAttribute('aria-valuenow', '42');
    await expect(dialog(page).locator('[data-setting-id="design-credits"]')).toContainText('42 of 50 used');
    await expect(dialog(page).locator('[data-setting-id="editable-credits"]')).toContainText('3 of 20 used');
    // The server counts per calendar month, so the reset is the 1st of next month (not the subscription renewal date).
    const next = await page.evaluate(() => { const now = new Date(); return new Date(now.getFullYear(), now.getMonth() + 1, 1).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }); });
    await expect(dialog(page).getByText(`Credits reset on ${next}.`)).toBeVisible();
    await expect(dialog(page).getByRole('status').filter({ hasText: 'You’ve used 42 of 50 design credits this month.' })).toBeVisible();
    await expect(dialog(page).getByRole('list', { name: 'Designs generated per month' }).getByRole('listitem')).toHaveCount(2);
    await expect(dialog(page).locator('.st-table')).toHaveCount(0);
    await expect(dialog(page)).not.toContainText(/ideogram|\$0\./i);
    const download = page.waitForEvent('download');
    await dialog(page).getByRole('button', { name: 'CSV' }).click();
    expect((await download).suggestedFilename()).toBe('buildographic-usage.csv');
  });

  test('Billing shows the plan, payment history and cancellation in the row layout', async ({ page }) => {
    await mockWorkspace(page, { plan: SOLO, payments: [{ id: 'pay-1', amount: 549900, currency: 'INR', status: 'CAPTURED', method: 'upi', externalPaymentId: 'pay_ABCDYqVEVYEtiDNz', createdAt: '2026-10-18T10:00:00.000Z' }] });
    await page.goto('/listings#settings/billing');
    await expect(dialog(page).getByTestId('text-plan-name')).toHaveText('Solo plan');
    await expect(dialog(page).getByTestId('badge-subscription-status')).toHaveText('Active');
    await expect(dialog(page).getByTestId('text-usage')).toHaveText('42 / 50');
    await expect(dialog(page).getByTestId('button-upgrade')).toHaveText('Change plan');
    const row = dialog(page).getByTestId('row-payment-pay-1');
    await expect(row.getByRole('cell')).toHaveText([/18 Oct 2026|Oct 18, 2026/, '₹5,499', 'UPI', 'Captured', 'YqVEVYEtiDNz']);
    await expect(dialog(page).getByRole('heading', { name: 'Need more?' })).toBeVisible();
    await dialog(page).getByTestId('button-cancel').click();
    await expect(page.getByRole('alertdialog')).toContainText('Cancel your Solo plan?');
    await page.getByTestId('button-cancel-dialog-cancel').click();
    await expect(page.getByRole('alertdialog')).toHaveCount(0);
    await expect(dialog(page)).toBeVisible();
  });

  test('Billing on Free: Upgrade plan, no cancellation, empty history', async ({ page }) => {
    await mockWorkspace(page);
    await page.goto('/listings#settings/billing');
    await expect(dialog(page).getByTestId('text-plan-name')).toHaveText('Free plan');
    await expect(dialog(page).getByTestId('text-amount')).toHaveText('Free');
    await expect(dialog(page).getByTestId('button-upgrade')).toHaveText('Upgrade plan');
    await expect(dialog(page).getByTestId('button-cancel')).toHaveCount(0);
    await expect(dialog(page).getByTestId('card-payment-history-empty')).toContainText('No payments yet');
  });

  test('Organization: seats, members (you can’t remove yourself), add by email, remove with confirmation', async ({ page }) => {
    await mockWorkspace(page, { plan: TEAM, team: { name: 'Harbour Realty', userLimit: 5, members: [{ id: 'user-ws', email: 'dana@account.test', name: 'Dana Account' }, { id: 'u2', email: 'sam@harbour.test', name: 'Sam Lee' }] } });
    await page.goto('/listings#settings/organization');
    await expect(dialog(page).getByText('Harbour Realty')).toBeVisible();
    await expect(dialog(page).getByRole('progressbar', { name: 'Seats used' })).toHaveAttribute('aria-valuenow', '2');
    const members = dialog(page).getByRole('list', { name: 'Members' });
    await expect(members.getByRole('listitem')).toHaveCount(2);
    await expect(members.getByRole('listitem').first()).toContainText('You');
    await expect(members.getByRole('button', { name: 'Remove Dana Account' })).toHaveCount(0);
    const input = dialog(page).getByRole('textbox', { name: 'Add member' });
    await input.fill('nobody@example.test');
    await dialog(page).getByRole('button', { name: 'Add', exact: true }).click();
    await expect(dialog(page).getByRole('alert')).toHaveText('No account found for that email.');
    await input.fill('lee@harbour.test');
    await dialog(page).getByRole('button', { name: 'Add', exact: true }).click();
    await expect(members.getByRole('listitem')).toHaveCount(3);
    await members.getByRole('button', { name: 'Remove Sam Lee' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Remove' }).click();
    await expect(members.getByRole('listitem')).toHaveCount(2);
    await expect(dialog(page)).not.toContainText('sam@harbour.test');
  });

  test('Organization on a one-seat plan explains the limit instead of offering Add', async ({ page }) => {
    await mockWorkspace(page, { plan: SOLO, team: { name: 'Dana’s Organization', userLimit: 1, members: [{ id: 'user-ws', email: 'dana@account.test', name: 'Dana Account' }] } });
    await page.goto('/listings#settings/organization');
    await expect(dialog(page).getByText('Your plan includes one seat. Team plans add up to 5.')).toBeVisible();
    await expect(dialog(page).getByRole('link', { name: 'Compare plans' })).toHaveAttribute('href', '/pricing');
    await expect(dialog(page).getByRole('textbox', { name: 'Add member' })).toHaveCount(0);
  });

  test('Appearance applies the theme immediately to the page and the dialog', async ({ page }) => {
    await mockWorkspace(page);
    await page.goto('/listings#settings/appearance');
    await dialog(page).getByText('Dark', { exact: true }).click();
    await expect(dialog(page).getByRole('radio', { name: 'Dark' })).toBeChecked();
    await expect(page.locator('.ws-root')).toHaveAttribute('data-theme', 'dark');
    await expect(dialog(page)).toHaveAttribute('data-theme', 'dark');
  });

  test('Privacy cross-links to the usage export and offers a deletion request', async ({ page }) => {
    await mockWorkspace(page, { plan: SOLO });
    await page.goto('/listings#settings/privacy');
    await expect(dialog(page).getByRole('link', { name: /Privacy policy|Open/ }).first()).toHaveAttribute('target', '_blank');
    await expect(dialog(page).getByRole('link', { name: /Email hello@buildographic.com/ })).toHaveAttribute('href', /^mailto:hello@buildographic\.com\?subject=/);
    await dialog(page).getByRole('button', { name: 'Open Usage' }).click();
    await expect(page).toHaveURL(/#settings\/usage\/export-usage$/);
    await expect(dialog(page).locator('[data-setting-id="export-usage"]')).toHaveAttribute('data-highlight', '');
  });
});

test.describe('account menu structure (spec §3)', () => {
  test('account menu keeps legal policies in Settings; Upgrade plan goes to pricing', async ({ page }) => {
    await mockWorkspace(page);
    await page.goto('/listings');
    await page.getByRole('button', { name: /Account menu/ }).click();
    await expect(page.getByRole('menu').getByRole('menuitem')).toHaveText([
      'Settings' + (process.platform === 'darwin' ? '⌘⇧,' : 'Ctrl+Shift+,'), 'Usage', 'Get help', 'Upgrade plan', 'Sign out',
    ]);
    await page.getByRole('menuitem', { name: 'Upgrade plan' }).click();
    await expect(page).toHaveURL(/\/pricing$/);
  });
});

test('phones: the dialog fills the screen and the tabs become a horizontal strip', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await mockWorkspace(page, { plan: SOLO });
  await page.goto('/listings#settings/account');
  const box = await dialog(page).boundingBox();
  expect(box).toMatchObject({ x: 0, y: 0, width: 390, height: 800 });
  const account = await tabs(page).getByRole('button', { name: 'Account' }).boundingBox();
  const billing = await tabs(page).getByRole('button', { name: 'Billing' }).boundingBox();
  expect(Math.round(account!.y)).toBe(Math.round(billing!.y));
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  // Nothing inside the sheet is wider than the screen (the tab strip scrolls on its own).
  expect(await dialog(page).evaluate(el => [...el.querySelectorAll('.st-pane, .st-search, .st-banner, .st-row')].every(node => node.getBoundingClientRect().right <= window.innerWidth + 0.5))).toBe(true);
});
