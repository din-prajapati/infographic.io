import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { captureCanvasData, restoreCanvasData, scheduleFitCanvasZoomToViewport } from '../canvasState';
import { useCanvasStore } from '../../hooks/useCanvasStore';
import { createShapeElement, importFromJSON } from '../canvasUtils';
import type { Paint } from '../canvasTypes';

const gradient: Paint={type:'radial',center:'corner',stops:[{color:'#ff0000',opacity:.2},{color:'#0000ff',opacity:1}]};
beforeEach(()=>useCanvasStore.getState().loadCanvas({elements:[],backgroundColor:'#ffffff',backgroundPaint:undefined,history:{past:[],future:[]}}));
describe('US-EDIT-035 paint document persistence',()=>{
  it('captures and restores element and background paints unchanged',()=>{
    const shape={...createShapeElement('rectangle',0,0),paints:{fill:gradient}};
    useCanvasStore.getState().loadCanvas({elements:[shape],backgroundColor:'#ff0000',backgroundPaint:gradient});
    const saved=JSON.parse(JSON.stringify(captureCanvasData()));
    useCanvasStore.getState().loadCanvas({elements:[],backgroundColor:'#ffffff'});
    expect(restoreCanvasData(saved)).toBe(true);
    expect(useCanvasStore.getState().elements[0].paints?.fill).toEqual(gradient);
    expect(useCanvasStore.getState().backgroundPaint).toEqual(gradient);
  });
  it('rejects malformed new paints before replacing the active document',()=>{
    const error=vi.spyOn(console,'error').mockImplementation(()=>{});
    try {
      expect(restoreCanvasData({elements:[],backgroundPaint:{type:'linear',angle:12,stops:[]}})).toBe(false);
      expect(useCanvasStore.getState().backgroundColor).toBe('#ffffff');
      expect(importFromJSON(JSON.stringify([{type:'text',paints:{fill:{type:'none'}}}]))).toEqual([]);
    }finally{error.mockRestore();}
  });
  it('restores legacy documents without stale paint overrides',()=>{
    useCanvasStore.getState().setBackgroundPaint(gradient);
    expect(restoreCanvasData({elements:[],backgroundColor:'#ffffff'})).toBe(true);
    expect(useCanvasStore.getState().backgroundPaint).toBeUndefined();
  });
});

describe('US-EDIT-035 scheduled viewport fit preserves editor actions',()=>{
  beforeEach(()=>{
    vi.useFakeTimers();
    vi.stubGlobal('requestAnimationFrame',(callback:FrameRequestCallback)=>setTimeout(()=>callback(0),16));
    useCanvasStore.setState({canvasWidth:1000,canvasHeight:1000,zoom:1,canvasPanX:0,canvasPanY:0});
  });
  afterEach(()=>{vi.clearAllTimers();vi.useRealTimers();vi.unstubAllGlobals();document.querySelector('[data-canvas-viewport]')?.remove();});
  function viewport(){
    const node=document.createElement('div');node.dataset.canvasViewport='';
    Object.defineProperties(node,{clientWidth:{configurable:true,value:1000},clientHeight:{configurable:true,value:800}});
    document.body.append(node);return node;
  }
  it('does not overwrite manual zoom after the initial fit',()=>{
    viewport();scheduleFitCanvasZoomToViewport();vi.advanceTimersByTime(40);
    expect(useCanvasStore.getState().zoom).toBe(.72);
    useCanvasStore.getState().setZoom(.5);vi.advanceTimersByTime(1000);
    expect(useCanvasStore.getState().zoom).toBe(.5);
  });
  it('continues fitting changed layout while the user has not changed zoom',()=>{
    const node=viewport();scheduleFitCanvasZoomToViewport();vi.advanceTimersByTime(40);
    expect(useCanvasStore.getState().zoom).toBe(.72);
    Object.defineProperty(node,'clientHeight',{configurable:true,value:600});vi.advanceTimersByTime(350);
    expect(useCanvasStore.getState().zoom).toBe(.52);
    Object.defineProperty(node,'clientHeight',{configurable:true,value:900});vi.advanceTimersByTime(350);
    expect(useCanvasStore.getState().zoom).toBe(.82);
  });
  it('cancels a pending fit after document geometry changes',()=>{
    viewport();scheduleFitCanvasZoomToViewport();vi.advanceTimersByTime(40);
    useCanvasStore.setState({canvasWidth:2000,zoom:.3});vi.advanceTimersByTime(1000);
    expect(useCanvasStore.getState().zoom).toBe(.3);
  });
  it('supersedes callbacks from an older scheduled fit',()=>{
    const node=viewport();scheduleFitCanvasZoomToViewport();vi.advanceTimersByTime(100);
    scheduleFitCanvasZoomToViewport();vi.advanceTimersByTime(100);
    Object.defineProperty(node,'clientHeight',{configurable:true,value:600});vi.advanceTimersByTime(150);
    expect(useCanvasStore.getState().zoom).toBe(.72);
    vi.advanceTimersByTime(100);
    expect(useCanvasStore.getState().zoom).toBe(.52);
  });
});
