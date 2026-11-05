import React, { useEffect, useRef, useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Grid2X2, List, Pipette, Plus, Search, Slash, X } from 'lucide-react';
import type { Paint } from '../../../lib/canvasTypes';
import { paintToCss } from '../../../lib/paint';
import { eyeDropperConstructor, V3PaintPicker } from './V3PaintPicker';
import './v3-color-panel.css';

export interface V3ColorPanelProps {
  targetLabel:string;currentPaint:Paint;designColors:Paint[];
  brandPalettes:{id:string;name:string;colors:Paint[]}[];defaultColors:Paint[];
  supportsGradients?:boolean;disabled?:boolean;
  onDraft:(paint:Paint)=>void;onCommit:(paint:Paint)=>void;onCancel:()=>void;onClose:()=>void;onEditBrand:()=>void;
}
const colorNames:Record<string,string>={'#000000':'Black','#FFFFFF':'White','#FF0000':'Red','#00FF00':'Green','#0000FF':'Blue','#FFFF00':'Yellow','#00FFFF':'Cyan','#FF00FF':'Magenta','#FFA500':'Orange','#800080':'Purple','#FFC0CB':'Pink','#808080':'Gray','#123E62':'Navy','#076B6C':'Teal','#008080':'Teal','#A52A2A':'Brown','#545454':'Dark gray','#737373':'Gray','#A6A6A6':'Light gray','#D9D9D9':'Light gray','#EF4444':'Red','#F97316':'Orange','#FACC15':'Yellow','#22C55E':'Green','#14B8A6':'Teal','#3B82F6':'Blue','#8B5CF6':'Purple','#EC4899':'Pink'};
function paintLabel(paint:Paint){if(paint.type==='none')return 'No color';if(paint.type==='solid')return `${colorNames[paint.color.toUpperCase()]??'Color'} ${paint.color.toUpperCase()}${paint.opacity<1?` ${Math.round(paint.opacity*100)}%`:''}`;return `${paint.type==='linear'?'Linear':'Radial'} gradient ${paint.stops.map(stop=>`${colorNames[stop.color.toUpperCase()]??''} ${stop.color}`).join(' ')}`;}
function unique(paints:Paint[]){const seen=new Set<string>();return paints.filter(paint=>{const key=JSON.stringify(paint);if(seen.has(key))return false;seen.add(key);return true;});}

