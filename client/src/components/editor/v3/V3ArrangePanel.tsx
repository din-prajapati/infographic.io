import React,{useEffect,useRef,useState} from 'react';
import {AlignCenterHorizontal,AlignCenterVertical,AlignEndHorizontal,AlignEndVertical,AlignStartHorizontal,AlignStartVertical,Lock,LockOpen,X} from 'lucide-react';
import {useCanvasStore} from '../../../hooks/useCanvasStore';
import type {CanvasElement} from '../../../lib/canvasTypes';
import {canMoveV3Layer,moveV3Layer,type V3LayerMove} from '../../../lib/v3LayerActions';
import {alignV3SelectionToPage,commitV3Geometry,v3ArrangeEligibility,v3GeometryFieldEnabled,type V3ArrangeBlock,type V3GeometryField,type V3PageAlign} from '../../../lib/v3Arrange';
import type {LayerPresentation} from './V3LayersPanel';
import './v3-arrange-panel.css';

export type V3SidebarTab='arrange'|'layers';
/** Shared by the Arrange and Layers views; only one is rendered at a time. */
export const V3_SIDEBAR_VIEW_ID='v3-sidebar-view';

export function V3SidebarTabs({active,onChange}:{active:V3SidebarTab;onChange:(tab:V3SidebarTab)=>void}){
  const tabs=['arrange','layers'] as const;
  const onKeyDown=(event:React.KeyboardEvent<HTMLDivElement>)=>{
    const index=tabs.indexOf(active),next=event.key==='ArrowRight'?tabs[(index+1)%tabs.length]:event.key==='ArrowLeft'?tabs[(index+tabs.length-1)%tabs.length]:event.key==='Home'?tabs[0]:event.key==='End'?tabs[tabs.length-1]:null;
    if(!next)return;event.preventDefault();onChange(next);
    requestAnimationFrame(()=>event.currentTarget?.querySelector<HTMLButtonElement>(`[data-sidebar-tab="${next}"]`)?.focus());
  };
  return <div className="v3-sidebar-tabs" role="tablist" aria-label="Sidebar views" onKeyDown={onKeyDown}>
    {tabs.map(tab=><button key={tab} type="button" role="tab" data-sidebar-tab={tab} aria-selected={active===tab} aria-controls={active===tab?V3_SIDEBAR_VIEW_ID:undefined} tabIndex={active===tab?0:-1} onClick={()=>onChange(tab)}>{tab==='arrange'?'Arrange':'Layers'}</button>)}
  </div>;
}

const stack=[['Forward','forward'],['Backward','backward'],['To front','front'],['To back','back']] as const;
const aligns=[['Top','top',AlignStartHorizontal],['Left','left',AlignStartVertical],['Middle','middle',AlignCenterHorizontal],['Centre','center',AlignCenterVertical],['Bottom','bottom',AlignEndHorizontal],['Right','right',AlignEndVertical]] as const;
const blocked:Record<V3ArrangeBlock,string>={empty:'Select an element to arrange it.',missing:'The selection changed. Select an element again.',hidden:'Show the hidden selection to arrange it.',locked:'Unlock the selection to arrange it.',invalid:'This selection cannot be arranged.'};
const format=(value:number|undefined)=>value===undefined?"":String(Math.round(value*10)/10);

function StackIcon({direction}:{direction:V3LayerMove}){
  const upward=direction==='forward'||direction==='front',extreme=direction==='front'||direction==='back';
  return <svg data-arrange-stack-icon={direction} aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d={upward?'M8 12 3 15 12 20 21 15 16 12':'M8 11 3 8 12 3 21 8 16 11'}/>
    <path d={upward?'M12 16V4m-4 4 4-4 4 4':'M12 7v13m-4-4 4 4 4-4'}/>
    {extreme&&<path d={upward?'M8 2h8':'M8 22h8'}/>}
  </svg>;
}

function GeometryField({label,prefix,suffix,value,disabled,title,onCommit}:{label:string;prefix:string;suffix?:string;value:number|undefined;disabled:boolean;title?:string;onCommit:(raw:string)=>boolean}){
  const [draft,setDraft]=useState(format(value));
  const dirty=useRef(false),latest=useRef(value);latest.current=value;
  useEffect(()=>{if(!dirty.current)setDraft(format(value));},[value]);
  useEffect(()=>{if(disabled){dirty.current=false;setDraft(format(latest.current));}},[disabled]);
  const commit=()=>{if(!dirty.current)return;dirty.current=false;if(!onCommit(draft))setDraft(format(latest.current));};
  return <label className="v3-arrange-field" title={title}><span className="v3-arrange-field-label">{prefix}</span><span className="v3-arrange-field-box">
    <input aria-label={label} inputMode="decimal" autoComplete="off" spellCheck={false} value={draft} disabled={disabled}
      onChange={event=>{dirty.current=true;setDraft(event.target.value);}} onBlur={commit}
      onKeyDown={event=>{
        if(event.key==='Enter'){event.preventDefault();commit();}
        else if(event.key==='Escape'&&dirty.current){event.preventDefault();event.stopPropagation();dirty.current=false;setDraft(format(latest.current));}
      }}/>{suffix&&<span aria-hidden="true">{suffix}</span>}</span></label>;
}

