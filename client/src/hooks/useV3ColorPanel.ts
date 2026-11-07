import {create} from 'zustand';
import type {CanvasElement,Paint,PaintSlot} from '../lib/canvasTypes';
import {elementPaintPatch,getElementPaint,isValidPaint,isValidElementPaints,normalizeLegacyColor} from '../lib/paint';
import {useCanvasStore} from './useCanvasStore';
import {clearElementPreview,previewElementPatch} from './useV3ElementPreview';
import {commitElementPatch} from '../lib/v3ElementEditing';
import {propertyIconPatch,isValidPropertyIcon} from '../lib/propertyIcons';

export type ColorTarget = {elementId:string;slot:PaintSlot|'shadow'|'icon'}|{slot:'background';elementId?:never};
export const useV3ColorPanel=create<{target:ColorTarget|null;draft:Paint|null}>(()=>({target:null,draft:null}));
const same=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);

function selectedTarget(target:ColorTarget):CanvasElement|undefined {
  if(target.slot==='background')return undefined;
  const state=useCanvasStore.getState(),element=state.elements.find(el=>el.id===target.elementId);
  if(!element||element.locked||!element.visible||state.selectedElementIds.length!==1||state.selectedElementIds[0]!==element.id)return undefined;
  const supported=target.slot==='icon'?element.type==='image'&&isValidPropertyIcon(element.icon):target.slot==='shadow'?element.type==='shape':target.slot==='color'?element.type==='text':target.slot==='fill'?element.type==='shape':target.slot==='overlay'?element.type==='image':element.type!=='text';
  return supported?element:undefined;
}
export function getTargetPaint(target:ColorTarget):Paint {
  const state=useCanvasStore.getState();
  if(target.slot==='background')return state.backgroundPaint??{type:'solid',...(normalizeLegacyColor(state.backgroundColor)??{color:'#FFFFFF',opacity:1})};
  const element=state.elements.find(el=>el.id===target.elementId);
  if(!element)return {type:'none'};
  if(target.slot==='icon'){return element.type==='image'&&isValidPropertyIcon(element.icon)&&element.icon.color!=='none'?{type:'solid',color:element.icon.color,opacity:element.icon.opacity??1}:{type:'none'};}
  if(target.slot==='shadow'){if(element.type!=='shape'||!element.shadow)return {type:'none'};const color=normalizeLegacyColor(element.shadow.color)??{color:'#000000',opacity:1};return {type:'solid',color:color.color,opacity:color.opacity*element.shadow.opacity};}
  return getElementPaint(element,target.slot);
}
export function clearColorDraft(){clearElementPreview();if(useV3ColorPanel.getState().draft)useV3ColorPanel.setState({draft:null});}
export function closeColorPanel(){clearColorDraft();useV3ColorPanel.setState({target:null,draft:null});}
export function openColorPanel(target:ColorTarget):boolean {
  if(target.slot!=='background'&&!selectedTarget(target))return false;
  clearColorDraft();useV3ColorPanel.setState({target,draft:null});return true;
}
function targetPatch(element:CanvasElement,target:Exclude<ColorTarget,{slot:'background'}>,paint:Paint):Partial<CanvasElement>|null {
  if(target.slot==='icon')return element.type==='image'&&(paint.type==='none'||paint.type==='solid')?propertyIconPatch(element,{color:paint.type==='none'?'none':paint.color,opacity:paint.type==='none'?1:paint.opacity}):null;
  if(target.slot==='shadow'){
    if(element.type!=='shape'||(paint.type!=='solid'&&paint.type!=='none'))return null;
    return paint.type==='none'?{shadow:undefined,shadowLayers:undefined}:{shadow:{...(element.shadow??{blur:12,offsetX:3,offsetY:3}),color:paint.color,opacity:paint.opacity}};
  }
  return elementPaintPatch(element,target.slot,paint);
}
export function previewColorPaint(paint:Paint):boolean {
  const {target}=useV3ColorPanel.getState();
  if(!target||!isValidPaint(paint)){clearColorDraft();return false;}
  if(target.slot==='background'){useV3ColorPanel.setState({draft:paint});return true;}
  const element=selectedTarget(target),patch=element&&targetPatch(element,target,paint);
  if(!element||!patch||!isValidElementPaints({...element,...patch})){clearColorDraft();return false;}
  const accepted=previewElementPatch(element.id,patch);
  if(accepted)useV3ColorPanel.setState({draft:paint});return accepted;
}
export function commitColorPaint(paint:Paint):boolean {
  const {target}=useV3ColorPanel.getState();
  if(!target||!isValidPaint(paint)){clearColorDraft();return false;}
  if(target.slot==='background'){
    const current=getTargetPaint(target);clearColorDraft();if(same(current,paint))return false;
    useCanvasStore.getState().setBackgroundPaint(paint);return true;
  }
  const element=selectedTarget(target),patch=element&&targetPatch(element,target,paint);clearColorDraft();
  if(!element||!patch||!isValidElementPaints({...element,...patch}))return false;
  const clearsExtraShadows=target.slot==='shadow'&&paint.type==='none'&&element.type==='shape'&&!!element.shadowLayers?.length;
  if(same(getTargetPaint(target),paint)&&!clearsExtraShadows)return false;
  return commitElementPatch(element.id,patch);
}
export const COLOR_TARGET_LABELS={background:'Background color',color:'Text color',fill:'Fill color',stroke:'Stroke color',overlay:'Overlay color',shadow:'Shadow color',icon:'Icon color'};
export function getDesignColors():Paint[]{
  const state=useCanvasStore.getState(),colors:Paint[]=[];
  const add=(paint:Paint)=>{
    if(paint.type==='none')return;
    if(!colors.some(value=>same(value,paint)))colors.push(paint);
    if(paint.type==='linear'||paint.type==='radial')paint.stops.forEach(stop=>add({type:'solid',...stop}));
  };
  add(getTargetPaint({slot:'background'}));
  for(const element of state.elements){
    const slots:PaintSlot[]=element.type==='text'?['color']:element.type==='shape'?['fill','stroke']:element.type==='image'?['stroke','overlay']:['stroke'];
    slots.forEach(slot=>add(getElementPaint(element,slot)));
    if(element.type==='image'&&element.icon&&element.icon.color!=='none')add({type:'solid',color:element.icon.color,opacity:element.icon.opacity??1});
    if(element.type==='shape'&&element.shadow)add({type:'solid',color:element.shadow.color,opacity:element.shadow.opacity});
  }
  return colors;
}
useCanvasStore.subscribe((next,previous)=>{
  const {target,draft}=useV3ColorPanel.getState();if(!target)return;
  if(draft&&target.slot==='background'&&!same(next.selectedElementIds,previous.selectedElementIds)){clearColorDraft();return;}
  if(target.slot!=='background'&&!selectedTarget(target)){closeColorPanel();return;}
  const canonicalChanged=target.slot==='background'?next.backgroundPaint!==previous.backgroundPaint||next.backgroundColor!==previous.backgroundColor:
    next.elements.find(el=>el.id===target.elementId)!==previous.elements.find(el=>el.id===target.elementId);
  if(draft&&canonicalChanged)clearColorDraft();
});
