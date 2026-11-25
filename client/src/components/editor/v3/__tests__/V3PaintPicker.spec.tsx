import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Simulate } from 'react-dom/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { V3PaintPicker } from '../V3PaintPicker';

let node:HTMLDivElement,root:Root;
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
beforeEach(()=>{node=document.createElement('div');document.body.append(node);root=createRoot(node);});
afterEach(()=>{act(()=>root.unmount());node.remove();});
function setup(supportsGradients=true){const callbacks={onDraft:vi.fn(),onCommit:vi.fn(),onCancel:vi.fn(),onClose:vi.fn()};act(()=>root.render(<V3PaintPicker currentPaint={{type:'solid',color:'#FF0000',opacity:1}} supportsGradients={supportsGradients} {...callbacks}/>));return callbacks;}
describe('US-EDIT-036 detailed paint picker',()=>{
  it('keeps opacity editable with a separate fixed percent suffix and cancels invalid input',()=>{
    const callbacks=setup();const input=node.querySelector<HTMLInputElement>('[aria-label="Color opacity percent"]')!;
    const group=node.querySelector('.v3-paint-opacity-value')!;expect(group).not.toBeNull();expect(group.querySelector('.v3-paint-percent-suffix')!.textContent).toBe('%');
    for(const value of ['0','50','100']){act(()=>{input.value=value;Simulate.change(input);});act(()=>Simulate.keyDown(input,{key:'Enter'}));expect(callbacks.onCommit.mock.calls.at(-1)?.[0].opacity).toBe(Number(value)/100);}
    const count=callbacks.onCommit.mock.calls.length;act(()=>{input.value='101';Simulate.change(input);});act(()=>Simulate.blur(input));expect(callbacks.onCommit).toHaveBeenCalledTimes(count);expect(input.value).toBe('100');
    act(()=>{input.value='50';Simulate.change(input);});act(()=>Simulate.keyDown(input,{key:'Escape'}));act(()=>Simulate.blur(input));expect(callbacks.onCommit).toHaveBeenCalledTimes(count);expect(input.value).toBe('100');
  });
  // Contract: entering Gradient previews two stops and creates no completed edit until choosing a preset.
  it('previews a gradient tab and commits exactly one chosen preset',()=>{
    const callbacks=setup();
    act(()=>Simulate.click(node.querySelector('[role="tab"][aria-label="Gradient"]')!));
    expect(callbacks.onCommit).toHaveBeenCalledTimes(0);
    expect(callbacks.onDraft.mock.calls.at(-1)?.[0]).toMatchObject({type:'linear',angle:0,stops:[{color:'#FF0000',opacity:1},{color:'#FFFFFF',opacity:1}]});
    act(()=>Simulate.click(node.querySelector('[aria-label="Top to bottom"]')!));
    expect(callbacks.onCommit).toHaveBeenCalledTimes(1);
    expect(callbacks.onCommit.mock.calls[0][0]).toMatchObject({type:'linear',angle:90});
  });
  // Contract: invalid hex leaves document unchanged, valid hex previews until Enter confirmation.
  it('previews valid numeric/color typing and commits only on confirmation',()=>{
    const callbacks=setup();const hex=node.querySelector<HTMLInputElement>('[aria-label="Hex color"]')!;
    act(()=>{hex.value='#123456';Simulate.change(hex);});
    expect(callbacks.onDraft.mock.calls.at(-1)?.[0]).toEqual({type:'solid',color:'#123456',opacity:1});
    expect(callbacks.onCommit).toHaveBeenCalledTimes(0);
    act(()=>Simulate.keyDown(hex,{key:'Enter'}));
    expect(callbacks.onCommit).toHaveBeenCalledTimes(1);expect(callbacks.onCommit).toHaveBeenCalledWith({type:'solid',color:'#123456',opacity:1});
  });
  // Contract: first Escape cancels dirty preview; next Escape closes the picker without committing.
  it('cancels before closing with Escape',()=>{
    const callbacks=setup();const hex=node.querySelector<HTMLInputElement>('[aria-label="Hex color"]')!;
    act(()=>{hex.value='#123456';Simulate.change(hex);});
    act(()=>Simulate.keyDown(hex,{key:'Escape'}));
    expect(callbacks.onCancel).toHaveBeenCalledTimes(1);expect(callbacks.onClose).toHaveBeenCalledTimes(0);
    expect(hex.value).toBe('#FF0000');
    act(()=>Simulate.blur(hex));
    expect(callbacks.onCommit).toHaveBeenCalledTimes(0);
    act(()=>Simulate.keyDown(hex,{key:'Escape'}));
    expect(callbacks.onClose).toHaveBeenCalledTimes(1);expect(callbacks.onCommit).toHaveBeenCalledTimes(0);
  });
  // Contract: solid-only shadow targets never expose a Gradient tab.
  it('omits gradients for solid-only targets',()=>{setup(false);expect(node.querySelector('[role="tab"][aria-label="Gradient"]')).toBe(null);});
  // Contract: five presets retain explicit semantics; gradients contain exactly 2..5 evenly spaced stops.
  it('limits gradient stops and exposes all five styles',()=>{
    const callbacks=setup();act(()=>Simulate.click(node.querySelector('[aria-label="Gradient"]')!));
    const add=()=>node.querySelector<HTMLButtonElement>('[aria-label="Add gradient stop"]')!;
    const remove=()=>node.querySelector<HTMLButtonElement>('[aria-label="Remove gradient stop"]')!;
    expect(remove().disabled).toBe(true);
    for(let index=0;index<3;index++)act(()=>Simulate.click(add()));
    expect(add().disabled).toBe(true);
    expect(callbacks.onCommit.mock.calls.at(-1)?.[0].stops).toHaveLength(5);
    for(const name of ['Left to right','Top to bottom','Diagonal','Center out','Corner out'])expect(node.querySelector(`[aria-label="${name}"]`)).not.toBe(null);
    act(()=>Simulate.click(node.querySelector('[aria-label="Corner out"]')!));
    expect(callbacks.onCommit.mock.calls.at(-1)?.[0]).toMatchObject({type:'radial',center:'corner'});
    for(let index=0;index<3;index++)act(()=>Simulate.click(remove()));
    expect(remove().disabled).toBe(true);
    expect(callbacks.onCommit.mock.calls.at(-1)?.[0].stops).toHaveLength(2);
  });
  // Contract: alpha previews independently, pointer release commits once; pointer cancellation never commits.
  it('commits alpha on release and cancels a later gesture',()=>{
    const callbacks=setup();const alpha=node.querySelector<HTMLInputElement>('[aria-label="Alpha"]')!;
    act(()=>{alpha.value='35';Simulate.change(alpha);});
    expect(callbacks.onDraft.mock.calls.at(-1)?.[0]).toEqual({type:'solid',color:'#FF0000',opacity:0.35});
    expect(callbacks.onCommit).toHaveBeenCalledTimes(0);
    act(()=>Simulate.pointerUp(alpha));
    expect(callbacks.onCommit).toHaveBeenCalledTimes(1);
    act(()=>{alpha.value='20';Simulate.change(alpha);});
    act(()=>Simulate.pointerCancel(alpha));
    expect(callbacks.onCommit).toHaveBeenCalledTimes(1);
    expect(callbacks.onCancel).toHaveBeenCalledTimes(1);
    expect(alpha.value).toBe('35');
  });
  // Contract: invalid typed percent cannot commit or replace a valid color.
  it('rejects invalid percent and restores on numeric confirmation',()=>{
    const callbacks=setup(),input=node.querySelector<HTMLInputElement>('[aria-label="Color opacity percent"]')!;
    act(()=>{input.value='120';Simulate.change(input);});
    expect(callbacks.onDraft).toHaveBeenCalledTimes(0);
    act(()=>Simulate.keyDown(input,{key:'Enter'}));
    expect(callbacks.onCommit).toHaveBeenCalledTimes(0);
    expect(input.value).toBe('100');
  });
  // Contract: focusing/blurring a displayed percentage does not quantize existing high precision alpha.
  it('does not commit clean hex or rounded percent displays',()=>{
    const callbacks={onDraft:vi.fn(),onCommit:vi.fn(),onCancel:vi.fn(),onClose:vi.fn()};
    act(()=>root.render(<V3PaintPicker currentPaint={{type:'solid',color:'#FF0000',opacity:0.55555}} {...callbacks}/>));
    act(()=>Simulate.blur(node.querySelector('[aria-label="Color opacity percent"]')!));
    act(()=>Simulate.blur(node.querySelector('[aria-label="Hex color"]')!));
    expect(callbacks.onCommit).toHaveBeenCalledTimes(0);
  });
});
