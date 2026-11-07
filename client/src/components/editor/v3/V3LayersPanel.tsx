import React,{useEffect,useRef,useState} from 'react';
import {EyeOff,GripVertical,Lock,X} from 'lucide-react';
import {useV3ElementPreview} from '../../../hooks/useV3ElementPreview';
import {useCanvasStore} from '../../../hooks/useCanvasStore';
import type {CanvasElement} from '../../../lib/canvasTypes';
import {moveV3Layer,orderedV3Layers,reorderV3Layer} from '../../../lib/v3LayerActions';
import {overlappingV3Layers,selectionIntersectsV3Page} from '../../../lib/v3LayerGeometry';
import {paintToCss} from '../../../lib/paint';
import {V3LayerPreview} from './V3LayerPreview';
import {V3ElementActionsMenu} from './V3ElementActionsMenu';
import './v3-layers-panel.css';

type Direction='forward'|'backward'|'front'|'back';
type DropTarget={id:string;placement:'before'|'after'};

export interface LayerPresentation {id:string;baseElement:CanvasElement;patch:Partial<CanvasElement>}
export function V3LayersPanel({onClose,onEditBackground,presentation,tabs}:{onClose:()=>void;onEditBackground:()=>void;presentation?:LayerPresentation|null;tabs?:React.ReactNode}){
  const state=useCanvasStore();
  const [filter,setFilter]=useState<'all'|'overlapping'>('all');
  const [dropTarget,setDropTarget]=useState<DropTarget|null>(null);
  const [announcement,setAnnouncement]=useState('');
  const panel=useRef<HTMLElement>(null),list=useRef<HTMLDivElement>(null);
  const drag=useRef<{id:string;order:string}|null>(null);
  const stylePreview=useV3ElementPreview(value=>value.preview);
  const presented=state.elements.map(element=>{
    const geometry=presentation?.id===element.id&&presentation.baseElement===element?presentation.patch:null;
    const style=stylePreview?.id===element.id&&stylePreview.baseElement===element?stylePreview.patch:null;
    return geometry||style?{...element,...geometry,...style} as CanvasElement:element;
  });
  const ordered=orderedV3Layers(presented);
  const rows=filter==='all'?ordered:overlappingV3Layers(ordered,state.selectedElementIds);
  const visibleSelected=state.elements.filter(element=>element.visible&&state.selectedElementIds.includes(element.id));
  const showBackground=filter==='all'||selectionIntersectsV3Page(presented,state.selectedElementIds,state.canvasWidth,state.canvasHeight);
  const orderKey=ordered.map(element=>`${element.id}:${element.zIndex}`).join('|');
  const cancelDrag=()=>{drag.current=null;setDropTarget(null);};
  useEffect(()=>{
    const cancel=(event:KeyboardEvent)=>{if(event.key==='Escape'&&drag.current){event.preventDefault();event.stopPropagation();cancelDrag();}};
    window.addEventListener('keydown',cancel,true);return()=>window.removeEventListener('keydown',cancel,true);
  },[]);
  useEffect(()=>{
    const source=drag.current&&state.elements.find(element=>element.id===drag.current?.id);
    if(drag.current&&(!source||source.locked||drag.current.order!==orderKey||filter!=='all'))cancelDrag();
  },[state.elements,state.selectedElementIds,filter,orderKey]);

  function select(element:CanvasElement,extend=false){
    const current=useCanvasStore.getState();
    if(!current.elements.some(item=>item.id===element.id))return;
    current.selectElements(extend?(current.selectedElementIds.includes(element.id)?current.selectedElementIds.filter(id=>id!==element.id):[...current.selectedElementIds,element.id]):[element.id]);
  }
  function move(id:string,direction:Direction){
    const element=useCanvasStore.getState().elements.find(item=>item.id===id);
    if(element&&moveV3Layer(id,direction))setAnnouncement(`Moved ${element.name} ${direction==='front'?'to front':direction==='back'?'to back':direction}.`);
  }
  function keyboardMove(event:React.KeyboardEvent,id:string){
    if(event.altKey&&!event.ctrlKey&&!event.metaKey&&['ArrowUp','ArrowDown'].includes(event.key)){
      event.preventDefault();event.stopPropagation();move(id,event.key==='ArrowUp'?'forward':'backward');
    }
  }
  function drop(event:React.DragEvent,anchorId:string){
    if(!drag.current||filter!=='all')return;
    event.preventDefault();
    const source=drag.current,current=useCanvasStore.getState();
    const element=current.elements.find(item=>item.id===source.id);
    const anchor=current.elements.find(item=>item.id===anchorId);
    const bounds=event.currentTarget.getBoundingClientRect();
    const placement=dropTarget?.id===anchorId?dropTarget.placement:event.clientY<bounds.top+bounds.height/2?'before':'after';
    if(element&&!element.locked&&anchor&&source.order===orderedV3Layers(current.elements).map(item=>`${item.id}:${item.zIndex}`).join('|')&&reorderV3Layer(source.id,anchorId,placement))setAnnouncement(`Moved ${element.name} ${placement} ${anchor.name}.`);
    cancelDrag();
  }
  return <section ref={panel} className="v3-layers-panel" aria-label="Layers sidebar">
    <header><h2>Layers</h2><button type="button" aria-label="Close Layers sidebar" onClick={onClose}><X/></button></header>
    {tabs}
    <div className="v3-layers-filters" role="tablist" aria-label="Layer filters">{(['all','overlapping'] as const).map(value=><button type="button" role="tab" key={value} aria-label={value==='all'?'All':'Overlapping'} aria-selected={filter===value} onClick={()=>{cancelDrag();setFilter(value);}}>{value==='all'?'All':'Overlapping'}</button>)}</div>
    {filter==='overlapping'&&<div className="v3-layer-filter-help">{!visibleSelected.length?<p role="status">Select an element to see overlapping layers.</p>:rows.every(element=>state.selectedElementIds.includes(element.id))&&<p role="status">Only selected layers overlap.</p>}<p>Reorder in the complete layer list.</p><button type="button" aria-label="Switch to All to drag" onClick={()=>setFilter('all')}>Switch to All to drag</button></div>}
    <p className="v3-layer-order-label">Front / top</p>
    <div ref={list} className="v3-layer-list" role="list" aria-label="Design layers" onDragOver={event=>{
      if(!drag.current||filter!=='all')return;event.preventDefault();const bounds=event.currentTarget.getBoundingClientRect();
      if(event.clientY<bounds.top+36)event.currentTarget.scrollTop-=12;else if(event.clientY>bounds.bottom-36)event.currentTarget.scrollTop+=12;
    }}>
      {filter==='all'&&!rows.length&&<p className="v3-layer-empty" role="status">No layers yet. Add elements to see them here.</p>}
      {rows.map(element=>{
        const selected=state.selectedElementIds.includes(element.id);
        return <div key={element.id} role="listitem" className={`v3-layer-row${selected?' is-selected':''}${!element.visible?' is-hidden':''}${dropTarget?.id===element.id?` drop-${dropTarget.placement}`:''}`} data-layer-id={element.id} onDragOver={event=>{
          if(!drag.current||filter!=='all')return;event.preventDefault();const bounds=event.currentTarget.getBoundingClientRect();setDropTarget({id:element.id,placement:event.clientY<bounds.top+bounds.height/2?'before':'after'});
        }} onDrop={event=>drop(event,element.id)}>
          <button type="button" className="v3-layer-drag" aria-label={`Drag layer ${element.name}`} title={filter==='all'?'Drag to reorder; Alt+Arrow keys to move':'Switch to All to drag'} disabled={element.locked||filter!=='all'} draggable={!element.locked&&filter==='all'} onClick={event=>event.stopPropagation()} onKeyDown={event=>keyboardMove(event,element.id)} onDragStart={event=>{
            const current=useCanvasStore.getState(),live=current.elements.find(item=>item.id===element.id);
            if(!live||live.locked||filter!=='all'){event.preventDefault();return;}
            drag.current={id:element.id,order:orderedV3Layers(current.elements).map(item=>`${item.id}:${item.zIndex}`).join('|')};
            event.dataTransfer.effectAllowed='move';event.dataTransfer.setData('text/plain',element.id);
          }} onDragEnd={cancelDrag}><GripVertical/></button>
          <button type="button" className="v3-layer-select" aria-label={`Select layer ${element.name}`} aria-pressed={selected} onClick={event=>select(element,event.shiftKey)} onKeyDown={event=>keyboardMove(event,element.id)}>
            <V3LayerPreview element={element}/><span className="v3-layer-name" title={element.name}>{element.name}</span>{element.locked&&<Lock className="v3-layer-lock" aria-label="Locked"/>}{!element.visible&&<EyeOff className="v3-layer-lock" aria-label="Hidden"/>}
          </button>
          <V3ElementActionsMenu label={`Layer actions for ${element.name}`} targetId={element.id} menuLabel={`Actions for ${element.name}`} triggerClassName="v3-layer-menu-trigger" onMoved={setAnnouncement}/>
        </div>;
      })}
    </div>
    {showBackground&&<button type="button" className="v3-layer-background" aria-label="Edit page background" onClick={onEditBackground}><span className="v3-layer-background-preview" style={{background:paintToCss(state.backgroundPaint,state.backgroundColor,{width:state.canvasWidth,height:state.canvasHeight})}}/><span>Page background</span><Lock aria-hidden="true"/></button>}
    <p className="v3-layer-order-label v3-layer-back-label">Back / bottom</p><div className="sr-only" aria-live="polite" aria-atomic="true">{announcement}</div>
  </section>;
}
