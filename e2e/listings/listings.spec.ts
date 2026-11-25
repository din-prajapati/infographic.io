import { test, expect, type Page } from '@playwright/test';
import { CDN, cuid, mockWorkspace, property, uploadFile } from '../fixtures/workspace-api';

/**
 * Listings module (rev-2 spec §5, §7, §9): library search + pagination, New property (paste review and manual),
 * detail editing with optimistic versions, photos, marketing assets and the Create design handoff.
 * Mocked: Vite only, /api answered by e2e/fixtures/workspace-api.ts.
 */
const cards = (page: Page) => page.getByTestId('property-card');

test.describe('library', () => {
  test('cards show photo state, status, name, address, formatted price and photo count', async ({ page }) => {
    const withPhoto = property(2, r => { r.photos = [{ id: 'a', name: 'Front', src: `${CDN}/front.png` }, { id: 'b', name: 'Hall', src: `${CDN}/hall.png` }]; });
    await mockWorkspace(page, { properties: [property(1), withPhoto], designs: { [withPhoto.id]: [{ id: cuid(500), name: 'Story', thumbnail: null, createdAt: withPhoto.updatedAt, updatedAt: withPhoto.updatedAt }] } });
    await page.goto('/listings');
    await expect(cards(page)).toHaveCount(2);
    const first = cards(page).first();
    await expect(first).toContainText('Lakeview 2');
    await expect(first).toContainText('2 Lake Road, Mumbai');
    await expect(first).toContainText('₹80 Lakh');
    await expect(first).toContainText('For sale');
    await expect(first).toContainText('2 photos');
    await expect(first).toContainText('1 design');
    await expect(cards(page).nth(1).getByRole('img', { name: 'No property photos' })).toBeVisible();
  });

  test('search is debounced, kept in the URL, and offers Clear search when nothing matches', async ({ page }) => {
    const state = await mockWorkspace(page, { properties: [property(1), property(2, r => { r.property.name = 'Palm Villa'; })] });
    await page.goto('/listings');
    await page.getByRole('searchbox', { name: /Search properties/ }).fill('palm');
    await expect(page).toHaveURL(/\/listings\?q=palm$/);
    await expect(cards(page)).toHaveCount(1);
    expect(state.requests.filter(r => r.path === '/properties/library' && r.search.includes('search=p') && !r.search.includes('search=palm'))).toHaveLength(0);
    await page.reload();
    await expect(page.getByRole('searchbox', { name: /Search properties/ })).toHaveValue('palm');
    await page.getByRole('searchbox', { name: /Search properties/ }).fill('nothing-here');
    await expect(page.getByRole('heading', { name: /No properties match/ })).toBeVisible();
    await page.getByRole('button', { name: 'Clear search' }).last().click();
    await expect(page).toHaveURL(/\/listings$/);
    await expect(cards(page)).toHaveCount(2);
  });

  test('pagination reaches records beyond the old 50-row limit', async ({ page }) => {
    await mockWorkspace(page, { properties: Array.from({ length: 60 }, (_, i) => property(i + 1)) });
    await page.goto('/listings');
    await expect(cards(page)).toHaveCount(24);
    await page.getByRole('button', { name: 'Load more properties' }).click();
    await expect(cards(page)).toHaveCount(48);
    await page.getByRole('button', { name: 'Load more properties' }).click();
    await expect(cards(page)).toHaveCount(60);
    await expect(page.getByRole('button', { name: 'Load more properties' })).toHaveCount(0);
    await expect(cards(page).last()).toContainText('Lakeview 1');
  });

  test('empty library offers New property; a failed load offers Retry', async ({ page }) => {
    const state = await mockWorkspace(page);
    state.failLibrary = 100; // outlasts React Query's automatic retry
    await page.goto('/listings');
    await expect(page.getByRole('alert')).toContainText('could not be loaded');
    state.failLibrary = 0;
    await page.getByRole('button', { name: 'Retry' }).click();
    await expect(page.getByRole('heading', { name: 'No properties yet' })).toBeVisible();
    await page.getByRole('main').getByRole('link', { name: 'New property' }).last().click();
    await expect(page).toHaveURL(/\/listings\/new$/);
  });

  test('returning from a property keeps the search', async ({ page }) => {
    await mockWorkspace(page, { properties: [property(1), property(2, r => { r.property.name = 'Palm Villa'; })] });
    await page.goto('/listings?q=palm');
    await cards(page).first().click();
    await page.getByRole('link', { name: 'All listings' }).click();
    await expect(page).toHaveURL(/\/listings$/);
    await page.goBack(); await page.goBack();
    await expect(page).toHaveURL(/\/listings\?q=palm$/);
    await expect(cards(page)).toHaveCount(1);
  });
});

