import {beforeEach,describe,it,expect} from 'vitest';
import {useCanvasStore} from '../useCanvasStore';
import {createShapeElement} from '../../lib/canvasUtils';
import {openColorPanel,closeColorPanel,previewColorPaint,commitColorPaint,useV3ColorPanel} from '../useV3ColorPanel';
import {useV3ElementPreview} from '../useV3ElementPreview';

beforeEach(()=>{closeColorPanel();useCanvasStore.setState({elements:[],selectedElementIds:[],backgroundColor:'#FFFFFF',backgroundPaint:undefined,history:{past:[],future:[]}});});
describe('US-EDIT-036 color target controller',()=>{
  // Contract: No Color in the Effects color panel removes every colored copy in a layered effect in one undoable edit.
  it.each([true,false])('clears all shadow layers with No Color and restores them on Undo (primary=%s)',primary=>{
    const shadow={color:'#00FFFF',opacity:1,blur:0,offsetX:-6,offsetY:0};
    const shape={...createShapeElement('rectangle'),shadow:primary?shadow:undefined,shadowLayers:[{...shadow,color:'#FF00FF',offsetX:6}]};
    useCanvasStore.setState({elements:[shape],selectedElementIds:[shape.id]});openColorPanel({elementId:shape.id,slot:'shadow'});
    expect(commitColorPaint({type:'none'})).toBe(true);expect(useCanvasStore.getState().elements[0]).toMatchObject({shadow:undefined,shadowLayers:undefined});
    expect(useCanvasStore.getState().history.past).toHaveLength(1);useCanvasStore.getState().undo();expect(useCanvasStore.getState().elements[0]).toMatchObject({shadow:shape.shadow,shadowLayers:shape.shadowLayers});
  });
  // Contract: a fill draft lives only in preview; confirmed alpha paint creates exactly one history entry.
  it('previews and commits only the selected fill once',()=>{
    const shape=createShapeElement('rectangle');useCanvasStore.setState({elements:[shape],selectedElementIds:[shape.id]});
    expect(openColorPanel({elementId:shape.id,slot:'fill'})).toBe(true);
    const paint={type:'solid' as const,color:'#FF0000',opacity:0.5};
    expect(previewColorPaint(paint)).toBe(true);expect(useCanvasStore.getState().elements[0]).toBe(shape);
    expect(useV3ElementPreview.getState().preview?.patch).toMatchObject({paints:{fill:paint}});
    expect(commitColorPaint(paint)).toBe(true);expect(commitColorPaint(paint)).toBe(false);
    expect(useCanvasStore.getState().history.past).toHaveLength(1);
    expect(useCanvasStore.getState().elements[0]).toMatchObject({paints:{fill:paint}});
  });
  // Contract: background preview never marks canonical history; close removes it without changing white background.
  it('discards an unfinished background gradient',()=>{
    openColorPanel({slot:'background'});
    const paint={type:'linear' as const,angle:0 as const,stops:[{color:'#FF0000',opacity:1},{color:'#0000FF',opacity:1}]};
    expect(previewColorPaint(paint)).toBe(true);expect(useV3ColorPanel.getState().draft).toEqual(paint);
    expect(useCanvasStore.getState().backgroundPaint).toBeUndefined();closeColorPanel();
    expect(useV3ColorPanel.getState().draft).toBe(null);expect(useCanvasStore.getState().backgroundColor).toBe('#FFFFFF');
    expect(useCanvasStore.getState().history.past).toHaveLength(0);
  });
  // Contract: selection changes close the stale target; subsequent paint cannot mutate it.
  it('rejects stale and locked targets',()=>{
    const shape=createShapeElement('rectangle');useCanvasStore.setState({elements:[shape],selectedElementIds:[shape.id]});
    openColorPanel({elementId:shape.id,slot:'fill'});useCanvasStore.setState({selectedElementIds:[]});
    expect(useV3ColorPanel.getState().target).toBe(null);expect(commitColorPaint({type:'none'})).toBe(false);
    useCanvasStore.setState({elements:[{...shape,locked:true}],selectedElementIds:[shape.id]});
    expect(openColorPanel({elementId:shape.id,slot:'fill'})).toBe(false);
  });
  // Contract: selecting an element cancels an unfinished canvas background without a persisted edit.
  it('clears a background draft when selection changes',()=>{
    const shape=createShapeElement('rectangle');useCanvasStore.setState({elements:[shape]});openColorPanel({slot:'background'});
    previewColorPaint({type:'solid',color:'#FF0000',opacity:1});useCanvasStore.getState().selectElement(shape.id);
    expect(useV3ColorPanel.getState().draft).toBe(null);expect(useCanvasStore.getState().backgroundPaint).toBeUndefined();expect(useCanvasStore.getState().history.past).toHaveLength(0);
  });
});
