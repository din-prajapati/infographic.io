/** Approved-shell contracts: real UI/store/render/export; only HTTP/auth mocked. */
import { test, expect, type Page } from '@playwright/test';

const id = 'c123456789012345678901234';
const base = { id: 'headline', name: 'Headline', type: 'text', x: 80, y: 120, width: 200, height: 40, rotation: 0, opacity: 1, locked: false, visible: true, zIndex: 1, content: 'Approved listing', fontFamily: 'Arial', fontSize: 24, fontWeight: 400, bold: false, italic: false, underline: false, strikethrough: false, color: '#111111', align: 'left', lineHeight: 1.2, textTransform: 'none', listStyle: 'none' };
async function setup(page: Page, theme = 'light', withTemplate = false) {
  await page.addInitScript(theme => {
    localStorage.setItem('auth_token', 'shell-test-only');
    localStorage.setItem('auth_user', JSON.stringify({ id: 'shell-test-user', name: 'Agent', email: 'agent@example.test', plan: 'SOLO' }));
    localStorage.setItem('theme', theme);
  }, theme);
  const state = { writes: [] as any[], writePaths: [] as string[], rejectSave: false, documents: {} as Record<string, any>, properties: [] as any[], profile: { version: 0, record: { agent: { name: '', phone: '', email: '', agency: '', license: '', photo: '' }, brand: { name: '', logo: '', tagline: '', accent: '' } } }, document: { id, name: 'Approved design', type: 'design', category: 'real-estate', tags: [], canvasData: { elements: [base], canvasWidth: 640, canvasHeight: 480, backgroundColor: '#ffffff' } } };
  const template = { ...state.document, id: 'template-city', name: 'City listing', thumbnail: '', canvasData: { ...state.document.canvasData, elements: [{ ...base, id: 'template-heading', content: 'City template content' }] } };
  await page.route('**/api/**', async route => {
    const request = route.request(); const pathname = new URL(request.url()).pathname;
    if (pathname.endsWith('/canvas-templates/template-city')) return route.fulfill({ json: template });
    if (pathname.endsWith('/canvas-templates')) return route.fulfill({ json: withTemplate ? [template] : [] });
    if (pathname.endsWith('/listing-profiles')) {
      if (request.method() === 'GET') return route.fulfill({ json: state.profile });
      state.profile = { version: state.profile.version + 1, record: request.postDataJSON().record };
      return route.fulfill({ json: state.profile });
    }
    if (pathname.endsWith('/properties')) {
      if (request.method() === 'GET') return route.fulfill({ json: state.properties });
      const value = { id: 'c' + '5'.repeat(24), version: 1, record: request.postDataJSON().record, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      state.properties.push(value); return route.fulfill({ status: 201, json: value });
    }
    if (/\/designs(?:\/[^/]+)?$/.test(pathname)) {
      const target = pathname.split('/').at(-1)!;
      if (request.method() === 'GET') return route.fulfill({ json: state.documents[target] ?? state.document });
      if (['POST', 'PUT'].includes(request.method())) {
        const body = request.postDataJSON(); state.writes.push(body); state.writePaths.push(`${request.method()} ${pathname}`);
        if (state.rejectSave) return route.fulfill({ status: 503, json: { message: 'Save temporarily unavailable' } });
        const saved = { ...(request.method() === 'POST' ? {} : state.document), ...body, id: request.method() === 'POST' ? 'c' + String(state.writes.length).padStart(24, '7') : id };
        state.documents[saved.id] = saved; if (saved.id === id) state.document = saved;
        return route.fulfill({ json: saved });
      }
    }
    return route.fulfill({ json: [] });
  });
  await page.goto(`/editor?editor=v3&designId=${id}`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('design-canvas').getByText('Approved listing', { exact: true })).toBeVisible();
  return state;
}

test('cancelled unsaved template navigation creates no separate Design', async ({ page }) => {
  const state = await setup(page, 'light', true);
  await page.getByRole('textbox', { name: 'Design title', exact: true }).fill('Keep this unsaved title');
  await page.getByRole('button', { name: /City listing/ }).click();
  const dialog = page.getByRole('alertdialog');
  await expect(dialog).toContainText('Create a separate Design?');
  await expect(dialog).toContainText('current saved Design stays unchanged');
  page.once('dialog', prompt => prompt.dismiss());
  await dialog.getByRole('button', { name: 'Create Design', exact: true }).click();
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`designId=${id}$`));
  await expect(page.getByRole('textbox', { name: 'Design title', exact: true })).toHaveValue('Keep this unsaved title');
  await expect(page.getByTestId('design-canvas').getByText('Approved listing', { exact: true })).toBeVisible();
  expect(state.writePaths.filter(path => path.startsWith('POST '))).toEqual([]);
  expect(await page.evaluate(() => localStorage.getItem('v3-recent-templates:shell-test-user'))).toBeNull();
});

