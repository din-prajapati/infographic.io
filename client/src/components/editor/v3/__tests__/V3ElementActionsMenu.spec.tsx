import React,{act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {Simulate} from 'react-dom/test-utils';
import {beforeEach,afterEach,describe,it,expect} from 'vitest';
import {V3ElementActionsMenu} from '../V3ElementActionsMenu';
import {useCanvasStore} from '../../../../hooks/useCanvasStore';
import {createShapeElement} from '../../../../lib/canvasUtils';

let host:HTMLDivElement,root:Root;
const pointerData={button:0,ctrlKey:false,pointerType:'mouse'};
async function open(targetId?:string){await act(async()=>root.render(<V3ElementActionsMenu label="More shape options" targetId={targetId}/>));await act(async()=>Simulate.keyDown(host.querySelector('button')!,{key:'ArrowDown'}));}
function item(label:string){const found=[...host.querySelectorAll<HTMLElement>('[role="menuitem"]')].find(node=>node.textContent===label);if(!found)throw new Error(`Missing ${label}`);return found;}
beforeEach(()=>{Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});host=document.createElement('div');host.className='v3-editor';document.body.append(host);root=createRoot(host);
const a={...createShapeElement('rectangle'),id:'a',name:'First',zIndex:2},b={...createShapeElement('circle'),id:'b',name:'Second',zIndex:1};useCanvasStore.setState({elements:[a,b],selectedElementIds:['a'],clipboard:[],history:{past:[],future:[]}});});
afterEach(()=>{act(()=>root.unmount());host.remove();});
describe('US-EDIT-043 shared toolbar and layer menu',()=>{
 it('has the exact common and layer action sequence with stack boundary guards',async()=>{
   await open();expect(host.querySelector('[role="menu"]')?.getAttribute('aria-label')).toBe('Element actions');
   expect(host.querySelector('[role="menu"]')?.getAttribute('aria-labelledby')).toBeNull();
   expect(document.body.style.pointerEvents).toBe('');
   expect([...host.querySelectorAll('[role="menuitem"]')].map(node=>node.textContent)).toEqual(['Copy','Paste','Duplicate','Delete','Bring forward','Send backward','Bring to front','Send to back','Hide','Lock']);
   expect(item('Bring forward').hasAttribute('data-disabled')).toBe(true);expect(item('Send backward').hasAttribute('data-disabled')).toBe(false);
   await act(async()=>Simulate.click(item('Send backward')));expect(useCanvasStore.getState().elements.find(element=>element.id==='a')!.zIndex).toBeLessThan(useCanvasStore.getState().elements.find(element=>element.id==='b')!.zIndex);expect(useCanvasStore.getState().history.past).toHaveLength(1);
 });
 it('duplicates multi-selection atomically while disabling single-target stack and hide actions',async()=>{
   useCanvasStore.getState().selectElements(['a','b']);await open();expect(item('Hide').hasAttribute('data-disabled')).toBe(true);expect(item('Send to back').hasAttribute('data-disabled')).toBe(true);
   await act(async()=>Simulate.click(item('Duplicate')));expect(useCanvasStore.getState().elements).toHaveLength(4);expect(useCanvasStore.getState().selectedElementIds).toHaveLength(2);expect(useCanvasStore.getState().history.past).toHaveLength(1);
 });
 it('selects a row target on open and refuses actions from an obsolete selection',async()=>{
   await open('b');expect(useCanvasStore.getState().selectedElementIds).toEqual(['b']);const obsolete=item('Delete');
   await act(async()=>useCanvasStore.getState().selectElements(['a']));expect(host.querySelector('[role="menu"]')).toBeNull();
   act(()=>Simulate.click(obsolete));expect(useCanvasStore.getState().elements).toHaveLength(2);expect(useCanvasStore.getState().history.past).toHaveLength(0);
 });
 it('offers only safe actions for locked or hidden targets',async()=>{
   useCanvasStore.setState({elements:useCanvasStore.getState().elements.map(element=>element.id==='a'?{...element,locked:true}:element)});await open();expect(item('Delete').hasAttribute('data-disabled')).toBe(true);expect(item('Hide').hasAttribute('data-disabled')).toBe(true);
   await act(async()=>Simulate.click(item('Unlock')));expect(useCanvasStore.getState().elements[0].locked).toBe(false);
 });
 it('keeps pointer interaction with canvas available while its pointer-opened menu is visible',async()=>{
   await act(async()=>root.render(<V3ElementActionsMenu label="More shape options"/>));
   await act(async()=>Simulate.pointerDown(host.querySelector('button')!,pointerData));
   expect(host.querySelector('[role="menu"]')).not.toBeNull();expect(document.body.style.pointerEvents).toBe('');
   expect(useCanvasStore.getState().selectedElementIds).toEqual(['a']);
 });
});
