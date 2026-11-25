import React, { useEffect, useState } from 'react';
import { MousePointer2, Hand, Slash, Square, Circle, Triangle, Star, Type, Image, Copy, Trash2, X, Spline, CornerUpRight } from 'lucide-react';
import { useCanvasStore } from '../../../hooks/useCanvasStore';
import { createShapeElement } from '../../../lib/canvasUtils';
import { createLineElement } from '../../../lib/lineGeometry';
import type { LineType } from '../../../lib/canvasTypes';
import {duplicateV3Selection,deleteV3Selection} from '../../../lib/v3EditorActions';

export function V3Tools({onText,onImage,onClose,onElements}: {onText:()=>void;onImage:()=>void;onClose:()=>void;onElements?:()=>void}) {
  const store = useCanvasStore();
  const [menu,setMenu] = useState<'shapes'|'lines'|null>(null);
  const [lineType,setLineType] = useState<LineType>('straight');
  useEffect(()=>{const close=(event:KeyboardEvent)=>{if(event.key==='Escape')setMenu(null);};window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close);},[]);
  return <div className="v3-tools">
    <button className="v3-icon v3-tools-close" aria-label="Close tools" onClick={onClose}><X /></button>
    <div className="v3-tool-strip" role="toolbar" aria-label="Canvas tools">
      <button className="v3-icon" aria-label="Select" aria-pressed={store.activeTool === 'select'} onClick={()=>store.setActiveTool('select')}><MousePointer2 /></button>
      <button className="v3-icon" aria-label="Hand" aria-pressed={store.activeTool === 'hand'} onClick={()=>store.setActiveTool('hand')}><Hand /></button><hr />
      <button className="v3-icon" aria-label="Line" aria-expanded={menu==='lines'} onClick={()=>setMenu(menu==='lines'?null:'lines')}><Slash /></button>
      <button className="v3-icon" aria-label="Shapes" aria-expanded={menu==='shapes'} onClick={()=>setMenu(menu==='shapes'?null:'shapes')}><span className="v3-shapes-symbol"><Square /><Circle /></span></button>
      <button className="v3-icon" aria-label="Add text" onClick={()=>{store.setActiveTool('select');onText();}}><Type /></button>
      <button className="v3-icon" aria-label="Add image" onClick={()=>{store.setActiveTool('select');onImage();}}><Image /></button>
      {store.selectedElementIds.length>0 && <><hr /><button className="v3-icon" aria-label="Duplicate" onClick={duplicateV3Selection}><Copy /></button>
        <button className="v3-icon" aria-label="Delete" onClick={deleteV3Selection}><Trash2 /></button></>}
    </div>
    {menu==='shapes' && <div className="v3-tool-menu v3-popover" aria-label="Shapes menu"><h3>Shapes</h3>{([
      ['rectangle','Square / Rectangle',Square],['circle','Circle',Circle],['triangle','Triangle',Triangle],['star','Star',Star]
    ] as const).map(([shape,label,Icon])=><button key={shape} onClick={()=>{const el=createShapeElement(shape);store.addElement(el);store.selectElement(el.id);store.setActiveTool('select');setMenu(null);}}><Icon />{label}</button>)}{onElements&&<button onClick={()=>{setMenu(null);onElements();}}>Browse all shapes</button>}</div>}
    {menu==='lines' && <div className="v3-tool-menu v3-popover" aria-label="Line menu"><h3>Line</h3>{([
      [Slash,'Straight line','straight'],[Spline,'Curved line','curved'],[CornerUpRight,'Elbow line','elbow']
    ] as const).map(([Icon,label,type])=><button key={type} aria-pressed={store.activeTool===`line-${type}`} onClick={()=>{setLineType(type);store.setActiveTool(`line-${type}`);setMenu(null);}}><Icon/>{label}</button>)}
      <button onClick={()=>{const center={x:store.canvasWidth/2,y:store.canvasHeight/2};const element=createLineElement(lineType,{x:center.x-100,y:center.y},{x:center.x+100,y:center.y});store.addElement(element);store.selectElement(element.id);store.setActiveTool('select');setMenu(null);}}>Insert line</button>
      <p>Choose a line and drag on the canvas, or insert a 200px line at the centre.</p></div>}
  </div>;
}
