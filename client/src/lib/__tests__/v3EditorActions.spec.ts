import {beforeEach, describe, expect, it} from 'vitest';
import {useCanvasStore} from '../../hooks/useCanvasStore';
import {createShapeElement} from '../canvasUtils';
import {createLineElement} from '../lineGeometry';
import {clearV3Clipboard, copyV3Selection, deleteV3Selection, duplicateV3Selection, insertV3Elements, nudgeV3Selection, pasteV3Clipboard, toggleV3SelectionLock} from '../v3EditorActions';

beforeEach(()=>{useCanvasStore.setState({elements:[],selectedElementIds:[],clipboard:[],canvasWidth:1200,canvasHeight:800,history:{past:[],future:[]}});clearV3Clipboard();});
describe('US-EDIT-039 atomic common actions',()=>{
  it('duplicates the whole eligible selection once, preserves nested paint metadata independently and selects copies',()=>{
    const first={...createShapeElement('rectangle',100,100),paints:{fill:{type:'solid' as const,color:'#123456',opacity:.5}}};
    const second=createLineElement('straight',{x:200,y:200},{x:300,y:220});
    useCanvasStore.setState({elements:[first,second],selectedElementIds:[first.id,second.id]});
    expect(duplicateV3Selection()).toBe(true);
    const state=useCanvasStore.getState();expect(state.history.past).toHaveLength(1);expect(state.elements).toHaveLength(4);
    expect(state.selectedElementIds).toEqual(state.elements.slice(2).map(item=>item.id));
    expect(state.elements[2]).toMatchObject({x:120,y:120,paints:first.paints});expect(state.elements[2].paints).not.toBe(first.paints);
    expect(state.elements[3]).toMatchObject({x:second.x+20,y:second.y+20,start:second.start});
    state.undo();expect(useCanvasStore.getState().elements).toEqual([first,second]);
  });
  it('takes a deep clipboard snapshot and pastes independent copies in one history step',()=>{
    const shape={...createShapeElement('rectangle',10,10),shadow:{color:'#000000',opacity:.5,offsetX:2,offsetY:2,blur:3}};
    useCanvasStore.setState({elements:[shape],selectedElementIds:[shape.id]});expect(copyV3Selection()).toBe(true);
    shape.shadow.color='#FFFFFF';expect(pasteV3Clipboard()).toBe(true);
    expect(useCanvasStore.getState().elements[1]).toMatchObject({shadow:{color:'#000000'}});expect(useCanvasStore.getState().history.past).toHaveLength(1);
  });
  it('deletes eligible selections only, retains locked and hidden objects and unlocks a locked selection',()=>{
    const first=createShapeElement('circle'),locked={...createShapeElement('rectangle'),locked:true},hidden={...createShapeElement('star'),visible:false};
    useCanvasStore.setState({elements:[first,locked,hidden],selectedElementIds:[first.id,locked.id,hidden.id]});
    expect(deleteV3Selection()).toBe(true);expect(useCanvasStore.getState().elements).toEqual([locked,hidden]);
    expect(useCanvasStore.getState().selectedElementIds).toEqual([locked.id,hidden.id]);
    expect(toggleV3SelectionLock()).toBe(true);expect(useCanvasStore.getState().elements[0].locked).toBe(false);
  });
  it('locks all selected visible objects together and records one history entry',()=>{
    const first=createShapeElement('circle'),second={...createShapeElement('rectangle'),locked:true};
    useCanvasStore.setState({elements:[first,second],selectedElementIds:[first.id,second.id]});expect(toggleV3SelectionLock()).toBe(true);
    expect(useCanvasStore.getState().elements.map(item=>item.locked)).toEqual([true,true]);expect(useCanvasStore.getState().history.past).toHaveLength(1);
  });
  it('inserts a whole batch atomically and refuses invalid paints or geometry without history',()=>{
    const first=createShapeElement('circle'),second=createShapeElement('star');expect(insertV3Elements([first,second])).toBe(true);
    expect(useCanvasStore.getState().selectedElementIds).toHaveLength(2);expect(useCanvasStore.getState().history.past).toHaveLength(1);
    expect(insertV3Elements([{...first,width:NaN}])).toBe(false);
    expect(insertV3Elements([{...first,paints:{fill:{type:'solid',color:'bad',opacity:1}}}])).toBe(false);
    expect(useCanvasStore.getState().history.past).toHaveLength(1);
  });
  it('nudges each selected line and shape once without changing line-local points',()=>{
    const line=createLineElement('straight',{x:100,y:100},{x:200,y:150}),shape=createShapeElement('circle',20,20);
    useCanvasStore.setState({elements:[line,shape],selectedElementIds:[line.id,shape.id]});expect(nudgeV3Selection(10,-10)).toBe(true);
    expect(useCanvasStore.getState().elements[0]).toMatchObject({x:line.x+10,y:line.y-10,start:line.start});expect(useCanvasStore.getState().history.past).toHaveLength(1);
  });
  it('rejects empty, stale, hidden, locked and zero-movement mutations without history',()=>{
    const shape={...createShapeElement('rectangle'),locked:true};useCanvasStore.setState({elements:[shape],selectedElementIds:[shape.id,'stale']});
    expect(duplicateV3Selection()).toBe(false);expect(deleteV3Selection()).toBe(false);expect(nudgeV3Selection(1,0)).toBe(false);
    expect(nudgeV3Selection(0,0)).toBe(false);expect(pasteV3Clipboard()).toBe(false);expect(insertV3Elements([])).toBe(false);
    expect(useCanvasStore.getState().history.past).toHaveLength(0);
  });
  it('keeps duplicated group spacing inside the artboard and assigns consecutive top z-indices',()=>{
    const first={...createShapeElement('rectangle',1000,500),width:100,height:100,zIndex:8};
    const second={...createShapeElement('circle',1100,600),width:100,height:100,zIndex:12};
    useCanvasStore.setState({elements:[first,second],selectedElementIds:[first.id,second.id]});expect(duplicateV3Selection()).toBe(true);
    const copies=useCanvasStore.getState().elements.slice(2);expect(copies.map(item=>item.zIndex)).toEqual([13,14]);
    expect(copies.map(item=>item.x)).toEqual([1000,1100]);expect(copies.map(item=>item.y)).toEqual([520,620]);
  });
});
