import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Layers, Minus, Plus, Scan, Sparkles, FlipHorizontal, FlipVertical, Bold, Italic, Underline } from 'lucide-react';
import { useCanvasStore } from '../../../hooks/useCanvasStore';
import { fitCanvasZoomToViewport } from '../../../lib/canvasState';
import { useTheme } from '../../../lib/theme-provider';
import { TextElement } from '../../canvas/TextElement';
import { ShapeElement } from '../../canvas/ShapeElement';
import { ImageElement } from '../../canvas/ImageElement';
import { LayersTab } from '../sidebar/LayersTab';

export function V3Canvas({isPreviewMode=false,onAssistant}: {isPreviewMode?:boolean;onPreview?:()=>void;onAssistant?:()=>void}) {
  const store=useCanvasStore();
  const {elements,selectedElementIds,selectElement,clearSelection,canvasWidth,canvasHeight,backgroundColor,zoom,setZoom}=store;
  const {resolvedTheme,setTheme}=useTheme();
  const [popover,setPopover]=useState<'layers'|'settings'|'zoom'|null>(null);
  const [settings,setSettings]=useState({width:canvasWidth,height:canvasHeight});
  useEffect(()=>{const close=(event:KeyboardEvent)=>{if(event.key==='Escape')setPopover(null);};window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close);},[]);
  const pan=useRef<{x:number;y:number;left:number;top:number}|null>(null);
  const selected=selectedElementIds.length===1?elements.find(el=>el.id===selectedElementIds[0]):undefined;
  useEffect(()=>{
    fitCanvasZoomToViewport();
    const viewport=document.querySelector('[data-canvas-viewport]');let bounds=viewport?.getBoundingClientRect();
    const observer=new ResizeObserver(()=>{const next=viewport?.getBoundingClientRect();if(next && (next.width!==bounds?.width||next.height!==bounds?.height)){bounds=next;fitCanvasZoomToViewport();}});
    if(viewport)observer.observe(viewport);return()=>observer.disconnect();
  },[canvasWidth,canvasHeight,isPreviewMode]);
  const toggle=(name:typeof popover)=>{setPopover(popover===name?null:name);if(name==='settings')setSettings({width:canvasWidth,height:canvasHeight});};
  const update=(change:Parameters<typeof store.updateElement>[1])=>{if(selected&&!selected.locked)store.updateElement(selected.id,change);};
  return <main aria-label={isPreviewMode?'Design preview':'Canvas workspace'} className="v3-workspace">
    <div data-canvas-viewport className={`v3-viewport ${isPreviewMode?'v3-preview':''}`} style={{cursor:store.activeTool==='hand'?'grab':undefined}}
      onClick={()=>{if(!isPreviewMode&&store.activeTool!=='hand')clearSelection();}}
      onPointerDown={event=>{if(!isPreviewMode&&store.activeTool==='hand'){event.preventDefault();event.currentTarget.setPointerCapture(event.pointerId);pan.current={x:event.clientX,y:event.clientY,left:event.currentTarget.scrollLeft,top:event.currentTarget.scrollTop};}}}
      onPointerMove={event=>{if(pan.current){event.currentTarget.scrollLeft=pan.current.left-event.clientX+pan.current.x;event.currentTarget.scrollTop=pan.current.top-event.clientY+pan.current.y;}}}
      onPointerUp={()=>{pan.current=null;}} onPointerCancel={()=>{pan.current=null;}}>
      <div className="v3-canvas-center"><div className="v3-artboard-wrap" style={{width:canvasWidth*zoom,height:canvasHeight*zoom}}>
        {!isPreviewMode&&<div className="v3-canvas-caption"><span>Design canvas</span><span>{canvasWidth} × {canvasHeight}</span></div>}
        <div data-canvas-container data-canvas-content="true" data-testid="design-canvas" data-preview={isPreviewMode} role={isPreviewMode?'img':'application'} aria-label="Design canvas"
          className="v3-artboard" style={{width:canvasWidth,height:canvasHeight,backgroundColor,transform:`scale(${zoom})`,pointerEvents:isPreviewMode||store.activeTool==='hand'?'none':undefined}}>
          {[...elements].sort((a,b)=>a.zIndex-b.zIndex).map(element=>{
            const props={isSelected:!isPreviewMode&&selectedElementIds.includes(element.id),onSelect:(event:React.MouseEvent)=>{event.stopPropagation();selectElement(element.id,event.shiftKey);}};
            if(element.type==='text')return <TextElement key={element.id} element={element} {...props}/>;
            if(element.type==='shape')return <ShapeElement key={element.id} element={element} {...props}/>;
            return <ImageElement key={element.id} element={element} {...props}/>;
          })}
        </div>
        {!isPreviewMode&&selected&&<div role="toolbar" aria-label={`${selected.type} formatting`} className="v3-proximity" style={{top:Math.max(-52,selected.y*zoom-52),left:Math.max(0,Math.min(selected.x*zoom,canvasWidth*zoom-280))}} onClick={event=>event.stopPropagation()}>
          <span>{selected.type}</span><fieldset disabled={selected.locked}>
          {selected.type==='text'&&<><select aria-label="Font family" value={selected.fontFamily} onChange={event=>update({fontFamily:event.target.value})}>{[...new Set([selected.fontFamily,'Inter','Arial','Georgia','Times New Roman'])].map(font=><option key={font}>{font}</option>)}</select>
            <input aria-label="Font size" type="number" min="8" max="200" value={selected.fontSize} onChange={event=>{const size=Number(event.target.value);if(size>=8&&size<=200)update({fontSize:size});}}/>
            <button aria-label="Bold" aria-pressed={selected.bold} onClick={()=>update({bold:!selected.bold,fontWeight:selected.bold?400:700})}><Bold/></button><button aria-label="Italic" aria-pressed={selected.italic} onClick={()=>update({italic:!selected.italic})}><Italic/></button><button aria-label="Underline" aria-pressed={selected.underline} onClick={()=>update({underline:!selected.underline})}><Underline/></button>
            <input aria-label="Text color" type="color" value={selected.color} onChange={event=>update({color:event.target.value})}/><select aria-label="Text alignment" value={selected.align} onChange={event=>update({align:event.target.value as 'left'|'center'|'right'})}><option>left</option><option>center</option><option>right</option></select></>}
          {selected.type==='shape'&&<><label>Fill<input aria-label="Shape fill" type="color" value={selected.fill} onChange={event=>update({fill:event.target.value})}/></label><label>Stroke<input aria-label="Shape stroke" type="color" value={selected.stroke} onChange={event=>update({stroke:event.target.value})}/></label><input aria-label="Stroke width" type="number" min="0" max="30" value={selected.strokeWidth} onChange={event=>update({strokeWidth:Number(event.target.value)})}/></>}
          {selected.type==='image'&&<><button aria-label="Flip horizontal" onClick={()=>update({flipHorizontal:!selected.flipHorizontal})}><FlipHorizontal/></button><button aria-label="Flip vertical" onClick={()=>update({flipVertical:!selected.flipVertical})}><FlipVertical/></button><select aria-label="Image fit" value={selected.objectFit??'cover'} onChange={event=>update({objectFit:event.target.value as 'cover'|'contain'|'fill'})}><option>cover</option><option>contain</option><option>fill</option></select><details className="v3-image-adjust"><summary>Adjust</summary><div className="v3-popover">{(["brightness","contrast","saturation"] as const).map(filter=><label key={filter}>{filter}<input aria-label={`Image ${filter}`} type="range" min="0" max="200" value={selected.filters[filter]} onChange={event=>update({filters:{...selected.filters,[filter]:Number(event.target.value)}})}/></label>)}<button onClick={()=>update({filters:{brightness:100,contrast:100,saturation:100}})}>Reset adjustments</button></div></details></>}
          <label>Opacity<input aria-label="Element opacity" type="range" min="0" max="1" step="0.05" value={selected.opacity} onChange={event=>update({opacity:Number(event.target.value)})}/></label>
          </fieldset>
        </div>}
      </div></div>
    </div>
    {!isPreviewMode&&<><div className="v3-canvas-bottom">{selectedElementIds.length>0?<output aria-label="Selection geometry">{selectedElementIds.length===1&&selected?`${Math.round(selected.width)} × ${Math.round(selected.height)} px · x ${Math.round(selected.x)}, y ${Math.round(selected.y)}`:`${selectedElementIds.length} elements selected`}</output>:<span/>}<button className="v3-assistant" onClick={onAssistant}><Sparkles/>AI Assistant</button></div>
    <footer className="v3-footer"><div className="v3-footer-left"><button aria-expanded={popover==='layers'} onClick={()=>toggle('layers')}><Layers/>Layers</button><button aria-expanded={popover==='settings'} onClick={()=>toggle('settings')}>Canvas settings</button><span>{elements.length} {elements.length===1?'element':'elements'}</span></div>
      <div className="v3-zoom"><button aria-label="Zoom out" disabled={zoom<=0.1} onClick={()=>setZoom(zoom-0.1)}><Minus/></button><button aria-label="Zoom level" aria-expanded={popover==='zoom'} onClick={()=>toggle('zoom')}>{Math.round(zoom*100)}%<ChevronDown/></button><button aria-label="Zoom in" disabled={zoom>=4} onClick={()=>setZoom(zoom+0.1)}><Plus/></button><button aria-label="Fit canvas" onClick={fitCanvasZoomToViewport}><Scan/></button></div>
      {popover==='zoom'&&<div className="v3-popover v3-zoom-menu"><button onClick={()=>setZoom(zoom+0.1)}>Zoom in</button><button onClick={()=>setZoom(zoom-0.1)}>Zoom out</button><button onClick={()=>{fitCanvasZoomToViewport();setPopover(null);}}>Fit to Screen</button>{[0.5,1,2].map(value=><button key={value} onClick={()=>{setZoom(value);setPopover(null);}}>Zoom to {value*100}%</button>)}</div>}
      {popover==='layers'&&<section className="v3-popover v3-layers" aria-label="Layers panel"><h2>Layers</h2><LayersTab/></section>}
      {popover==='settings'&&<section className="v3-popover v3-settings" aria-label="Canvas settings"><h2>Canvas settings</h2><form onSubmit={event=>{event.preventDefault();if(settings.width>=100&&settings.height>=100&&settings.width<=10000&&settings.height<=10000)store.loadCanvas({canvasWidth:settings.width,canvasHeight:settings.height});}}><label>Width<input aria-label="Canvas width" type="number" min="100" max="10000" value={settings.width} onChange={event=>setSettings({...settings,width:Number(event.target.value)})}/></label><label>Height<input aria-label="Canvas height" type="number" min="100" max="10000" value={settings.height} onChange={event=>setSettings({...settings,height:Number(event.target.value)})}/></label><button type="submit">Apply size</button></form><label>Background<input aria-label="Canvas background" type="color" value={backgroundColor} onChange={event=>store.setBackgroundColor(event.target.value)}/></label><button aria-label="Toggle theme" onClick={()=>setTheme(resolvedTheme==='dark'?'light':'dark')}>Switch to {resolvedTheme==='dark'?'light':'dark'} theme</button><button onClick={()=>setTheme('system')}>Use system theme</button></section>}
    </footer></>}
  </main>;
}
