import React, { useEffect, useRef, useState } from 'react';
import { Minus, Plus, X, Pipette } from 'lucide-react';
import type { Paint, PaintStop } from '../../../lib/canvasTypes';
import { paintToCss } from '../../../lib/paint';

type Solid = {type:'solid';color:string;opacity:number};
const clamp=(value:number,min:number,max:number)=>Math.max(min,Math.min(max,value));
const validHex=(value:string)=>/^#[0-9a-f]{6}$/i.test(value);
function toHsv(color:string){
  const [r,g,b]=[1,3,5].map(index=>parseInt(color.slice(index,index+2),16)/255);
  const max=Math.max(r,g,b),min=Math.min(r,g,b),delta=max-min;
  let h=delta===0?0:max===r?((g-b)/delta)%6:max===g?(b-r)/delta+2:(r-g)/delta+4;
  h=(h*60+360)%360;return {h,s:max===0?0:delta/max,v:max};
}
function fromHsv(h:number,s:number,v:number){
  const c=v*s,x=c*(1-Math.abs((h/60)%2-1)),m=v-c;
  const rgb=h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];
  return '#'+rgb.map(value=>Math.round((value+m)*255).toString(16).padStart(2,'0')).join('').toUpperCase();
}
function solidFrom(paint:Paint,index=0):Solid{
  if(paint.type==='solid')return paint;
  if(paint.type==='linear'||paint.type==='radial')return {type:'solid',...(paint.stops[index]??paint.stops[0])};
  return {type:'solid',color:'#123E62',opacity:1};
}
type ScreenPicker = {new():{open:()=>Promise<{sRGBHex:string}>}};
export function eyeDropperConstructor():ScreenPicker|undefined{return (window as typeof window & {EyeDropper?:ScreenPicker}).EyeDropper;}

