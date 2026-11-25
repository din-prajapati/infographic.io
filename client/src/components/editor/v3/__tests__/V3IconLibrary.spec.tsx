import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Simulate } from 'react-dom/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { V3IconLibrary } from '../V3IconLibrary';
import { usePropertyStore } from '../../../../hooks/usePropertyStore';
import { createPropertyIcon } from '../../../../lib/propertyIcons';

let host: HTMLDivElement, root: Root;
beforeEach(() => { vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true); host = document.createElement('div'); document.body.append(host); root = createRoot(host); usePropertyStore.getState().resetProperty(); });
afterEach(() => { act(() => root.unmount()); host.remove(); vi.unstubAllGlobals(); });
function button(name: string) { return ([...host.querySelectorAll<HTMLButtonElement>('button')].find(item => item.getAttribute('aria-label') === name) ?? null)!; }

describe('US-EDIT-041 property library panel', () => {
  // Contract: German search narrows to Heating; one click returns a single image or a two-element editable row.
  it('searches bilingual names and inserts editable rows as one callback', () => {
    const onInsert = vi.fn(); act(() => root.render(<V3IconLibrary mode="icons" onInsert={onInsert} />));
    const search = host.querySelector<HTMLInputElement>('input[type="search"]')!;
    act(() => { search.value = 'Heizung'; Simulate.change(search); });
    expect(button('Insert Heating')).not.toBeNull(); expect(button('Insert Shower')).toBeNull();
    act(() => button('Insert Heating').click()); expect(onInsert.mock.calls[0][0]).toHaveLength(1);
    act(() => button('Icon + label').click()); act(() => button('Insert Heating').click());
    const row = onInsert.mock.calls[1][0]; expect(row).toHaveLength(2); expect(row[1]).toMatchObject({ type: 'text', content: 'Heating' }); expect(row[1].slot).toBeUndefined();
    act(() => { search.value = 'nothingmatches'; Simulate.change(search); }); expect(host.textContent).toContain('No icons found');
  });

  // Contract: location row uses the existing property location binding; replacement sends only artwork patch.
  it('binds exact existing fields and preserves replacement geometry', () => {
    usePropertyStore.getState().setProperty({ address: 'Berlin Prenzlauer Berg' }); const onInsert = vi.fn();
    act(() => root.render(<V3IconLibrary mode="icons" onInsert={onInsert} />)); act(() => button('Icon + label').click()); act(() => button('Insert Location').click());
    expect(onInsert.mock.calls[0][0][1]).toMatchObject({ content: 'Berlin Prenzlauer Berg', slot: 'property.location' });
    const icon = createPropertyIcon('heating'), onReplace = vi.fn(); act(() => root.render(<V3IconLibrary mode="icons" replaceElement={icon} onInsert={onInsert} onReplace={onReplace} />));
    act(() => button('Replace with Shower').click()); expect(onReplace.mock.calls[0][0].icon.id).toBe('shower'); expect(onReplace.mock.calls[0][0].x).toBeUndefined();
    act(() => root.render(<V3IconLibrary mode="icons" replaceElement={{ ...icon, locked: true }} onInsert={onInsert} onReplace={onReplace} />)); act(() => button('Replace with Shower').click()); expect(onReplace).toHaveBeenCalledTimes(1);
  });

  // Contract: curated emoji insert editable text and disclose platform-dependent font appearance.
  it('inserts emoji as editable text without an external asset', () => {
    const onInsert = vi.fn(); act(() => root.render(<V3IconLibrary mode="emoji" onInsert={onInsert} />));
    act(() => button('Insert House emoji').click()); expect(onInsert.mock.calls[0][0][0]).toMatchObject({ type: 'text', content: '🏠' }); expect(host.textContent).toContain('appearance varies');
  });
});
