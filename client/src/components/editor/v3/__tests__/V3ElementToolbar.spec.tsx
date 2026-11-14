import {useV3ColorPanel} from '../../../../hooks/useV3ColorPanel';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Simulate } from 'react-dom/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { V3ElementToolbar } from '../V3ElementToolbar';
import { useCanvasStore } from '../../../../hooks/useCanvasStore';
import { createTextElement, createImageElement, createShapeElement } from '../../../../lib/canvasUtils';
import { createLineElement } from '../../../../lib/lineGeometry';
import { useV3ElementPreview } from '../../../../hooks/useV3ElementPreview';
const media = vi.hoisted(() => ({ upload: vi.fn() }));
vi.mock('../../../../lib/v3MediaUpload', () => ({ uploadV3Image: media.upload }));

let node: HTMLDivElement;
let root: Root;
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
beforeEach(() => { node = document.createElement('div'); document.body.append(node); root = createRoot(node); useCanvasStore.setState({ elements: [], selectedElementIds: [], history: { past: [], future: [] } }); });
afterEach(() => { act(() => root.unmount()); node.remove(); vi.unstubAllGlobals(); });
describe('approved compact text toolbar', () => {
  it('cancels an unfinished font-size preview when resize moves its control into More', async () => {
    let width = 1600;
    vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
    const bounds = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      const measuredWidth = this.hasAttribute('data-canvas-viewport') ? width : this.hasAttribute('data-v3-toolbar-group') ? 100 : 200;
      return { x: 0, y: 100, left: 0, top: 100, width: measuredWidth, height: 48, right: measuredWidth, bottom: 148, toJSON() {} };
    });
    const viewport = document.createElement('div'); viewport.setAttribute('data-canvas-viewport', ''); document.body.append(viewport);
    const element = createTextElement(); useCanvasStore.setState({ elements: [element], selectedElementIds: [element.id] });
    try {
      act(() => root.render(<V3ElementToolbar element={element} onEditImage={() => {}} />));
      const input = node.querySelector<HTMLInputElement>('[aria-label="Font size"]')!;
      act(() => { input.value = '95'; Simulate.change(input); });
      expect(useV3ElementPreview.getState().preview).not.toBeNull();
      width = 180;
      act(() => window.dispatchEvent(new Event('resize')));
      expect(useV3ElementPreview.getState().preview).toBeNull();
      await act(async () => Simulate.click(node.querySelector('[aria-label="More formatting options"]')!));
      expect(document.querySelector<HTMLInputElement>('[aria-label="Font size"]')!.value).toBe(String(element.fontSize));
      expect(useCanvasStore.getState().history.past).toHaveLength(0);
    } finally { bounds.mockRestore(); viewport.remove(); }
  });
  it('moves measured secondary image controls into More and restores them when the canvas grows', async () => {
    let viewportWidth = 280;
    const callbacks = new Set<() => void>();
    vi.stubGlobal('ResizeObserver', class { constructor(private callback: () => void) { callbacks.add(callback); } observe() {} unobserve() {} disconnect() { callbacks.delete(this.callback); } });
    const rect = (width: number) => ({ x: 0, y: 100, left: 0, top: 100, width, height: 48, right: width, bottom: 148, toJSON() {} });
    const bounds = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      if (this.hasAttribute('data-canvas-viewport')) return rect(viewportWidth);
      if (this.hasAttribute('data-v3-toolbar-group')) return rect(48);
      return rect(200);
    });
    const viewport = document.createElement('div'); viewport.setAttribute('data-canvas-viewport', ''); document.body.append(viewport);
    const element = createImageElement('photo'); useCanvasStore.setState({ elements: [element], selectedElementIds: [element.id] });
    try {
      act(() => root.render(<V3ElementToolbar element={element} onEditImage={() => {}} />));
      const more = node.querySelector<HTMLButtonElement>('[aria-label="More formatting options"]');
      expect(more).not.toBeNull();
      expect(document.querySelector('[role="dialog"][aria-label="More formatting options"]')).toBeNull();
      expect(node.querySelector('[role="toolbar"] [aria-label="Reset image"]')).toBeNull();
      await act(async () => Simulate.click(more!));
      const overflow = document.querySelector('[role="dialog"][aria-label="More formatting options"]');
      expect(overflow?.querySelector('[aria-label="Reset image"]')).not.toBeNull();
      await act(async () => Simulate.click(overflow!.querySelector('[aria-label="Corners"]')!));
      const radius = document.querySelector<HTMLInputElement>('[aria-label="Corner radius value"]')!;
      expect(radius).not.toBeNull();
      act(() => { radius.focus(); radius.value = '45'; Simulate.change(radius); });
      expect(useCanvasStore.getState().history.past).toHaveLength(0);
      await act(async () => { radius.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })); });
      expect(radius.value).toBe('0');
      expect(useV3ElementPreview.getState().preview).toBeNull();
      await act(async () => { radius.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })); });
      expect(document.querySelector('[aria-label="Corner radius value"]')).toBeNull();
      expect(document.querySelector('[role="dialog"][aria-label="More formatting options"]')).not.toBeNull();
      viewportWidth = 1600;
      act(() => window.dispatchEvent(new Event('resize')));
      expect(node.querySelector('[aria-label="More formatting options"]')).toBeNull();
      expect(node.querySelector('[role="toolbar"] [aria-label="Reset image"]')).not.toBeNull();
    } finally { bounds.mockRestore(); viewport.remove(); }
  });
  // Contract: every toolbar keeps its direct common controls and ends in the shared ten-action menu, without a Layers shortcut.
  it.each([
    ['text',()=>createTextElement()],['shape',()=>createShapeElement('rectangle')],
    ['image',()=>createImageElement('photo')],['line',()=>createLineElement('straight',{x:0,y:0},{x:100,y:20})],
  ] as const)('uses the shared final More menu for %s',async(type,create)=>{
    vi.stubGlobal('ResizeObserver',class{observe(){}unobserve(){}disconnect(){}});
    const element=create();useCanvasStore.setState({elements:[element],selectedElementIds:[element.id]});
    act(()=>root.render(<V3ElementToolbar element={element} onEditImage={()=>{}}/>));
    const common=[...node.querySelectorAll('.v3-common-actions button')].map(button=>button.getAttribute('aria-label'));
    expect(common).toEqual(['Lock','Duplicate','Delete',`More ${type} options`]);expect(node.querySelector('[aria-label="Open Layers sidebar"]')).toBeNull();
    const pointerData={button:0,ctrlKey:false,pointerType:'mouse'};
    await act(async()=>Simulate.pointerDown(node.querySelector(`[aria-label="More ${type} options"]`)!,pointerData));
    expect([...document.querySelectorAll('[aria-label="Element actions"] [role="menuitem"]')].map(item=>item.textContent)).toEqual(['Copy','Paste','Duplicate','Delete','Bring forward','Send backward','Bring to front','Send to back','Hide','Lock']);
  });
  // Contract: shape Effects routes to the sidebar callback instead of creating a local shadow popover.
  it('opens the shape Effects sidebar through the editor callback',async()=>{
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
    const element=createShapeElement('rectangle');useCanvasStore.setState({elements:[element],selectedElementIds:[element.id]});
    const onEditEffects=vi.fn();act(()=>root.render(<V3ElementToolbar element={element} onEditImage={()=>{}} onEditEffects={onEditEffects}/>));
    await act(async()=>Simulate.click(node.querySelector('[aria-label="Effects"]')!));
    expect(onEditEffects).toHaveBeenCalledTimes(1);
    expect(document.querySelector('[role="dialog"][aria-label="Effects"]')).toBeNull();
  });
  // Contract: spacing panel has both numeric controls and exactly three anchor icons, without the redundant heading or More Settings.
  it('matches the reference spacing composition and anchor selection',async()=>{
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
    const element=createTextElement();useCanvasStore.setState({elements:[element],selectedElementIds:[element.id]});
    const render=()=>root.render(<V3ElementToolbar element={useCanvasStore.getState().elements[0]} onEditImage={()=>{}}/>);
    act(render);await act(async()=>Simulate.click(node.querySelector('[aria-label="Text spacing"]')!));
    const popover=document.querySelector('.v3-text-spacing')!;expect(popover).not.toBe(null);
    expect(popover.querySelector('h3')).toBe(null);
    for(const label of ['Letter spacing value','Line spacing value','Anchor start','Anchor middle','Anchor end'])expect(popover.querySelector(`[aria-label="${label}"]`)).not.toBe(null);
    act(()=>Simulate.click(popover.querySelector('[aria-label="Anchor middle"]')!));act(render);
    expect(document.querySelector('[aria-label="Anchor middle"]')!.getAttribute('aria-pressed')).toBe('true');
    expect(useCanvasStore.getState().elements[0]).toMatchObject({textAnchor:'middle'});
    expect(popover.textContent).not.toContain('More settings');
  });
  // Contract: one case button cycles AA/aa/Aa with exactly one history entry each; no nested menu or content rewrite.
  it('cycles three case states directly and preserves the original text',async()=>{
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
    const element={...createTextElement(),content:'miXeD hOME'};useCanvasStore.setState({elements:[element],selectedElementIds:[element.id]});
    const render=()=>root.render(<V3ElementToolbar element={useCanvasStore.getState().elements[0]} onEditImage={()=>{}}/>);
    act(render);
    for(const [textTransform,icon] of [['uppercase','AA'],['lowercase','aa'],['capitalize','Aa']] as const){
      act(()=>Simulate.click(document.querySelector('button[aria-label="Text case"]')!));act(render);
      expect(useCanvasStore.getState().elements[0]).toMatchObject({textTransform,content:'miXeD hOME'});
      expect(document.querySelector('[aria-label="Text case"]')!.textContent).toBe(icon);
      expect(document.querySelectorAll('.v3-element-popover')).toHaveLength(0);
    }
    expect(useCanvasStore.getState().history.past).toHaveLength(3);
  });
  // Contract: text color opens a shared target without a document revision.
  it('routes text color to the shared sidebar',async()=>{
    const element=createTextElement();useCanvasStore.setState({elements:[element],selectedElementIds:[element.id]});
    act(()=>root.render(<V3ElementToolbar element={element} onEditImage={()=>{}}/>));
    await act(async()=>Simulate.click(node.querySelector('[aria-label="Text color"]')!));
    expect(useV3ColorPanel.getState().target).toEqual({elementId:element.id,slot:'color'});
    expect(useCanvasStore.getState().history.past).toHaveLength(0);
  });
  // Contract: opacity .555 must remain exact after a changed percent draft is cancelled or an unchanged rounded display blurs.
  it('cancels fractional opacity drafts without rounding canonical artwork',async()=>{
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
    const element={...createTextElement(),opacity:0.555};useCanvasStore.setState({elements:[element],selectedElementIds:[element.id]});
    act(()=>root.render(<V3ElementToolbar element={element} onEditImage={()=>{}}/>));
    await act(async()=>Simulate.click(node.querySelector('[aria-label="Opacity"]')!));
    const input=document.querySelector<HTMLInputElement>('[aria-label="Opacity value"]')!;
    act(()=>Simulate.blur(input));expect(useCanvasStore.getState().elements[0].opacity).toBe(0.555);
    act(()=>{input.value='42';Simulate.change(input);});
    act(()=>Simulate.keyDown(input,{key:'Escape'}));
    expect(useV3ElementPreview.getState().preview).toBe(null);
    expect(useCanvasStore.getState().elements[0].opacity).toBe(0.555);expect(useCanvasStore.getState().history.past).toHaveLength(0);
  });
  // Contract: Fit and Reset are direct named image actions; each mode changes only objectFit and Reset preserves it.
  it('exposes direct image fit and reset controls with separated appearance reset', async () => {
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
    const element = {...createImageElement('photo'), opacity:0.4, objectFit:'contain' as const};
    useCanvasStore.setState({elements:[element],selectedElementIds:[element.id]});
    act(()=>root.render(<V3ElementToolbar element={element} onEditImage={()=>{}}/>));
    const fit=node.querySelector('[aria-label="Image fit"]');expect(fit).not.toBe(null);
    expect(node.querySelector('[aria-label="Reset image"]')).not.toBe(null);
    await act(async()=>Simulate.click(fit!));
    const fill=document.querySelector('[aria-label="Fit fill"]');expect(fill).not.toBe(null);
    act(()=>Simulate.click(fill!));
    expect(useCanvasStore.getState().elements[0]).toMatchObject({objectFit:'fill',opacity:0.4});
    act(()=>Simulate.click(node.querySelector('[aria-label="Reset image"]')!));
    expect(useCanvasStore.getState().elements[0]).toMatchObject({objectFit:'fill',opacity:1,src:'photo'});
  });
  // Contract: text uses direct formatting buttons and keeps common actions in More.
  it('uses the inspected text control arrangement', async () => {
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
    const element=createTextElement();useCanvasStore.setState({elements:[element],selectedElementIds:[element.id]});
    act(()=>root.render(<V3ElementToolbar element={element} onEditImage={()=>{}}/>));
    for(const label of ['Text alignment','List style','Text spacing','Underline','Strikethrough','Text case'])expect(node.querySelector(`[aria-label="${label}"]`)).not.toBe(null);
    const pointerData={button:0,ctrlKey:false,pointerType:'mouse'};
    await act(async()=>Simulate.pointerDown(node.querySelector('[aria-label="More text options"]')!,pointerData));
    expect(document.querySelector('.v3-layer-menu[role=menu]')).not.toBe(null);
    expect(node.querySelector('[aria-label="Text case"]')).not.toBe(null);
    expect(document.querySelector('.v3-layer-menu [aria-label="Text case"]')).toBe(null);
  });
  // Contract: line has independent start/end and type pickers and a focused visual stroke control.
  it('uses icon pickers for line controls', async () => {
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
    const element=createLineElement('straight',{x:0,y:0},{x:200,y:0});useCanvasStore.setState({elements:[element],selectedElementIds:[element.id]});
    act(()=>root.render(<V3ElementToolbar element={element} onEditImage={()=>{}}/>));
    for(const label of ['Line type','Line start','Line end','Swap ends','Stroke'])expect(node.querySelector(`button[aria-label="${label}"]`)).not.toBe(null);
    await act(async()=>Simulate.click(node.querySelector('button[aria-label="Stroke"]')!));
    expect(document.querySelector('[aria-label="Rounded end points"]')).not.toBe(null);
    expect(document.querySelector('[aria-label="Line stroke patterns"]')).not.toBe(null);
  });
  // Contract: image Border is a direct control; its one pattern chooser and weight retain color editing without a duplicate native Style selector.
  it('opens a focused border popover directly from image formatting', async () => {
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
    const element = createImageElement('photo');
    useCanvasStore.setState({ elements: [element], selectedElementIds: [element.id] });
    act(() => root.render(<V3ElementToolbar element={element} onEditImage={() => {}}/>));
    const border = node.querySelector('[aria-label="Border"]');
    expect(border).not.toBe(null);
    await act(async () => Simulate.click(border!));
    const popover = document.querySelector('.v3-element-popover')!;
    expect(popover.querySelector('[aria-label="Border styles"]')!.children).toHaveLength(5);
    expect(popover.querySelector('[aria-label="Border style"]')).toBe(null);
    expect(popover.querySelector('[aria-label="Border width value"]')).not.toBe(null);
    expect(node.querySelector('button[aria-label="Border color"]')).not.toBe(null);
    expect(popover.querySelector('details')).toBe(null);
  });
  // Contract: Corners opens a compact Corner rounding slider/value with no extra footer, preserving 0 neutral.
  it('opens compact corner rounding for image selection', async () => {
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
    const element = createImageElement('photo');
    useCanvasStore.setState({ elements: [element], selectedElementIds: [element.id] });
    act(() => root.render(<V3ElementToolbar element={element} onEditImage={() => {}}/>));
    await act(async () => Simulate.click(node.querySelector('[aria-label="Corners"]')!));
    const popover = document.querySelector('.v3-element-popover--compact')!;
    expect(popover).not.toBe(null);
    expect(popover.querySelector('h3')!.textContent).toBe('Corner rounding');
    expect(popover.querySelector<HTMLInputElement>('[aria-label="Corner radius value"]')!.value).toBe('0');
    expect(popover.querySelectorAll('input')).toHaveLength(2);
  });
  // Contract: clicking Bold sets both boldtrue/weight700 in one history entry for the selected text.
  it('synchronizes bold and font weight', () => {
    const element = createTextElement();
    useCanvasStore.setState({ elements: [element], selectedElementIds: [element.id] });
    act(() => root.render(<V3ElementToolbar element={element} onEditImage={() => {}}/>));
    act(() => Simulate.click(node.querySelector('[aria-label="Bold"]')!));
    expect(useCanvasStore.getState().elements[0]).toMatchObject({ bold: true, fontWeight: 700 });
    expect(useCanvasStore.getState().history.past).toHaveLength(1);
  });
  // Contract: 500px font size is supported and typed intermediate characters create no history before blur.
  it('commits numeric font size on blur within the full supported range', () => {
    const element = createTextElement();
    useCanvasStore.setState({ elements: [element], selectedElementIds: [element.id] });
    act(() => root.render(<V3ElementToolbar element={element} onEditImage={() => {}}/>));
    const input = node.querySelector<HTMLInputElement>('[aria-label="Font size"]')!;
    act(() => { input.value = '500'; Simulate.change(input); });
    expect(useCanvasStore.getState().history.past).toHaveLength(0);
    act(() => Simulate.blur(input));
    expect(useCanvasStore.getState().elements[0]).toMatchObject({ fontSize: 500 });
    expect(useCanvasStore.getState().history.past).toHaveLength(1);
  });
});

