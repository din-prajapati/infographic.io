import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Simulate } from 'react-dom/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { V3Canvas } from '../V3Canvas';
import { LineElement } from '../../../canvas/LineElement';
import { useCanvasStore } from '../../../../hooks/useCanvasStore';
import { createLineElement } from '../../../../lib/lineGeometry';

vi.mock('../../../../lib/theme-provider',()=>({useTheme:()=>({resolvedTheme:'light',setTheme:vi.fn()})}));
vi.mock('../../../../lib/canvasState',()=>({fitCanvasZoomToViewport:vi.fn()}));
vi.mock('../V3ElementToolbar',()=>({V3ElementToolbar:()=>null}));
vi.mock('../../../canvas/RotationHandle',()=>({RotationHandle:()=>null}));
vi.mock('../../sidebar/LayersTab',()=>({LayersTab:()=>null}));
let root:Root,node:HTMLDivElement;
beforeEach(()=>{
  vi.stubGlobal('React',React);vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT',true);
  vi.stubGlobal('ResizeObserver',class {observe(){} disconnect(){}});
  Object.defineProperties(Element.prototype,{setPointerCapture:{configurable:true,value:()=>{}},hasPointerCapture:{configurable:true,value:()=>false},releasePointerCapture:{configurable:true,value:()=>{}}});
  vi.spyOn(HTMLElement.prototype,'getBoundingClientRect').mockReturnValue({left:100,top:80,width:640,height:480,right:740,bottom:560,x:100,y:80,toJSON:()=>({})});
  useCanvasStore.setState({elements:[],selectedElementIds:[],zoom:1,canvasWidth:640,canvasHeight:480,activeTool:'line-straight',history:{past:[],future:[]}});
  node=document.createElement('div');document.body.append(node);root=createRoot(node);
});
afterEach(()=>{act(()=>root.unmount());node.remove();vi.restoreAllMocks();vi.unstubAllGlobals();});
const surface=()=>node.querySelector('[aria-label="Line drawing surface"]')!;
const pointer=(target:Element,type:'pointerDown'|'pointerMove'|'pointerUp',clientX:number,clientY:number,shiftKey=false)=>act(()=>Simulate[type](target,{clientX,clientY,button:0,shiftKey}));

