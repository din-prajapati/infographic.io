import React,{act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {useCanvasStore} from '../useCanvasStore';
import {createShapeElement} from '../../lib/canvasUtils';
import {useV3EditorShortcuts} from '../useV3EditorShortcuts';

vi.mock('../../lib/canvasState',()=>({fitCanvasZoomToViewport:vi.fn()}));
import {fitCanvasZoomToViewport} from '../../lib/canvasState';
let node:HTMLDivElement,root:Root;
const Harness=({enabled=true}:{enabled?:boolean})=>{useV3EditorShortcuts({enabled});return null;};
function key(key:string,options:KeyboardEventInit={},target:EventTarget=window){const event=new KeyboardEvent('keydown',{key,bubbles:true,cancelable:true,...options});act(()=>target.dispatchEvent(event));return event;}
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
beforeEach(()=>{node=document.createElement('div');document.body.append(node);root=createRoot(node);const shape=createShapeElement('rectangle',100,100);useCanvasStore.setState({elements:[shape],selectedElementIds:[shape.id],clipboard:[],activeTool:'select',zoom:1,history:{past:[],future:[]}});vi.clearAllMocks();});
afterEach(()=>{act(()=>root.unmount());node.remove();document.querySelectorAll('[data-test-field]').forEach(item=>item.remove());});
describe('US-EDIT-039 keyboard eligibility and commands',()=>{
  it('duplicates once, prevents browser bookmarking only when handled, and ignores key repeats',()=>{
    act(()=>root.render(React.createElement(Harness)));expect(key('d',{ctrlKey:true}).defaultPrevented).toBe(true);
    expect(key('d',{ctrlKey:true,repeat:true}).defaultPrevented).toBe(true);expect(useCanvasStore.getState().elements).toHaveLength(2);expect(useCanvasStore.getState().history.past).toHaveLength(1);
    useCanvasStore.setState({selectedElementIds:[]});expect(key('d',{ctrlKey:true}).defaultPrevented).toBe(false);
  });
  it('retains native editing and composition and disables every command in Preview',()=>{
    act(()=>root.render(React.createElement(Harness)));const field=document.createElement('input');field.dataset.testField='true';document.body.append(field);
    key('Delete',{},field);key('d',{ctrlKey:true},field);key('Delete',{isComposing:true});expect(useCanvasStore.getState().elements).toHaveLength(1);
    act(()=>root.render(React.createElement(Harness,{enabled:false})));key('Delete');key('h');expect(useCanvasStore.getState().elements).toHaveLength(1);expect(useCanvasStore.getState().activeTool).toBe('select');
  });
  it('blocks destructive commands while a dialog or menu is open',()=>{
    act(()=>root.render(React.createElement(Harness)));const menu=document.createElement('div');menu.setAttribute('role','menu');menu.dataset.testField='true';document.body.append(menu);
    expect(key('Delete').defaultPrevented).toBe(false);expect(useCanvasStore.getState().elements).toHaveLength(1);
  });
  it('restores the previous tool after Space keyup, window blur and unmount',()=>{
    useCanvasStore.setState({activeTool:'rectangle'});act(()=>root.render(React.createElement(Harness)));key(' ');expect(useCanvasStore.getState().activeTool).toBe('hand');
    act(()=>window.dispatchEvent(new KeyboardEvent('keyup',{key:' '})));expect(useCanvasStore.getState().activeTool).toBe('rectangle');
    key(' ');act(()=>window.dispatchEvent(new Event('blur')));expect(useCanvasStore.getState().activeTool).toBe('rectangle');
    key(' ');act(()=>root.render(null));expect(useCanvasStore.getState().activeTool).toBe('rectangle');
  });
  it('reads live zoom for repeated keys, recognizes physical Shift+1 and nudges 10px once',()=>{
    act(()=>root.render(React.createElement(Harness)));key('+',{ctrlKey:true});key('+',{ctrlKey:true});expect(useCanvasStore.getState().zoom).toBeCloseTo(1.2);
    key('!',{shiftKey:true,code:'Digit1'});expect(fitCanvasZoomToViewport).toHaveBeenCalledTimes(1);
    key('ArrowRight',{shiftKey:true});expect(useCanvasStore.getState().elements[0].x).toBe(110);expect(useCanvasStore.getState().history.past).toHaveLength(1);
    key('h',{ctrlKey:true});expect(useCanvasStore.getState().activeTool).toBe('select');key('h');expect(useCanvasStore.getState().activeTool).toBe('hand');
  });
  it('copies and pastes with Cmd, then deletes one selected copy with one history entry per mutation',()=>{
    act(()=>root.render(React.createElement(Harness)));expect(key('c',{metaKey:true}).defaultPrevented).toBe(true);
    expect(useCanvasStore.getState().history.past).toHaveLength(0);expect(key('v',{metaKey:true}).defaultPrevented).toBe(true);
    expect(useCanvasStore.getState().elements).toHaveLength(2);expect(useCanvasStore.getState().history.past).toHaveLength(1);
    expect(key('Backspace').defaultPrevented).toBe(true);expect(useCanvasStore.getState().elements).toHaveLength(1);expect(useCanvasStore.getState().history.past).toHaveLength(2);
  });
  it('does not handle contenteditable fields or default-prevented line movement twice',()=>{
    act(()=>root.render(React.createElement(Harness)));const field=document.createElement('div');field.setAttribute('contenteditable','true');field.dataset.testField='true';document.body.append(field);
    key('Delete',{},field);key('ArrowRight',{},field);
    const event=new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true,cancelable:true});event.preventDefault();act(()=>window.dispatchEvent(event));
    expect(useCanvasStore.getState().elements[0].x).toBe(100);expect(useCanvasStore.getState().history.past).toHaveLength(0);
  });
});