export function V3ColorPanel({targetLabel,currentPaint,designColors,brandPalettes,defaultColors,supportsGradients=true,disabled=false,onDraft,onCommit,onCancel,onClose,onEditBrand}:V3ColorPanelProps){
  const [query,setQuery]=useState(''),[layout,setLayout]=useState<'grid'|'list'>('grid'),[open,setOpen]=useState(false),[container,setContainer]=useState<HTMLElement|null>(null);
  const panel=useRef<HTMLElement>(null),currentButton=useRef<HTMLButtonElement>(null),mounted=useRef(true),busy=useRef(false),cancelRef=useRef(onCancel);
  cancelRef.current=onCancel;
  useEffect(()=>{setContainer(panel.current?.closest<HTMLElement>('.v3-editor')??null);mounted.current=true;return()=>{mounted.current=false;cancelRef.current();};},[]);
  const key=JSON.stringify(currentPaint);
  useEffect(()=>{setOpen(false);onCancel();},[targetLabel]);
  const normalized=query.trim().toLowerCase();
  const allowed=(paint:Paint)=>supportsGradients||paint.type==='solid'||paint.type==='none';
  const matches=(paint:Paint)=>allowed(paint)&&(!normalized||paintLabel(paint).toLowerCase().includes(normalized));
  const choose=(paint:Paint)=>{if(!disabled&&allowed(paint)){onCancel();onCommit(paint);}};
  const closePicker=()=>{setOpen(false);onCancel();};
  const sample=async()=>{const Constructor=eyeDropperConstructor();if(!Constructor||disabled||busy.current)return;busy.current=true;const target=targetLabel;try{const result=await new Constructor().open();if(mounted.current&&target===panel.current?.dataset.target&&/^#[0-9a-f]{6}$/i.test(result.sRGBHex))choose({type:'solid',color:result.sRGBHex.toUpperCase(),opacity:1});}catch{/* Unsupported and cancelled eyedroppers preserve artwork. */}finally{busy.current=false;}};
  const swatches=(paints:Paint[],section:string)=><div className={`v3-panel-color-swatches v3-panel-color-swatches--${layout}`}>{unique(paints).filter(matches).map((paint,index)=><button key={`${section}:${JSON.stringify(paint)}:${index}`} type="button" disabled={disabled} aria-label={`${section}: ${paintLabel(paint)}`} title={paintLabel(paint)} aria-pressed={JSON.stringify(paint)===key} onClick={()=>choose(paint)}><span className={`v3-paint-swatch${paint.type==='none'?' v3-no-color':''}`} style={{background:paintToCss(paint)}}/>{layout==='list'&&<span>{paintLabel(paint)}</span>}</button>)}</div>;
  return <section ref={panel} className="v3-color-panel" data-target={targetLabel} aria-label={`${targetLabel} panel`} onKeyDown={event=>{if(event.key==='Escape'&&!open){event.preventDefault();event.stopPropagation();onCancel();onClose();}}}>
    <header className="v3-color-panel-header"><h2>{targetLabel}</h2><button type="button" aria-label={layout==='grid'?'Show color list':'Show color grid'} title={layout==='grid'?'List view':'Grid view'} onClick={()=>setLayout(layout==='grid'?'list':'grid')}>{layout==='grid'?<List/>:<Grid2X2/>}</button><button type="button" aria-label="Close color panel" onClick={()=>{onCancel();onClose();}}><X/></button></header>
    <label className="v3-color-search"><Search aria-hidden="true"/><input type="search" aria-label="Search colors" placeholder="Search name or #hex" value={query} onChange={event=>setQuery(event.target.value)}/></label>
    <section><h3>{targetLabel.replace(/ color$/i,'')} colors</h3><div className="v3-current-colors"><Popover.Root open={open} onOpenChange={value=>{setOpen(value);if(!value)onCancel();}}><Popover.Anchor asChild><button ref={currentButton} type="button" aria-label="Add color" title="Add color" disabled={disabled} onClick={()=>setOpen(true)}><Plus/></button></Popover.Anchor><Popover.Portal container={container}><Popover.Content aria-label="Color picker popover" className="v3-color-picker-popover" side="right" align="start" sideOffset={16} collisionPadding={12} onEscapeKeyDown={event=>event.preventDefault()} onPointerDown={event=>event.stopPropagation()} onClick={event=>event.stopPropagation()} onOpenAutoFocus={event=>{event.preventDefault();setTimeout(()=>panel.current?.closest('.v3-editor')?.querySelector<HTMLElement>('.v3-paint-picker [role=tab]')?.focus(),0);}} onCloseAutoFocus={event=>{event.preventDefault();currentButton.current?.focus();}}><V3PaintPicker currentPaint={currentPaint} supportsGradients={supportsGradients} disabled={disabled} onDraft={onDraft} onCommit={onCommit} onCancel={onCancel} onClose={closePicker}/></Popover.Content></Popover.Portal></Popover.Root>
      <button type="button" aria-label="Pick color from screen" title={eyeDropperConstructor()?'Pick color from screen':'Eyedropper unavailable in this browser'} disabled={disabled||!eyeDropperConstructor()} onClick={()=>void sample()}><Pipette/></button>
      <button type="button" aria-label="No color" title="No color" className="v3-no-color" aria-pressed={currentPaint.type==='none'} disabled={disabled} onClick={()=>choose({type:'none'})}><Slash/></button>
      <button type="button" aria-label="Edit current color" title={paintLabel(currentPaint)} disabled={disabled} onClick={()=>setOpen(true)}><span className="v3-paint-swatch" style={{background:paintToCss(currentPaint)}}/></button>
    </div></section>
    {/^#[0-9a-f]{6}$/i.test(query.trim())&&<button type="button" className="v3-search-custom" aria-label={`Use ${query.trim().toUpperCase()}`} disabled={disabled} onClick={()=>choose({type:'solid',color:query.trim().toUpperCase(),opacity:1})}><span className="v3-paint-swatch" style={{background:query.trim()}}/>Use {query.trim().toUpperCase()}</button>}
    <section><h3>Colors in this design</h3>{swatches(designColors,'Design color')}{unique(designColors).filter(matches).length===0&&<p>No matching design colors</p>}</section>
    <section><div className="v3-color-section-heading"><h3>Brand colors</h3><button type="button" aria-label="Edit brand colors" onClick={()=>{closePicker();onEditBrand();}}>Edit</button></div>{brandPalettes.length?brandPalettes.map(palette=><div key={palette.id} className="v3-brand-color-group"><h4>{palette.name}</h4>{swatches(palette.colors,`${palette.name} color`)}</div>):<p>Add a brand palette to see its colors here.</p>}</section>
    <section><h3>Default solid colors</h3>{swatches(defaultColors.filter(paint=>paint.type==='solid'),'Default color')}</section>
    {supportsGradients&&<section><h3>Default gradients</h3>{swatches(defaultColors.filter(paint=>paint.type==='linear'||paint.type==='radial'),'Default gradient')}</section>}
  </section>;
}
