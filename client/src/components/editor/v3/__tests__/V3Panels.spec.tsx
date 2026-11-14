import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { V3Panels } from '../V3Panels';
import { useCanvasStore } from '../../../../hooks/useCanvasStore';
import { createTextElement } from '../../../../lib/canvasUtils';

const api = vi.hoisted(() => ({ getAll: vi.fn(), getAdminCurated: vi.fn(), getOne: vi.fn() }));
vi.mock('../../../../lib/api', async original => ({ ...await original<typeof import('../../../../lib/api')>(), canvasTemplatesApi: api }));
const media = vi.hoisted(() => ({ upload: vi.fn() }));
vi.mock('../../../../lib/v3MediaUpload', () => ({ uploadV3Image: media.upload }));
let host: HTMLDivElement, root: Root, query: QueryClient;
beforeEach(() => {
  vi.stubGlobal('React', React); vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  localStorage.clear(); vi.clearAllMocks();
  api.getAll.mockResolvedValue([]); api.getAdminCurated.mockResolvedValue([]);
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
  query = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  useCanvasStore.setState({ elements: [], selectedElementIds: [], canvasWidth: 640, canvasHeight: 480, backgroundColor: '#ffffff', selectedThemeColors: null, history: { past: [], future: [] } });
});
afterEach(() => { act(() => root.unmount()); query.clear(); host.remove(); vi.unstubAllGlobals(); });
async function render(panel: 'Text' | 'Templates', userId = 'agent-a') {
  await act(async () => root.render(<QueryClientProvider client={query}><V3Panels panel={panel} userId={userId} onClose={() => {}} /></QueryClientProvider>));
}
async function click(label: string) {
  const button = [...document.querySelectorAll('button')].find(item => item.textContent?.trim().endsWith(label));
  if (!button) throw new Error(`Missing button ${label}`);
  await act(async () => button.click());
}