function SolidControls({paint,onDraft,onCommit,onDirty,onCancel,onInvalid,resetKey,disabled=false}:{paint:Solid;onDraft:(paint:Solid)=>void;onCommit:(paint:Solid)=>void;onDirty:()=>void;onCancel:()=>void;onInvalid:()=>void;resetKey:number;disabled?:boolean}){
  const [hex,setHex]=useState(paint.color),[alpha,setAlpha]=useState(String(Math.round(paint.opacity*10000)/100));
  const [hsv,setHsv]=useState(()=>toHsv(paint.color));
  const pointer=useRef(false),pending=useRef<Solid>(paint),mounted=useRef(true),eyedropperBusy=useRef(false);
  const hexEdited=useRef(false),alphaEdited=useRef(false);
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
  useEffect(()=>{hexEdited.current=false;alphaEdited.current=false;},[resetKey]);
  useEffect(()=>{setHex(paint.color);setAlpha(String(Math.round(paint.opacity*10000)/100));setHsv(previous=>{const next=toHsv(paint.color);return {...next,h:next.s===0?previous.h:next.h};});pending.current=paint;},[paint.color,paint.opacity,resetKey]);
  const draft=(next:Solid)=>{pending.current=next;onDirty();onDraft(next);};
  const previewHsv=(next:typeof hsv)=>{setHsv(next);draft({...paint,color:fromHsv(next.h,next.s,next.v)});};
  const confirm=(next=pending.current)=>{if(!disabled)onCommit(next);};
  const plane=(event:React.PointerEvent<HTMLDivElement>)=>{const bounds=event.currentTarget.getBoundingClientRect();if(bounds.width&&bounds.height)previewHsv({...hsv,s:clamp((event.clientX-bounds.left)/bounds.width,0,1),v:1-clamp((event.clientY-bounds.top)/bounds.height,0,1)});};
  const hexCommit=()=>{if(!hexEdited.current)return;hexEdited.current=false;if(validHex(hex))confirm({...paint,color:hex.toUpperCase()});else{setHex(paint.color);onCancel();}};
  const alphaCommit=()=>{if(!alphaEdited.current)return;alphaEdited.current=false;const value=alpha.trim()?Number(alpha):NaN;if(Number.isFinite(value)&&value>=0&&value<=100)confirm({...paint,opacity:value/100});else{setAlpha(String(paint.opacity*100));onCancel();}};
  const sample=async()=>{const Constructor=eyeDropperConstructor();if(!Constructor||disabled||eyedropperBusy.current)return;eyedropperBusy.current=true;try{const result=await new Constructor().open();if(mounted.current&&validHex(result.sRGBHex))confirm({...paint,color:result.sRGBHex.toUpperCase()});}catch{/* Browser cancellation leaves the current draft untouched. */}finally{eyedropperBusy.current=false;}};
  return <div className="v3-solid-picker">
    <div className="v3-saturation" role="slider" tabIndex={disabled?-1:0} aria-label="Saturation and brightness" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(hsv.s*100)} aria-valuetext={`${Math.round(hsv.s*100)}% saturation, ${Math.round(hsv.v*100)}% brightness`} aria-disabled={disabled} style={{backgroundColor:fromHsv(hsv.h,1,1)}}
      onPointerDown={event=>{if(disabled||event.button!==0)return;event.preventDefault();pointer.current=true;event.currentTarget.setPointerCapture?.(event.pointerId);plane(event);}} onPointerMove={event=>{if(pointer.current)plane(event);}} onPointerUp={event=>{if(pointer.current){plane(event);pointer.current=false;confirm();}}} onPointerCancel={()=>{pointer.current=false;onCancel();}}
      onKeyDown={event=>{if(disabled)return;const delta=event.shiftKey?0.1:0.01;if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)){event.preventDefault();previewHsv({...hsv,s:clamp(hsv.s+(event.key==='ArrowRight'?delta:event.key==='ArrowLeft'?-delta:0),0,1),v:clamp(hsv.v+(event.key==='ArrowUp'?delta:event.key==='ArrowDown'?-delta:0),0,1)});}}} onKeyUp={event=>{if(event.key.startsWith('Arrow'))confirm();}}>
      <span style={{left:`${hsv.s*100}%`,top:`${(1-hsv.v)*100}%`}}/>
    </div>
    <label className="v3-paint-range">Hue<input type="range" aria-label="Hue" min={0} max={359} step={1} disabled={disabled} className="v3-hue" value={Math.round(hsv.h)} onChange={event=>previewHsv({...hsv,h:Number(event.target.value)})} onPointerUp={()=>confirm()} onPointerCancel={onCancel} onKeyUp={event=>{if(event.key.startsWith('Arrow')||['Home','End','PageUp','PageDown'].includes(event.key))confirm();}}/></label>
    <label className="v3-paint-range">Alpha<input type="range" aria-label="Alpha" min={0} max={100} step={1} disabled={disabled} className="v3-alpha" value={paint.opacity*100} style={{'--paint-color':paint.color} as React.CSSProperties} onChange={event=>draft({...paint,opacity:Number(event.target.value)/100})} onPointerUp={()=>confirm()} onPointerCancel={onCancel} onKeyUp={event=>{if(event.key.startsWith('Arrow')||['Home','End','PageUp','PageDown'].includes(event.key))confirm();}}/></label>
    <div className="v3-paint-values"><span className="v3-paint-swatch" aria-hidden="true" style={{background:paintToCss(paint)}}/><input aria-label="Hex color" value={hex} disabled={disabled} onChange={event=>{hexEdited.current=true;const next=event.target.value;setHex(next);onDirty();if(validHex(next))draft({...paint,color:next.toUpperCase()});else onInvalid();}} onBlur={hexCommit} onKeyDown={event=>{if(event.key==='Enter'){event.preventDefault();hexCommit();}}}/><label className="v3-paint-opacity-value"><input aria-label="Color opacity percent" type="number" min={0} max={100} step={0.01} disabled={disabled} value={alpha} onChange={event=>{alphaEdited.current=true;setAlpha(event.target.value);onDirty();const numeric=event.target.value.trim()?Number(event.target.value):NaN;if(Number.isFinite(numeric)&&numeric>=0&&numeric<=100)draft({...paint,opacity:numeric/100});else onInvalid();}} onBlur={alphaCommit} onKeyDown={event=>{if(event.key==='Enter'){event.preventDefault();alphaCommit();}}}/><span className="v3-paint-percent-suffix" aria-hidden="true">%</span></label><button type="button" aria-label="Pick custom color from screen" title={eyeDropperConstructor()?'Pick color from screen':'Eyedropper unavailable in this browser'} disabled={disabled||!eyeDropperConstructor()} onClick={()=>void sample()}><Pipette/></button></div>
  </div>;
}

