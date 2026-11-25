import React from 'react';
import {X} from 'lucide-react';
import {useCanvasStore} from '../../../hooks/useCanvasStore';
import type {CanvasElement} from '../../../lib/canvasTypes';
import {insertV3Elements} from '../../../lib/v3EditorActions';
import {commitElementPatch} from '../../../lib/v3ElementEditing';
import {V3ShapeLibrary} from './V3ShapeLibrary';
import {V3IconLibrary} from './V3IconLibrary';

export type ElementsTab='shapes'|'icons'|'emoji';
export function V3ElementsPanel({tab,onTabChange,onClose,replaceId}:{tab:ElementsTab;onTabChange:(tab:ElementsTab)=>void;onClose:()=>void;replaceId?:string|null}){
 const state=useCanvasStore();
 const target=replaceId&&state.selectedElementIds.length===1&&state.selectedElementIds[0]===replaceId?state.elements.find(el=>el.id===replaceId&&el.visible&&!el.locked):undefined;
 const stale=!!replaceId&&(!target||(tab==='shapes'?target.type!=='shape':tab==='icons'?target.type!=='image'||!target.icon:true));
 const insert=(elements:CanvasElement[])=>{
   if(replaceId||!elements.length)return;
   const minX=Math.min(...elements.map(el=>el.x)),minY=Math.min(...elements.map(el=>el.y)),width=Math.max(...elements.map(el=>el.x+el.width))-minX,height=Math.max(...elements.map(el=>el.y+el.height))-minY;
   const current=useCanvasStore.getState();
   if(insertV3Elements(elements.map(el=>({...el,x:el.x-minX+Math.max(0,(current.canvasWidth-width)/2),y:el.y-minY+Math.max(0,(current.canvasHeight-height)/2)}))))current.setActiveTool('select');
 };
 const replace=(patch:Partial<CanvasElement>)=>{if(replaceId&&!stale)commitElementPatch(replaceId,patch);};
 return <section className="v3-panel-content v3-elements-panel" aria-label="Elements library"><header className="v3-panel-header"><h2>Elements</h2><button type="button" aria-label="Close Elements" onClick={onClose}><X/></button></header>
   <div role="tablist" aria-label="Element library" className="v3-library-tabs">{(['shapes','icons','emoji'] as const).map(value=><button type="button" key={value} role="tab" aria-selected={tab===value} onClick={()=>onTabChange(value)}>{value[0].toUpperCase()+value.slice(1)}</button>)}</div>
   <div role="tabpanel" aria-label={`${tab[0].toUpperCase()+tab.slice(1)} library`}>
    {stale?<p role="status">Selection changed. Reopen Edit to replace this element.</p>:tab==='shapes'?<V3ShapeLibrary onInsert={insert} replaceElement={target?.type==='shape'?target:undefined} onReplace={replace}/>:<V3IconLibrary key={tab} mode={tab} onInsert={insert} replaceElement={target?.type==='image'?target:undefined} onReplace={replace}/>}
   </div>
 </section>;
}
