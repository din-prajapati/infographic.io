import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, Eye, Layers, Link2, Minus, Plus, Scan, Sparkles, Settings2 } from 'lucide-react';
import { V3LinkOverlay } from './V3LinkOverlay';
import { useCanvasStore } from '../../../hooks/useCanvasStore';
import { clearElementPreview, useV3ElementPreview } from '../../../hooks/useV3ElementPreview';
import { fitCanvasZoomToViewport } from '../../../lib/canvasState';
import {useV3ColorPanel,openColorPanel} from '../../../hooks/useV3ColorPanel';
import {paintToCss} from '../../../lib/paint';
import { useTheme } from '../../../lib/theme-provider';
import { TextElement } from '../../canvas/TextElement';
import { ShapeElement } from '../../canvas/ShapeElement';
import { ImageElement } from '../../canvas/ImageElement';
import { LineElement } from '../../canvas/LineElement';
import { RotationHandle } from '../../canvas/RotationHandle';
import { V3ElementToolbar } from './V3ElementToolbar';
import { createLineElement, linePath, snapLineEnd, type LinePoint } from '../../../lib/lineGeometry';
import type { CanvasElement, LineElement as LineElementType, LineType } from '../../../lib/canvasTypes';

export function V3Canvas({isPreviewMode=false,onAssistant,onEditImage,onEditEffects,onBrowseElements,onOpenLayers,isLayersSidebarOpen=false,onLayerPresentation,onTemplateFields,isTemplateFieldsOpen=false,showLinks=false,onToggleLinks,onLinkField}: {onTemplateFields?:()=>void;isTemplateFieldsOpen?:boolean;showLinks?:boolean;onToggleLinks?:()=>void;onLinkField?:()=>void;isPreviewMode?:boolean;onPreview?:()=>void;onAssistant?:()=>void;onEditImage?:()=>void;onEditEffects?:()=>void;onBrowseElements?:()=>void;onOpenLayers?:()=>void;isLayersSidebarOpen?:boolean;onLayerPresentation?:(id:string,patch:Partial<CanvasElement>|null)=>void}) {
  const store=useCanvasStore();
  const stylePreview=useV3ElementPreview(state=>state.preview);
  useEffect(()=>{if(isPreviewMode)clearElementPreview();return()=>clearElementPreview();},[isPreviewMode]);
  const {elements,selectedElementIds,selectElement,clearSelection,canvasWidth,canvasHeight,backgroundColor,zoom,setZoom}=store;
  const colorPanel=useV3ColorPanel();
  const canvasPaint=!isPreviewMode&&colorPanel.target?.slot==='background'&&colorPanel.draft?colorPanel.draft:store.backgroundPaint;
  const canvasBackground=paintToCss(canvasPaint,backgroundColor,{width:canvasWidth,height:canvasHeight});
  const {resolvedTheme,setTheme}=useTheme();
  const [popover,setPopover]=useState<'settings'|'zoom'|null>(null);
  const [settings,setSettings]=useState({width:canvasWidth,height:canvasHeight});
  const [geometryPreview,setGeometryPreview]=useState<{id:string;x:number;y:number;width:number;height:number}|null>(null);
  const onGeometryChange=useCallback((id:string,geometry:{x:number;y:number;width:number;height:number}|null)=>{
    if(!geometry){setGeometryPreview(current=>current?.id===id?null:current);onLayerPresentation?.(id,null);return;}
    const state=useCanvasStore.getState();
    if(state.selectedElementIds.length===1&&state.selectedElementIds[0]===id){setGeometryPreview({id,...geometry});onLayerPresentation?.(id,geometry);}
  },[onLayerPresentation]);
  const onRotationPreview=useCallback((id:string,rotation:number|null)=>onLayerPresentation?.(id,rotation===null?null:{rotation}),[onLayerPresentation]);
  useEffect(()=>{const close=(event:KeyboardEvent)=>{if(event.key==='Escape')setPopover(null);};window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close);},[]);
  const pan=useRef<{x:number;y:number;left:number;top:number}|null>(null);
  const artboard=useRef<HTMLDivElement>(null);
  const drawing=useRef<{start:LinePoint;clientX:number;clientY:number;type:LineType}|null>(null);
  const [drawPreview,setDrawPreview]=useState<LineElementType|null>(null);
  const suppressClick=useRef(false);
  const drawType:LineType|null=store.activeTool==='line-straight'?'straight':store.activeTool==='line-curved'?'curved':store.activeTool==='line-elbow'?'elbow':null;
  const cancelDrawing=()=>{drawing.current=null;setDrawPreview(null);};
  useEffect(()=>{const cancel=(event:KeyboardEvent)=>{if(event.key==='Escape'&&drawing.current){event.preventDefault();cancelDrawing();useCanvasStore.getState().setActiveTool('select');}};window.addEventListener('keydown',cancel);return()=>window.removeEventListener('keydown',cancel);},[]);
  useEffect(()=>{if(isPreviewMode||!drawType)cancelDrawing();},[isPreviewMode,drawType]);
  const canvasPoint=(event:React.PointerEvent):LinePoint=>{const bounds=artboard.current?.getBoundingClientRect();return {x:Math.max(0,Math.min(canvasWidth,(event.clientX-(bounds?.left??0))/zoom)),y:Math.max(0,Math.min(canvasHeight,(event.clientY-(bounds?.top??0))/zoom))};};
  const drawingLine=(event:React.PointerEvent)=>{const gesture=drawing.current;if(!gesture)return null;let end=canvasPoint(event);if(event.shiftKey&&gesture.type==='straight')end=snapLineEnd(gesture.start,end);return createLineElement(gesture.type,gesture.start,end);};
  const selected=selectedElementIds.length===1?elements.find(el=>el.id===selectedElementIds[0]):undefined;
  const toolbarElement=elements.find(el=>selectedElementIds.includes(el.id)&&el.visible);
  useEffect(()=>{setGeometryPreview(null);},[selected?.id,selected?.locked,selected?.visible,isPreviewMode]);
  const geometry=geometryPreview?.id===selected?.id?geometryPreview:selected;
  useEffect(()=>{
    fitCanvasZoomToViewport();
    const viewport=document.querySelector('[data-canvas-viewport]');let bounds=viewport?.getBoundingClientRect();
    const observer=new ResizeObserver(()=>{const next=viewport?.getBoundingClientRect();if(next && (next.width!==bounds?.width||next.height!==bounds?.height)){bounds=next;fitCanvasZoomToViewport();}});
    if(viewport)observer.observe(viewport);return()=>observer.disconnect();
  },[canvasWidth,canvasHeight,isPreviewMode]);
  const toggle=(name:typeof popover)=>{setPopover(popover===name?null:name);if(name==='settings')setSettings({width:canvasWidth,height:canvasHeight});};
  return <main aria-label={isPreviewMode?'Design preview':'Canvas workspace'} className="v3-workspace">
    <div data-canvas-viewport className={`v3-viewport ${isPreviewMode?'v3-preview':''}`} style={{cursor:store.activeTool==='hand'?'grab':undefined}}
      onClick={()=>{if(suppressClick.current){suppressClick.current=false;return;}if(!isPreviewMode&&store.activeTool!=='hand'&&!drawType)clearSelection();}}
      onPointerDown={event=>{if(!isPreviewMode&&store.activeTool==='hand'){event.preventDefault();event.currentTarget.setPointerCapture(event.pointerId);pan.current={x:event.clientX,y:event.clientY,left:event.currentTarget.scrollLeft,top:event.currentTarget.scrollTop};}}}
      onPointerMove={event=>{if(pan.current){event.currentTarget.scrollLeft=pan.current.left-event.clientX+pan.current.x;event.currentTarget.scrollTop=pan.current.top-event.clientY+pan.current.y;}}}
      onPointerUp={()=>{pan.current=null;}} onPointerCancel={()=>{pan.current=null;}}>
      <div className="v3-canvas-center"><div className="v3-artboard-wrap" style={{width:canvasWidth*zoom,height:canvasHeight*zoom}}>
        {!isPreviewMode&&<div className="v3-canvas-caption"><span>Design canvas</span><span>{canvasWidth} × {canvasHeight}</span></div>}
        <div ref={artboard} data-canvas-container data-canvas-content="true" data-testid="design-canvas" data-preview={isPreviewMode} role={isPreviewMode?'img':'application'} aria-label="Design canvas"
          className="v3-artboard" style={{width:canvasWidth,height:canvasHeight,background:canvasBackground,transform:`scale(${zoom})`,pointerEvents:isPreviewMode||store.activeTool==='hand'?'none':undefined}}>
          {[...elements].sort((a,b)=>a.zIndex-b.zIndex).map(committed=>{
            const element=!isPreviewMode&&stylePreview?.id===committed.id&&stylePreview.baseElement===committed
              ? {...committed,...stylePreview.patch,type:committed.type} as typeof committed:committed;
            const props={isSelected:!isPreviewMode&&selectedElementIds.includes(element.id),onGeometryChange,onSelect:(event:React.MouseEvent)=>{event.stopPropagation();selectElement(element.id,event.shiftKey);}};
            if(element.type==='text')return <TextElement key={element.id} element={element} {...props}/>;
            if(element.type==='shape')return <ShapeElement key={element.id} element={element} {...props}/>;
            if(element.type==='line')return <LineElement key={element.id} element={element} {...props} readOnly={isPreviewMode}/>;
            return <ImageElement key={element.id} element={element} {...props} allowFrameResize/>;
          })}
          {!isPreviewMode&&showLinks&&<V3LinkOverlay zoom={zoom}/>}
          {!isPreviewMode&&drawType&&<div aria-label="Line drawing surface" role="application" style={{position:'absolute',inset:0,zIndex:100000,cursor:'crosshair',touchAction:'none'}}
            onClick={event=>event.stopPropagation()}
            onPointerDown={event=>{if(event.button!==0)return;event.preventDefault();event.stopPropagation();event.currentTarget.setPointerCapture(event.pointerId);drawing.current={start:canvasPoint(event),clientX:event.clientX,clientY:event.clientY,type:drawType};setDrawPreview(drawingLine(event));}}
            onPointerMove={event=>{if(drawing.current){event.stopPropagation();setDrawPreview(drawingLine(event));}}}
            onPointerUp={event=>{const gesture=drawing.current;if(!gesture)return;event.preventDefault();event.stopPropagation();const line=drawingLine(event);if(line&&Math.hypot(line.end.x-line.start.x,line.end.y-line.start.y)*zoom>=4){store.addElement(line);store.selectElement(line.id);suppressClick.current=true;}cancelDrawing();store.setActiveTool('select');}}
            onPointerCancel={()=>{cancelDrawing();store.setActiveTool('select');}} onLostPointerCapture={()=>{if(drawing.current){cancelDrawing();store.setActiveTool('select');}}}>
            {drawPreview&&<svg data-artwork-svg="true" width={canvasWidth} height={canvasHeight} style={{position:'absolute',inset:0,width:canvasWidth,height:canvasHeight,pointerEvents:'none'}}><path transform={`translate(${drawPreview.x} ${drawPreview.y})`} d={linePath(drawPreview)} style={{fill:'none',stroke:drawPreview.stroke,strokeWidth:drawPreview.strokeWidth,strokeLinecap:'butt',strokeLinejoin:'round'}}/></svg>}
          </div>}
        </div>
        {!isPreviewMode&&toolbarElement&&<V3ElementToolbar element={toolbarElement} onEditImage={onEditImage??(()=>{})} onEditEffects={onEditEffects} onBrowseElements={onBrowseElements} onLinkField={onLinkField}/>}
        {!isPreviewMode&&selected&&<RotationHandle element={selected} onPreview={onRotationPreview}/>}
      </div></div>
    </div>
    {!isPreviewMode&&<><div className="v3-canvas-bottom">{selectedElementIds.length>0?<output aria-label="Selection geometry">{selectedElementIds.length===1&&geometry?`${Math.round(geometry.width)} × ${Math.round(geometry.height)} px · x ${Math.round(geometry.x)}, y ${Math.round(geometry.y)}`:`${selectedElementIds.length} elements selected`}</output>:<span/>}<button className="v3-assistant" onClick={onAssistant}><Sparkles/>AI Assistant</button></div>
    <footer className="v3-footer"><div className="v3-footer-left"><button aria-label="Layers" aria-expanded={isLayersSidebarOpen} onClick={()=>{setPopover(null);onOpenLayers?.();}}><Layers/><span>Layers</span></button><button aria-label="Canvas settings" aria-expanded={popover==='settings'} onClick={()=>toggle('settings')}><Settings2/><span>Canvas settings</span></button><span>{elements.length} {elements.length===1?'element':'elements'}</span></div>
      <div className="v3-zoom"><button aria-label="Zoom out" disabled={zoom<=0.1} onClick={()=>setZoom(zoom-0.1)}><Minus/></button><button aria-label="Zoom level" aria-expanded={popover==='zoom'} onClick={()=>toggle('zoom')}>{Math.round(zoom*100)}%<ChevronDown/></button><button aria-label="Zoom in" disabled={zoom>=4} onClick={()=>setZoom(zoom+0.1)}><Plus/></button><button aria-label="Fit canvas" onClick={fitCanvasZoomToViewport}><Scan/></button></div>
      {popover==='zoom'&&<div className="v3-popover v3-zoom-menu"><button onClick={()=>setZoom(zoom+0.1)}>Zoom in</button><button onClick={()=>setZoom(zoom-0.1)}>Zoom out</button><button onClick={()=>{fitCanvasZoomToViewport();setPopover(null);}}>Fit to Screen</button>{[0.5,1,2].map(value=><button key={value} onClick={()=>{setZoom(value);setPopover(null);}}>Zoom to {value*100}%</button>)}</div>}
      {popover==='settings'&&<section className="v3-popover v3-settings" aria-label="Canvas settings"><h2>Canvas settings</h2><form onSubmit={event=>{event.preventDefault();if(settings.width>=100&&settings.height>=100&&settings.width<=10000&&settings.height<=10000)store.loadCanvas({canvasWidth:settings.width,canvasHeight:settings.height});}}><label>Width<input aria-label="Canvas width" type="number" min="100" max="10000" value={settings.width} onChange={event=>setSettings({...settings,width:Number(event.target.value)})}/></label><label>Height<input aria-label="Canvas height" type="number" min="100" max="10000" value={settings.height} onChange={event=>setSettings({...settings,height:Number(event.target.value)})}/></label><button type="submit">Apply size</button></form><label>Background<button type="button" aria-label="Canvas background" onClick={()=>{setPopover(null);openColorPanel({slot:'background'});}}><span className="v3-color-swatch" style={{background:canvasBackground}}/>Change color</button></label><button aria-label="Toggle theme" onClick={()=>setTheme(resolvedTheme==='dark'?'light':'dark')}>Switch to {resolvedTheme==='dark'?'light':'dark'} theme</button><button onClick={()=>setTheme('system')}>Use system theme</button></section>}
    </footer></>}
  </main>;
}
