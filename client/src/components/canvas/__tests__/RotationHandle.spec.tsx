import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Simulate } from 'react-dom/test-utils';
import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import { RotationHandle } from '../RotationHandle';
import { createShapeElement } from '../../../lib/canvasUtils';
import { useCanvasStore } from '../../../hooks/useCanvasStore';

let node:HTMLDivElement,root:Root;
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
beforeEach(()=>{node=document.createElement('div');document.body.append(node);root=createRoot(node);});
afterEach(()=>{act(()=>root.unmount());node.remove();});
describe('US-EDIT-034 rotation contracts',()=>{
  // Contract: keyboard-entered -15 degrees persists normalized345 in one history step.
  it('applies a finite numeric rotation once and Undo restores it',()=>{
    const element=createShapeElement('rectangle');
    useCanvasStore.setState({elements:[element],selectedElementIds:[element.id],history:{past:[],future:[]},zoom:1});
    act(()=>root.render(<RotationHandle element={element}/>));
    act(()=>Simulate.keyDown(node.querySelector('button')!,{key:'Enter'}));
    const input=node.querySelector('input')!;
    act(()=>{input.value='-15';Simulate.change(input);});
    act(()=>Simulate.submit(node.querySelector('form')!));
    expect(useCanvasStore.getState().elements[0].rotation).toBe(345);
    expect(useCanvasStore.getState().history.past).toHaveLength(1);
    act(()=>useCanvasStore.getState().undo());
    expect(useCanvasStore.getState().elements[0].rotation).toBe(0);
  });
  // Contract: opening angle entry and Escape does not change a stored angle/history.
  it('cancels pending numeric input without a document revision',()=>{
    const element=createShapeElement('rectangle');
    useCanvasStore.setState({elements:[element],selectedElementIds:[element.id],history:{past:[],future:[]},zoom:.5});
    act(()=>root.render(<RotationHandle element={element}/>));
    act(()=>Simulate.keyDown(node.querySelector('button')!,{key:'Enter'}));
    act(()=>{const input=node.querySelector('input')!;input.value='60';Simulate.change(input);});
    act(()=>window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'})));
    expect(useCanvasStore.getState().elements[0].rotation).toBe(0);
    expect(useCanvasStore.getState().history.past).toHaveLength(0);
    expect(node.querySelector('form')).toBeNull();
    act(()=>Simulate.keyDown(node.querySelector('button')!,{key:'Enter'}));
    expect(node.querySelector('input')!.value).toBe('0');
  });
  it('does not expose an editing handle for a locked shape',()=>{
    const element={...createShapeElement('star'),locked:true};
    act(()=>root.render(<RotationHandle element={element}/>));
    expect(node.childElementCount).toBe(0);
  });
});
