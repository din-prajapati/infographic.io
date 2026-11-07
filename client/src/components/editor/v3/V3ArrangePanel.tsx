import React,{useEffect,useRef,useState} from 'react';
import {AlignCenterHorizontal,AlignCenterVertical,AlignEndHorizontal,AlignEndVertical,AlignStartHorizontal,AlignStartVertical,ArrowDown,ArrowDownToLine,ArrowUp,ArrowUpToLine,Link2,Link2Off,X} from 'lucide-react';
import {useCanvasStore} from '../../../hooks/useCanvasStore';
import type {CanvasElement} from '../../../lib/canvasTypes';
import {canMoveV3Layer,moveV3Layer,type V3LayerMove} from '../../../lib/v3LayerActions';
import {alignV3SelectionToPage,commitV3Geometry,v3ArrangeEligibility,v3GeometryFieldEnabled,type V3ArrangeBlock,type V3GeometryField,type V3PageAlign} from '../../../lib/v3Arrange';
import type {LayerPresentation} from './V3LayersPanel';
import './v3-arrange-panel.css';

export type V3SidebarTab='arrange'|'layers';

export function V3SidebarTabs({active,onChange}:{active:V3SidebarTab;onChange:(tab:V3SidebarTab)=>void}){
  return <div className="v3-sidebar-tabs" role="tablist" aria-label="Sidebar views">
    {(['arrange','layers'] as const).map(tab=><button key={tab} type="button" role="tab" aria-selected={active===tab} onClick={()=>onChange(tab)}>{tab==='arrange'?'Arrange':'Layers'}</button>)}
  </div>;
}

const stack=[['Forward','forward',ArrowUp],['Backward','backward',ArrowDown],['To front','front',ArrowUpToLine],['To back','back',ArrowDownToLine]] as const;
const aligns=[['Left','left',AlignStartVertical],['Center','center',AlignCenterVertical],['Right','right',AlignEndVertical],['Top','top',AlignStartHorizontal],['Middle','middle',AlignCenterHorizontal],['Bottom','bottom',AlignEndHorizontal]] as const;
const blocked:Record<V3ArrangeBlock,string>={empty:'Select an element to arrange it.',missing:'The selection changed. Select an element again.',hidden:'Show the hidden selection to arrange it.',locked:'Unlock the selection to arrange it.',invalid:'This selection cannot be arranged.'};
const format=(value:number|undefined)=>value===undefined?"":String(Math.round(value*10)/10);

function GeometryField({label,prefix,suffix,value,disabled,title,onCommit}:{label:string;prefix:string;suffix?:string;value:number|undefined;disabled:boolean;title?:string;onCommit:(raw:string)=>boolean}){
  const [draft,setDraft]=useState(format(value));
  const dirty=useRef(false),latest=useRef(value);latest.current=value;
  useEffect(()=>{if(!dirty.current)setDraft(format(value));},[value]);
  useEffect(()=>{if(disabled){dirty.current=false;setDraft(format(latest.current));}},[disabled]);
  const commit=()=>{if(!dirty.current)return;dirty.current=false;if(!onCommit(draft))setDraft(format(latest.current));};
  return <label className="v3-arrange-field" title={title}><span aria-hidden="true">{prefix}</span>
    <input aria-label={label} inputMode="decimal" autoComplete="off" spellCheck={false} value={draft} disabled={disabled}
      onChange={event=>{dirty.current=true;setDraft(event.target.value);}} onBlur={commit}
      onKeyDown={event=>{
        if(event.key==='Enter'){event.preventDefault();commit();}
        else if(event.key==='Escape'&&dirty.current){event.preventDefault();event.stopPropagation();dirty.current=false;setDraft(format(latest.current));}
      }}/>{suffix&&<span aria-hidden="true">{suffix}</span>}</label>;
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
    return <GeometryField label={label} prefix={prefix} suffix={suffix} value={shown?.[name]} disabled={!enabled}
      title={single&&!enabled?`This line is flat, so it has no ${name} to resize.`:undefined} onCommit={raw=>commit(name,raw)}/>;
  };
  return <section className="v3-arrange-panel" aria-label="Arrange sidebar">
    <header><h2>Arrange</h2><button type="button" aria-label="Close Arrange sidebar" onClick={onClose}><X/></button></header>
    {tabs}
    <div className="v3-arrange-body">
      {!eligibility.ok&&<p className="v3-arrange-status" role="status">{blocked[eligibility.reason]}</p>}
      <div role="group" aria-label="Stacking" className="v3-arrange-group"><h3>Stacking</h3>
        <div className="v3-arrange-stack">{stack.map(([name,direction,Icon])=><button key={direction} type="button" aria-label={name} disabled={!single||!canMoveV3Layer(single.id,direction)} onClick={()=>move(direction,name)}><Icon/><span>{name}</span></button>)}</div>
      </div>
      <div role="group" aria-label="Align to page" className="v3-arrange-group"><h3>Align to page</h3>
        <div className="v3-arrange-align">{aligns.map(([name,value,Icon])=><button key={value} type="button" aria-label={`Align ${name.toLowerCase()}`} title={`Align ${name.toLowerCase()}`} disabled={!eligibility.ok} onClick={()=>align(value,name)}><Icon/><span>{name}</span></button>)}</div>
      </div>
      <div role="group" aria-label="Size and position" className="v3-arrange-group"><h3>Size and position</h3>
        {eligibility.ok&&!single&&<p className="v3-arrange-note">Stacking, size and position apply to one element at a time.</p>}
        <div className="v3-arrange-fields">
          {field('width','Width','W')}
          <button type="button" className="v3-arrange-ratio" aria-label="Lock aspect ratio" title="Lock aspect ratio" aria-pressed={ratioLocked} disabled={!single} onClick={()=>setRatioLocked(value=>!value)}>{ratioLocked?<Link2/>:<Link2Off/>}</button>
          {field('height','Height','H')}
          {field('x','X position','X')}<span aria-hidden="true"/>{field('y','Y position','Y')}
          {field('rotation','Rotation','↻','°')}
        </div>
        {error&&<p className="v3-arrange-error" role="alert">{error}</p>}
      </div>
    </div>
    <div className="sr-only" aria-live="polite" aria-atomic="true">{announcement}</div>
  </section>;
}
