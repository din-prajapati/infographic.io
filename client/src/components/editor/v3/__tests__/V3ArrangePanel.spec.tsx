import React,{act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {Simulate} from 'react-dom/test-utils';
import {beforeEach,afterEach,describe,it,expect,vi} from 'vitest';
import {V3ArrangePanel,V3SidebarTabs} from '../V3ArrangePanel';
import {useCanvasStore} from '../../../../hooks/useCanvasStore';
import {createShapeElement} from '../../../../lib/canvasUtils';
import {createLineElement} from '../../../../lib/lineGeometry';
import type {CanvasElement} from '../../../../lib/canvasTypes';

let host:HTMLDivElement,root:Root;
const onClose=vi.fn();
const shape=(id:string,x:number,y:number,zIndex:number,extra:Partial<CanvasElement>={})=>({...createShapeElement('rectangle',x,y),id,name:id,width:200,height:100,zIndex,...extra}) as CanvasElement;
const button=(label:string)=>{const item=host.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`);if(!item)throw new Error(`Missing ${label}`);return item;};
const input=(label:string)=>{const item=host.querySelector<HTMLInputElement>(`input[aria-label="${label}"]`);if(!item)throw new Error(`Missing ${label}`);return item;};
const get=(id:string)=>useCanvasStore.getState().elements.find(element=>element.id===id)!;
const past=()=>useCanvasStore.getState().history.past.length;
const key=(target:HTMLElement,key:string)=>{let dispatched=true;act(()=>{dispatched=target.dispatchEvent(new KeyboardEvent('keydown',{key,bubbles:true,cancelable:true}));});return dispatched;};
function type(target:HTMLInputElement,value:string){act(()=>{Simulate.focus(target);target.value=value;Simulate.change(target);});}
function load(elements:CanvasElement[],selected:string[]){act(()=>useCanvasStore.setState({elements,selectedElementIds:selected,canvasWidth:800,canvasHeight:600,clipboard:[],history:{past:[],future:[]}}));}
const stackAndAlign=['Forward','Backward','To front','To back','Align left','Align center','Align right','Align top','Align middle','Align bottom'];

beforeEach(()=>{Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});vi.clearAllMocks();host=document.createElement('div');host.className='v3-editor';document.body.append(host);root=createRoot(host);
 load([shape('back',100,50,1),shape('front',400,300,2)],[]);
 act(()=>root.render(<V3ArrangePanel onClose={onClose} tabs={<V3SidebarTabs active="arrange" onChange={()=>{}}/>}/>));});
afterEach(()=>{act(()=>root.unmount());host.remove();});

describe('V3 Arrange panel',()=>{
 it('reference presentation: keeps exact stack and alignment order with distinct layered icons and Centre spelling',()=>{
  const stack=host.querySelector('[role="group"][aria-label="Stacking"]')!;
  expect(stack.querySelector('h3')).toBeNull();
  expect([...stack.querySelectorAll('button')].map(item=>item.textContent)).toEqual(['Forward','Backward','To front','To back']);
  expect([...stack.querySelectorAll('svg[data-arrange-stack-icon]')].map(item=>item.getAttribute('data-arrange-stack-icon'))).toEqual(['forward','backward','front','back']);
  const alignment=host.querySelector('[role="group"][aria-label="Align to page"]')!;
  expect([...alignment.querySelectorAll('button')].map(item=>[item.getAttribute('aria-label'),item.textContent])).toEqual([
   ['Align top','Top'],['Align left','Left'],['Align middle','Middle'],['Align center','Centre'],['Align bottom','Bottom'],['Align right','Right'],
  ]);
 });
 it('reference presentation: labels Advanced fields above their unit boxes and exposes open/closed ratio locks',()=>{
  load(useCanvasStore.getState().elements,['back']);
  const advanced=host.querySelector('[role="group"][aria-label="Size and position"]')!;
  expect(advanced.querySelector('h3')?.textContent).toBe('Advanced');
  expect([...advanced.querySelectorAll('.v3-arrange-fields>label,.v3-arrange-fields>.v3-arrange-ratio-field')].map(item=>item.firstElementChild?.textContent)).toEqual(['Width','Height','Ratio','X','Y','Rotate']);
  for(const label of ['Width','Height','X position','Y position'])expect(input(label).parentElement?.textContent).toBe('px');
  expect(input('Rotation').parentElement?.textContent).toBe('°');
  const ratio=button('Lock aspect ratio');expect(ratio.querySelector('svg.lucide-lock-open')).not.toBeNull();
  act(()=>Simulate.click(ratio));expect(ratio.querySelector('svg.lucide-lock')).not.toBeNull();expect(past()).toBe(0);
 });
 it('A4/B2: is titled Arrange, explains an empty selection and disables every action and field',()=>{
  expect(host.querySelector('h2')?.textContent).toBe('Arrange');
  expect(host.querySelector('[role="tablist"][aria-label="Sidebar views"]')).not.toBeNull();
  expect(host.textContent).toContain('Select an element to arrange it.');
  for(const label of stackAndAlign)expect(button(label).disabled).toBe(true);
  for(const label of ['Width','Height','X position','Y position','Rotation'])expect(input(label).disabled).toBe(true);
  act(()=>Simulate.click(button('Close Arrange sidebar')));expect(onClose).toHaveBeenCalledTimes(1);
 });
 it('C1/C2: stacks one element with boundary-disabled buttons and one history entry',()=>{
  load(useCanvasStore.getState().elements,['back']);
  expect(button('Backward').disabled).toBe(true);expect(button('To back').disabled).toBe(true);
  expect(button('Forward').disabled).toBe(false);
  act(()=>Simulate.click(button('To front')));
  expect(get('back').zIndex).toBeGreaterThan(get('front').zIndex);expect(past()).toBe(1);
  expect(button('To front').disabled).toBe(true);
 });
 it('D1/D3: aligns to page; a multi-selection aligns as one unit while stacking and size stay single-only',()=>{
  load(useCanvasStore.getState().elements,['back']);
  act(()=>Simulate.click(button('Align left')));expect(get('back').x).toBe(0);expect(past()).toBe(1);
  load(useCanvasStore.getState().elements,['back','front']);
  for(const label of ['Forward','To front'])expect(button(label).disabled).toBe(true);
  expect(input('Width').disabled).toBe(true);
  act(()=>Simulate.click(button('Align bottom')));
  expect([get('back').y,get('front').y]).toEqual([250,500]);
 });
 it('B1/B2: disables the whole selection when any target is locked or hidden',()=>{
  load([shape('a',0,0,1),shape('b',50,50,2,{locked:true}),shape('c',90,90,3,{visible:false})],['a','b']);
  expect(host.textContent).toContain('Unlock the selection to arrange it.');
  for(const label of stackAndAlign)expect(button(label).disabled).toBe(true);
  load(useCanvasStore.getState().elements,['c']);
  expect(host.textContent).toContain('Show the hidden selection to arrange it.');
  expect(button('Align left').disabled).toBe(true);
 });
 it('E2/E4: commits on Enter, reverts on Escape without closing the sidebar, and rejects invalid input',()=>{
  load(useCanvasStore.getState().elements,['back']);
  const width=input('Width');expect(width.value).toBe('200');expect(input('X position').value).toBe('100');
  type(width,'300');key(width,'Enter');expect(get('back').width).toBe(300);expect(past()).toBe(1);expect(width.value).toBe('300');
  act(()=>Simulate.blur(width));expect(past()).toBe(1); // Enter then blur is one entry
  type(width,'999');expect(key(width,'Escape')).toBe(false);
  expect(width.value).toBe('300');expect(get('back').width).toBe(300);expect(past()).toBe(1);
  expect(key(width,'Escape')).toBe(true); // a clean field lets Escape reach the sidebar
  type(width,'abc');key(width,'Enter');
  expect(host.querySelector('[role="alert"]')?.textContent).toBe('Enter a number for width.');
  expect(width.value).toBe('300');expect(past()).toBe(1);
  const rotation=input('Rotation');type(rotation,'-90');act(()=>Simulate.blur(rotation));
  expect(get('back').rotation).toBe(270);expect(rotation.value).toBe('270');expect(past()).toBe(2);
  expect(host.querySelector('[role="alert"]')).toBeNull();
 });
 it('E5: the ratio lock scales the partner dimension and resets for a new selection',()=>{
  load(useCanvasStore.getState().elements,['back']);
  const lock=button('Lock aspect ratio');expect(lock.getAttribute('aria-pressed')).toBe('false');
  act(()=>Simulate.click(lock));expect(lock.getAttribute('aria-pressed')).toBe('true');
  type(input('Width'),'400');key(input('Width'),'Enter');
  expect([get('back').width,get('back').height]).toEqual([400,200]);expect(input('Height').value).toBe('200');
  load(useCanvasStore.getState().elements,['front']);
  expect(button('Lock aspect ratio').getAttribute('aria-pressed')).toBe('false');
 });
 it('review R1: a draft left in a field is discarded, never committed, when the selection changes',()=>{
  load(useCanvasStore.getState().elements,['back']);
  type(input('Width'),'250');
  load(useCanvasStore.getState().elements,['front']);
  expect(input('Width').value).toBe('200');
  act(()=>Simulate.blur(input('Width')));key(input('Width'),'Enter');
  expect([get('back').width,get('front').width]).toEqual([200,200]);expect(past()).toBe(0);
 });
 it('E7: disables the zero-span dimension of a flat line',()=>{
  const line={...createLineElement('straight',{x:100,y:100},{x:300,y:100}),id:'line'} as CanvasElement;
  load([line],['line']);
  expect(input('Width').disabled).toBe(false);expect(input('Height').disabled).toBe(true);
 });
 it('E8: shows live presentation geometry for the selected element',()=>{
  load(useCanvasStore.getState().elements,['back']);
  const base=get('back');
  act(()=>root.render(<V3ArrangePanel onClose={onClose} presentation={{id:'back',baseElement:base,patch:{x:155,width:240}}}/>));
  expect(input('X position').value).toBe('155');expect(input('Width').value).toBe('240');
 });
 it('review R2: line fields display editable path spans and retyping them creates no history',()=>{
  const line={...createLineElement('straight',{x:0,y:0},{x:80,y:40}),id:'legacy',x:0,y:0,width:100,height:60,start:{x:10,y:10},end:{x:90,y:50},control:{x:50,y:30}} as CanvasElement;
  load([line],['legacy']);expect(input('Width').value).toBe('80');expect(input('Height').value).toBe('40');
  type(input('Width'),'80');key(input('Width'),'Enter');expect(get('legacy')).toBe(line);expect(past()).toBe(0);
 });
});

describe('V3 sidebar tabs',()=>{
 it('review R1: restores keyboard focus to the replacement tab after its former tablist unmounts',()=>{
  const frames:FrameRequestCallback[]=[];vi.stubGlobal('requestAnimationFrame',(callback:FrameRequestCallback)=>{frames.push(callback);return frames.length;});
  function ReplacingTabs(){const [active,setActive]=React.useState<'arrange'|'layers'>('layers');return <div key={active}><V3SidebarTabs active={active} onChange={setActive}/></div>;}
  act(()=>root.render(<ReplacingTabs/>));
  const previous=host.querySelector<HTMLButtonElement>('[data-sidebar-tab="layers"]')!;previous.focus();key(previous,'ArrowRight');expect(previous.isConnected).toBe(false);
  act(()=>frames.shift()?.(0));expect(document.activeElement).toBe(host.querySelector('[data-sidebar-tab="arrange"]'));
  vi.unstubAllGlobals();
 });
 it('A2: exposes Arrange and Layers tabs with the active one selected',()=>{
  const onChange=vi.fn();
  act(()=>root.render(<V3SidebarTabs active="layers" onChange={onChange}/>));
  const tabs=[...host.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
  expect(tabs.map(tab=>[tab.textContent,tab.getAttribute('aria-selected')])).toEqual([['Arrange','false'],['Layers','true']]);
  act(()=>Simulate.click(tabs[0]));expect(onChange).toHaveBeenCalledWith('arrange');
  expect(tabs.map(tab=>tab.tabIndex)).toEqual([-1,0]);expect(tabs[1].getAttribute('aria-controls')).toBe('v3-sidebar-view');
  key(tabs[1],'ArrowRight');expect(onChange).toHaveBeenLastCalledWith('arrange');
  key(tabs[1],'Home');expect(onChange).toHaveBeenLastCalledWith('arrange');
 });
});
