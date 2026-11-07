import {useCanvasStore} from '../hooks/useCanvasStore';
import type {CanvasElement} from './canvasTypes';
import {generateId} from './canvasUtils';
import {isValidElementPaints} from './paint';
import {isValidLineElement} from './lineGeometry';

const clone = <T,>(value:T):T => JSON.parse(JSON.stringify(value)) as T;
let pasteCount=0;

export function selectedV3Elements(includeLocked=true):CanvasElement[] {
  const {elements,selectedElementIds}=useCanvasStore.getState();
  return elements.filter(element=>element.visible&&selectedElementIds.includes(element.id)&&(includeLocked||!element.locked));
}

function validElement(element:CanvasElement):boolean {
  return ['text','shape','image','line'].includes(element.type)&&
    [element.x,element.y,element.width,element.height,element.rotation,element.opacity,element.zIndex].every(Number.isFinite)&&
    element.width>0&&element.height>0&&element.opacity>=0&&element.opacity<=1&&
    isValidElementPaints(element)&&(element.type!=='line'||isValidLineElement(element));
}

function commit(elements:CanvasElement[], selectedElementIds:string[]):void {
  const state=useCanvasStore.getState();
  state.pushToHistory(state.elements);
  useCanvasStore.setState({elements,selectedElementIds});
}

export function insertV3Elements(elements:CanvasElement[]):boolean {
  if(!elements.length||!elements.every(validElement))return false;
  const state=useCanvasStore.getState();
  const maxZ=Math.max(0,...state.elements.map(element=>element.zIndex));
  const copies=clone(elements).map((element,index)=>({...element,id:generateId(),zIndex:maxZ+index+1}));
  commit([...state.elements,...copies],copies.map(element=>element.id));
  return true;
}

function insertOffsetCopies(elements:CanvasElement[],offset:number):boolean {
  if(!elements.length||!elements.every(validElement))return false;
  const {canvasWidth,canvasHeight}=useCanvasStore.getState();
  const minX=Math.min(...elements.map(element=>element.x)),minY=Math.min(...elements.map(element=>element.y));
  const maxX=Math.max(...elements.map(element=>element.x+element.width)),maxY=Math.max(...elements.map(element=>element.y+element.height));
  const boundedOffset=(min:number,max:number,size:number)=>max-min<=size?Math.max(-min,Math.min(offset,size-max)):-min;
  const dx=boundedOffset(minX,maxX,canvasWidth),dy=boundedOffset(minY,maxY,canvasHeight);
  return insertV3Elements(elements.map(element=>({...element,x:element.x+dx,y:element.y+dy})));
}

export function duplicateV3Selection():boolean {
  return insertOffsetCopies(selectedV3Elements(false),20);
}

export function deleteV3Selection():boolean {
  const targets=selectedV3Elements(false);if(!targets.length)return false;
  const ids=new Set(targets.map(element=>element.id)),state=useCanvasStore.getState();
  commit(state.elements.filter(element=>!ids.has(element.id)),state.selectedElementIds.filter(id=>!ids.has(id)));
  return true;
}

export function copyV3Selection():boolean {
  const targets=selectedV3Elements();if(!targets.length||!targets.every(validElement))return false;
  useCanvasStore.setState({clipboard:clone(targets)});pasteCount=0;return true;
}

export function pasteV3Clipboard():boolean {
  const elements=useCanvasStore.getState().clipboard;
  // Pasted copies must be immediately editable even when their source was locked.
  const success=insertOffsetCopies(elements.map(element=>({...element,locked:false})),20*(pasteCount+1));
  if(success)pasteCount++;return success;
}

export function clearV3Clipboard():void {useCanvasStore.setState({clipboard:[]});pasteCount=0;}

export function toggleV3SelectionLock():boolean {
  const targets=selectedV3Elements();if(!targets.length)return false;
  const locked=!targets.every(element=>element.locked),ids=new Set(targets.map(element=>element.id));
  const state=useCanvasStore.getState();
  commit(state.elements.map(element=>ids.has(element.id)?{...element,locked}:element),state.selectedElementIds);
  return true;
}

export function nudgeV3Selection(dx:number,dy:number):boolean {
  if(!Number.isFinite(dx)||!Number.isFinite(dy)||(!dx&&!dy))return false;
  const targets=selectedV3Elements(false);if(!targets.length)return false;
  const ids=new Set(targets.map(element=>element.id)),state=useCanvasStore.getState();
  const elements=state.elements.map(element=>ids.has(element.id)?{...element,x:element.x+dx,y:element.y+dy}:element);
  if(!elements.filter(element=>ids.has(element.id)).every(validElement))return false;
  commit(elements,state.selectedElementIds);return true;
}