describe('approved panel contracts', () => {
  it('ignores a gallery fetch completed after navigation to another Design', async () => {
    const template = { id: 'template-a', name: 'City listing', thumbnail: '', tags: [], canvasData: { elements: [createTextElement()], canvasWidth: 640, canvasHeight: 480 } };
    api.getAll.mockResolvedValue([template]);
    let resolve!: (value: typeof template) => void;
    api.getOne.mockReturnValueOnce(new Promise<typeof template>(yes => { resolve = yes; }));
    const onUseTemplate = vi.fn(async () => true);
    history.replaceState(null, '', '/editor?editor=v3&designId=first');
    await act(async () => root.render(<QueryClientProvider client={query}><V3Panels panel="Templates" userId="agent-a" onClose={() => {}} onUseTemplate={onUseTemplate} /></QueryClientProvider>));
    await vi.waitFor(() => expect(host.textContent).toContain('City listing'));
    await click('City listing');
    history.replaceState(null, '', '/editor?editor=v3&designId=second');
    await act(async () => { resolve(template); });
    expect(onUseTemplate).not.toHaveBeenCalled();
    expect(localStorage.getItem('v3-recent-templates:agent-a')).toBeNull();
  });
  it('describes a separate Design and records no recent template when navigation is cancelled', async () => {
    const template = { id: 'template-a', name: 'City listing', thumbnail: '', tags: [], canvasData: { elements: [createTextElement(10, 10, 'Template')], canvasWidth: 640, canvasHeight: 480 } };
    api.getAll.mockResolvedValue([template]); api.getOne.mockResolvedValue(template);
    useCanvasStore.getState().addElement({ ...createTextElement(), id: 'existing' });
    const onUseTemplate = vi.fn(async () => false);
    await act(async () => root.render(<QueryClientProvider client={query}><V3Panels panel="Templates" userId="agent-a" onClose={() => {}} onUseTemplate={onUseTemplate} /></QueryClientProvider>));
    await vi.waitFor(() => expect(host.textContent).toContain('City listing'));
    await click('City listing');
    expect(document.querySelector('[role="alertdialog"]')?.textContent).toContain('Create a separate Design?');
    expect(document.querySelector('[role="alertdialog"]')?.textContent).toContain('current saved Design stays unchanged');
    await click('Create Design');
    expect(onUseTemplate).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('v3-recent-templates:agent-a')).toBeNull();
    expect(useCanvasStore.getState().elements[0].id).toBe('existing');
  });
  // AC6: each named style creates a real selected text element at its exact approved size.
  it('creates all eight text style sizes with independent history entries', async () => {
    await render('Text');
    const names = ['Headline Large', 'Headline Medium', 'Title', 'Subtitle', 'Body Large', 'Body', 'Caption', 'Price Tag'];
    const sizes = [48, 36, 24, 18, 16, 14, 12, 28];
    for (let index = 0; index < names.length; index++) {
      const button = [...host.querySelectorAll('button')].find(item => item.querySelector('strong')?.textContent === names[index]);
      expect(button, names[index]).toBeDefined();
      await act(async () => button!.click());
      const state = useCanvasStore.getState();
      expect(state.elements[index]).toMatchObject({ type: 'text', name: names[index], fontSize: sizes[index] });
      expect(state.selectedElementIds).toEqual([state.elements[index].id]);
      expect(state.history.past).toHaveLength(index + 1);
    }
  });

  // AC9: both failed APIs produce a retry action in Templates, not a blank successful gallery.
  it('shows failed template loading and retries both sources', async () => {
    api.getAll.mockRejectedValue(new Error('Unavailable')); api.getAdminCurated.mockRejectedValue(new Error('Unavailable'));
    await render('Templates');
    await vi.waitFor(() => expect(host.textContent).toContain('Templates could not be loaded.'));
    api.getAll.mockResolvedValue([]); api.getAdminCurated.mockResolvedValue([]);
    await click('Retry templates');
    await vi.waitFor(() => expect(api.getAll).toHaveBeenCalledTimes(2));
    await vi.waitFor(() => expect(host.textContent).toContain('No templates found.'));
  });

  // AC8/9: a malformed authoritative payload preserves the existing canvas and writes no recents.
  it('refuses a template without valid geometry', async () => {
    const card = { id: 'template-a', name: 'Broken template', thumbnail: '', tags: [] };
    api.getAll.mockResolvedValue([card]); api.getOne.mockResolvedValue({ ...card, canvasData: { elements: [], canvasWidth: 0, canvasHeight: 480 } });
    await render('Templates');
    await vi.waitFor(() => expect(host.textContent).toContain('Broken template'));
    await click('Broken template');
    await vi.waitFor(() => expect(host.textContent).toContain('no usable canvas layout'));
    expect(useCanvasStore.getState().canvasWidth).toBe(640);
    expect(useCanvasStore.getState().elements).toEqual([]);
    expect(localStorage.getItem('v3-recent-templates:agent-a')).toBeNull();
  });
});
const chooseFile = async (input: HTMLInputElement, file: File) => {
  Object.defineProperty(input, 'files', { value: [file], configurable: true });
  await act(async () => { input.dispatchEvent(new Event('change', { bubbles: true })); await new Promise(resolve => setTimeout(resolve, 10)); });
};
describe('Uploads panel stores R2 URLs', () => {
  // Contract: an uploaded image becomes a canvas element whose src is the R2 URL, sized from the decoded dimensions.
  it('adds the uploaded image with its R2 URL', async () => {
    media.upload.mockReset().mockResolvedValue({ src: 'https://media.example.test/design-media/org/u.png', name: 'u.png', width: 1600, height: 1200 });
    await render('Uploads' as 'Text');
    await chooseFile(host.querySelector('input[type="file"]') as HTMLInputElement, new File(['x'], 'u.png', { type: 'image/png' }));
    const [added] = useCanvasStore.getState().elements;
    expect(added).toMatchObject({ type: 'image', src: 'https://media.example.test/design-media/org/u.png', name: 'u.png' });
    expect(added.width / added.height).toBeCloseTo(4 / 3, 2);
    expect(added.width).toBeLessThanOrEqual(640 * 0.8);
  });
});
