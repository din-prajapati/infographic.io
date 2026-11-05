import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Simulate } from 'react-dom/test-utils';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { V3EffectsPanel } from '../V3EffectsPanel';
import { useCanvasStore } from '../../../../hooks/useCanvasStore';
import { useV3ElementPreview } from '../../../../hooks/useV3ElementPreview';
import { createShapeElement } from '../../../../lib/canvasUtils';

let node:HTMLDivElement,root:Root;
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
beforeEach(()=>{node=document.createElement('div');document.body.append(node);root=createRoot(node);useCanvasStore.setState({elements:[],selectedElementIds:[],history:{past:[],future:[]}});});
afterEach(()=>{act(()=>root.unmount());node.remove();});
function setup(){const element=createShapeElement('rectangle');useCanvasStore.setState({elements:[element],selectedElementIds:[element.id]});const close=vi.fn();const render=()=>root.render(<V3EffectsPanel element={useCanvasStore.getState().elements[0] as typeof element} onClose={close}/>);act(render);return{element,render,close};}
describe('US-EDIT-038 Effects sidebar',()=>{
  it('preserves fractional shadow opacity when its rounded display is blurred without editing',()=>{
    const {element,render}=setup();const shadow={color:'#000000',opacity:1/3,blur:12,offsetX:4,offsetY:4};
    useCanvasStore.setState({elements:[{...element,shadow}]});act(render);
    const value=node.querySelector<HTMLInputElement>('[aria-label="Shadow opacity value"]')!;expect(value.value).toBe('33');
    act(()=>Simulate.blur(value));expect(useCanvasStore.getState().elements[0]).toMatchObject({shadow});expect(useCanvasStore.getState().history.past).toHaveLength(0);
  });
  it('exposes eight functional visual cards and applies Glow with one undo step',()=>{
    const {render}=setup();
    for(const label of ['None','Drop','Glow','Echo','Glitch','Radioactive','Retro','Midnight'])expect(node.querySelector(`button[aria-label="Effect ${label}"]`)).not.toBeNull();
    expect(node.querySelector('h3')!.textContent).toBe('Advanced');
    act(()=>Simulate.click(node.querySelector('[aria-label="Effect Glow"]')!));act(render);
    expect(useCanvasStore.getState().elements[0]).toMatchObject({shadow:{offsetX:0,offsetY:0}});
    expect(useCanvasStore.getState().history.past).toHaveLength(1);
    expect(node.querySelector('[aria-label="Effect Glow"]')!.getAttribute('aria-pressed')).toBe('true');
    expect(node.querySelector('[aria-label="Shadow opacity value"]')).not.toBeNull();
  });
  it('previews without history, cancels on leave and rejects an obsolete selection',()=>{
    setup();const glow=node.querySelector('[aria-label="Effect Glow"]')!;
    act(()=>Simulate.mouseEnter(glow));expect(useV3ElementPreview.getState().preview).not.toBeNull();expect(useCanvasStore.getState().history.past).toHaveLength(0);
    act(()=>Simulate.mouseLeave(glow));expect(useV3ElementPreview.getState().preview).toBeNull();
    useCanvasStore.setState({selectedElementIds:[]});act(()=>Simulate.click(glow));expect(useCanvasStore.getState().history.past).toHaveLength(0);
  });
  it('None clears every shadow layer and Close clears the transient effect',()=>{
    const {render,close}=setup();act(()=>Simulate.click(node.querySelector('[aria-label="Effect Echo"]')!));act(render);
    expect(useCanvasStore.getState().elements[0]).toHaveProperty('shadowLayers');
    act(()=>Simulate.click(node.querySelector('[aria-label="Effect None"]')!));act(render);
    expect(useCanvasStore.getState().elements[0]).toMatchObject({shadow:undefined,shadowLayers:undefined});
    act(()=>Simulate.mouseEnter(node.querySelector('[aria-label="Effect Drop"]')!));act(()=>Simulate.click(node.querySelector('[aria-label="Close Effects"]')!));
    expect(close).toHaveBeenCalledOnce();expect(useV3ElementPreview.getState().preview).toBeNull();
  });
});
