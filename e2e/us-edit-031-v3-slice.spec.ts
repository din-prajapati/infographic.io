/** US-EDIT-031: MOCKED browser integration evidence, not authenticated live-server evidence.
 * Only browser HTTP/auth boundaries are mocked; real UI, canvas elements, history,
 * serializer and PNG exporter run. No production module imports or store injection.
 */
import { test, expect, type Page, type Locator } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const ID = 'c123456789012345678901234';
const URL = `/editor?editor=v3&designId=${ID}`;
const TEXT = 'SUNLIT HOME';
const EDITED = 'GARDEN HOME';
const base = { x: 40, y: 40, width: 400, height: 100, rotation: 0, opacity: 1, locked: false, visible: true, zIndex: 1 };
function fixture() {
  return {
    id: ID, name: 'Mocked saved listing', type: 'design', category: 'residential', tags: ['v3-fixture'], thumbnail: '', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
    canvasData: {
      version: '1.0', canvasWidth: 640, canvasHeight: 480, backgroundColor: '#ffffff', zoom: 1,
      listing: { property: { address: '14 Garden Lane', price: '$725,000', description: 'Retain unrendered listing facts' }, agent: { name: 'Morgan Agent', brokerage: 'Garden Realty', website: 'https://example.test' } },
      elements: [
        { ...base, id: 'text-1', name: 'Headline', type: 'text', content: TEXT, fontFamily: 'Arial', fontSize: 36, fontWeight: 700, bold: true, italic: false, underline: false, strikethrough: false, color: '#111111', align: 'left', lineHeight: 1.2, textTransform: 'none', listStyle: 'none' },
        { ...base, id: 'shape-1', name: 'Accent', type: 'shape', x: 40, y: 220, width: 180, height: 100, shapeType: 'rectangle', fill: '#dc2626', stroke: '#dc2626', strokeWidth: 0, cornerRadius: 0 },
        { ...base, id: 'image-1', name: 'Listing photo', type: 'image', x: 350, y: 240, width: 120, height: 100, src: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="100"><rect width="120" height="100" fill="#2563eb"/></svg>'), objectFit: 'contain', cornerRadius: 0, flipHorizontal: false, flipVertical: false, colorOverlay: null, filters: { brightness: 100, contrast: 100, saturation: 100 } },
      ],
    },
  };
}
function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>(yes => { resolve = yes; });
  return { promise, resolve };
}
async function mockedSession(page: Page, theme: 'light' | 'dark' = 'light') {
  // Retained manual-save contracts run before the new two-second idle window.
  // Freeze browser time, not the production autosave policy or network behavior.
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
  await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'));
  await page.addInitScript(({ theme }) => {
    localStorage.setItem('auth_token', 'mocked-v3-browser-token');
    localStorage.setItem('auth_user', JSON.stringify({ id: 'mocked-agent', name: 'Mocked Agent', email: 'mocked@example.test', plan: 'SOLO' }));
    localStorage.setItem('theme', theme);
  }, { theme });
  const model = { design: fixture(), reads: 0, writes: [] as { method: string; body: ReturnType<typeof fixture> }[], rejectRead: false, rejectWrite: false, readGate: null as ReturnType<typeof deferred> | null, writeGate: null as ReturnType<typeof deferred> | null };
  await page.route('**/api/**', async route => {
    const pathname = new globalThis.URL(route.request().url()).pathname;
    const method = route.request().method();
    if (/\/designs(?:\/[^/]+)?$/.test(pathname)) {
      if (method === 'GET') {
        model.reads++;
        if (model.readGate) await model.readGate.promise;
        if (model.rejectRead) return route.fulfill({ status: 503, json: { message: 'Mocked read unavailable' } });
        return route.fulfill({ json: pathname.endsWith('/designs') ? [model.design] : model.design });
      }
      if (method === 'PUT' || method === 'POST') {
        const body = route.request().postDataJSON();
        model.writes.push({ method, body });
        if (model.writeGate) await model.writeGate.promise;
        if (model.rejectWrite) return route.fulfill({ status: 503, json: { message: 'Mocked write unavailable' } });
        model.design = { ...model.design, ...body, id: ID };
        return route.fulfill({ json: model.design });
      }
    }
    return route.fulfill({ json: [] });
  });
  return model;
}
const canvas = (page: Page) => page.getByTestId('design-canvas');
async function open(page: Page) {
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('textbox', { name: 'Design title', exact: true })).toBeVisible();
  await expect(canvas(page).getByText(TEXT, { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save', exact: true })).toBeEnabled();
  // Restore schedules Fit at 350/700ms and two animation frames. Settle those
  // document-open callbacks before exercising manual view controls.
  await page.clock.runFor(750);
}
async function edit(page: Page, content = EDITED) {
  if (!await page.getByRole('textbox', { name: 'Text content', exact: true }).isVisible())
    await page.getByRole('button', { name: 'Text', exact: true }).click();
  await canvas(page).locator('[data-element-id="text-1"]').click();
  await page.getByRole('textbox', { name: 'Text content', exact: true }).fill(content);
  await page.getByRole('textbox', { name: 'Text content', exact: true }).press('Tab');
  await expect(canvas(page).getByText(content, { exact: true })).toBeVisible();
}

async function expectReadable(locator: Locator, label: string) {
  await expect(locator, label).toBeVisible();
  const ratio = await locator.evaluate(node => {
    // Browser canvas parses CSS Color 4 as well as rgb(), so the check measures
    // computed tokens in both themes rather than assuming a string format.
    const scratch = document.createElement('canvas'); scratch.width = scratch.height = 1;
    const ctx = scratch.getContext('2d', { willReadFrequently: true })!;
    function color(value: string) { ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = value; ctx.fillRect(0, 0, 1, 1); return [...ctx.getImageData(0, 0, 1, 1).data]; }
    function over(top: number[], bottom: number[]) { const a = top[3] / 255; return [0, 1, 2].map(i => top[i] * a + bottom[i] * (1 - a)).concat(255); }
    function lum(c: number[]) { return c.slice(0, 3).map(n => { n /= 255; return n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4; }).reduce((v, n, i) => v + n * [.2126, .7152, .0722][i], 0); }
    const chain: Element[] = []; let el: Element | null = node;
    while (el) { chain.unshift(el); el = el.parentElement; }
    let backgrounds = [[255, 255, 255, 255]];
    for (const ancestor of chain) {
      const style = getComputedStyle(ancestor);
      backgrounds = backgrounds.map(bg => over(color(style.backgroundColor), bg));
      // The approved header is a real gradient. Measure every stop (plus its
      // interpolated midpoint) rather than treating its transparent base as white.
      const stops = style.backgroundImage.match(/rgba?\([^)]*\)|#[0-9a-f]{3,8}/gi);
      if (stops?.length) {
        const samples = stops.map(color);
        for (let i = 1; i < stops.length; i++)
          samples.push(samples[i - 1].map((v, channel) => (v + samples[i][channel]) / 2));
        backgrounds = backgrounds.flatMap(bg => samples.map(sample => over(sample, bg)));
      }
    }
    return Math.min(...backgrounds.map(bg => {
      const fg = over(color(getComputedStyle(node).color), bg);
      const a = lum(fg); const b = lum(bg);
      return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
    }));
  });
  expect(ratio, `${label} text contrast`).toBeGreaterThanOrEqual(4.5);
}

test.describe('US-EDIT-031 — mocked browser integration', () => {
  // AC12 Preview Contract: entering Preview shows the same live design without
  // editing chrome or interactions; returning restores the draft and save state.
  test('TC-EDIT-031-20 [P1] Preview isolates the live canvas and Exit restores editor draft', async ({ page }, info) => {
    const model = await mockedSession(page); await open(page); await edit(page);
    const downloadReady = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export', exact: true }).click();
    expect((await downloadReady).suggestedFilename()).toMatch(/\.png$/i);
    await expect(page.getByText('PNG exported', { exact: true })).toBeVisible();
    await page.getByRole('textbox', { name: 'Text content', exact: true }).fill('DRAFT ONLY');
    const beforeIds = await canvas(page).locator('[data-element-id]').evaluateAll(nodes => nodes.map(el => el.getAttribute('data-element-id')));
    await expect(page.getByText('Unsaved', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Preview', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Preview', exact: true }).click();
    const preview = page.getByRole('main', { name: 'Design preview', exact: true });
    await expect(preview).toBeVisible();
    await expect(page.getByText('PNG exported', { exact: true })).toBeHidden();
    await expect(canvas(page)).toHaveAttribute('data-preview', 'true');
    await expect(canvas(page)).toHaveAttribute('role', 'img');
    expect(await canvas(page).evaluate(el => getComputedStyle(el).pointerEvents)).toBe('none');
    await expect(page.getByRole('button', { name: 'Exit preview', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Save', exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Text', exact: true })).toHaveCount(0);
    await expect(page.getByRole('complementary', { name: 'Text inspector', exact: true })).toBeHidden();
    await expect(page.getByRole('navigation', { name: 'Editing workflow', exact: true })).toBeHidden();
    await expect(page.getByText('640 × 480', { exact: true })).toBeHidden();
    await expect(page.getByText('Select text on the canvas or in the inspector. Apply your changes when ready.', { exact: true })).toBeHidden();
    await expect(page.getByRole('button', { name: 'Zoom in', exact: true })).toHaveCount(0);
    expect(await canvas(page).locator('[data-element-id]').evaluateAll(nodes => nodes.map(el => el.getAttribute('data-element-id')))).toEqual(beforeIds);
    await expect(canvas(page).getByText(EDITED, { exact: true })).toBeVisible();
    await expect(canvas(page).getByText('DRAFT ONLY', { exact: true })).toHaveCount(0);
    const text = canvas(page).locator('[data-element-id="text-1"]');
    const box = await text.boundingBox(); expect(box).not.toBeNull();
    await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.mouse.dblclick(box!.x + box!.width / 2, box!.y + box!.height / 2);
    expect(await page.evaluate(() => window.getSelection()?.toString())).toBe('');
    await expect(canvas(page).locator('textarea, input, [contenteditable="true"]')).toHaveCount(0);
    await page.screenshot({ path: info.outputPath('v3-preview.png'), fullPage: true });
    expect(model.writes).toEqual([]);
    await page.getByRole('button', { name: 'Exit preview', exact: true }).click();
    await expect(page.getByRole('main', { name: 'Design preview', exact: true })).toHaveCount(0);
    await expect(page.getByRole('textbox', { name: 'Text content', exact: true })).toHaveValue('DRAFT ONLY');
    await expect(canvas(page).getByText(EDITED, { exact: true })).toBeVisible();
    await expect(page.getByText('Unsaved', { exact: true })).toBeVisible();
    expect(model.writes).toEqual([]);
  });

  // AC12 keyboard Contract: typing P in an input remains native typing; P with
  // focus outside fields enters Preview and Escape restores the same editor.
  test('TC-EDIT-031-21 [P1] Preview shortcut ignores fields and Escape returns', async ({ page }) => {
    const model = await mockedSession(page); await open(page);
    await page.getByRole('button', { name: 'Text', exact: true }).click();
    await canvas(page).locator('[data-element-id="text-1"]').click();
    const draft = page.getByRole('textbox', { name: 'Text content', exact: true });
    await draft.fill('DRAFT'); await draft.press('End'); await draft.press('p');
    await expect(draft).toHaveValue('DRAFTp');
    await expect(page.getByRole('main', { name: 'Design preview', exact: true })).toHaveCount(0);
    await page.getByRole('button', { name: 'Preview', exact: true }).focus();
    await page.keyboard.press('p');
    await expect(page.getByRole('main', { name: 'Design preview', exact: true })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('main', { name: 'Design preview', exact: true })).toHaveCount(0);
    await expect(draft).toHaveValue('DRAFTp');
    await expect(page.getByText('Saved', { exact: true })).toBeVisible();
    expect(model.writes).toEqual([]);
  });

  // AC1/AC4: saved text/image/shape content survives UI edit → history → server
  // acknowledgement → reload, and existing metadata/record ID remain intact.
  test('TC-EDIT-031-01 [P0] open edit undo redo save reload retains all elements', async ({ page }) => {
    const model = await mockedSession(page); await open(page);
    await expect(page.getByRole('link', { name: 'Projects', exact: true })).toHaveAttribute('href', '/my-designs');
    await expect(canvas(page).locator('[data-element-id="shape-1"]')).toBeVisible();
    await expect(canvas(page).locator('[data-element-id="image-1"]')).toBeVisible();
    await edit(page);
    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    await expect(canvas(page).getByText(TEXT, { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Redo', exact: true }).click();
    await expect(canvas(page).getByText(EDITED, { exact: true })).toBeVisible();
    await page.getByRole('textbox', { name: 'Design title', exact: true }).fill('Updated mocked listing');
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByText('Saved', { exact: true })).toBeVisible();
    expect(model.writes).toHaveLength(1); expect(model.writes[0].method).toBe('PUT');
    expect(model.writes[0].body.thumbnail).toMatch(/^data:image\/png;base64,/);
    expect(model.writes[0].body).toMatchObject({ name: 'Updated mocked listing', category: 'residential', tags: ['v3-fixture'], canvasData: { canvasWidth: 640, canvasHeight: 480, backgroundColor: '#ffffff', listing: fixture().canvasData.listing, elements: expect.arrayContaining([expect.objectContaining({ id: 'text-1', content: EDITED }), expect.objectContaining(fixture().canvasData.elements[1]), expect.objectContaining(fixture().canvasData.elements[2])]) } });
    expect(new globalThis.URL(page.url()).searchParams.get('designId')).toBe(ID);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('textbox', { name: 'Design title', exact: true })).toHaveValue('Updated mocked listing');
    await expect(canvas(page).getByText(EDITED, { exact: true })).toBeVisible();
    await expect(canvas(page).locator('[data-element-id="image-1"]')).toBeVisible();
    await expect(canvas(page).locator('[data-element-id="shape-1"]')).toBeVisible();
  });

  // AC5: failed Save is visible and retryable with original edits still present.
  test('TC-EDIT-031-02 [P0] failed save retains edits and retries without local fallback', async ({ page }) => {
    const model = await mockedSession(page); await open(page); await edit(page);
    model.rejectWrite = true;
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Retry save', exact: true })).toBeVisible();
    await expect(page.getByText('Saved', { exact: true })).toHaveCount(0);
    await expect(canvas(page).getByText(EDITED, { exact: true })).toBeVisible();
    model.rejectWrite = false;
    await page.getByRole('button', { name: 'Retry save', exact: true }).click();
    await expect(page.getByText('Saved', { exact: true })).toBeVisible();
    expect(model.writes).toHaveLength(2);
    expect(model.design.canvasData.elements[0]).toMatchObject({ content: EDITED });
  });

  // AC4: absent optional metadata remains absent, rather than being replaced by
  // blank-session defaults when an existing record is saved.
  test('TC-EDIT-031-15 [P1] omitted category and tags remain omitted on existing save', async ({ page }) => {
    const model = await mockedSession(page);
    Reflect.deleteProperty(model.design, 'category'); Reflect.deleteProperty(model.design, 'tags');
    await open(page); await edit(page);
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByText('Saved', { exact: true })).toBeVisible();
    expect(model.writes).toHaveLength(1);
    expect(model.writes[0].body).not.toHaveProperty('category');
    expect(model.writes[0].body).not.toHaveProperty('tags');
    expect(model.writes[0].body.type).toBe('design');
  });

  // AC6: Save A acknowledgement cannot call newer revision B Saved.
  test('TC-EDIT-031-03 [P0] editing during an in-flight save stays Unsaved', async ({ page }) => {
    const model = await mockedSession(page); await open(page); await edit(page);
    model.writeGate = deferred();
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect.poll(() => model.writes.length).toBe(1);
    await edit(page, 'NEWER REVISION');
    model.writeGate.resolve();
    await expect(page.getByText('Unsaved', { exact: true })).toBeVisible();
    await expect(canvas(page).getByText('NEWER REVISION', { exact: true })).toBeVisible();
    expect(model.writes).toHaveLength(1);
  });

  // AC2: initial load blocks actions, rejected GET stays blocked, retry hydrates.
  test('TC-EDIT-031-04 [P1] failed initial load remains blocked until retry succeeds', async ({ page }) => {
    const model = await mockedSession(page); model.readGate = deferred(); model.rejectRead = true;
    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('status')).toHaveText(/Opening design/);
    await expect(page.getByRole('button', { name: 'Save', exact: true })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Export', exact: true })).toBeDisabled();
    model.readGate.resolve();
    await expect(page.getByRole('button', { name: 'Retry opening', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Save', exact: true })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Export', exact: true })).toBeDisabled();
    model.rejectRead = false;
    await page.getByRole('button', { name: 'Retry opening', exact: true }).click();
    await expect(canvas(page).getByText(TEXT, { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Save', exact: true })).toBeEnabled();
  });

  // AC2: structurally invalid server documents never become an editable canvas.
  for (const invalid of [null, { elements: [], canvasWidth: 0, canvasHeight: 480 }, { elements: [{ type: 'unknown' }], canvasWidth: 640, canvasHeight: 480 }]) {
    test(`TC-EDIT-031-11 [P0] invalid canvas ${JSON.stringify(invalid)} stays blocked`, async ({ page }) => {
      const model = await mockedSession(page);
      model.design.canvasData = invalid as unknown as ReturnType<typeof fixture>['canvasData'];
      await page.goto(URL, { waitUntil: 'domcontentloaded' });
      await expect(page.getByRole('button', { name: 'Retry opening', exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Save', exact: true })).toBeDisabled();
      await expect(page.getByRole('button', { name: 'Export', exact: true })).toBeDisabled();
      model.design = fixture();
      await page.getByRole('button', { name: 'Retry opening', exact: true }).click();
      await expect(canvas(page).getByText(TEXT, { exact: true })).toBeVisible();
    });
  }

  // AC3: drafts and native editing shortcuts cannot mutate the selected element;
  // one blur is exactly one history operation for the complete text.
  test('TC-EDIT-031-12 [P0] text draft is isolated until one blur undo step', async ({ page }) => {
    await mockedSession(page); await open(page);
    await page.getByRole('button', { name: 'Text', exact: true }).click();
    await canvas(page).locator('[data-element-id="text-1"]').click();
    const input = page.getByRole('textbox', { name: 'Text content', exact: true });
    await input.fill('DRAFT ONLY');
    await expect(canvas(page).getByText(TEXT, { exact: true })).toBeVisible();
    await expect(page.getByText('Saved', { exact: true })).toBeVisible();
    await input.press('Control+a'); await input.press('Backspace');
    await expect(canvas(page).getByText(TEXT, { exact: true })).toBeVisible();
    await input.fill(EDITED); await page.getByRole('textbox', { name: 'Text content', exact: true }).press('Tab');
    await expect(canvas(page).getByText(EDITED, { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    await expect(canvas(page).getByText(TEXT, { exact: true })).toBeVisible();
    // With an initially empty history, disabled Undo proves blur added exactly
    // one history entry, rather than a separate entry for each draft keystroke.
    await expect(page.getByRole('button', { name: 'Undo', exact: true })).toBeDisabled();
    await expect(page.getByText('Unsaved', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Redo', exact: true }).click();
    await expect(canvas(page).getByText(EDITED, { exact: true })).toBeVisible();
  });

  // AC3/AC4: existing listingBindings owns Undo/Redo hydration globally. Prove
  // that using a fresh shell still saves the facts shown by linked canvas text.
  test('TC-EDIT-031-18 [P0] undo and redo keep saved listing facts aligned with slot text', async ({ page }) => {
    const model = await mockedSession(page);
    Object.assign(model.design.canvasData.elements[0], { slot: 'property.headline' });
    await open(page); await edit(page);
    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByText('Saved', { exact: true })).toBeVisible();
    expect(model.writes[0].body.canvasData.listing.property).toMatchObject({ headline: TEXT });
    await page.getByRole('button', { name: 'Redo', exact: true }).click();
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByText('Saved', { exact: true })).toBeVisible();
    expect(model.writes[1].body.canvasData.listing.property).toMatchObject({ headline: EDITED });
  });

  // AC1: Text adds exactly one independent text element as one undo operation.
  test('TC-EDIT-031-16 [P1] Text rail adds one text element with one-step undo', async ({ page }) => {
    const model = await mockedSession(page); await open(page);
    await expect(canvas(page).locator('[data-element-id]')).toHaveCount(3);
    await page.getByRole('button', { name: 'Text', exact: true }).click();
    await page.getByRole('button', { name: 'Add text', exact: true }).click();
    await expect(canvas(page).locator('[data-element-id]')).toHaveCount(4);
    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    await expect(canvas(page).locator('[data-element-id]')).toHaveCount(3);
    await page.getByRole('button', { name: 'Redo', exact: true }).click();
    await expect(canvas(page).locator('[data-element-id]')).toHaveCount(4);
    await page.getByRole('button', { name: 'Tools', exact: true }).click();
    await page.getByRole('button', { name: 'Select', exact: true }).click();
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByText('Saved', { exact: true })).toBeVisible();
    const added = model.writes[0].body.canvasData.elements.filter(el => !['text-1', 'image-1', 'shape-1'].includes(el.id));
    expect(added).toHaveLength(1); expect(added[0].type).toBe('text');
  });

  // AC3/AC6: reused direct manipulation paths must advance document revisions,
  // independently of the inspector Apply button.
  test('TC-EDIT-031-17 [P1] shape drag and canvas inline text edit become Unsaved', async ({ page }) => {
    const model = await mockedSession(page); await open(page);
    const shape = canvas(page).locator('[data-element-id="shape-1"]');
    const box = await shape.boundingBox(); expect(box).not.toBeNull();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.mouse.down(); await page.mouse.move(box!.x + box!.width / 2 + 30, box!.y + box!.height / 2 + 20, { steps: 8 }); await page.mouse.up();
    await expect(page.getByText('Unsaved', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByText('Saved', { exact: true })).toBeVisible();
    const moved = model.writes[0].body.canvasData.elements.find(el => el.id === 'shape-1')!;
    expect(moved.x).not.toBe(40); expect(moved.y).not.toBe(220);
    await canvas(page).locator('[data-element-id="text-1"]').dblclick();
    const inline = canvas(page).locator('textarea, input, [contenteditable="true"]').first();
    await expect(inline).toBeVisible(); await inline.fill('INLINE EDIT'); await inline.press('Tab');
    await expect(canvas(page).getByText('INLINE EDIT', { exact: true })).toBeVisible();
    await expect(page.getByText('Unsaved', { exact: true })).toBeVisible();
  });

  // Contract: every selected type and mixed selection uses the same strip
  // actions. Each duplicate/delete acts on all selected IDs as one history step.
  test('selected text image and shape share duplicate and delete actions', async ({ page }) => {
    await mockedSession(page); await open(page);
    await page.getByRole('button', { name: 'Tools', exact: true }).click();
    const elements = canvas(page).locator('[data-element-id]');
    for (const id of ['text-1', 'image-1', 'shape-1']) {
      await canvas(page).locator(`[data-element-id="${id}"]`).click();
      await page.getByRole('toolbar', { name: 'Canvas tools', exact: true }).getByRole('button', { name: 'Duplicate', exact: true }).click();
      await expect(elements).toHaveCount(4);
      await page.getByRole('toolbar', { name: 'Canvas tools', exact: true }).getByRole('button', { name: 'Delete', exact: true }).click();
      await expect(elements).toHaveCount(3);
    }
    await canvas(page).locator('[data-element-id="text-1"]').click();
    await canvas(page).locator('[data-element-id="image-1"]').click({ modifiers: ['Shift'] });
    await canvas(page).locator('[data-element-id="shape-1"]').click({ modifiers: ['Shift'] });
    await expect(page.getByText('3 elements selected', { exact: true })).toBeVisible();
    await page.getByRole('toolbar', { name: 'Canvas tools', exact: true }).getByRole('button', { name: 'Duplicate', exact: true }).click();
    await expect(elements).toHaveCount(6);
    await page.getByRole('toolbar', { name: 'Canvas tools', exact: true }).getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(elements).toHaveCount(3);
    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    await expect(elements).toHaveCount(6);
  });

  // AC5: unsupported IDs are rejected before any designs request or POST.
  test('TC-EDIT-031-13 [P0] local-only design ID cannot become an accidental server create', async ({ page }) => {
    const model = await mockedSession(page); const requests: string[] = [];
    page.on('request', request => { if (/\/designs(?:\/|$)/.test(new globalThis.URL(request.url()).pathname)) requests.push(request.method()); });
    await page.goto('/editor?editor=v3&designId=local-only-draft', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Unsupported design ID', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Save', exact: true })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Export', exact: true })).toBeDisabled();
    expect(requests).toEqual([]); expect(model.writes).toEqual([]);
  });

  // AC6: view-only selection/zoom/fit never creates persisted-document changes.
  test('TC-EDIT-031-14 [P1] selection zoom and fit keep acknowledged design Saved', async ({ page }) => {
    const model = await mockedSession(page); await open(page);
    await canvas(page).locator('[data-element-id="text-1"]').click();
    await expect(page.getByText('Saved', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
    for (let step = 0; step < 10; step++) await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
    const zoomLabel = page.getByRole('button', { name: 'Zoom level', exact: true });
    const manualZoom = await zoomLabel.textContent();
    await page.clock.runFor(50);
    await expect(zoomLabel).toHaveText(manualZoom!);
    await expect(page.getByText('Saved', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Zoom out', exact: true }).click();
    await expect(page.getByText('Saved', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Fit canvas', exact: true }).click();
    await expect(page.getByText('Saved', { exact: true })).toBeVisible();
    expect(model.writes).toEqual([]);
  });

  // AC7: first POST ID is carried in the opt-in URL and next save uses PUT.
  test('TC-EDIT-031-08 [P1] first blank save retains editor=v3 and server identity', async ({ page }) => {
    const model = await mockedSession(page); await page.goto('/editor?editor=v3', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('button', { name: 'Save', exact: true })).toBeEnabled();
    expect(model.reads).toBe(0);
    await page.getByRole('textbox', { name: 'Design title', exact: true }).fill('Blank session');
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`editor=v3.*designId=${ID}|designId=${ID}.*editor=v3`));
    expect(model.reads, 'Adopting create ID must not trigger another GET').toBe(0);
    await page.getByRole('textbox', { name: 'Design title', exact: true }).fill('Second save');
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByText('Saved', { exact: true })).toBeVisible();
    expect(model.reads, 'Subsequent PUT must stay in the same mounted session').toBe(0);
    expect(model.writes.map(w => w.method)).toEqual(['POST', 'PUT']);
    expect(model.writes[0].body).toMatchObject({ type: 'design', category: 'real-estate', tags: [], canvasData: { canvasWidth: 1200, canvasHeight: 800, elements: [] } });
    expect(model.writes[0].body.canvasData.backgroundColor.toLowerCase()).toBe('#ffffff');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('textbox', { name: 'Design title', exact: true })).toHaveValue('Second save');
    expect(model.reads).toBe(1);
  });

  // AC8: real download decodes at the existing exporter's 2x small-artboard
  // scale and contains dark text pixels inside the headline region.
  test('TC-EDIT-031-06 [P1] PNG export decodes with expected dimensions and rendered text', async ({ page }, info) => {
    await mockedSession(page); await open(page); await edit(page);
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export', exact: true }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.png$/i);
    const filename = info.outputPath('export.png'); await download.saveAs(filename);
    const data = await readFile(filename);
    const decoded = await page.evaluate(async encoded => {
      const img = new Image(); img.src = 'data:image/png;base64,' + encoded; await img.decode();
      const out = document.createElement('canvas'); out.width = img.width; out.height = img.height;
      const ctx = out.getContext('2d')!; ctx.drawImage(img, 0, 0);
      const pixels = ctx.getImageData(80, 80, 800, 200).data;
      let dark = 0; for (let i = 0; i < pixels.length; i += 4) if (pixels[i] < 80 && pixels[i+1] < 80 && pixels[i+2] < 80 && pixels[i+3] > 0) dark++;
      return { width: img.width, height: img.height, dark };
    }, data.toString('base64'));
    expect(decoded).toMatchObject({ width: 1280, height: 960 });
    expect(decoded.dark).toBeGreaterThan(200);
    await info.attach('Decoded PNG export', { path: filename, contentType: 'image/png' });
  });

  // AC9: external browser canvas encoder failure must be surfaced, with retry.
  test('TC-EDIT-031-09 [P1] PNG encoder failure is visible and retryable', async ({ page }) => {
    await mockedSession(page); await open(page);
    await page.evaluate(() => {
      const original = HTMLCanvasElement.prototype.toDataURL;
      (window as unknown as { restorePngEncoder: () => void }).restorePngEncoder = () => { HTMLCanvasElement.prototype.toDataURL = original; };
      HTMLCanvasElement.prototype.toDataURL = () => { throw new Error('Mocked browser PNG encoder failure'); };
    });
    await page.getByRole('button', { name: 'Export', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Retry export', exact: true })).toBeVisible();
    await expect(page.getByText('Saved', { exact: true })).toBeVisible();
    await expect(canvas(page).getByText(TEXT, { exact: true })).toBeVisible();
    await page.evaluate(() => (window as unknown as { restorePngEncoder: () => void }).restorePngEncoder());
    const downloading = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Retry export', exact: true }).click();
    expect((await downloading).suggestedFilename()).toMatch(/\.png$/);
  });
});

// AC11: default route still exposes the existing canvas and excludes V3 shell;
// both variants without browser authentication follow ProtectedRoute to /auth.
for (const route of ['/editor', `/editor?designId=${ID}`]) test(`TC-EDIT-031-07 [P1] legacy remains default at ${route}`, async ({ page }) => {
  await mockedSession(page); await page.goto(route, { waitUntil: 'domcontentloaded' });
  await expect(canvas(page)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'V3 Editor', exact: true })).toHaveCount(0);
});
for (const route of ['/editor', URL]) test(`TC-EDIT-031-10 [P1] unauthenticated ${route} redirects to auth`, async ({ page }) => {
  await page.goto(route, { waitUntil: 'domcontentloaded' }); await expect(page).toHaveURL(/\/auth(?:\?|$)/);
  await expect(page.getByRole('heading', { name: 'V3 Editor', exact: true })).toHaveCount(0);
});

// AC10: exact shell surfaces stay within viewport, controls are keyboard reachable,
// and computed foreground/background text contrast exceeds 4.5 in both themes.
for (const width of [1280, 1440]) for (const theme of ['light', 'dark'] as const) {
  test(`TC-EDIT-031-05 [P1] ${width}px ${theme} shell contrast and geometry`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 1000 }); await mockedSession(page, theme); await open(page);
    await expect(page.locator('html')).toHaveClass(new RegExp(theme));
    const title = page.getByRole('textbox', { name: 'Design title', exact: true });
    const save = page.getByRole('button', { name: 'Save', exact: true });
    await title.focus();
    const keyboardVisited: string[] = [];
    for (let i = 0; i < 80; i++) {
      keyboardVisited.push(await page.evaluate(() => document.activeElement?.getAttribute('aria-label') || document.activeElement?.textContent?.trim() || document.activeElement?.getAttribute('title') || ''));
      await page.keyboard.press('Tab');
    }
    expect(keyboardVisited).toContain('Save'); expect(keyboardVisited).toContain('Export');
    for (const button of await page.getByRole('button').all()) {
      if (!await button.isVisible() || !await button.isEnabled()) continue;
      const name = await button.evaluate(el => el.getAttribute('aria-label') || el.textContent?.trim() || el.getAttribute('title') || '');
      expect(name, 'Enabled button must have an accessible name').not.toBe('');
      expect(keyboardVisited, `Keyboard must reach ${name}`).toContain(name);
    }
    for (const locator of [title, save, page.getByRole('button', { name: 'Export', exact: true }), canvas(page)]) {
      const box = await locator.boundingBox(); expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0); expect(box!.x + box!.width).toBeLessThanOrEqual(width + 1);
    }
    for (const [label, locator] of [
      ['Design title', title],
      ['Projects', page.getByRole('link', { name: 'Projects', exact: true })],
      ['Saved status', page.getByText('Saved', { exact: true })],
      ['Save', save], ['Export', page.getByRole('button', { name: 'Export', exact: true })],
      ['Tools rail', page.getByRole('button', { name: 'Tools', exact: true })],
      ['Text rail', page.getByRole('button', { name: 'Text', exact: true })],
      ['Actual dimensions', page.getByText('640 × 480', { exact: true })],
      ['Zoom footer', page.getByText(/^\d+%$/).first()],
    ] as const) await expectReadable(locator, label);
    const rail = page.getByRole('navigation', { name: 'Editor sections', exact: true });
    await expect(rail).toBeVisible();
    for (const name of ['Templates', 'Tools', 'Text', 'Uploads', 'Brand', 'Property', 'Agent'])
      await expectReadable(rail.getByRole('button', { name, exact: true }), `${name} rail`);
    await expectReadable(page.getByRole('button', { name: 'Layers', exact: true }), 'Layers footer');
    await expectReadable(page.getByRole('button', { name: 'Canvas settings', exact: true }), 'Canvas settings footer');
    await page.getByRole('button', { name: 'Text', exact: true }).click();
    await canvas(page).locator('[data-element-id="text-1"]').click();
    const input = page.getByRole('textbox', { name: 'Text content', exact: true });
    await expectReadable(input, 'Text panel content');
    const label = page.locator('label').filter({ has: input });
    await expect(label).toContainText('Text content');
    await expectReadable(label, 'Text panel label');
    const panel = page.getByRole('complementary', { name: 'Text panel', exact: true });
    await expectReadable(panel.getByRole('heading', { name: 'Text', exact: true }), 'Text panel heading');
    const artboard = await canvas(page).boundingBox(); const panelBox = await panel.boundingBox();
    expect(artboard).not.toBeNull(); expect(panelBox).not.toBeNull();
    expect(panelBox!.x + panelBox!.width).toBeLessThanOrEqual(artboard!.x + 1);
    // Verify painted canvas content too: DOM visibility alone can miss an
    // artboard covered by its background or clipped after keyboard navigation.
    const painted = await canvas(page).screenshot();
    const redPixels = await page.evaluate(async data => {
      const image = new Image(); image.src = `data:image/png;base64,${data}`; await image.decode();
      const sample = document.createElement('canvas'); sample.width = image.width; sample.height = image.height;
      const context = sample.getContext('2d')!; context.drawImage(image, 0, 0);
      const pixels = context.getImageData(0, 0, image.width, image.height).data;
      let red = 0;
      for (let i = 0; i < pixels.length; i += 4) if (pixels[i] > 150 && pixels[i + 1] < 90 && pixels[i + 2] < 90) red++;
      return red;
    }, painted.toString('base64'));
    expect(redPixels, 'The existing red shape must be painted on the live artboard').toBeGreaterThan(500);
    await page.screenshot({ path: info.outputPath(`v3-${width}-${theme}.png`), fullPage: true });
    await page.getByRole('button', { name: 'Canvas settings', exact: true }).click();
    await page.getByRole('button', { name: 'Toggle theme', exact: true }).click();
    await expect(page.locator('html')).toHaveClass(new RegExp(theme === 'light' ? 'dark' : 'light'));
    await expectReadable(title, 'Design title after theme switch');
  });
}