test.describe('new property', () => {
  test('paste text: example, review with evidence, agent details as unselected suggestions, then explicit create', async ({ page }) => {
    const state = await mockWorkspace(page, { profile: { version: 3, record: { agent: { name: 'Saved Profile Agent', phone: '+91 90000 00000', email: 'saved@agency.test', agency: 'Saved Realty', license: '', photo: '' }, brand: { name: 'Saved Brand', logo: '', tagline: '', accent: '#087E78' } } } });
    await page.goto('/listings/new');
    await page.getByRole('button', { name: 'Use example' }).click();
    await expect(page.getByRole('status')).toContainText('Example message');
    expect(state.requests.filter(r => r.method === 'POST')).toHaveLength(0);
    await page.getByRole('button', { name: 'Extract & review' }).click();
    const address = page.getByRole('checkbox', { name: /Address/ });
    await expect(address).toBeChecked();
    await expect(page.getByText('Found in: “Address: 14 Lake View Road, Powai, Mumbai”')).toBeVisible();
    await expect(page.getByRole('checkbox', { name: /Agent name/ })).not.toBeChecked();
    await page.getByRole('button', { name: /Copy \d+ facts to the form/ }).click();
    await expect(page.getByLabel('Address')).toHaveValue('14 Lake View Road, Powai, Mumbai');
    await expect(page.getByLabel('Amount')).toHaveValue('12000000');
    await expect(page.getByLabel('Listing name')).toHaveValue('Sunrise Residency');
    await page.getByRole('button', { name: 'Create property' }).click();
    await expect(page).toHaveURL(/\/listings\/c0+9\d\d$/);
    const created = state.requests.find(r => r.method === 'POST' && r.path === '/properties')!.body.record;
    expect(created.property.address).toBe('14 Lake View Road, Powai, Mumbai');
    // Agent comes from the saved profile; the pasted agent stayed a suggestion and the profile was not rewritten.
    expect(created.agent.name).toBe('Saved Profile Agent');
    expect(state.requests.filter(r => r.path === '/listing-profiles' && r.method === 'PUT')).toHaveLength(0);
    await expect(page.getByRole('heading', { level: 1, name: 'Sunrise Residency' })).toBeVisible();
  });

  test('manual entry validates inline, counts characters, and Cancel discards', async ({ page }) => {
    const state = await mockWorkspace(page);
    await page.goto('/listings/new');
    await page.getByRole('button', { name: 'Enter manually' }).click();
    await page.getByLabel('Marketing headline').fill('A'.repeat(110));
    await expect(page.getByText('110/105')).toBeVisible();
    await expect(page.getByText(/Longer than the recommended 105 characters/)).toBeVisible();
    await page.getByLabel('Bedrooms').fill('three');
    await page.getByRole('button', { name: 'Create property' }).click();
    await expect(page.getByText('enter a non-negative number')).toBeVisible();
    expect(state.requests.filter(r => r.method === 'POST')).toHaveLength(0);
    await page.getByRole('link', { name: 'Cancel' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Discard' }).click();
    await expect(page).toHaveURL(/\/listings$/);
  });
});

test.describe('listing detail', () => {
  test('summary cards, edit with expected version, and Cancel restores', async ({ page }) => {
    const saved = property(7, r => { r.agent = { ...r.agent, name: 'Listing Agent', agency: 'Listing Agency' }; r.brand = { ...r.brand, name: 'Listing Brand', accent: '#123456' }; });
    const state = await mockWorkspace(page, { properties: [saved] });
    await page.goto(`/listings/${saved.id}`);
    await expect(page.getByRole('heading', { level: 1, name: 'Lakeview 7' })).toBeVisible();
    await expect(page.getByText('₹80 Lakh')).toBeVisible();
    await expect(page.getByText('Listing Agent', { exact: true })).toBeVisible();
    await expect(page.getByText('Listing Brand')).toBeVisible();
    await page.getByRole('button', { name: 'Edit property' }).click();
    await expect(page.getByRole('tab', { name: 'Property details' })).toHaveAttribute('aria-selected', 'true');
    await page.getByLabel('Marketing headline').fill('Fresh headline');
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByLabel('Marketing headline')).toHaveValue('');
    await page.getByLabel('Marketing headline').fill('Fresh headline');
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Property saved' })).toBeVisible();
    const put = state.requests.find(r => r.method === 'PUT')!;
    expect(put.body.expectedVersion).toBe(1);
    expect(put.body.record.property.headline).toBe('Fresh headline');
    expect(state.properties[0].version).toBe(2);
  });

  test('a version conflict never overwrites: Keep editing keeps the draft, Reload latest replaces it', async ({ page }) => {
    const saved = property(8);
    const state = await mockWorkspace(page, { properties: [saved] });
    await page.goto(`/listings/${saved.id}`);
    await page.getByRole('tab', { name: 'Property details' }).click();
    await page.getByLabel('Marketing headline').fill('My edit');
    state.bump(saved.id);
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'Someone saved this property' })).toBeVisible();
    expect(state.properties[0].record.property.headline).toBe('');
    await page.getByRole('button', { name: 'Keep editing' }).click();
    await expect(page.getByLabel('Marketing headline')).toHaveValue('My edit');
    await page.getByRole('button', { name: 'Save changes' }).click();
    await page.getByRole('button', { name: 'Reload latest' }).click();
    await expect(page.getByLabel('Marketing headline')).toHaveValue('');
    expect(state.requests.filter(r => r.method === 'PUT')).toHaveLength(2);
  });

  test('photos: upload, reject a non-image, reorder, remove, then save in gallery order', async ({ page }) => {
    const saved = property(9, r => { r.photos = [{ id: 'p1', name: 'One', src: `${CDN}/one.png` }, { id: 'p2', name: 'Two', src: `${CDN}/two.png` }]; });
    const state = await mockWorkspace(page, { properties: [saved] });
    await page.goto(`/listings/${saved.id}`);
    await page.getByRole('tab', { name: /Photos/ }).click();
    await page.getByLabel('Add property photos').setInputFiles([uploadFile('front.png')]);
    await expect(page.getByRole('img', { name: 'front.png' })).toBeVisible();
    await page.getByLabel('Add property photos').setInputFiles([{ name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('hello') }]);
    await expect(page.getByText(/notes\.txt.*Choose a JPEG, PNG, WebP, GIF or AVIF image/)).toBeVisible();
    await page.getByRole('button', { name: 'Move photo 1 down' }).click();
    await page.getByRole('button', { name: 'Remove photo 3' }).click();
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Property saved' })).toBeVisible();
    expect(state.properties[0].record.photos.map(p => p.name)).toEqual(['Two', 'One']);
    expect(state.uploads).toBe(0); // Removed local preview never uploads.
  });

  test('photo limit: Add photos is disabled at eight', async ({ page }) => {
    const saved = property(10, r => { r.photos = Array.from({ length: 8 }, (_, i) => ({ id: `p${i}`, name: `P${i}`, src: `${CDN}/p${i}.png` })); });
    await mockWorkspace(page, { properties: [saved] });
    await page.goto(`/listings/${saved.id}`);
    await page.getByRole('tab', { name: /Photos/ }).click();
    await expect(page.getByText('8 of 8 photos')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add photos' })).toBeDisabled();
  });

  test('marketing assets list linked designs and open them in V3; empty state offers Create design', async ({ page }) => {
    const linked = property(11), empty = property(12);
    await mockWorkspace(page, { properties: [linked, empty], designs: { [linked.id]: [{ id: cuid(700), name: 'Open house story', thumbnail: `${CDN}/thumb.png`, createdAt: linked.updatedAt, updatedAt: '2026-11-15T10:00:00.000Z' }] } });
    await page.goto(`/listings/${linked.id}`);
    const card = page.getByTestId('property-design');
    await expect(card).toContainText('Open house story');
    await expect(card.getByRole('link', { name: 'Open in editor' })).toHaveAttribute('href', `/editor?designId=${cuid(700)}`);
    await page.goto(`/listings/${empty.id}`);
    await expect(page.getByRole('heading', { name: 'No designs yet' })).toBeVisible();
  });

  for (const section of ['agent', 'brand'] as const) {
    test(`Use saved ${section} changes only that draft section; Cancel restores and Save persists`, async ({ page }) => {
      const saved = property(13, record => { record.brand.name = 'Listing Brand'; });
      const state = await mockWorkspace(page, { properties: [saved], profile: { version: 2, record: { agent: { name: 'New Profile Agent', phone: '', email: '', agency: 'New Agency', license: '', photo: '' }, brand: { name: 'New Brand', logo: '', tagline: '', accent: '' } } } });
      const before = structuredClone(saved.record);
      await page.goto(`/listings/${saved.id}`);
      const action = page.getByRole('button', { name: section === 'agent' ? 'Use saved profile' : 'Use saved brand', exact: true });
      await action.click();
      expect(state.properties[0].record).toEqual(before);
      await expect(page.getByRole('region', { name: section === 'agent' ? 'Agent on this listing' : 'Brand on this listing' })).toContainText(section === 'agent' ? 'New Profile Agent' : 'New Brand');
      await expect(action).toHaveCount(0);
      await page.getByRole('button', { name: 'Cancel', exact: true }).click();
      await expect(action).toBeVisible();
      expect(state.properties[0].record).toEqual(before);
      await action.click();
      await page.getByRole('button', { name: 'Save changes' }).click();
      await expect(page.getByRole('status').filter({ hasText: 'Property saved' })).toBeVisible();
      expect(state.properties[0].record[section]).toEqual(state.profile.record[section]);
      const other = section === 'agent' ? 'brand' : 'agent';
      expect(state.properties[0].record[other]).toEqual(before[other]);
      expect(state.properties[0].record.property).toEqual(before.property);
      expect(state.profile.record.agent.name).toBe('New Profile Agent');
      await page.reload();
      await expect(action).toHaveCount(0);
      await expect(page.getByRole('region', { name: section === 'agent' ? 'Agent on this listing' : 'Brand on this listing' })).toContainText(section === 'agent' ? 'New Profile Agent' : 'New Brand');
    });
  }

  test('Create design opens the format picker and hands the property to V3', async ({ page }) => {
    const saved = property(14);
    await mockWorkspace(page, { properties: [saved] });
    await page.goto(`/listings/${saved.id}`);
    await page.getByRole('button', { name: 'Create design' }).first().click();
    const picker = page.getByRole('dialog');
    await expect(picker).toBeVisible();
    await picker.getByRole('button', { name: 'Just Listed', exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/editor\\?(width=\\d+&height=\\d+|templateId=[^&]+)&propertyId=${saved.id}$`));
  });

  test('an unknown or foreign property shows Not found', async ({ page }) => {
    await mockWorkspace(page);
    await page.goto(`/listings/${cuid(404)}`);
    await expect(page.getByRole('heading', { name: 'Property not found' })).toBeVisible();
  });
});


test('marketing-assets count shows the full total before more designs load', async ({ page }) => {
  const saved = property(90);
  const designs = Array.from({ length: 53 }, (_, i) => ({ id: cuid(1000 + i), name: `Design ${i + 1}`, thumbnail: null, createdAt: saved.createdAt, updatedAt: saved.updatedAt }));
  await mockWorkspace(page, { properties: [saved], designs: { [saved.id]: designs } });
  await page.goto(`/listings/${saved.id}`);
  await expect(page.getByRole('tab', { name: /Marketing assets/ })).toHaveText('Marketing assets53');
  await expect(page.getByTestId('property-design')).toHaveCount(24);
  await page.getByRole('button', { name: 'Load more designs' }).click();
  await expect(page.getByTestId('property-design')).toHaveCount(48);
  await expect(page.getByRole('tab', { name: /Marketing assets/ })).toHaveText('Marketing assets53');
});

test('photo Cancel never uploads; Save persists only retained photos', async ({ page }) => {
  const saved = property(91);
  const state = await mockWorkspace(page, { properties: [saved] });
  await page.goto(`/listings/${saved.id}`);
  await page.getByRole('tab', { name: /Photos/ }).click();
  await page.getByLabel('Add property photos').setInputFiles(uploadFile('cancel.png'));
  await expect(page.getByRole('img', { name: 'cancel.png' })).toHaveAttribute('src', /^blob:/);
  expect(state.uploads).toBe(0);
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.getByRole('img', { name: 'cancel.png' })).toHaveCount(0);
  expect(state.requests.filter(r => r.method === 'PUT')).toHaveLength(0);
  await page.getByLabel('Add property photos').setInputFiles(uploadFile('keep.png'));
  await expect(page.getByRole('img', { name: 'keep.png' })).toHaveAttribute('src', /^blob:/);
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Property saved' })).toBeVisible();
  expect(state.uploads).toBe(1);
  expect(state.properties[0].record.photos[0].src).toMatch(/^https:/);
  await page.reload();
  await page.getByRole('tab', { name: /Photos/ }).click();
  await expect(page.getByRole('img', { name: 'keep.png' })).toHaveAttribute('src', /^https:/);
});