export interface V3PaintPickerProps{currentPaint:Paint;supportsGradients?:boolean;disabled?:boolean;onDraft:(paint:Paint)=>void;onCommit:(paint:Paint)=>void;onCancel:()=>void;onClose:()=>void;}
export function V3PaintPicker({currentPaint,supportsGradients=true,disabled=false,onDraft,onCommit,onCancel,onClose}:V3PaintPickerProps){
  const [paint,setPaint]=useState<Paint>(currentPaint),[tab,setTab]=useState<'solid'|'gradient'>(currentPaint.type==='linear'||currentPaint.type==='radial'?'gradient':'solid');
  const [stop,setStop]=useState(0),[generation,setGeneration]=useState(0),[dirty,setDirty]=useState(false);
  const saved=useRef(currentPaint),canonicalKey=JSON.stringify(currentPaint);
  useEffect(()=>{saved.current=currentPaint;setPaint(currentPaint);setDirty(false);setStop(0);setTab(currentPaint.type==='linear'||currentPaint.type==='radial'?'gradient':'solid');},[canonicalKey]);
  const draft=(next:Paint)=>{if(disabled)return;setPaint(next);setDirty(true);onDraft(next);};
  const commit=(next:Paint)=>{if(disabled)return;setPaint(next);saved.current=next;setDirty(false);onCommit(next);};
  const cancel=()=>{setPaint(saved.current);setDirty(false);setGeneration(value=>value+1);setTab(saved.current.type==='linear'||saved.current.type==='radial'?'gradient':'solid');setStop(0);onCancel();};
  const gradient=paint.type==='linear'||paint.type==='radial'?paint:null;
  const editStop=(solid:Solid,final:boolean)=>{if(tab==='gradient'&&gradient){const stops=gradient.stops.map((value,index)=>index===stop?{color:solid.color,opacity:solid.opacity}:value);(final?commit:draft)({...gradient,stops});}else(final?commit:draft)(solid);};
  const switchTab=(next:'solid'|'gradient')=>{if(disabled||next===tab)return;setTab(next);if(next==='solid')draft(solidFrom(paint,stop));else{const first=solidFrom(paint);draft({type:'linear',angle:0,stops:[{color:first.color,opacity:first.opacity},{color:'#FFFFFF',opacity:1}]});setStop(0);}};
  const styles=[['Left to right',{type:'linear',angle:0}],['Top to bottom',{type:'linear',angle:90}],['Diagonal',{type:'linear',angle:135}],['Center out',{type:'radial',center:'center'}],['Corner out',{type:'radial',center:'corner'}]] as const;
  return <section className="v3-paint-picker" aria-label="Custom color picker" onKeyDown={event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();if(dirty)cancel();else onClose();}}}>
    <header><div role="tablist" aria-label="Color type"><button type="button" role="tab" aria-label="Solid color" aria-selected={tab==='solid'} disabled={disabled} onClick={()=>switchTab('solid')}>Solid color</button>{supportsGradients&&<button type="button" role="tab" aria-label="Gradient" aria-selected={tab==='gradient'} disabled={disabled} onClick={()=>switchTab('gradient')}>Gradient</button>}</div><button type="button" aria-label="Close color picker" onClick={()=>{onCancel();onClose();}}><X/></button></header>
    {tab==='gradient'&&gradient&&<><h3>Gradient colors</h3><div className="v3-gradient-stops">{gradient.stops.map((value,index)=><button key={index} type="button" aria-label={`Gradient stop ${index+1}`} aria-pressed={index===stop} disabled={disabled} style={{background:paintToCss({type:'solid',...value})}} onClick={()=>setStop(index)}><span className="sr-only">Stop {index+1}</span></button>)}<button type="button" aria-label="Add gradient stop" disabled={disabled||gradient.stops.length>=5} onClick={()=>{const stops:PaintStop[]=[...gradient.stops,{...gradient.stops.at(-1)!}];setStop(stops.length-1);commit({...gradient,stops});}}><Plus/></button><button type="button" aria-label="Remove gradient stop" disabled={disabled||gradient.stops.length<=2} onClick={()=>{const stops=gradient.stops.filter((_,index)=>index!==stop);setStop(Math.max(0,stop-1));commit({...gradient,stops});}}><Minus/></button></div><h3>Style</h3><div className="v3-gradient-presets">{styles.map(([label,style])=>{const sample={...style,stops:gradient.stops} as Paint;return <button type="button" key={label} aria-label={label} title={label} aria-pressed={gradient.type===style.type&&(style.type==='linear'?gradient.type==='linear'&&gradient.angle===style.angle:gradient.type==='radial'&&gradient.center===style.center)} disabled={disabled} onClick={()=>commit(sample)}><span aria-hidden="true" style={{background:paintToCss(sample)}}/><small>{label}</small></button>;})}</div></>}
    <SolidControls key={`${tab}:${stop}`} resetKey={generation} paint={solidFrom(paint,stop)} disabled={disabled} onDraft={value=>editStop(value,false)} onCommit={value=>editStop(value,true)} onDirty={()=>setDirty(true)} onCancel={cancel} onInvalid={onCancel}/>
  </section>;
}
