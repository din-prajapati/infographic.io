import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import {Simulate} from 'react-dom/test-utils';
import {describe,it,expect} from 'vitest';
import {V3ElementsPanel} from '../V3ElementsPanel';
import {useCanvasStore} from '../../../../hooks/useCanvasStore';
import {createShapeElement} from '../../../../lib/canvasUtils';
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
describe('elements library integration',()=>{
 // Contract: library inserts an actual shape with one atomic history step; stale replacement is visibly blocked.
 it('inserts one selected shape and blocks a stale replacement target',()=>{
  const node=document.createElement('div');document.body.append(node);const root=createRoot(node);
  useCanvasStore.setState({elements:[],selectedElementIds:[],history:{past:[],future:[]},canvasWidth:800,canvasHeight:600});
  act(()=>root.render(<V3ElementsPanel tab="shapes" onTabChange={()=>{}} onClose={()=>{}}/>));
  act(()=>Simulate.click(node.querySelector('[aria-label="Insert Ellipse"]')!));
  expect(useCanvasStore.getState().elements[0]).toMatchObject({type:'shape',shapeType:'ellipse'});expect(useCanvasStore.getState().history.past).toHaveLength(1);
  const shape=createShapeElement('rectangle');useCanvasStore.setState({elements:[shape],selectedElementIds:[]});act(()=>root.render(<V3ElementsPanel tab="shapes" replaceId={shape.id} onTabChange={()=>{}} onClose={()=>{}}/>));
  expect(node.querySelector('[role="status"]')!.textContent).toContain('Selection changed');expect(node.querySelector('[aria-label="Insert Ellipse"]')).toBeNull();
  act(()=>root.unmount());node.remove();
 });
});
