import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,expect,it} from 'vitest';
import {ShapeElement} from '../ShapeElement';
import {createShapeElement} from '../../../lib/canvasUtils';
import {shapeEffectPatch} from '../../../lib/shapeEffects';

describe('US-EDIT-038 independent shape effect rendering',()=>{
  it('creates exactly two Echo shadows from source alpha, preserving source fill',()=>{
    const element={...createShapeElement('rectangle',0,0),...shapeEffectPatch('echo')};
    const node=document.createElement('div');node.innerHTML=renderToStaticMarkup(<ShapeElement element={element} isSelected={false} onSelect={()=>{}}/>);
    expect(node.querySelectorAll('feGaussianBlur')).toHaveLength(2);
    expect([...node.querySelectorAll('feGaussianBlur')].map(value=>value.getAttribute('in'))).toEqual(['SourceAlpha','SourceAlpha']);
    expect([...node.querySelectorAll('feOffset')].map(value=>value.getAttribute('dx'))).toEqual(['8','16']);
    expect(node.querySelectorAll('feMergeNode')).toHaveLength(3);
    expect(node.querySelector('g[fill]')!.getAttribute('fill')).toBe(element.fill);
  });
  it('preserves the legacy single-shadow CSS path',()=>{
    const element={...createShapeElement('rectangle',0,0),shadow:{color:'#000000',opacity:.3,blur:16,offsetX:8,offsetY:8}};
    const node=document.createElement('div');node.innerHTML=renderToStaticMarkup(<ShapeElement element={element} isSelected={false} onSelect={()=>{}}/>);
    expect(node.querySelector('filter')).toBeNull();
    expect(node.innerHTML).toContain('drop-shadow(8px 8px 8px rgba(0, 0, 0, 0.3))');
  });
});
