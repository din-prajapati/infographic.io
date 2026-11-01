import { useEffect, useRef, useState } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, Cloud, CloudUpload, Download, LayoutTemplate, MousePointer2, Redo2, Save, Type, Undo2, Upload, Palette, House, ContactRound, Scan, X } from 'lucide-react';
import { useV3DesignSession } from '../../../hooks/useV3DesignSession';
import { useCanvasStore } from '../../../hooks/useCanvasStore';
import { downloadCanvas } from '../../../lib/canvasExport';
import { createTextElement } from '../../../lib/canvasUtils';
import { useTheme } from '../../../lib/theme-provider';
import { useAuth } from '../../../lib/auth';
import { loadAiVariationToCanvas, loadComposedDesignToCanvas, restoreCanvasData, scheduleFitCanvasZoomToViewport } from '../../../lib/canvasState';
import { loadTemplateById } from '../../../lib/storage';
import { AIChatBox } from '../../ai-chat/AIChatBox';
import type { Template } from '../../ai-chat/types';
import { V3Canvas } from './V3Canvas';
import { V3TextInspector } from './V3TextInspector';
import { V3Tools } from './V3Tools';
import { V3Panels, type V3Panel } from './V3Panels';
import { V3ImageEditor } from './V3ImageEditor';
import './v3-editor.css';