test('edits made while a template Design is being created retain the current guarded document', async ({ page }) => {
  const state = await setup(page, 'light', true);
  let release!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  let started = false;
  await page.route('**/api/v1/designs', async route => {
    if (route.request().method() !== 'POST') return route.fallback();
    started = true; await held; return route.fallback();
  });
  await page.getByRole('button', { name: /City listing/ }).click();
  await page.getByRole('button', { name: 'Create Design', exact: true }).click();
  await expect.poll(() => started).toBe(true);
  // The dialog intentionally blocks pointer interactions; a keyboard shortcut or
  // asynchronous editor mutation can still create a newer document revision.
  await page.evaluate(() => {
    const input = document.querySelector<HTMLInputElement>('input[aria-label="Design title"]')!;
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, 'Newer title stays here');
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  release();
  await expect.poll(() => state.writePaths.filter(path => path.startsWith('POST ')).length).toBe(1);
  await expect(page.getByText(/Your newer edits remain open/)).toBeVisible();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`designId=${id}$`));
  await expect(page.getByRole('textbox', { name: 'Design title', exact: true })).toHaveValue('Newer title stays here');
  let prompted = false;
  page.once('dialog', async prompt => { prompted = true; await prompt.dismiss(); });
  await page.evaluate(() => history.pushState(null, '', '/my-designs'));
  expect(prompted).toBe(true);
  await expect(page).toHaveURL(new RegExp(`designId=${id}$`));
});

test('a template creation response cannot redirect after leaving the Editor', async ({ page }) => {
  const state = await setup(page, 'light', true);
  let release!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  let started = false;
  await page.route('**/api/v1/designs', async route => {
    if (route.request().method() !== 'POST') return route.fallback();
    started = true; await held; return route.fallback();
  });
  await page.getByRole('button', { name: /City listing/ }).click();
  await page.getByRole('button', { name: 'Create Design', exact: true }).click();
  await expect.poll(() => started).toBe(true);
  await page.evaluate(() => history.pushState(null, '', '/my-designs'));
  await expect(page).toHaveURL(/\/my-designs$/);
  release();
  await expect.poll(() => state.writePaths.filter(path => path.startsWith('POST ')).length).toBe(1);
  await expect(page).toHaveURL(/\/my-designs$/);
  await expect(page.getByRole('heading', { name: 'V3 Editor', exact: true })).toHaveCount(0);
});