export function V3ArrangePanel({onClose,tabs,presentation}:{onClose:()=>void;tabs?:React.ReactNode;presentation?:LayerPresentation|null}){
  const elements=useCanvasStore(state=>state.elements),selectedIds=useCanvasStore(state=>state.selectedElementIds);
  const [announcement,setAnnouncement]=useState(''),[error,setError]=useState<string|null>(null),[ratioLocked,setRatioLocked]=useState(false);
  const eligibility=v3ArrangeEligibility(elements,selectedIds);
  const single=eligibility.ok&&eligibility.targets.length===1?eligibility.targets[0]:undefined;
  const shown:CanvasElement|undefined=single&&presentation?.id===single.id&&presentation.baseElement===single?{...single,...presentation.patch} as CanvasElement:single;
  const singleId=single?.id;
  useEffect(()=>{setRatioLocked(false);setError(null);},[singleId]);
  function move(direction:V3LayerMove,name:string){if(single&&moveV3Layer(single.id,direction))setAnnouncement(`Moved ${single.name} ${name.toLowerCase()}.`);}
  function align(value:V3PageAlign,name:string){if(alignV3SelectionToPage(value))setAnnouncement(`Aligned to page ${name.toLowerCase()}.`);}
  function commit(field:V3GeometryField,raw:string){
    if(!single)return false;
    const result=commitV3Geometry(single.id,field,raw,ratioLocked);
    if(result.status==='invalid'){setError(result.message);return false;}
    setError(null);return result.status==='committed';
  }
  const field=(name:V3GeometryField,label:string,prefix:string,suffix?:string)=>{
    const enabled=!!single&&v3GeometryFieldEnabled(single,name);
    return <GeometryField key={`${name}:${singleId??'none'}`} label={label} prefix={prefix} suffix={suffix} value={shown?.[name]} disabled={!enabled}
      title={single&&!enabled?`This line is flat, so it has no ${name} to resize.`:undefined} onCommit={raw=>commit(name,raw)}/>;
  };
  return <section id={V3_SIDEBAR_VIEW_ID} className="v3-arrange-panel" aria-label="Arrange sidebar">
    <header><h2>Arrange</h2><button type="button" aria-label="Close Arrange sidebar" onClick={onClose}><X/></button></header>
    {tabs}
    <div className="v3-arrange-body">
      {!eligibility.ok&&<p className="v3-arrange-status" role="status">{blocked[eligibility.reason]}</p>}
      <div role="group" aria-label="Stacking" className="v3-arrange-group">
        <div className="v3-arrange-stack">{stack.map(([name,direction])=><button key={direction} type="button" aria-label={name} disabled={!single||!canMoveV3Layer(single.id,direction)} onClick={()=>move(direction,name)}><StackIcon direction={direction}/><span>{name}</span></button>)}</div>
      </div>
      <div role="group" aria-label="Align to page" className="v3-arrange-group"><h3>Align to page</h3>
        <div className="v3-arrange-align">{aligns.map(([name,value,Icon])=><button key={value} type="button" aria-label={`Align ${value}`} title={`Align ${value}`} disabled={!eligibility.ok} onClick={()=>align(value,name)}><Icon/><span>{name}</span></button>)}</div>
      </div>
      <div role="group" aria-label="Size and position" className="v3-arrange-group"><h3>Advanced</h3>
        {eligibility.ok&&!single&&<p className="v3-arrange-note">Stacking, size and position apply to one element at a time.</p>}
        <div className="v3-arrange-fields">
          {field('width','Width','Width','px')}
          {field('height','Height','Height','px')}
          <div className="v3-arrange-ratio-field"><span className="v3-arrange-field-label">Ratio</span><button type="button" className="v3-arrange-ratio" aria-label="Lock aspect ratio" title="Lock aspect ratio" aria-pressed={ratioLocked} disabled={!single} onClick={()=>setRatioLocked(value=>!value)}>{ratioLocked?<Lock/>:<LockOpen/>}</button></div>
          {field('x','X position','X','px')}{field('y','Y position','Y','px')}
          {field('rotation','Rotation','Rotate','°')}
        </div>
        {error&&<p className="v3-arrange-error" role="alert">{error}</p>}
      </div>
    </div>
    <div className="sr-only" aria-live="polite" aria-atomic="true">{announcement}</div>
  </section>;
}