describe('line gestures — US-EDIT-032',()=>{
  // Contract: preview changes zero store elements/history; completing a 200px drag adds one selected line and one undo entry.
  it('commits a completed draw only once',()=>{
    act(()=>root.render(<V3Canvas/>));const target=surface();
    pointer(target,'pointerDown',150,140);pointer(target,'pointerMove',350,140);
    expect(useCanvasStore.getState().elements).toHaveLength(0);expect(useCanvasStore.getState().history.past).toHaveLength(0);
    pointer(target,'pointerUp',350,140);
    const state=useCanvasStore.getState();expect(state.elements[0]).toMatchObject({type:'line',lineType:'straight',x:50,y:60,width:200,height:1});
    expect(state.history.past).toHaveLength(1);expect(state.selectedElementIds).toEqual([state.elements[0].id]);expect(state.activeTool).toBe('select');
    act(()=>state.undo());expect(useCanvasStore.getState().elements).toHaveLength(0);
  });
  // Contract: Escape during a visible preview creates no element and no history/autosave mutation.
  it('cancels an unfinished line on Escape',()=>{
    act(()=>root.render(<V3Canvas/>));const target=surface();pointer(target,'pointerDown',150,140);pointer(target,'pointerMove',350,240);
    act(()=>window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'})));
    expect(useCanvasStore.getState().elements).toHaveLength(0);expect(useCanvasStore.getState().history.past).toHaveLength(0);
  });
  // Contract: minimum gesture threshold is four screen pixels at any zoom, not four design pixels.
  it('refuses a three-screen-pixel gesture at 200 percent',()=>{
    useCanvasStore.setState({zoom:2});act(()=>root.render(<V3Canvas/>));const target=surface();pointer(target,'pointerDown',150,140);pointer(target,'pointerUp',153,140);
    expect(useCanvasStore.getState().elements).toHaveLength(0);expect(useCanvasStore.getState().history.past).toHaveLength(0);
  });
  // Contract: Shift creates a 45-degree endpoint in document coordinates even at 50 percent zoom.
  it('snaps a straight drag after converting from screen coordinates',()=>{
    useCanvasStore.setState({zoom:0.5});act(()=>root.render(<V3Canvas/>));const target=surface();pointer(target,'pointerDown',150,140);pointer(target,'pointerMove',250,220,true);pointer(target,'pointerUp',250,220,true);
    const line=useCanvasStore.getState().elements[0];if(line.type!=='line')throw new Error('Expected line');
    expect(line.end.x-line.start.x).toBeCloseTo(line.end.y-line.start.y);expect(line.x).toBeCloseTo(100);expect(line.y).toBeCloseTo(120);
  });
  // Contract: a completed endpoint edit creates exactly one history entry; local moves never write the store.
  it('edits an endpoint in one transaction',()=>{
    const line=createLineElement('straight',{x:50,y:60},{x:250,y:60});useCanvasStore.setState({elements:[line],selectedElementIds:[line.id],activeTool:'select'});
    act(()=>root.render(<div data-canvas-content="true"><LineElement element={line} isSelected onSelect={()=>{}}/></div>));
    const handle=node.querySelector('[aria-label="Line end endpoint"]')!;pointer(handle,'pointerDown',350,140);pointer(handle,'pointerMove',400,180);
    expect(useCanvasStore.getState().history.past).toHaveLength(0);expect(useCanvasStore.getState().elements[0]).toEqual(line);
    pointer(handle,'pointerUp',400,180);expect(useCanvasStore.getState().history.past).toHaveLength(1);
    const edited=useCanvasStore.getState().elements[0];if(edited.type!=='line')throw new Error('Expected line');expect(edited.x+edited.end.x).toBeCloseTo(300);expect(edited.y+edited.end.y).toBeCloseTo(100);
  });
  // Contract: a locked line cannot move from either keyboard or pointer and exposes no editable endpoint handles.
  it('refuses locked line edits',()=>{
    const line={...createLineElement('straight',{x:50,y:60},{x:250,y:60}),locked:true};useCanvasStore.setState({elements:[line],selectedElementIds:[line.id],activeTool:'select'});
    act(()=>root.render(<LineElement element={line} isSelected onSelect={()=>{}}/>));
    const path=node.querySelector('path[role="button"]')!;pointer(path,'pointerDown',150,140);pointer(path,'pointerMove',250,140);pointer(path,'pointerUp',250,140);act(()=>Simulate.keyDown(path,{key:'ArrowRight'}));
    expect(useCanvasStore.getState().elements[0]).toEqual(line);expect(useCanvasStore.getState().history.past).toHaveLength(0);expect(node.querySelector('[aria-label="Line end endpoint"]')).toBeNull();
  });
  // Contract: Preview renders the path but exposes no interactive handles and refuses synthetic keyboard movement.
  it('makes lines read-only in Preview',()=>{
    const line=createLineElement('curved',{x:50,y:60},{x:250,y:60});useCanvasStore.setState({elements:[line],selectedElementIds:[line.id],activeTool:'select'});
    act(()=>root.render(<LineElement element={line} isSelected readOnly onSelect={()=>{}}/>));
    const path=node.querySelector('path[role="button"]')!;act(()=>Simulate.keyDown(path,{key:'ArrowRight'}));
    expect(path.getAttribute('tabindex')).toBe('-1');expect((path as SVGElement).style.pointerEvents).toBe('none');
    expect(node.querySelector('[aria-label="Curve bend"]')).toBeNull();expect(useCanvasStore.getState().elements[0]).toEqual(line);
  });
  // Contract: a body gesture ending at its original position is a no-op even after a visible drag preview.
  it('does not dirty history when a drag returns to its original position',()=>{
    const line=createLineElement('straight',{x:50,y:60},{x:250,y:60});useCanvasStore.setState({elements:[line],selectedElementIds:[line.id],activeTool:'select'});
    act(()=>root.render(<div data-canvas-content="true"><LineElement element={line} isSelected onSelect={()=>{}}/></div>));
    const path=node.querySelector('path[role="button"]')!;pointer(path,'pointerDown',150,140);pointer(path,'pointerMove',250,190);pointer(path,'pointerUp',150,140);
    expect(useCanvasStore.getState().elements[0]).toEqual(line);expect(useCanvasStore.getState().history.past).toHaveLength(0);
  });
});
