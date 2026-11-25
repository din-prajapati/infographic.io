import type {ElementShadow,ShapeElement} from './canvasTypes';
import {normalizeShadow,shadowFilter} from './elementStyles';

export type ShapeEffectPresetId='drop'|'glow'|'echo'|'glitch'|'radioactive'|'retro'|'midnight';
export interface ShapeEffectPreset {id:ShapeEffectPresetId;label:string;advanced?:boolean;shadow:ElementShadow;shadowLayers?:ElementShadow[]}
export const SHAPE_EFFECT_PRESETS:readonly ShapeEffectPreset[]=[
  {id:'drop',label:'Drop',shadow:{color:'#000000',opacity:.25,blur:12,offsetX:4,offsetY:4}},
  {id:'glow',label:'Glow',shadow:{color:'#14B8A6',opacity:.65,blur:24,offsetX:0,offsetY:0}},
  {id:'echo',label:'Echo',shadow:{color:'#153B5B',opacity:.32,blur:0,offsetX:8,offsetY:8},shadowLayers:[{color:'#153B5B',opacity:.18,blur:0,offsetX:16,offsetY:16}]},
  {id:'glitch',label:'Glitch',shadow:{color:'#00D4FF',opacity:.8,blur:0,offsetX:-6,offsetY:0},shadowLayers:[{color:'#FF2D95',opacity:.8,blur:0,offsetX:6,offsetY:0}]},
  {id:'radioactive',label:'Radioactive',advanced:true,shadow:{color:'#A3FF12',opacity:.85,blur:28,offsetX:0,offsetY:0}},
  {id:'retro',label:'Retro',advanced:true,shadow:{color:'#F59E0B',opacity:1,blur:0,offsetX:8,offsetY:8}},
  {id:'midnight',label:'Midnight',advanced:true,shadow:{color:'#3730A3',opacity:.75,blur:28,offsetX:0,offsetY:12}},
];
export function shapeEffectPatch(id:ShapeEffectPresetId|'none'):Pick<ShapeElement,'shadow'|'shadowLayers'>{
  const preset=SHAPE_EFFECT_PRESETS.find(value=>value.id===id);
  return {shadow:preset?{...preset.shadow}:undefined,shadowLayers:preset?.shadowLayers?.map(layer=>({...layer}))};
}
export function isValidShadowLayers(value:unknown):value is ElementShadow[]{
  return Array.isArray(value)&&value.length<=3&&value.every(layer=>!!layer&&typeof layer==='object'
    &&typeof layer.color==='string'&&/^#[\da-f]{6}$/i.test(layer.color)
    &&(['opacity','blur','offsetX','offsetY'] as const).every(key=>typeof layer[key]==='number'&&Number.isFinite(layer[key]))
    &&layer.opacity>=0&&layer.opacity<=1&&layer.blur>=0&&layer.blur<=100
    &&Math.abs(layer.offsetX)<=100&&Math.abs(layer.offsetY)<=100);
}
export function shapeEffectShadows(element:Pick<ShapeElement,'shadow'|'shadowLayers'>):ElementShadow[]{
  return [...(element.shadow?[element.shadow]:[]),...(element.shadowLayers??[])].map(normalizeShadow);
}
export function shapeEffectFilter(element:Pick<ShapeElement,'shadow'|'shadowLayers'>):string|undefined{
  // A single legacy shadow stays on its established CSS rendering path.
  return element.shadowLayers?.length?undefined:shadowFilter(element.shadow);
}
export function shapeEffectPadding(element:Pick<ShapeElement,'shadow'|'shadowLayers'|'strokeWidth'>):number{
  return Math.ceil(Math.max(0,...shapeEffectShadows(element).map(shadow=>shadow.blur*2+Math.max(Math.abs(shadow.offsetX),Math.abs(shadow.offsetY))))+Math.min(20,Math.max(0,element.strokeWidth))+2);
}
export function getShapeEffectPreset(element:Pick<ShapeElement,'shadow'|'shadowLayers'>):ShapeEffectPresetId|'none'|'custom'{
  const shadows=shapeEffectShadows(element);
  if(!shadows.length)return 'none';
  const same=(a:ElementShadow,b:ElementShadow)=>a.color.toLowerCase()===b.color.toLowerCase()&&(['opacity','blur','offsetX','offsetY'] as const).every(key=>a[key]===b[key]);
  return SHAPE_EFFECT_PRESETS.find(preset=>{
    const expected=shapeEffectShadows(preset);
    return expected.length===shadows.length&&expected.every((shadow,index)=>same(shadow,shadows[index]));
  })?.id??'custom';
}
