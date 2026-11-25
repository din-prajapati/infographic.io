import {describe,expect,it} from 'vitest';
import {createShapeElement} from '../canvasUtils';
import {SHAPE_EFFECT_PRESETS,getShapeEffectPreset,isValidShadowLayers,shapeEffectPatch,shapeEffectShadows} from '../shapeEffects';

describe('US-EDIT-038 functional shape effects',()=>{
  // Contract: the new Drop card preserves the former toolbar's default shadow values.
  it('retains the existing default shadow when choosing Drop',()=>{
    expect(shapeEffectPatch('drop')).toEqual({shadow:{color:'#000000',opacity:.25,blur:12,offsetX:4,offsetY:4},shadowLayers:undefined});
  });
  it('offers exactly seven named functional presets with advanced grouping',()=>{
    expect(SHAPE_EFFECT_PRESETS.map(value=>value.label)).toEqual(['Drop','Glow','Echo','Glitch','Radioactive','Retro','Midnight']);
    expect(SHAPE_EFFECT_PRESETS.filter(value=>value.advanced).map(value=>value.label)).toEqual(['Radioactive','Retro','Midnight']);
  });
  it('recognizes semantic persisted values without a stored preset identifier',()=>{
    const shape=createShapeElement('rectangle',0,0);
    for(const preset of SHAPE_EFFECT_PRESETS){
      const patch=shapeEffectPatch(preset.id);
      expect(getShapeEffectPreset({...shape,...JSON.parse(JSON.stringify(patch))})).toBe(preset.id);
      expect('effectId' in patch).toBe(false);
    }
    expect(shapeEffectPatch('none')).toEqual({shadow:undefined,shadowLayers:undefined});
    expect(getShapeEffectPreset(shape)).toBe('none');
  });
  it('makes exactly two independently offset echo copies and opposed glitch copies',()=>{
    const shape=createShapeElement('rectangle',0,0);
    expect(shapeEffectShadows({...shape,...shapeEffectPatch('echo')}).map(value=>[value.offsetX,value.offsetY])).toEqual([[8,8],[16,16]]);
    expect(shapeEffectShadows({...shape,...shapeEffectPatch('glitch')}).map(value=>[value.color,value.offsetX])).toEqual([['#00D4FF',-6],['#FF2D95',6]]);
  });
  it('rejects invalid extra layers while retaining bounded empty/custom values',()=>{
    expect(isValidShadowLayers([])).toBe(true);
    const shadow={color:'#123456',opacity:.5,blur:12,offsetX:0,offsetY:0};
    expect(isValidShadowLayers([shadow])).toBe(true);
    for(const layers of [null,[{...shadow,color:'red'}],[{...shadow,blur:NaN}],[{...shadow,offsetX:101}],Array(4).fill(shadow)])expect(isValidShadowLayers(layers)).toBe(false);
  });
});
