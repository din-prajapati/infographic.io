import React,{act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {Simulate} from 'react-dom/test-utils';
import {beforeEach,afterEach,describe,it,expect,vi} from 'vitest';
import {V3LayersPanel} from '../V3LayersPanel';
import {useCanvasStore} from '../../../../hooks/useCanvasStore';
import {createShapeElement} from '../../../../lib/canvasUtils';

vi.mock('../V3LayerPreview',()=>({V3LayerPreview:({element}:{element:{name:string}})=><span aria-label={`${element.name} preview`}/>}));
let host:HTMLDivElement,root:Root;
const onClose=vi.fn(),onEditBackground=vi.fn();
const pointerData={button:0,ctrlKey:false,pointerType:'mouse'};
const dragData=(dataTransfer:DataTransfer,clientY=0)=>({dataTransfer,clientY});
function button(label:string){const item=host.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`);if(!item)throw new Error(`Missing ${label}`);return item;}
beforeEach(()=>{Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});vi.clearAllMocks();host=document.createElement('div');host.className='v3-editor';document.body.append(host);root=createRoot(host);
 const a={...createShapeElement('rectangle',20,20),id:'a',name:'Front',zIndex:10},b={...createShapeElement('circle',30,30),id:'b',name:'Locked',locked:true,zIndex:5},c={...createShapeElement('star',600,500),id:'c',name:'Hidden',visible:false,zIndex:0};
 useCanvasStore.setState({elements:[c,b,a],selectedElementIds:[],canvasWidth:800,canvasHeight:600,clipboard:[],history:{past:[],future:[]}});
 act(()=>root.render(<V3LayersPanel onClose={onClose} onEditBackground={onEditBackground}/>));});
afterEach(()=>{act(()=>root.unmount());host.remove();});
describe('US-EDIT-043 Layers sidebar',()=>{
 it('lists all layers top first, leaves the fixed background last and permits locked and hidden selection',()=>{
   expect([...host.querySelectorAll('[data-layer-id]')].map(item=>item.getAttribute('data-layer-id'))).toEqual(['a','b','c']);
   act(()=>Simulate.click(button('Select layer Locked')));expect(useCanvasStore.getState().selectedElementIds).toEqual(['b']);
   act(()=>Simulate.click(button('Select layer Hidden'),{shiftKey:true}));expect(useCanvasStore.getState().selectedElementIds).toEqual(['b','c']);
   act(()=>Simulate.click(button('Edit page background')));expect(onEditBackground).toHaveBeenCalledTimes(1);expect(useCanvasStore.getState().history.past).toHaveLength(0);
   expect(host.querySelector('[aria-label="Arrange"]')).toBeNull();
 });
 it('prompts when Overlapping has no selection and excludes hidden layers from overlap results',()=>{
   act(()=>Simulate.click(button('Overlapping')));expect(host.textContent).toContain('Select an element to see overlapping layers.');
   act(()=>useCanvasStore.getState().selectElements(['a','c']));expect([...host.querySelectorAll('[data-layer-id]')].map(item=>item.getAttribute('data-layer-id'))).toEqual(['a','b']);
   expect(button('Drag layer Front').disabled).toBe(true);expect(host.textContent).toContain('Switch to All to drag');
 });
 it('moves a row with Alt+Arrow and records one completed operation without changing selected IDs',()=>{
   act(()=>useCanvasStore.getState().selectElements(['a','b']));
   act(()=>Simulate.keyDown(button('Select layer Front'),{key:'ArrowDown',altKey:true}));
   expect([...host.querySelectorAll('[data-layer-id]')].map(item=>item.getAttribute('data-layer-id'))).toEqual(['b','a','c']);
   expect(useCanvasStore.getState().selectedElementIds).toEqual(['a','b']);expect(useCanvasStore.getState().history.past).toHaveLength(1);
   act(()=>Simulate.keyDown(button('Select layer Locked'),{key:'ArrowDown',altKey:true}));expect(useCanvasStore.getState().history.past).toHaveLength(1);
 });
 it('announces selected-only overlap and supports close and Switch to All',()=>{
   act(()=>useCanvasStore.setState({elements:useCanvasStore.getState().elements.map(item=>item.id==='b'?{...item,x:700,y:500}:item),selectedElementIds:['a']}));
   act(()=>Simulate.click(button('Overlapping')));expect(host.textContent).toContain('Only selected layers overlap.');
   act(()=>Simulate.click(button('Switch to All to drag')));expect(button('All').getAttribute('aria-selected')).toBe('true');
   act(()=>Simulate.click(button('Close Layers sidebar')));expect(onClose).toHaveBeenCalledTimes(1);
 });
 it('opens the clicked row menu, selects its locked target and refuses unrelated selection actions',async()=>{
   act(()=>useCanvasStore.getState().selectElements(['a']));
   await act(async()=>Simulate.pointerDown(button('Layer actions for Locked'),pointerData));
   expect(useCanvasStore.getState().selectedElementIds).toEqual(['b']);
   const menu=host.querySelector('[role="menu"]');expect(menu).not.toBeNull();
   const duplicate=[...menu!.querySelectorAll('[role="menuitem"]')].find(item=>item.textContent==='Duplicate');expect(duplicate?.hasAttribute('data-disabled')).toBe(true);
   const unlock=[...menu!.querySelectorAll('[role="menuitem"]')].find(item=>item.textContent==='Unlock');
   await act(async()=>Simulate.click(unlock!));expect(useCanvasStore.getState().elements.find(item=>item.id==='b')?.locked).toBe(false);expect(useCanvasStore.getState().history.past).toHaveLength(1);
 });
 it('commits handle dragging once, keeps selection and announces the completed drop',()=>{
   const dataTransfer={setData:vi.fn(),effectAllowed:'move'} as unknown as DataTransfer;
   act(()=>useCanvasStore.getState().selectElements(['b']));
   act(()=>Simulate.dragStart(button('Drag layer Front'),dragData(dataTransfer)));
   const anchor=host.querySelector('[data-layer-id="c"]')!;
   act(()=>Simulate.dragOver(anchor,dragData(dataTransfer,1)));expect(anchor.className).toContain('drop-after');
   expect(useCanvasStore.getState().history.past).toHaveLength(0);
   act(()=>Simulate.drop(anchor,dragData(dataTransfer,1)));
   expect([...host.querySelectorAll('[data-layer-id]')].map(item=>item.getAttribute('data-layer-id'))).toEqual(['b','c','a']);
   expect(useCanvasStore.getState().selectedElementIds).toEqual(['b']);expect(useCanvasStore.getState().history.past).toHaveLength(1);expect(host.querySelector('[aria-live="polite"]')?.textContent).toBe('Moved Front after Hidden.');
 });
 it('cancels a drag on Escape, source locking and same-place drops without history',()=>{
   const dataTransfer={setData:vi.fn(),effectAllowed:'move'} as unknown as DataTransfer;
   act(()=>Simulate.dragStart(button('Drag layer Front'),dragData(dataTransfer)));
   act(()=>window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'})));
   act(()=>Simulate.drop(host.querySelector('[data-layer-id="c"]')!,dragData(dataTransfer,1)));expect(useCanvasStore.getState().history.past).toHaveLength(0);
   act(()=>Simulate.dragStart(button('Drag layer Front'),dragData(dataTransfer)));
   act(()=>Simulate.drop(host.querySelector('[data-layer-id="a"]')!,dragData(dataTransfer,1)));expect(useCanvasStore.getState().history.past).toHaveLength(0);
   act(()=>Simulate.dragStart(button('Drag layer Front'),dragData(dataTransfer)));
   act(()=>useCanvasStore.setState({elements:useCanvasStore.getState().elements.map(item=>item.id==='a'?{...item,locked:true}:item)}));
   act(()=>Simulate.drop(host.querySelector('[data-layer-id="c"]')!,dragData(dataTransfer,1)));expect(useCanvasStore.getState().history.past).toHaveLength(0);
 });
 it('closes a stale row menu and does not mutate another selected layer',async()=>{
   await act(async()=>Simulate.pointerDown(button('Layer actions for Front'),pointerData));
   const duplicate=[...host.querySelectorAll('[role="menuitem"]')].find(item=>item.textContent==='Duplicate')!;
   await act(async()=>useCanvasStore.getState().selectElements(['b']));
   expect(host.querySelector('[role="menu"]')).toBeNull();
   act(()=>Simulate.click(duplicate));expect(useCanvasStore.getState().elements).toHaveLength(3);expect(useCanvasStore.getState().history.past).toHaveLength(0);
 });
 it('omits background and hidden selected rows when the current selection does not intersect the page',()=>{
   act(()=>useCanvasStore.setState({elements:useCanvasStore.getState().elements.map(item=>item.id==='a'?{...item,x:1200,y:1200}:item),selectedElementIds:['a','c']}));
   act(()=>Simulate.click(button('Overlapping')));expect(host.querySelector('[aria-label="Edit page background"]')).toBeNull();
   expect([...host.querySelectorAll('[data-layer-id]')].map(item=>item.getAttribute('data-layer-id'))).toEqual(['a']);
 });
});

// Contract: temporary geometry changes overlap immediately without changing document coordinates/history.
it('uses live presentation bounds and discards them without a document mutation',()=>{
 const source={...useCanvasStore.getState().elements.find(el=>el.id==='c')!,visible:true,width:80,height:80};act(()=>useCanvasStore.setState({elements:[...useCanvasStore.getState().elements.filter(el=>el.id!=='c'),source],selectedElementIds:['c']}));act(()=>Simulate.click(button('Overlapping')));expect([...host.querySelectorAll('[data-layer-id]')].map(node=>node.getAttribute('data-layer-id'))).toEqual(['c']);
 act(()=>root.render(<V3LayersPanel onClose={onClose} onEditBackground={onEditBackground} presentation={{id:source.id,baseElement:source,patch:{x:30,y:30}}}/>));expect([...host.querySelectorAll('[data-layer-id]')].map(node=>node.getAttribute('data-layer-id'))).toEqual(['a','b','c']);expect(useCanvasStore.getState().elements.find(el=>el.id==='c')).toBe(source);expect(useCanvasStore.getState().history.past).toHaveLength(0);
 act(()=>root.render(<V3LayersPanel onClose={onClose} onEditBackground={onEditBackground}/>));expect([...host.querySelectorAll('[data-layer-id]')].map(node=>node.getAttribute('data-layer-id'))).toEqual(['c']);
});