describe('Nov2 compact toolbar presentation contract', () => {
  // Contract: first Escape cancels a changed opacity draft without closing; clean second Escape dismisses the popover.
  it('cancels a dirty transparency draft before allowing keyboard dismissal', async () => {
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
    const element = createImageElement('photo');
    useCanvasStore.setState({ elements: [element], selectedElementIds: [element.id] });
    act(() => root.render(<V3ElementToolbar element={element} onEditImage={() => {}}/>));
    await act(async () => Simulate.click(node.querySelector('[aria-label="Opacity"]')!));
    const input = document.querySelector<HTMLInputElement>('[aria-label="Opacity value"]')!;
    act(() => { input.focus(); input.value = '60'; Simulate.change(input); });
    await act(async () => { input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })); });
    expect(input.value).toBe('100');
    expect(document.querySelector('.v3-element-popover h3')!.textContent).toBe('Transparency');
    expect(useCanvasStore.getState().history.past).toHaveLength(0);
    await act(async () => { input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })); });
    expect(document.querySelector('.v3-element-popover')).toBe(null);
  });
  // Contract: Enter commits opacity60 once; immediately following Escape closes and preserves that committed value.
  it('dismisses transparency immediately after confirming a numeric value', async () => {
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
    const element = createImageElement('photo');
    useCanvasStore.setState({ elements: [element], selectedElementIds: [element.id] });
    act(() => root.render(<V3ElementToolbar element={element} onEditImage={() => {}}/>));
    await act(async () => Simulate.click(node.querySelector('[aria-label="Opacity"]')!));
    const input = document.querySelector<HTMLInputElement>('[aria-label="Opacity value"]')!;
    act(() => { input.focus(); input.value = '60'; Simulate.change(input); });
    act(() => Simulate.keyDown(input, { key: 'Enter' }));
    await act(async () => { input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })); });
    expect(document.querySelector('.v3-element-popover')).toBe(null);
    expect(useCanvasStore.getState().elements[0].opacity).toBe(0.6);
    expect(useCanvasStore.getState().history.past).toHaveLength(1);
  });
  // Contract: each direct image flip independently toggles its stored axis with one history entry.
  it.each(['horizontal', 'vertical'] as const)('exposes direct %s flip with its current pressed state', axis => {
    const element = createImageElement('photo');
    useCanvasStore.setState({ elements: [element], selectedElementIds: [element.id] });
    const render = () => root.render(<V3ElementToolbar element={useCanvasStore.getState().elements[0]} onEditImage={() => {}}/>);
    act(render);
    const flip = node.querySelector<HTMLButtonElement>(`[aria-label="Flip ${axis}"]`)!;
    expect(flip.getAttribute('aria-pressed')).toBe('false');
    expect(flip.textContent).toBe('');
    act(() => Simulate.click(flip));
    act(render);
    expect(flip.getAttribute('aria-pressed')).toBe('true');
    expect(useCanvasStore.getState().elements[0]).toMatchObject(axis === 'horizontal' ? { flipHorizontal: true, flipVertical: false } : { flipVertical: true, flipHorizontal: false });
    expect(useCanvasStore.getState().history.past).toHaveLength(1);
  });
  // Contract: text/image More triggers have only their three-dot icon, with their accessible name and title retained.
  it.each([['More text options', createTextElement], ['Image fit', () => createImageElement('photo')]] as const)('keeps %s accessible without a visible label', (label, create) => {
    const element = create();
    useCanvasStore.setState({ elements: [element], selectedElementIds: [element.id] });
    act(() => root.render(<V3ElementToolbar element={element} onEditImage={() => {}}/>));
    const more = node.querySelector<HTMLButtonElement>(`[aria-label="${label}"]`)!;
    expect(more.textContent).toBe('');
    expect(more.title).toBe(label);
    expect(more.querySelector('svg')).not.toBe(null);
  });
  // Contract: opacity is a direct icon action for every supported element, with fully opaque value100.
  it.each([
    ['text', () => createTextElement()], ['image', () => createImageElement('photo')],
    ['shape', () => createShapeElement('rectangle')], ['line', () => createLineElement('straight', { x: 0, y: 0 }, { x: 200, y: 0 })],
  ] as const)('exposes direct checkerboard transparency for %s', async (_type, create) => {
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
    const element = create();
    useCanvasStore.setState({ elements: [element], selectedElementIds: [element.id] });
    act(() => root.render(<V3ElementToolbar element={element} onEditImage={() => {}}/>));
    const button = node.querySelector<HTMLButtonElement>('[aria-label="Opacity"]')!;
    expect(button.textContent).toBe('');
    await act(async () => Simulate.click(button));
    const heading = document.querySelector('.v3-element-popover h3')!;
    expect(heading.textContent).toBe('Transparency');
    const input = document.querySelector<HTMLInputElement>('[aria-label="Opacity value"]')!;
    expect(input.value).toBe('100');
    act(() => { input.value = '60'; Simulate.change(input); });
    expect(useCanvasStore.getState().history.past).toHaveLength(0);
    act(() => Simulate.blur(input));
    expect(useCanvasStore.getState().elements[0].opacity).toBe(0.6);
    expect(useCanvasStore.getState().history.past).toHaveLength(1);
    vi.unstubAllGlobals();
  });
});

