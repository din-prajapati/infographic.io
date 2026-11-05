import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Simulate } from 'react-dom/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { V3ColorPanel } from '../V3ColorPanel';
import type { Paint } from '../../../../lib/canvasTypes';

let node: HTMLDivElement, root: Root;
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const red:Paint={type:'solid',color:'#FF0000',opacity:1};
beforeEach(()=>{node=document.createElement('div');node.className='v3-editor';document.body.append(node);root=createRoot(node);});
afterEach(()=>{act(()=>root.unmount());node.remove();vi.unstubAllGlobals();});
function setup(extra:Record<string,unknown>={}){
  const callbacks={onDraft:vi.fn(),onCommit:vi.fn(),onCancel:vi.fn(),onClose:vi.fn(),onEditBrand:vi.fn()};
  act(()=>root.render(<V3ColorPanel targetLabel="Fill color" currentPaint={red} designColors={[red]} brandPalettes={[{id:'brand',name:'My brand',colors:[{type:'solid',color:'#00FF00',opacity:1}]}]} defaultColors={[red,{type:'linear',angle:0,stops:[{color:'#000000',opacity:1},{color:'#FFFFFF',opacity:1}]}]} {...callbacks} {...extra}/>));
  return callbacks;
}
describe('US-EDIT-036 shared color panel',()=>{
  // Contract: searching Orange finds the editor's actual default orange, #F97316.
  it('searches the named shades in the supplied default palette',()=>{
    setup({defaultColors:[{type:'solid',color:'#F97316',opacity:1}]});
    const search=node.querySelector<HTMLInputElement>('[aria-label="Search colors"]')!;
    act(()=>{search.value='orange';Simulate.change(search);});
    expect(node.querySelector('[aria-label="Default color: Orange #F97316"]')).not.toBe(null);
  });
  // Contract: choosing No color commits none once; opening the sidebar itself does not draft or commit.
  it('shows the target sections and commits No color directly',()=>{
    const callbacks=setup();
    expect(node.querySelector('h2')?.textContent).toBe('Fill color');
    for(const title of ['Colors in this design','Brand colors','Default solid colors','Default gradients'])expect(node.textContent).toContain(title);
    expect(callbacks.onDraft).toHaveBeenCalledTimes(0);
    expect(callbacks.onCommit).toHaveBeenCalledTimes(0);
    act(()=>Simulate.click(node.querySelector('[aria-label="No color"]')!));
    expect(callbacks.onCommit).toHaveBeenCalledTimes(1);expect(callbacks.onCommit).toHaveBeenCalledWith({type:'none'});
  });
  // Contract: a valid custom searched hex becomes an explicit one-click swatch without mutating while typing.
  it('filters and offers a searched custom hex; Brand Edit remains separate',()=>{
    const callbacks=setup();
    const search=node.querySelector<HTMLInputElement>('[aria-label="Search colors"]')!;
    act(()=>{search.value='#123456';Simulate.change(search);});
    expect(callbacks.onDraft).toHaveBeenCalledTimes(0);
    act(()=>Simulate.click(node.querySelector('[aria-label="Use #123456"]')!));
    expect(callbacks.onCommit).toHaveBeenCalledTimes(1);expect(callbacks.onCommit).toHaveBeenCalledWith({type:'solid',color:'#123456',opacity:1});
    act(()=>Simulate.click(node.querySelector('[aria-label="Edit brand colors"]')!));
    expect(callbacks.onEditBrand).toHaveBeenCalledTimes(1);
  });
  // Contract: unsupported EyeDropper is disabled while manual entry remains available.
  it('keeps unsupported eyedropper harmless and the picker accessible',async()=>{
    const callbacks=setup();
    expect(node.querySelector<HTMLButtonElement>('[aria-label="Pick color from screen"]')!.disabled).toBe(true);
    await act(async()=>Simulate.click(node.querySelector('[aria-label="Add color"]')!));
    expect(document.querySelector('[aria-label="Custom color picker"]')).not.toBe(null);
    expect(document.querySelector('[aria-label="Hex color"]')).not.toBe(null);
    expect(callbacks.onCommit).toHaveBeenCalledTimes(0);
  });
  // Contract: locked/disabled targets expose no enabled paint mutations.
  it('disables direct mutations for an ineligible target',()=>{
    const callbacks=setup({disabled:true});
    expect(node.querySelector<HTMLButtonElement>('[aria-label="No color"]')!.disabled).toBe(true);
    expect(node.querySelector<HTMLButtonElement>('[aria-label="Add color"]')!.disabled).toBe(true);
    expect(callbacks.onCommit).toHaveBeenCalledTimes(0);
  });
  // Contract: list view shows descriptive color labels, and searching a color name filters design swatches.
  it('switches labeled swatches to list view and searches common color names',()=>{
    setup();act(()=>Simulate.click(node.querySelector('[aria-label="Show color list"]')!));
    expect(node.querySelector('.v3-panel-color-swatches--list')?.textContent).toBe('Red #FF0000');
    const search=node.querySelector<HTMLInputElement>('[aria-label="Search colors"]')!;
    act(()=>{search.value='green';Simulate.change(search);});
    expect(node.querySelector('[aria-label="Design color: Red #FF0000"]')).toBe(null);
    expect(node.querySelector('[aria-label="My brand color: Green #00FF00"]')).not.toBe(null);
  });
  // Contract: browser eyedropper cancellation leaves the current target paint unchanged.
  it('treats supported eyedropper cancellation as a harmless no-op',async()=>{
    vi.stubGlobal('EyeDropper',class{open(){return Promise.reject(new Error('Cancelled'));}});
    const callbacks=setup();const eyedropper=node.querySelector<HTMLButtonElement>('[aria-label="Pick color from screen"]')!;
    expect(eyedropper.disabled).toBe(false);
    await act(async()=>Simulate.click(eyedropper));
    expect(callbacks.onCommit).toHaveBeenCalledTimes(0);expect(callbacks.onDraft).toHaveBeenCalledTimes(0);
  });
});
