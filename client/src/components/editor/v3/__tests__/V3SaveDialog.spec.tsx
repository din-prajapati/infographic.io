import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Simulate } from 'react-dom/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { V3SaveDialog, type V3SaveDialogProps } from '../V3SaveDialog';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
let host: HTMLDivElement;
let root: ReturnType<typeof createRoot>;
afterEach(() => { if (root) act(() => root.unmount()); host?.remove(); });
function render(overrides: Partial<V3SaveDialogProps> = {}) {
  host = document.createElement('div'); host.className = 'v3-editor'; host.dataset.theme = 'dark'; document.body.append(host); root = createRoot(host);
  const props: V3SaveDialogProps = { action: 'design', initialName: 'Oak Road', initialTags: ['luxury'], initialCategory: 'real-estate', sourceHasChanges: false, hasSourceId: false, pendingUpdates: 3, onClose: vi.fn(), onSubmit: vi.fn(async () => {}), ...overrides };
  act(() => root.render(<V3SaveDialog {...props}/>)); return props;
}
const button = (name: string) => [...document.querySelectorAll<HTMLButtonElement>('button')].find(el => el.textContent === name)!;
function change(input: HTMLInputElement, value: string) {
  act(() => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, value); input.dispatchEvent(new Event('input', { bubbles: true })); });
}
describe('approved creation dialogs', () => {
  it('provides optional editable Design tags and preserves pending listing disclosure', () => {
    render(); expect(document.querySelector('[role=dialog]')?.textContent).toContain('3 pending listing updates');
    expect(document.querySelector('summary')?.textContent).toBe('Tags (optional)'); expect(document.querySelector('select')).toBeNull();
    expect((document.querySelector('[aria-label="Design name"]') as HTMLInputElement).value).toBe('Oak Road');
  });
  it('does not submit empty names or duplicate pending requests', async () => {
    let resolve!: () => void; const submit = vi.fn(() => new Promise<void>(yes => { resolve = yes; })); render({ onSubmit: submit });
    change(document.querySelector('[aria-label="Design name"]')!, '  '); expect(button('Save design').disabled).toBe(true);
    change(document.querySelector('[aria-label="Design name"]')!, 'Named'); act(() => button('Save design').click());
    expect(submit).toHaveBeenCalledTimes(1); expect(button('Saving…').disabled).toBe(true); await act(async () => resolve());
  });
  it('keeps entered values after failure and offers inline retry', async () => {
    render({ onSubmit: vi.fn(async () => { throw new Error('Offline'); }) });
    change(document.querySelector('[aria-label="Design name"]')!, 'My house'); await act(async () => button('Save design').click());
    expect(document.querySelector('[role=alert]')?.textContent).toBe('Offline'); expect(button('Retry save')).toBeTruthy();
    expect((document.querySelector('[aria-label="Design name"]') as HTMLInputElement).value).toBe('My house');
  });
  it('exposes unchecked source-save consent only when an existing source is dirty', () => {
    render({ action: 'copy', hasSourceId: true, sourceHasChanges: true });
    expect((document.querySelector('[type=checkbox]') as HTMLInputElement).checked).toBe(false);
    expect(document.querySelector('[role=dialog]')?.textContent).toContain('The original keeps its last saved version.');
  });
  it('explains template sanitation and provides category and tags without a destination toggle', () => {
    render({ action: 'template' }); expect(document.querySelector('summary')?.textContent).toBe('Category and tags (optional)');
    expect(document.querySelector('[role=dialog]')?.textContent).toContain('Clears linked listing facts and photos.'); expect(document.querySelector('select')).not.toBeNull();
    expect(document.querySelector('[aria-label="Template name"]')).not.toBeNull();
  });
  it('adds tags with Enter without submitting and prevents longer or sixth tags', () => {
    const submit = vi.fn(async () => {}); render({ onSubmit: submit, initialTags: ['one', 'two', 'three', 'four'] });
    const input = document.querySelector<HTMLInputElement>('[aria-label="Add a tag"]')!;
    change(input, 'fifth'); act(() => Simulate.keyDown(input, { key: 'Enter' }));
    expect(document.querySelector('[aria-label="Remove tag fifth"]')).not.toBeNull(); expect(submit).not.toHaveBeenCalled();
    change(input, 'sixth'); act(() => button('Add tag').click()); expect(document.querySelector('[role=alert]')?.textContent).toBe('Use up to 5 tags.');
    change(input, 'x'.repeat(21)); act(() => button('Add tag').click()); expect(document.querySelector('[role=alert]')?.textContent).toBe('Use 20 characters or fewer per tag.');
  });
  it('retains the legacy 50 character name limit', () => {
    render(); expect(document.querySelector<HTMLInputElement>('[aria-label="Design name"]')?.maxLength).toBe(50);
  });
});