describe('Link field in the element toolbar', () => {
  // Contract: Link field is a labelled toolbar action for exactly one eligible text/image element and opens Template Fields via the callback.
  it.each([['text',()=>createTextElement()],['image',()=>createImageElement('photo')]] as const)('shows Link field for one %s element',async(_type,create)=>{
    vi.stubGlobal('ResizeObserver',class{observe(){}unobserve(){}disconnect(){}});
    const element=create();useCanvasStore.setState({elements:[element],selectedElementIds:[element.id]});
    const onLinkField=vi.fn();act(()=>root.render(<V3ElementToolbar element={element} onEditImage={()=>{}} onLinkField={onLinkField}/>));
    const button=node.querySelector('[aria-label="Link field"]') as HTMLButtonElement;
    expect(button.textContent).toBe('Link field');
    await act(async()=>Simulate.click(button));
    expect(onLinkField).toHaveBeenCalledTimes(1);
    expect(useCanvasStore.getState().selectedElementIds).toEqual([element.id]);
  });
  // Contract: unsupported, locked and multiple selections do not offer Link field.
  it('hides Link field for shapes, locked elements and multiple selection',()=>{
    vi.stubGlobal('ResizeObserver',class{observe(){}unobserve(){}disconnect(){}});
    const shape=createShapeElement('rectangle'),text=createTextElement(),locked={...createTextElement(),locked:true};
    useCanvasStore.setState({elements:[shape],selectedElementIds:[shape.id]});
    act(()=>root.render(<V3ElementToolbar element={shape} onEditImage={()=>{}} onLinkField={()=>{}}/>));
    expect(node.querySelector('[aria-label="Link field"]')).toBeNull();
    useCanvasStore.setState({elements:[locked],selectedElementIds:[locked.id]});
    act(()=>root.render(<V3ElementToolbar element={locked} onEditImage={()=>{}} onLinkField={()=>{}}/>));
    expect(node.querySelector('[aria-label="Link field"]')).toBeNull();
    useCanvasStore.setState({elements:[text,shape],selectedElementIds:[text.id,shape.id]});
    act(()=>root.render(<V3ElementToolbar element={text} onEditImage={()=>{}} onLinkField={()=>{}}/>));
    expect(node.querySelector('[aria-label="Link field"]')).toBeNull();
  });
});
const chooseFile = async (input: HTMLInputElement, file: File) => {
  Object.defineProperty(input, 'files', { value: [file], configurable: true });
  await act(async () => { input.dispatchEvent(new Event('change', { bubbles: true })); await new Promise(resolve => setTimeout(resolve, 10)); });
};
describe('Replace image stores the R2 URL', () => {
  // Contract: Replace uploads through uploadV3Image and the element keeps only the returned https URL (no data URL).
  it('replaces the image with the uploaded R2 URL', async () => {
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
    media.upload.mockReset().mockResolvedValue({ src: 'https://media.example.test/design-media/org/a.png', name: 'a.png', width: 40, height: 40 });
    const element = createImageElement('https://media.example.test/old.png'); useCanvasStore.setState({ elements: [element], selectedElementIds: [element.id] });
    act(() => root.render(<V3ElementToolbar element={element} onEditImage={() => {}} />));
    await chooseFile(node.querySelector('[aria-label="Replace image file"]') as HTMLInputElement, new File(['x'], 'a.png', { type: 'image/png' }));
    expect(media.upload).toHaveBeenCalledTimes(1);
    expect(useCanvasStore.getState().elements[0]).toMatchObject({ src: 'https://media.example.test/design-media/org/a.png', name: 'a.png' });
  });
  // Contract: a failed upload shows a retryable error and leaves the artwork unchanged.
  it('keeps the image and shows retry when the upload fails', async () => {
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
    media.upload.mockReset().mockRejectedValue(new Error('Image storage is unavailable. Your design is unchanged; retry the upload.'));
    const element = createImageElement('https://media.example.test/old.png'); useCanvasStore.setState({ elements: [element], selectedElementIds: [element.id] });
    act(() => root.render(<V3ElementToolbar element={element} onEditImage={() => {}} />));
    await chooseFile(node.querySelector('[aria-label="Replace image file"]') as HTMLInputElement, new File(['x'], 'a.png', { type: 'image/png' }));
    expect(node.querySelector('[role="alert"]')?.textContent).toContain('retry the upload');
    expect((useCanvasStore.getState().elements[0] as { src?: string }).src).toBe('https://media.example.test/old.png');
  });
});
