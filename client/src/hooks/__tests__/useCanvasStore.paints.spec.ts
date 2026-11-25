import { beforeEach, describe, expect, it } from 'vitest';
import { useCanvasStore } from '../useCanvasStore';
import { createShapeElement } from '../../lib/canvasUtils';
import { elementPaintPatch } from '../../lib/paint';
import type { Paint } from '../../lib/canvasTypes';

const gradient: Paint = { type: 'linear', angle: 135, stops: [{color:'#ff0000',opacity:1},{color:'#0000ff',opacity:.5}] };
beforeEach(()=>useCanvasStore.getState().loadCanvas({elements:[],backgroundColor:'#ffffff',backgroundPaint:undefined,history:{past:[],future:[]}}));
describe('US-EDIT-035 background paint history and legacy replacement',()=>{
  it('undoes interleaved background and element edits in their actual order',()=>{
    const state=useCanvasStore.getState();
    state.setBackgroundPaint(gradient);
    state.addElement(createShapeElement('rectangle',0,0));
    state.undo();
    expect(useCanvasStore.getState().elements).toHaveLength(0);
    expect(useCanvasStore.getState().backgroundPaint).toEqual(gradient);
    state.undo();
    expect(useCanvasStore.getState().backgroundColor).toBe('#ffffff');
    expect(useCanvasStore.getState().backgroundPaint).toBeUndefined();
    state.redo();state.redo();
    expect(useCanvasStore.getState().backgroundPaint).toEqual(gradient);
    expect(useCanvasStore.getState().elements).toHaveLength(1);
  });
  it('legacy color edits clear only their corresponding paint override',()=>{
    const shape=createShapeElement('rectangle',0,0);
    const state=useCanvasStore.getState();state.addElement(shape);
    state.updateElement(shape.id,elementPaintPatch(shape,'fill',gradient));
    state.updateElement(shape.id,{stroke:'#ffffff'});
    expect(useCanvasStore.getState().elements[0].paints?.fill).toEqual(gradient);
    state.updateElement(shape.id,{fill:'#00ff00'});
    expect(useCanvasStore.getState().elements[0].paints).toBeUndefined();
    state.undo();
    expect(useCanvasStore.getState().elements[0].paints?.fill).toEqual(gradient);
  });
  it('rejects invalid canonical paints and clears stale background on legacy load',()=>{
    const state=useCanvasStore.getState();state.setBackgroundPaint(gradient);
    state.loadCanvas({backgroundColor:'#ffffff'});
    expect(useCanvasStore.getState().backgroundPaint).toBeUndefined();
    state.setBackgroundPaint({type:'solid',color:'#ffffff',opacity:NaN});
    expect(useCanvasStore.getState().backgroundPaint).toBeUndefined();
    const shape=createShapeElement('rectangle',0,0);state.addElement(shape);
    const past=useCanvasStore.getState().history.past.length;
    state.updateElement(shape.id,{paints:{fill:{type:'solid',color:'#ffffff',opacity:2}}});
    expect(useCanvasStore.getState().elements[0].paints).toBeUndefined();
    expect(useCanvasStore.getState().history.past).toHaveLength(past);
  });
});
