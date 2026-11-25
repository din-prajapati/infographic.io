import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Simulate } from 'react-dom/test-utils';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { V3Tools } from '../V3Tools';
import { V3TextInspector } from '../V3TextInspector';
import { useCanvasStore } from '../../../../hooks/useCanvasStore';
import { createTextElement, createShapeElement, createImageElement } from '../../../../lib/canvasUtils';

let node: HTMLDivElement;
let root: Root;
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
beforeEach(() => {
  node = document.createElement('div'); document.body.append(node); root = createRoot(node);
  useCanvasStore.setState({elements: [], selectedElementIds: [], history: {past: [], future: []}});
});
describe('Text draft contract', () => {
  // AC6: two draft changes commit once at blur; Undo restores the whole original string.
  it('commits content as one history boundary on blur', () => {
    const element=createTextElement(80,120,'Original');
    useCanvasStore.setState({elements:[element],selectedElementIds:[element.id]});
    act(()=>root.render(<V3TextInspector/>));
    const input=node.querySelector('textarea')!;
    act(()=>{input.value='Draft one';Simulate.change(input);});
    act(()=>{input.value='Final draft';Simulate.change(input);});
    expect(useCanvasStore.getState().history.past).toHaveLength(0);
    act(()=>Simulate.blur(input));
    expect(useCanvasStore.getState().elements[0]).toMatchObject({content:'Final draft'});
    expect(useCanvasStore.getState().history.past).toHaveLength(1);
    act(()=>useCanvasStore.getState().undo());
    expect(useCanvasStore.getState().elements[0]).toMatchObject({content:'Original'});
  });
  // AC6: Escape cancels a changed draft without making any history entry.
  it('cancels uncommitted text on Escape', () => {
    const element=createTextElement(80,120,'Original');
    useCanvasStore.setState({elements:[element],selectedElementIds:[element.id]});
    act(()=>root.render(<V3TextInspector/>));const input=node.querySelector('textarea')!;
    act(()=>{input.value='Do not keep';Simulate.change(input);});
    act(()=>Simulate.keyDown(input,{key:'Escape'}));act(()=>Simulate.blur(input));
    expect(input.value).toBe('Original');expect(useCanvasStore.getState().history.past).toHaveLength(0);
  });
  // AC12: Preview-trigger blur leaves the pending draft and store untouched.
  it('exempts the Preview trigger from committing pending text', () => {
    const element=createTextElement(80,120,'Original');
    useCanvasStore.setState({elements:[element],selectedElementIds:[element.id]});
    act(()=>root.render(<V3TextInspector/>));const input=node.querySelector('textarea')!;
    act(()=>{input.value='Pending preview';Simulate.change(input);});
    const trigger=document.createElement('button');trigger.dataset.v3PreviewTrigger='';
    act(()=>Simulate.blur(input,{relatedTarget:trigger}));
    expect(input.value).toBe('Pending preview');expect(useCanvasStore.getState().elements[0]).toMatchObject({content:'Original'});
  });
});
afterEach(() => { act(() => root.unmount()); node.remove(); });
const click = (name: string) => act(() => {
  const button = [...node.querySelectorAll('button')].find(item => item.getAttribute('aria-label') === name || item.textContent === name);
  if (!button) throw new Error(`Missing ${name}`); button.click();
});
describe('approved tools contract', () => {
  // US-EDIT-032 AC1: the Line menu arms real drawing tools without inserting a substitute on choice.
  it('offers three enabled line drawing choices', () => {
    act(() => root.render(<V3Tools onText={() => {}} onImage={() => {}} onClose={() => {}} />));
    click('Line');
    for (const name of ['Straight line', 'Curved line', 'Elbow line']) {
      const button = [...node.querySelectorAll('button')].find(item => item.textContent?.includes(name));
      expect(button?.disabled).toBe(false);
    }
    click('Curved line');
    expect(useCanvasStore.getState().activeTool).toBe('line-curved');
    expect(useCanvasStore.getState().elements).toHaveLength(0);
  });
  // AC5: all three element types in a multi-selection duplicate; deletion skips locked members.
  it('duplicates every selected type and deletes only unlocked selections', () => {
    const elements = [createTextElement(), createShapeElement('star'), createImageElement('data:image/png;base64,test')];
    useCanvasStore.setState({elements, selectedElementIds: elements.map(item => item.id)});
    act(() => root.render(<V3Tools onText={() => {}} onImage={() => {}} onClose={() => {}} />));
    click('Duplicate'); expect(useCanvasStore.getState().elements).toHaveLength(6);
    act(() => useCanvasStore.setState({elements: elements.map((item,index) => ({...item, locked:index === 0})), selectedElementIds: elements.map(item=>item.id)}));
    click('Delete'); expect(useCanvasStore.getState().elements.map(item=>item.id)).toEqual([elements[0].id]);
  });
  // AC3: Star is a real shape element in the existing store, not a preview-only note.
  it('creates the chosen shape', () => {
    act(() => root.render(<V3Tools onText={() => {}} onImage={() => {}} onClose={() => {}} />));
    click('Shapes'); click('Star');
    expect(useCanvasStore.getState().elements[0]).toMatchObject({type:'shape',shapeType:'star'});
  });
});
