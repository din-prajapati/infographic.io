import { test, expect, type Page } from '@playwright/test';
import { cuid, mockWorkspace, property, type WorkspaceState } from '../fixtures/workspace-api';

/**
 * V3 property handoff (rev-2 spec §9): /editor?[templateId|width&height]&propertyId=<id>.
 * The editor settles its session first, then stages the property as the Listing panel's pending source; artwork
 * changes only on Apply to design. A saved design (designId) restores its own snapshot and ignores propertyId.
 */
const saved = property(21, r => { r.property.address = '21 Handoff Road, Pune'; r.property.headline = 'Handoff headline'; });
const listingPanel = (page: Page) => page.getByRole('complementary', { name: 'Listing panel' });

async function withDesigns(page: Page, state: WorkspaceState) {
  const documents: Record<string, any> = {};
  let created = 0;
  const heading = { id: 'template-heading', type: 'text', name: 'Heading', content: 'City template content', x: 40, y: 40, width: 400, height: 60, rotation: 0, opacity: 1, locked: false, visible: true, zIndex: 1, fontFamily: 'Arial', fontSize: 28, fontWeight: 700, bold: true, italic: false, underline: false, strikethrough: false, color: '#111111', align: 'left', lineHeight: 1.2, textTransform: 'none', listStyle: 'none' };
  await page.route('**/api/v1/canvas-templates/template-city', route => route.fulfill({ json: { id: 'template-city', name: 'City listing', type: 'template', category: 'real-estate', tags: [], thumbnail: '', canvasData: { elements: [heading], canvasWidth: 640, canvasHeight: 480, backgroundColor: '#ffffff' } } }));
  await page.route(/\/api\/v1\/designs(?:\/[^/?]+)?(?:\?.*)?$/, async route => {
    const request = route.request(), id = new URL(request.url()).pathname.split('/').at(-1)!;
    state.requests.push({ method: request.method(), path: new URL(request.url()).pathname, search: '' });
    if (request.method() === 'GET') return documents[id] ? route.fulfill({ json: documents[id] }) : route.fulfill({ status: 404, json: { message: 'Not found' } });
    const body = request.postDataJSON();
    const target = request.method() === 'POST' ? cuid(800 + ++created) : id;
    documents[target] = { ...body, id: target, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    return route.fulfill({ json: documents[target] });
  });
  return documents;
}

test('a blank size + propertyId stages the property without touching the artwork', async ({ page }) => {
  const state = await mockWorkspace(page, { properties: [saved] });
  await page.goto(`/editor?editor=v3&width=1080&height=1080&propertyId=${saved.id}`);
  await expect(listingPanel(page)).toBeVisible();
  await expect(listingPanel(page)).toContainText('21 Handoff Road, Pune');
  await expect(page.getByRole('status').filter({ hasText: 'Property loaded in the Listing panel' })).toBeVisible();
  await expect(page.getByTestId('design-canvas').getByText('21 Handoff Road, Pune', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Back to listing' })).toHaveAttribute('href', `/listings/${saved.id}`);
  expect(state.requests.filter(r => r.path === `/properties/${saved.id}`)).toHaveLength(1);
});

test('template + propertyId opens a new Design first, then stages the property as pending', async ({ page }) => {
  const state = await mockWorkspace(page, { properties: [saved] });
  const documents = await withDesigns(page, state);
  await page.goto(`/editor?editor=v3&templateId=template-city&propertyId=${saved.id}`);
  await expect(page).toHaveURL(new RegExp(`designId=${cuid(801)}$`));
  await expect(listingPanel(page)).toContainText('21 Handoff Road, Pune');
  // Created from the template with no listing applied: the property is pending until Apply to design.
  expect(documents[cuid(801)].canvasData.v3Listing?.appliedListingId).toBeUndefined();
  await expect(listingPanel(page).getByRole('button', { name: 'Apply to design', exact: true })).toBeEnabled();
});

test('designId wins: a saved design keeps its own listing and propertyId is never fetched', async ({ page }) => {
  const state = await mockWorkspace(page, { properties: [saved] });
  const documents = await withDesigns(page, state);
  documents[cuid(810)] = { id: cuid(810), name: 'Saved design', type: 'design', thumbnail: '', tags: [], canvasData: { elements: [], canvasWidth: 800, canvasHeight: 600, backgroundColor: '#ffffff' } };
  await page.goto(`/editor?editor=v3&designId=${cuid(810)}&propertyId=${saved.id}`);
  await expect(page.getByRole('textbox', { name: 'Design title', exact: true })).toHaveValue('Saved design');
  expect(state.requests.filter(r => r.path === `/properties/${saved.id}`)).toHaveLength(0);
  await expect(page.getByRole('link', { name: 'Projects', exact: true })).toHaveAttribute('href', '/my-designs');
});

test('an unknown property shows an error and leaves the canvas empty', async ({ page }) => {
  await mockWorkspace(page);
  await page.goto(`/editor?editor=v3&width=1080&height=1080&propertyId=${cuid(999)}`);
  await expect(page.getByRole('alert').filter({ hasText: 'This property could not be opened' })).toBeVisible();
});

test('plain /editor links with propertyId open V3 and keep the handoff', async ({ page }) => {
  await mockWorkspace(page, { properties: [saved] });
  await page.goto(`/editor?width=1080&height=1080&propertyId=${saved.id}`);
  await expect(page).toHaveURL(new RegExp(`/editor\\?width=1080&height=1080&propertyId=${saved.id}$`));
  await expect(listingPanel(page)).toContainText('21 Handoff Road, Pune');
});