const rail=[['Templates',LayoutTemplate],['Tools',MousePointer2],['Text',Type],['Uploads',Upload],['Brand',Palette],['Property',House],['Agent',ContactRound]] as const;
export default function V3Editor({designId}:{designId?:string}) {
  const {user}=useAuth();
  const session=useV3DesignSession(designId,user?String(user.id):undefined);
  const {undo,redo,history,addElement,selectElement}=useCanvasStore();
  const {resolvedTheme}=useTheme();
  const [panel,setPanel]=useState<V3Panel|'Tools'|null>('Templates');
  const [imageEditing,setImageEditing]=useState(false);
  const selectedImage=useCanvasStore(state=>state.selectedElementIds.length===1?state.elements.find(element=>element.id===state.selectedElementIds[0]&&element.type==='image'):undefined);
  useEffect(()=>{if(!selectedImage)setImageEditing(false);},[selectedImage]);
  const [cloud,setCloud]=useState(false);
  const [assistant,setAssistant]=useState(false);
  const [assistantError,setAssistantError]=useState<string|null>(null);
  const [recoveryNotice,setRecoveryNotice]=useState(false);
  const [exportStatus,setExportStatus]=useState<'idle'|'exporting'|'exported'|'error'>('idle');
  const [isPreviewMode,setIsPreviewMode]=useState(false);
  const wasPreview=useRef(false);
  const previewIntent=useRef(false);
  const ready=session.ready, save=session.save;
  useEffect(()=>{setExportStatus('idle');setIsPreviewMode(false);},[designId]);
  useEffect(()=>{previewIntent.current=isPreviewMode;if(isPreviewMode)window.getSelection()?.removeAllRanges();if(wasPreview.current&&!isPreviewMode)document.querySelector<HTMLButtonElement>('[data-v3-preview-trigger]')?.focus();wasPreview.current=isPreviewMode;},[isPreviewMode]);
  useEffect(()=>{
    function key(event:KeyboardEvent){
      if(event.key==='Escape'&&isPreviewMode){event.preventDefault();setIsPreviewMode(false);return;}
      const target=event.target;if(target instanceof HTMLElement&&(target.closest('input,textarea,select')||target.isContentEditable))return;
      if(ready&&event.key.toLowerCase()==='p'&&!event.ctrlKey&&!event.metaKey&&!event.altKey){event.preventDefault();setIsPreviewMode(value=>!value);return;}
      if(isPreviewMode||!ready||!(event.ctrlKey||event.metaKey))return;
      if(event.key.toLowerCase()==='s'){event.preventDefault();void save();}
      if(event.key.toLowerCase()==='z'){event.preventDefault();event.shiftKey?redo():undo();}
      if(event.key.toLowerCase()==='y'){event.preventDefault();redo();}
    }
    window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);
  },[ready,save,undo,redo,isPreviewMode]);
  async function exportDesign(){if(!ready||exportStatus==='exporting')return;setExportStatus('exporting');try{setExportStatus(await downloadCanvas(session.title||'design','png')?'exported':'error');}catch{setExportStatus('error');}}
  async function placeTemplate(template:Template){
    setAssistantError(null);
    try{
      let success=false;
      if(template.isAiVariation&&template.composedDesign)success=await loadComposedDesignToCanvas(template.composedDesign);
      else if(template.isAiVariation&&template.previewImage)success=await loadAiVariationToCanvas(template.previewImage,template.name,template.aiOrientation,template.aiComposition,template.aiListing);
      else {const full=await loadTemplateById(template.id);if(full?.canvasData&&(!useCanvasStore.getState().elements.length||window.confirm('Replace the current canvas with this template?'))){restoreCanvasData(full.canvasData);useCanvasStore.getState().setCanvasOrigin({templateId:template.id});success=true;}}
      if(success){setAssistant(false);scheduleFitCanvasZoomToViewport();}else setAssistantError('Design was not placed. Your canvas is unchanged.');
    }catch{setAssistantError('Unable to place this design. Please try again.');}
  }
  const status=!ready?(session.status==='loading'||session.status==='idle'?'Opening design':'Unable to open design'):session.status==='saving'?'Saving…':session.status==='saved'&&!session.hasUnsavedChanges?'Saved':'Unsaved';
  const addText=()=>{const el=createTextElement();addElement(el);selectElement(el.id);useCanvasStore.getState().setActiveTool('select');setPanel('Text');};
  return <div className="v3-editor" data-theme={resolvedTheme}>
    <h1 className="sr-only">V3 Editor</h1>
    <header className="v3-header" hidden={isPreviewMode}><a href="/my-designs" className="v3-logo" onClick={event=>{if(!session.confirmNavigation())event.preventDefault();}}><img src="/logo-icon-option6-light.png" alt="" width="28" height="28"/>Buildographic</a>
      <Link href="/my-designs" className="v3-projects" onClick={event=>{if(!session.confirmNavigation())event.preventDefault();}}><ArrowLeft/>Projects</Link>
      <div className="v3-title-wrap"><span aria-hidden="true" className="v3-title-measure">{session.title || 'Untitled design'}</span><input aria-label="Design title" className="v3-title" size={1} value={session.title} disabled={!ready} onChange={event=>session.setTitle(event.target.value)}/></div>
      <div className="v3-cloud-wrap"><button className="v3-icon" aria-label="Save status" aria-expanded={cloud} onClick={()=>setCloud(!cloud)}>{status==='Saved'?<Cloud/>:<CloudUpload/>}</button><span className="sr-only" role="status">{status}</span>
        {cloud&&<section className="v3-popover v3-cloud" aria-label="Save status details"><h2>{status==='Saved'?'Changes saved':status==='Saving…'?'Saving changes…':'Changes not saved'}</h2><p>{session.lastSavedAt?`Last saved: ${new Date(session.lastSavedAt).toLocaleTimeString()}`:designId?'Loaded from saved design.':'Save this design to start automatic saving.'}</p>{session.error?.operation==='save'&&<button onClick={()=>void save()}>Retry save</button>}</section>}
      </div>
      <div className="v3-header-actions"><button className="v3-icon" aria-label="Undo" disabled={!ready||!history.past.length} onClick={undo}><Undo2/></button><button className="v3-icon" aria-label="Redo" disabled={!ready||!history.future.length} onClick={redo}><Redo2/></button><button data-v3-preview-trigger disabled={!ready} onMouseDown={event=>{previewIntent.current=true;event.preventDefault();}} onClick={()=>setIsPreviewMode(true)}><Scan/>Preview</button><button disabled={!ready||session.status==='saving'} onClick={()=>void save()}><Save/>Save</button><button className="v3-export" disabled={!ready||exportStatus==='exporting'} onClick={()=>void exportDesign()}><Download/>Export</button></div>
    </header>
    {isPreviewMode&&<button className="v3-exit-preview" aria-label="Exit preview" onClick={()=>setIsPreviewMode(false)}><ArrowLeft/>Exit preview <kbd>Esc</kbd></button>}
    <div hidden={isPreviewMode}>
      {session.error&&<div role="alert" className="v3-alert"><span><strong>{session.error.operation==='save'?'Save failed':session.error.message==='Unsupported design ID'?'Unsupported design ID':'Unable to open design'}</strong> · {session.error.message}</span>{session.error.operation==='save'?<button onClick={()=>void save()}>Retry save</button>:session.error.message!=='Unsupported design ID'&&<button onClick={()=>void session.retryLoad()}>Retry opening</button>}</div>}
      {session.recoveredDraft&&<div role="alert" className="v3-alert">A local recovery draft is available.<button onClick={()=>{session.restoreDraft();setRecoveryNotice(true);}}>Restore draft</button><button onClick={session.discardDraft}>Discard draft</button></div>}
      {recoveryNotice&&status!=='Saved'&&<p role="status" className="v3-alert">Draft restored. Save to upload.</p>}
      {session.draftError&&<p role="alert" className="v3-alert">{session.draftError}</p>}
      {exportStatus==='error'&&<div role="alert" className="v3-alert">Export failed. Your design is unchanged.<button onClick={()=>void exportDesign()}>Retry export</button></div>}
      {exportStatus==='exported'&&<p role="status" className="v3-alert">PNG exported</p>}
    </div>
    <div className="v3-body">
      <nav aria-label="Editor sections" className="v3-rail" hidden={isPreviewMode}>{rail.map(([name,Icon])=><button key={name} disabled={!ready} aria-pressed={!imageEditing&&panel===name} onClick={()=>{setImageEditing(false);setPanel(panel===name?null:name);}}><Icon/>{name}</button>)}</nav>
      <aside className="v3-panel" hidden={!ready||isPreviewMode||(!imageEditing&&(panel===null||panel==='Tools'))} aria-label={imageEditing?'Image editing panel':panel&&panel!=='Tools'?`${panel} panel`:undefined}>
        <div hidden={imageEditing}>{ready&&panel&&panel!=='Tools'&&<V3Panels panel={panel} userId={user?String(user.id):''} onClose={()=>setPanel(null)}/>}</div>
        <div hidden={imageEditing||panel!=='Text'}>{ready&&<V3TextInspector suspended={isPreviewMode} isSuspended={()=>previewIntent.current}/>}</div>
        {ready&&imageEditing&&selectedImage?.type==='image'&&<V3ImageEditor key={selectedImage.id} element={selectedImage} onBack={()=>setImageEditing(false)}/>}
      </aside>
      <div className="v3-stage">{ready?<V3Canvas isPreviewMode={isPreviewMode} onAssistant={()=>setAssistant(!assistant)} onEditImage={()=>setImageEditing(true)}/>:<main aria-label="Opening workspace" className="v3-opening"><p>{session.error?'Retry opening to load your design.':'Loading your workspace…'}</p></main>}
        {!isPreviewMode&&ready&&panel==='Tools'&&<V3Tools onClose={()=>setPanel(null)} onText={addText} onImage={()=>setPanel('Uploads')}/>}
        <div hidden={isPreviewMode||!ready||!assistant} className="v3-ai-panel">{assistant&&ready&&<><button aria-label="Close Assistant" className="v3-icon" onClick={()=>setAssistant(false)}><X/></button>{assistantError&&<p role="alert">{assistantError}</p>}<AIChatBox isExpanded={assistant&&!isPreviewMode} onClose={()=>setAssistant(false)} onTemplateLoad={template=>void placeTemplate(template)}/></>}</div>
      </div>
    </div>
  </div>;
}
