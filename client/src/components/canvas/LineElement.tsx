import React, { useEffect, useRef, useState } from 'react';
import type { LineElement as LineElementType } from '../../lib/canvasTypes';
import { useCanvasStore } from '../../hooks/useCanvasStore';
import { isValidLineElement, lineDecorations, linePath, normalizeLineElement, snapLineEnd, type LinePoint } from '../../lib/lineGeometry';
import { strokeDash } from '../../lib/elementStyles';

type DragMode = 'body' | 'start' | 'end' | 'control' | 'elbow';
interface Drag { mode: DragMode; element: LineElementType; clientX: number; clientY: number; moved: boolean }

export function LineElement({element,isSelected,onSelect,readOnly=false}: {
  element: LineElementType; isSelected: boolean; onSelect: (event: React.MouseEvent) => void; readOnly?: boolean;
}) {
  const zoom = useCanvasStore(state=>state.zoom);
  const [preview,setPreview] = useState<LineElementType|null>(null);
  const drag = useRef<Drag|null>(null);
  const draft = useRef<LineElementType|null>(null);
  const skipClick = useRef(false);
  const svg = useRef<SVGSVGElement>(null);
  const shown = preview ?? element;
  const cancel = () => { drag.current=null; draft.current=null; setPreview(null); };
  useEffect(()=>{
    const key=(event:KeyboardEvent)=>{if(event.key==='Escape'&&drag.current){event.preventDefault();cancel();}};
    window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);
  },[]);
  useEffect(()=>{if(readOnly||element.locked||!element.visible||!isSelected)cancel();},[element.locked,element.visible,isSelected,readOnly]);
  if (!element.visible) return null;

  function localPoint(event: React.PointerEvent, original: LineElementType): LinePoint {
    const canvas = svg.current?.closest('[data-canvas-content]')?.getBoundingClientRect();
    const x = (event.clientX-(canvas?.left??0))/zoom-original.x-original.width/2;
    const y = (event.clientY-(canvas?.top??0))/zoom-original.y-original.height/2;
    const angle = -original.rotation*Math.PI/180;
    return {x:x*Math.cos(angle)-y*Math.sin(angle)+original.width/2,y:x*Math.sin(angle)+y*Math.cos(angle)+original.height/2};
  }
  function start(event: React.PointerEvent, mode: DragMode) {
    event.stopPropagation();
    if(readOnly||element.locked||event.button!==0)return;
    event.preventDefault(); svg.current?.setPointerCapture(event.pointerId);
    if(!isSelected&&!event.shiftKey)useCanvasStore.getState().selectElement(element.id);
    drag.current={mode,element,clientX:event.clientX,clientY:event.clientY,moved:false};
  }
  function move(event: React.PointerEvent) {
    const gesture=drag.current;if(!gesture)return;event.stopPropagation();
    const original=gesture.element;
    gesture.moved=gesture.moved||Math.hypot(event.clientX-gesture.clientX,event.clientY-gesture.clientY)>0.25;
    let next:LineElementType;
    if(gesture.mode==='body') next={...original,x:original.x+(event.clientX-gesture.clientX)/zoom,y:original.y+(event.clientY-gesture.clientY)/zoom};
    else {
      let point=localPoint(event,original);
      if(event.shiftKey&&original.lineType==='straight'&&(gesture.mode==='start'||gesture.mode==='end'))point=snapLineEnd(gesture.mode==='start'?original.end:original.start,point);
      next=gesture.mode==='elbow'?{...original,elbowOffset:original.elbowAxis==='horizontal'?point.x:point.y}:{...original,[gesture.mode]:point};
      next=normalizeLineElement(next);
    }
    draft.current=next;setPreview(next);
  }
  function finish(event: React.PointerEvent) {
    const gesture=drag.current;if(!gesture)return;event.stopPropagation();
    move(event);
    const next=draft.current;
    const state=useCanvasStore.getState();
    const live=state.elements.find(item=>item.id===element.id);
    const different=next&&live?.type==='line'&&(
      (['x','y','width','height','elbowOffset'] as const).some(key=>Math.abs(next[key]-live[key])>1e-7)||
      (['start','end','control'] as const).some(key=>Math.abs(next[key].x-live[key].x)>1e-7||Math.abs(next[key].y-live[key].y)>1e-7));
    if(gesture.moved&&next&&different&&isValidLineElement(next)&&live?.type==='line'&&live.visible&&!live.locked&&state.selectedElementIds.includes(live.id)){
      const {x,y,width,height,start,end,control,elbowOffset}=next;
      state.updateElement(element.id,{x,y,width,height,start,end,control,elbowOffset});
    }
    skipClick.current=gesture.moved;cancel();
    if(svg.current?.hasPointerCapture(event.pointerId))svg.current.releasePointerCapture(event.pointerId);
  }
  function keyMove(event: React.KeyboardEvent) {
    if(readOnly||element.locked||event.ctrlKey||event.metaKey||event.altKey)return;
    const delta=event.shiftKey?10:1;
    const movement:Record<string,LinePoint>={ArrowLeft:{x:-delta,y:0},ArrowRight:{x:delta,y:0},ArrowUp:{x:0,y:-delta},ArrowDown:{x:0,y:delta}};
    const offset=movement[event.key];if(!offset)return;
    event.preventDefault();event.stopPropagation();
    useCanvasStore.getState().updateElement(element.id,{x:element.x+offset.x,y:element.y+offset.y});
  }
  const handle=(name:string,point:LinePoint,mode:DragMode)=><circle key={mode} role="button" tabIndex={0} aria-label={name} cx={point.x} cy={point.y} r={5/zoom}
    style={{pointerEvents:'all',cursor:mode==='elbow'?'col-resize':'move',fill:'white',stroke:'#3b82f6',strokeWidth:1.5/zoom}}
    onPointerDown={event=>start(event,mode)} onKeyDown={keyMove}/>;

  return <svg ref={svg} data-element-id={element.id} data-element-type="line" data-artwork-svg="true"
    width={shown.width} height={shown.height} style={{position:'absolute',left:shown.x,top:shown.y,width:shown.width,height:shown.height,overflow:'visible',zIndex:shown.zIndex,
      transform:`rotate(${shown.rotation}deg)`,transformOrigin:'center',pointerEvents:'none'}}
    onPointerMove={move} onPointerUp={finish} onPointerCancel={cancel} onLostPointerCapture={()=>{if(drag.current)cancel();}}>
    <g style={{opacity:shown.opacity,pointerEvents:'none'}}>
      <path d={linePath(shown)} style={{fill:'none',stroke:shown.stroke,strokeWidth:shown.strokeWidth,strokeDasharray:strokeDash(shown.strokeStyle,shown.strokeWidth).join(' '),strokeLinecap:shown.strokeStyle==='dotted'?'round':'butt',strokeLinejoin:'round'}}/>
      {lineDecorations(shown).map((decoration,index)=><g key={index} transform={`translate(${decoration.tip.x} ${decoration.tip.y}) rotate(${decoration.angle*180/Math.PI})`}>
        {decoration.kind==='circle'?<circle r={decoration.size/2} style={{fill:shown.stroke,stroke:'none'}}/>:decoration.kind==='bar'?<path d={`M 0 ${-decoration.size/2} L 0 ${decoration.size/2}`} style={{fill:'none',stroke:shown.stroke,strokeWidth:shown.strokeWidth}}/>:<path d={`M 0 0 L ${-decoration.size} ${-decoration.size/2} L ${-decoration.size} ${decoration.size/2} Z`} style={{fill:shown.stroke,stroke:'none'}}/>}
      </g>)}
    </g>
    <path role="button" tabIndex={readOnly||element.locked?-1:0} aria-label={element.name||'Line'} d={linePath(shown)}
      style={{fill:'none',stroke:'transparent',strokeWidth:Math.max(shown.strokeWidth,12/zoom),pointerEvents:readOnly?'none':'stroke',cursor:element.locked?'default':'move'}}
      onPointerDown={event=>start(event,'body')} onClick={event=>{event.stopPropagation();if(readOnly)return;if(skipClick.current){skipClick.current=false;return;}onSelect(event);}} onKeyDown={keyMove}/>
    {isSelected&&!element.locked&&!readOnly&&<g style={{pointerEvents:'all'}}>
      {handle('Line start endpoint',shown.start,'start')}{handle('Line end endpoint',shown.end,'end')}
      {shown.lineType==='curved'&&<><path d={`M ${shown.start.x} ${shown.start.y} L ${shown.control.x} ${shown.control.y} L ${shown.end.x} ${shown.end.y}`} style={{fill:'none',stroke:'#3b82f6',strokeWidth:1/zoom,strokeDasharray:`${3/zoom} ${3/zoom}`,pointerEvents:'none'}}/>{handle('Curve bend',shown.control,'control')}</>}
      {shown.lineType==='elbow'&&handle('Elbow middle segment',shown.elbowAxis==='horizontal'?{x:shown.elbowOffset,y:(shown.start.y+shown.end.y)/2}:{x:(shown.start.x+shown.end.x)/2,y:shown.elbowOffset},'elbow')}
    </g>}
  </svg>;
}