test('listing-only edits during a deferred template deep link cancel automatic creation', async ({ page }) => {
  const state = await setup(page, 'light', true);
  let release!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  let started = false;
  await page.route('**/api/v1/canvas-templates/template-city', async route => {
    started = true; await held; return route.fallback();
  });
  await page.goto('/editor?editor=v3&templateId=template-city', { waitUntil: 'domcontentloaded' });
  await expect.poll(() => started).toBe(true);
  await page.getByRole('button', { name: 'Listing', exact: true }).click();
  await page.getByRole('button', { name: 'Enter manually', exact: true }).click();
  await page.getByRole('textbox', { name: 'Address', exact: true }).fill('Preserve this pending address');
  await page.getByRole('button', { name: 'Save property', exact: true }).click();
  await expect(page.getByRole('button', { name: /^Property information/ })).toContainText('Preserve this pending address');
  release();
  await expect(page.getByText('Template opening cancelled because this Design changed. Your edits remain open.', { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/templateId=template-city$/);
  await expect(page.getByTestId('design-canvas').locator('[data-element-id]')).toHaveCount(0);
  expect(state.writePaths.filter(path => path.startsWith('POST '))).toEqual([]);
  await page.getByRole('button', { name: 'Save as Design', exact: true }).click();
  await expect.poll(() => state.writes.length).toBe(1);
  expect(state.writes[0].canvasData.v3Listing.pending.property.address).toBe('Preserve this pending address');
});

// Contract: approved seven rail entries, direct creation tools and three available
// line drawing choices at their named toolbars after opening Tools/Line.
test('approved rail, direct tools and three line choices', async ({ page }) => {
  await setup(page);
  for (const name of ['Templates', 'Tools', 'Elements', 'Text', 'Uploads', 'Brand', 'Listing', 'Details']) await expect(page.getByRole('button', { name, exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Tools', exact: true }).click();
  const strip = page.getByRole('toolbar', { name: 'Canvas tools', exact: true });
  for (const name of ['Select', 'Hand', 'Line', 'Shapes', 'Add text', 'Add image']) await expect(strip.getByRole('button', { name, exact: true })).toBeVisible();
  await strip.getByRole('button', { name: 'Line', exact: true }).click();
  for (const name of ['Straight line', 'Curved line', 'Elbow line']) await expect(page.getByRole('button', { name, exact: true })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Undo', exact: true })).toHaveCount(1);
});

// Contract: template replacement needs explicit confirmation and successful
// application alone moves its ID to the signed-in user's Recently used group.
test('template search confirms replacement and records account scoped recents', async ({ page }) => {
  const state = await setup(page, 'light', true);
  await page.getByRole('searchbox', { name: 'Search templates', exact: true }).fill('City');
  await page.getByRole('button', { name: /City listing/ }).click();
  await expect(page.getByRole('alertdialog')).toBeVisible();
  await expect(page.getByTestId('design-canvas').getByText('Approved listing', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Create Design', exact: true }).click();
  await expect(page).not.toHaveURL(new RegExp(`designId=${id}$`));
  await expect(page.getByTestId('design-canvas').getByText('City template content', { exact: true })).toBeVisible();
  expect(state.document.canvasData.elements[0].content).toBe('Approved listing');
  await expect(page.getByRole('region', { name: 'Recently used', exact: true }).getByRole('button', { name: /City listing/ })).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('v3-recent-templates:shell-test-user') ?? '[]'))).toEqual(['template-city']);
});

// Contract: selected geometry is design pixels regardless of actual zoom.
test('coordinates remain document based at every zoom preset', async ({ page }) => {
  await setup(page);
  await page.getByTestId('design-canvas').getByText('Approved listing', { exact: true }).click();
  await expect(page.getByText('200 × 40 px · x 80, y 120', { exact: true })).toBeVisible();
  for (const percent of [50, 100, 200]) {
    await page.getByRole('button', { name: 'Zoom level', exact: true }).click();
    await page.getByRole('button', { name: `Zoom to ${percent}%`, exact: true }).click();
    await expect(page.getByText('200 × 40 px · x 80, y 120', { exact: true })).toBeVisible();
    await expect(page.getByTestId('design-canvas')).toHaveCSS('transform', `matrix(${percent / 100}, 0, 0, ${percent / 100}, 0, 0)`);
  }
});

// Contract: a real shape can be created, duplicated and deleted through the
// universal selected actions, and one undo restores the last deletion.
test('shape creation and universal selection actions mutate the canvas', async ({ page }) => {
  await setup(page);
  await page.getByRole('button', { name: 'Tools', exact: true }).click();
  await page.getByRole('button', { name: 'Shapes', exact: true }).click();
  await page.getByRole('button', { name: 'Star', exact: true }).click();
  const elements = page.getByTestId('design-canvas').locator('[data-element-id]');
  await expect(elements).toHaveCount(2);
  await page.getByRole('toolbar', { name: 'Canvas tools', exact: true }).getByRole('button', { name: 'Duplicate', exact: true }).click();
  await expect(elements).toHaveCount(3);
  await page.getByRole('toolbar', { name: 'Canvas tools', exact: true }).getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(elements).toHaveCount(2);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(elements).toHaveCount(3);
});

// Contract: one blur commits the complete draft, then the guarded existing
// design autosaves that text under the same canonical ID without pressing Save.
test('text blur commits once and autosave acknowledges the same design', async ({ page }) => {
  const state = await setup(page);
  await page.getByRole('button', { name: 'Text', exact: true }).click();
  await page.getByTestId('design-canvas').getByText('Approved listing', { exact: true }).click();
  await page.getByRole('textbox', { name: 'Text content', exact: true }).fill('Autosaved listing');
  await page.getByRole('textbox', { name: 'Text content', exact: true }).press('Tab');
  await expect(page.getByTestId('design-canvas').getByText('Autosaved listing', { exact: true })).toBeVisible();
  await expect.poll(() => state.writes.length).toBe(1);
  expect(state.writes[0].canvasData.elements[0].content).toBe('Autosaved listing');
  expect(state.writePaths).toEqual([`PUT /api/v1/designs/${id}`]);
  await page.getByRole('button', { name: 'Save status', exact: true }).click();
  await expect(page.getByText('Changes saved', { exact: true })).toBeVisible();
});

for (const theme of ['light', 'dark']) test(`${theme} approved shell and artwork`, async ({ page }, info) => {
  await page.setViewportSize({ width: 1191, height: 668 });
  await setup(page, theme);
  await expect(page.getByTestId('design-canvas')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await page.getByTestId('design-canvas').getByText('Approved listing', { exact: true }).click();
  await page.getByRole('button', { name: 'Tools', exact: true }).click();
  await page.getByRole('button', { name: 'Shapes', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Triangle', exact: true })).toBeVisible();
  await page.screenshot({ path: info.outputPath(`approved-${theme}.png`), fullPage: true });
});

// Contract: listing-only form changes enter the saved document; Layers and
// Assistant remain reachable from their approved canvas-level positions.
test('listing panels persist their fields and canvas panels open', async ({ page }) => {
  const state = await setup(page);
  const exceptions: string[] = []; page.on('pageerror', error => exceptions.push(error.message));
  await page.getByRole('button', { name: 'Listing', exact: true }).click();
  await page.getByRole('button', { name: 'Enter manually', exact: true }).click();
  await page.getByRole('textbox', { name: 'Address', exact: true }).fill('7 Garden Road');
  await page.getByRole('textbox', { name: 'Marketing headline', exact: true }).fill('Garden residence');
  await page.getByRole('button', { name: 'Save property', exact: true }).click();
  await page.getByRole('button', { name: /^Agent / }).click();
  await page.getByRole('textbox', { name: 'Full name', exact: true }).fill('Morgan Agent');
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await page.getByRole('button', { name: 'Listing', exact: true }).click();
  await expect(page.getByRole('button', { name: /^Agent Morgan Agent/ })).toBeVisible();
  await page.getByRole('button', { name: 'Save as Design', exact: true }).click();
  await expect(page.getByText('Saved', { exact: true })).toBeVisible();
  expect(state.writes.at(-1).canvasData.v3Listing.pending.property.headline).toBe('Garden residence');
  expect(state.writes.at(-1).canvasData.v3Listing.pending.agent.name).toBe('Morgan Agent');
  await page.getByRole('button', { name: 'Layers', exact: true }).click();
  await expect(page.getByRole('complementary', { name: 'Layers panel', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'AI Assistant', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Close Assistant', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Close Assistant', exact: true }).click();
  expect(exceptions).toEqual([]);
});
