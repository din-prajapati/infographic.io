import React, { useEffect } from 'react';
import { X, Ban } from 'lucide-react';
import type { ShapeElement, ElementShadow } from '../../../lib/canvasTypes';
import { SHAPE_EFFECT_PRESETS, getShapeEffectPreset, shapeEffectPatch, type ShapeEffectPresetId } from '../../../lib/shapeEffects';
import { commitElementPatch } from '../../../lib/v3ElementEditing';
import { clearElementPreview, previewElementPatch } from '../../../hooks/useV3ElementPreview';
import { NumericControl, V3ColorButton } from './V3ElementToolbar';
import './v3-effects-panel.css';

function EffectThumbnail({id,shadows}:{id:string;shadows:ElementShadow[]}) {
  return <svg data-artwork-svg="true" viewBox="0 0 88 88" aria-hidden="true"><defs>{shadows.map((shadow,index)=><filter key={index} id={`effect-card-${id}-${index}`} x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation={shadow.blur/4}/></filter>)}</defs>{shadows.map((shadow,index)=><rect key={index} x={26+shadow.offsetX/2} y={26+shadow.offsetY/2} width="36" height="36" rx="6" fill={shadow.color} opacity={shadow.opacity} filter={`url(#effect-card-${id}-${index})`}/>)}<rect x="26" y="26" width="36" height="36" rx="6" fill="#8B5CF6"/></svg>;
}

export function V3EffectsPanel({element,onClose}:{element:ShapeElement;onClose:()=>void}) {
  useEffect(()=>()=>clearElementPreview(element.id),[element.id]);
  const selected=getShapeEffectPreset(element),disabled=element.locked||!element.visible;
  const shadow=element.shadow;
  const card=(id:ShapeEffectPresetId|'none',label:string,shadows:ElementShadow[]=[])=>{
    const patch=shapeEffectPatch(id);
    return <button key={id} type="button" className="v3-effect-card" aria-label={`Effect ${label}`} aria-pressed={selected===id} disabled={disabled}
      onMouseEnter={()=>previewElementPatch(element.id,patch)} onMouseLeave={()=>clearElementPreview(element.id)} onFocus={()=>previewElementPatch(element.id,patch)} onBlur={()=>clearElementPreview(element.id)}
      onClick={()=>commitElementPatch(element.id,patch)}><span className="v3-effect-thumbnail">{id==='none'?<Ban aria-hidden="true"/>:<EffectThumbnail id={id} shadows={shadows}/>}</span><span>{label}</span></button>;
  };
  const presets=(advanced:boolean)=>SHAPE_EFFECT_PRESETS.filter(preset=>!!preset.advanced===advanced).map(preset=>card(preset.id,preset.label,[preset.shadow,...(preset.shadowLayers??[])]));
  const custom=(key:'opacity'|'blur'|'offsetX'|'offsetY',value:number)=>({shadow:{...shadow!,[key]:key==='opacity'?value/100:value}});
  const changeCustom=(key:'opacity'|'blur'|'offsetX'|'offsetY',value:number,commit:boolean)=>{
    if(!shadow)return;
    const displayed=key==='opacity'?Math.round(shadow.opacity*100):shadow[key];
    if(value===displayed){clearElementPreview(element.id);return;}
    (commit?commitElementPatch:previewElementPatch)(element.id,custom(key,value));
  };
  return <section className="v3-effects-panel" aria-label="Shape effects">
    <header><h2>Effects</h2><button type="button" aria-label="Close Effects" onClick={()=>{clearElementPreview(element.id);onClose();}}><X/></button></header>
    <div className="v3-effects-grid">{card('none','None')}{presets(false)}</div>
    <h3>Advanced</h3><div className="v3-effects-grid">{presets(true)}</div>
    {selected==='custom'&&<p className="v3-effect-current" role="status">Custom effect</p>}
    {shadow&&<fieldset className="v3-effects-custom" disabled={disabled}><legend>Adjust effect</legend><div className="v3-effects-color"><span>Color</span><V3ColorButton element={element} slot="shadow" label="Shadow color"/></div>
      {([['opacity','Shadow opacity',0,100],['blur','Shadow blur',0,100],['offsetX','Shadow horizontal offset',-100,100],['offsetY','Shadow vertical offset',-100,100]] as const).map(([key,label,min,max])=><NumericControl key={key} label={label} min={min} max={max} value={key==='opacity'?Math.round(shadow.opacity*100):shadow[key]}
        onDraft={value=>changeCustom(key,value,false)} onCommit={value=>changeCustom(key,value,true)} onCancel={()=>clearElementPreview(element.id)}/>)}</fieldset>}
  </section>;
}
