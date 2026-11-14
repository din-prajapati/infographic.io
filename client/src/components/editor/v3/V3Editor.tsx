import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { ArrowLeft, Cloud, CloudUpload, Download, LayoutTemplate, MousePointer2, Redo2, Save, Type, Undo2, Upload, Palette, House, Scan, X, Shapes, MoreHorizontal, ChevronUp, ChevronDown, NotebookTabs, Link2, Eye, Maximize2 } from 'lucide-react';
import { useV3DesignSession } from '../../../hooks/useV3DesignSession';
import { useCanvasStore } from '../../../hooks/useCanvasStore';
import { downloadCanvas } from '../../../lib/canvasExport';
import { createTextElement } from '../../../lib/canvasUtils';
import { useTheme } from '../../../lib/theme-provider';
import { useAuth } from '../../../lib/auth';
import { captureCanvasData, loadAiVariationToCanvas, loadComposedDesignToCanvas, restoreCanvasData, scheduleFitCanvasZoomToViewport } from '../../../lib/canvasState';
import { canvasTemplatesApi, designsApi } from '../../../lib/api';
import { createReusableTemplate, createDesignFromTemplate, type ListingCanvasDocument } from '../../../lib/v3TemplateWorkflow';
import { useV3ListingWorkflow, useV3ListingStore } from '../../../hooks/useV3ListingWorkflow';
import { initializeV3NavigationGuard } from '../../../lib/v3NavigationGuard';
import { V3SaveDialog, type V3SaveAction, type V3SaveValues } from './V3SaveDialog';
import { V3ExportReview } from './V3ExportReview';
import { V3TemplateFields } from './V3TemplateFields';
import type { DesignMetadata } from '../../../lib/storage';
import { queryClient } from '../../../lib/queryClient';
import { loadTemplateById } from '../../../lib/storage';
import { resolveUrlTemplate, type V3EditorParams } from '../../../lib/v3EditorUrl';
import { AIChatBox } from '../../ai-chat/AIChatBox';
import type { Template } from '../../ai-chat/types';
import { V3Canvas } from './V3Canvas';
import { V3TextInspector } from './V3TextInspector';
import { V3Tools } from './V3Tools';
import { V3Panels, builtInPalettes, loadPalettes, type V3Panel } from './V3Panels';
import { V3ImageEditor } from './V3ImageEditor';
import { V3EffectsPanel } from './V3EffectsPanel';
import {V3LayersPanel,type LayerPresentation} from './V3LayersPanel';
import {V3ArrangePanel,V3SidebarTabs,type V3SidebarTab} from './V3ArrangePanel';
import {V3ElementsPanel,type ElementsTab} from './V3ElementsPanel';
import {useV3EditorShortcuts} from '../../../hooks/useV3EditorShortcuts';
import {clearV3Clipboard} from '../../../lib/v3EditorActions';
import {clearElementPreview} from '../../../hooks/useV3ElementPreview';
import {clearV3StrokeMemory} from './V3ElementToolbar';
import './v3-editor.css';
import './v3-responsive.css';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from '../../ui/dropdown-menu';
import {V3ColorPanel} from './V3ColorPanel';
import {useV3ColorPanel,openColorPanel,closeColorPanel,getTargetPaint,getDesignColors,previewColorPaint,commitColorPaint,clearColorDraft,COLOR_TARGET_LABELS} from '../../../hooks/useV3ColorPanel';
import type {Paint} from '../../../lib/canvasTypes';
const defaultPaintColors:Paint[]=['#000000','#545454','#737373','#A6A6A6','#D9D9D9','#FFFFFF','#EF4444','#F97316','#FACC15','#22C55E','#14B8A6','#3B82F6','#8B5CF6','#EC4899'].map(color=>({type:'solid',color,opacity:1}));
defaultPaintColors.push({type:'linear',angle:0,stops:[{color:'#123E62',opacity:1},{color:'#14B8A6',opacity:1}]},{type:'linear',angle:90,stops:[{color:'#000000',opacity:1},{color:'#FFFFFF',opacity:1}]},{type:'radial',center:'center',stops:[{color:'#FFFFFF',opacity:1},{color:'#3B82F6',opacity:1}]});


const rail=[['Templates',LayoutTemplate],['Tools',MousePointer2],['Elements',Shapes],['Text',Type],['Uploads',Upload],['Brand',Palette],['Listing',House],['Details',NotebookTabs]] as const;
export default function V3Editor({designId,templateId,canvasSize}:V3EditorParams) {
  const {user}=useAuth();
  const [,navigate]=useLocation();
  const listing=useV3ListingWorkflow();
  const account=useRef(user?.id);account.current=user?.id;
  const session=useV3DesignSession(designId,user?String(user.id):undefined);
  const {undo,redo,history,addElement,selectElement}=useCanvasStore();
  const {resolvedTheme}=useTheme();
  const [panel,setPanel]=useState<V3Panel|'Tools'|null>(()=>typeof window!=='undefined'&&typeof window.matchMedia==='function'&&window.matchMedia('(max-width: 767px)').matches?null:'Templates');
  const [sheetExpanded,setSheetExpanded]=useState(false);
  const [fieldsOpen,setFieldsOpen]=useState(false);
  // Show links is editor-only and session-scoped: off on entry, kept across designs opened in this editor session.
  const [showLinks,setShowLinks]=useState(false);
  const fieldsOpener=useRef<HTMLElement|null>(null);
  const panelOpener=useRef<HTMLElement|null>(null);
  const sheetRef=useRef<HTMLElement>(null);
  const panelHadFocus=useRef(false);
  const rememberPanelOpener=()=>{if(document.activeElement instanceof HTMLElement)panelOpener.current=document.activeElement.closest('[role=menu]')?document.querySelector<HTMLElement>('.v3-more'):document.activeElement;setSheetExpanded(false);if(window.matchMedia?.('(max-width: 767px)').matches){setFieldsOpen(false);fieldsOpener.current=null;}};
  const [imageEditing,setImageEditing]=useState(false);
  const [effectsId,setEffectsId]=useState<string|null>(null);
  const [layersOpen,setLayersOpen]=useState(false);
  const [sidebarTab,setSidebarTab]=useState<V3SidebarTab>('layers');
  const [layerPresentation,setLayerPresentation]=useState<LayerPresentation|null>(null);
  const onLayerPresentation=useCallback((id:string,patch:LayerPresentation['patch']|null)=>{
    if(!patch){setLayerPresentation(current=>current?.id===id?null:current);return;}
    const state=useCanvasStore.getState(),element=state.elements.find(item=>item.id===id);
    if(element&&element.visible&&!element.locked&&state.selectedElementIds.length===1&&state.selectedElementIds[0]===id)setLayerPresentation({id,baseElement:element,patch});
  },[]);

  const beforeLayers=useRef<{panel:V3Panel|'Tools'|null;imageEditing:boolean;effectsId:string|null}|null>(null);
  const openLayers=()=>{if(!layersOpen)beforeLayers.current={panel,imageEditing,effectsId};closeColorPanel();clearElementPreview();setImageEditing(false);setEffectsId(null);setSidebarTab('layers');setLayersOpen(true);};
  const closeLayers=()=>{const previous=beforeLayers.current;setLayersOpen(false);beforeLayers.current=null;if(previous){setPanel(previous.panel);setImageEditing(previous.imageEditing);setEffectsId(previous.effectsId);}};
  const leaveLayers=()=>{setLayersOpen(false);beforeLayers.current=null;};
  const [elementsTab,setElementsTab]=useState<ElementsTab>('shapes');
  const [elementsReplaceId,setElementsReplaceId]=useState<string|null>(null);
  const beforeElements=useRef<{panel:V3Panel|'Tools'|null;imageEditing:boolean;effectsId:string|null}|null>(null);
  const openElements=(tab:ElementsTab,targetId?:string)=>{leaveLayers();if(panel!=='Elements')beforeElements.current={panel,imageEditing,effectsId};closeColorPanel();clearElementPreview();setEffectsId(null);setImageEditing(false);setPanel('Elements');setElementsTab(tab);setElementsReplaceId(targetId??null);};
  const closeElements=()=>{const previous=beforeElements.current;setElementsReplaceId(null);beforeElements.current=null;setPanel(previous?.panel??null);setImageEditing(previous?.imageEditing??false);setEffectsId(previous?.effectsId??null);};
  const colorTarget=useV3ColorPanel(state=>state.target);
  const [editingBrandFromColor,setEditingBrandFromColor]=useState(false);
  const beforeBrandColor=useRef<{panel:V3Panel|'Tools'|null;imageEditing:boolean}|null>(null);
  const colorActive=!!colorTarget&&!editingBrandFromColor;
  const selectedShape=useCanvasStore(state=>state.selectedElementIds.length===1?state.elements.find(element=>element.id===state.selectedElementIds[0]&&element.type==='shape'&&element.visible&&!element.locked):undefined);
  const effectsActive=!!effectsId&&selectedShape?.id===effectsId&&!editingBrandFromColor;
  const closeEffects=()=>{clearElementPreview();setEffectsId(null);};
  useEffect(()=>{if(effectsId&&selectedShape?.id!==effectsId){setEffectsId(null);clearElementPreview();}},[effectsId,selectedShape]);
  useEffect(()=>{setEditingBrandFromColor(false);},[colorTarget]);
  useEffect(()=>()=>closeColorPanel(),[]);

  const selectedImage=useCanvasStore(state=>state.selectedElementIds.length===1?state.elements.find(element=>element.id===state.selectedElementIds[0]&&element.type==='image'):undefined);
  useEffect(()=>{if(!selectedImage)setImageEditing(false);},[selectedImage]);
  const [cloud,setCloud]=useState(false);
  const [assistant,setAssistant]=useState(false);
  const [assistantError,setAssistantError]=useState<string|null>(null);
  const [recoveryNotice,setRecoveryNotice]=useState(false);
  const [exportStatus,setExportStatus]=useState<'idle'|'exporting'|'exported'|'error'>('idle');
  const [reviewOpen,setReviewOpen]=useState(false);
  const [saveAction,setSaveAction]=useState<V3SaveAction|null>(null);
  const saveIntent=useRef(0);
  const resumeAutosave=useRef<(()=>void)|null>(null);
  const [createdCopy,setCreatedCopy]=useState<string|null>(null);
  const [templateCreated,setTemplateCreated]=useState(false);
  const closeSaveDialog=()=>{saveIntent.current++;setSaveAction(null);resumeAutosave.current?.();resumeAutosave.current=null;};
  const openSaveDialog=(action:V3SaveAction)=>{if(!session.ready||session.status==='saving'||session.recoveredDraft)return;saveIntent.current++;resumeAutosave.current?.();resumeAutosave.current=session.pauseAutosave();setSaveAction(action);};
  useEffect(()=>{closeSaveDialog();setCreatedCopy(null);setTemplateCreated(false);},[designId,user?.id]);
  useEffect(()=>()=>{resumeAutosave.current?.();},[]);
  const [workflowNotice,setWorkflowNotice]=useState('');
  const [workflowError,setWorkflowError]=useState('');
  const [isPreviewMode,setIsPreviewMode]=useState(false);
  useEffect(()=>{if(!layersOpen||isPreviewMode)setLayerPresentation(null);},[layersOpen,isPreviewMode]);
  const wasPreview=useRef(false);
  const previewIntent=useRef(false);
  const ready=session.ready;
  const save=()=>{if(!session.ready||session.status==='saving'||saveAction)return;if(!session.id){openSaveDialog('design');return;}return session.save();};
  useV3EditorShortcuts({enabled:ready&&!isPreviewMode});
  useEffect(()=>{setExportStatus('idle');setIsPreviewMode(false);setLayersOpen(false);setFieldsOpen(false);setSidebarTab('layers');beforeLayers.current=null;setEffectsId(null);setElementsReplaceId(null);beforeElements.current=null;closeColorPanel();clearV3StrokeMemory();clearV3Clipboard();},[designId]);
  useEffect(()=>{if(isPreviewMode){closeColorPanel();setEffectsId(null);clearElementPreview();}},[isPreviewMode]);
  useEffect(()=>{previewIntent.current=isPreviewMode;if(isPreviewMode)window.getSelection()?.removeAllRanges();if(wasPreview.current&&!isPreviewMode)document.querySelector<HTMLButtonElement>(window.matchMedia?.('(max-width: 1199px)').matches?'.v3-more':'[data-v3-preview-trigger]')?.focus();wasPreview.current=isPreviewMode;},[isPreviewMode]);
  useEffect(()=>{
    const preserveFocus=()=>{const focused=document.activeElement;if(focused instanceof HTMLElement&&focused.closest('.v3-editor')&&!focused.getClientRects().length)document.querySelector<HTMLButtonElement>('.v3-more')?.focus();};
    window.addEventListener('resize',preserveFocus);return()=>window.removeEventListener('resize',preserveFocus);
  },[]);
  const panelVisible=ready&&!isPreviewMode&&(layersOpen||colorActive||imageEditing||effectsActive||(panel!==null&&panel!=='Tools'));
  const closeResponsivePanel=()=>{leaveLayers();closeColorPanel();closeEffects();setImageEditing(false);setEditingBrandFromColor(false);setElementsReplaceId(null);beforeElements.current=null;setPanel(null);setSheetExpanded(false);panelOpener.current?.focus();};
  useEffect(()=>{if(!panelVisible&&panelHadFocus.current){panelHadFocus.current=false;panelOpener.current?.focus();}},[panelVisible]);
  useEffect(()=>{
    function key(event:KeyboardEvent){
      if(event.isComposing||event.keyCode===229)return;
      if(event.key==='Escape'&&isPreviewMode){event.preventDefault();setIsPreviewMode(false);return;}
      if(event.key==='Escape'&&!event.defaultPrevented&&window.matchMedia?.('(max-width: 767px)').matches&&panelVisible&&!document.querySelector('[role="menu"],[role="dialog"],.v3-element-popover,.v3-color-picker-popover')){event.preventDefault();closeResponsivePanel();return;}
      if(event.key==='Escape'&&!event.defaultPrevented&&useV3ColorPanel.getState().target&&!(event.target instanceof HTMLElement&&event.target.closest('.v3-element-popover,.v3-color-picker-popover'))){event.preventDefault();closeColorPanel();return;}
      if(event.key==='Escape'&&!event.defaultPrevented&&layersOpen&&!document.querySelector('[role="menu"]')){event.preventDefault();closeLayers();return;}
      if(event.key==='Escape'&&!event.defaultPrevented&&effectsActive){event.preventDefault();clearElementPreview();setEffectsId(null);return;}
      const target=event.target;if(event.defaultPrevented||event.altKey||document.querySelector('[role="dialog"]:not([aria-hidden="true"]),[role="alertdialog"]:not([aria-hidden="true"]),[role="menu"]:not([aria-hidden="true"])')||target instanceof Element&&(target.closest('input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="menu"],[role="dialog"],[role="alertdialog"],[role="combobox"],[role="slider"],[role="spinbutton"]')))return;
      if(ready&&event.key.toLowerCase()==='p'&&!event.ctrlKey&&!event.metaKey&&!event.altKey&&!event.shiftKey){event.preventDefault();setIsPreviewMode(value=>!value);return;}
      if(isPreviewMode||!ready||!(event.ctrlKey||event.metaKey))return;
      if(event.key.toLowerCase()==='s'){event.preventDefault();void save();}
      if(event.key.toLowerCase()==='z'){event.preventDefault();event.shiftKey?redo():undo();}
      if(event.key.toLowerCase()==='y'){event.preventDefault();redo();}
    }
    window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);
  },[ready,save,undo,redo,isPreviewMode,effectsActive,layersOpen,panelVisible]);
  async function exportDesign(){if(!ready||exportStatus==='exporting')return;setExportStatus('exporting');try{setExportStatus(await downloadCanvas(session.title||'design','png')?'exported':'error');}catch{setExportStatus('error');}}
  const listingArtwork=!!(listing.pending.property.address||listing.pending.property.headline||listing.selectedListingId||Object.keys(listing.bindings).length);
  const requestExport=()=>{if(listingArtwork)setReviewOpen(true);else void exportDesign();};
  async function submitSave(values:V3SaveValues){
    const owner=user?.id,sourceUrl=window.location.href,intent=saveIntent.current;
    const sameIntent=()=>editorMounted.current&&account.current===owner&&saveIntent.current===intent;
    const stillHere=()=>sameIntent()&&window.location.href===sourceUrl;
    if(!saveAction||!ready)throw new Error('This Design is no longer available.');
    if(saveAction==='design'){
      session.setTitle(values.name);session.setMetadata({tags:values.tags});
      const saved=await session.save();
      if(!saved)throw new Error('The Design could not be saved. Your edits stay. Retry save.');
      if(sameIntent())closeSaveDialog();
    }else if(saveAction==='copy'){
      const result=await session.saveCopy({title:values.name,tags:values.tags,alsoSaveOriginal:values.alsoSaveOriginal});
      if(!result)throw new Error('The Design is no longer available.');
      if(!sameIntent()||(!result.opened&&!stillHere()))return;
      if(!result.opened&&stillHere()){setCreatedCopy(result.id);setWorkflowNotice('A separate Design was created. Your newer edits remain open.');}
      closeSaveDialog();
    }else{
      const now=new Date().toISOString();
      const canvasData=createReusableTemplate(captureCanvasData());
      const saved=await canvasTemplatesApi.save({id:'',name:values.name,type:'template',canvasData,thumbnail:'',category:values.category,tags:values.tags,createdAt:now,updatedAt:now});
      if(!/^c[a-z0-9]{24}$/.test(saved.id)||saved.id===session.id)throw new Error('The server did not acknowledge the template. Retry creation.');
      if(!stillHere())return;
      closeSaveDialog();setTemplateCreated(true);setWorkflowNotice('Template created.');
      void queryClient.invalidateQueries({queryKey:['v3-templates',String(owner),'personal']});
    }
  }
  async function useTemplate(template:DesignMetadata,options:{replace?:boolean;stillWanted?:()=>boolean}={}){
    if(options.stillWanted&&!options.stillWanted())return false;
    const pristineUrlStart=!!options.stillWanted&&session.title==='Untitled design'&&!useCanvasStore.getState().elements.length;
    if(!pristineUrlStart&&!session.confirmNavigation())return false;
    const sourceUrl=window.location.href,sourceRevision=session.getNavigationRevision();
    const owner=user?.id;const now=new Date().toISOString();
    const sourceListing=useV3ListingStore.getState().snapshot;
    const canvasData=createDesignFromTemplate(template.canvasData as ListingCanvasDocument,sourceListing.pending,sourceListing.selectedListingId,sourceListing.selectedListingVersion);
    const saved=await designsApi.save({id:'',name:`${template.name} — ${sourceListing.pending.property.name||sourceListing.pending.property.address||'New design'}`,type:'design',canvasData,thumbnail:'',category:template.category,tags:template.tags,createdAt:now,updatedAt:now});
    if(!editorMounted.current||account.current!==owner||window.location.href!==sourceUrl)return false;
    if(!/^c[a-z0-9]{24}$/.test(saved.id)||saved.id===session.id)throw new Error('The server did not acknowledge a separate design.');
    // A deep link that finished after the user left or opened something else must not pull them back.
    if(session.getNavigationRevision()!==sourceRevision){setWorkflowNotice('A separate Design was created. Your newer edits remain open in this Design. Find the new Design in Projects.');return false;}
    if(options.stillWanted&&!options.stillWanted())return false;
    initializeV3NavigationGuard().allowInternal(()=>navigate(`/editor?editor=v3&designId=${saved.id}`,{replace:!!options.replace}));
    setWorkflowNotice('A separate Design was created from the template.');
    return true;
  }
  // URL start-up (lib/v3EditorUrl.ts): templateId starts a separate design exactly like the Templates panel; width/height
  // pre-size a blank design. Runs once per URL value, only for a new unsaved session (designId always wins).
  const urlStart=useRef<string|null>(null);
  const editorMounted=useRef(true);
  useEffect(()=>{editorMounted.current=true;return()=>{editorMounted.current=false;};},[]);
  useEffect(()=>{
    if(designId||!ready||session.id)return;
    const key=templateId?`template:${templateId}`:canvasSize?`size:${canvasSize.width}x${canvasSize.height}`:null;
    if(!key||urlStart.current===key)return;
    urlStart.current=key;
    if(!templateId&&canvasSize){if(!useCanvasStore.getState().elements.length){useCanvasStore.getState().loadCanvas({canvasWidth:canvasSize.width,canvasHeight:canvasSize.height});scheduleFitCanvasZoomToViewport();}return;}
    const owner=user?.id,initialRevision=session.getNavigationRevision();setWorkflowError('');setWorkflowNotice('Opening template…');
    const stillWanted=()=>{const params=new URLSearchParams(window.location.search);return editorMounted.current&&urlStart.current===key&&account.current===owner&&params.get('templateId')===templateId&&!params.get('designId')&&!useCanvasStore.getState().elements.length&&session.getNavigationRevision()===initialRevision;};
    void (async()=>{
      const resolved=await resolveUrlTemplate(templateId!,canvasTemplatesApi.getOne);
      if(!stillWanted()){if(editorMounted.current&&account.current===owner&&urlStart.current===key&&session.getNavigationRevision()!==initialRevision)setWorkflowNotice('Template opening cancelled because this Design changed. Your edits remain open.');return;}
      if(!resolved.ok){setWorkflowNotice('');setWorkflowError(resolved.error);return;}
      try{await useTemplate(resolved.template,{replace:true,stillWanted});}
      catch(error){if(stillWanted()){setWorkflowNotice('');setWorkflowError(error instanceof Error?error.message:'The template could not be opened. Try again.');}}
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[designId,templateId,canvasSize?.width,canvasSize?.height,ready,session.id]);
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
  // One sidebar hosts Arrange and Layers; the footer Layers button remains its only entry.
  const sidebarVisible=layersOpen&&!colorActive&&!imageEditing&&!effectsActive;
  const sidebarTabs=<V3SidebarTabs active={sidebarTab} onChange={setSidebarTab}/>;
  const status=!ready?(session.status==='loading'||session.status==='idle'?'Opening design':'Unable to open design'):session.status==='saving'?'Saving…':session.status==='saved'&&!session.hasUnsavedChanges?'Saved':'Unsaved';
  const addText=()=>{const el=createTextElement();addElement(el);selectElement(el.id);useCanvasStore.getState().setActiveTool('select');setPanel('Text');};
  // Template Fields is a right-hand inspector beside the Listing panel (approved editor.html). On phones it replaces the bottom sheet.
  const openTemplateFields=()=>{fieldsOpener.current=document.activeElement instanceof HTMLElement&&!document.activeElement.closest('[role=menu]')?document.activeElement:document.querySelector<HTMLElement>('.v3-more');if(window.matchMedia?.('(max-width: 767px)').matches){leaveLayers();closeColorPanel();setImageEditing(false);setEffectsId(null);setPanel(null);}setFieldsOpen(true);};
  const closeTemplateFields=()=>{setFieldsOpen(false);const opener=fieldsOpener.current;fieldsOpener.current=null;if(opener?.isConnected&&opener.getClientRects().length)opener.focus();};
  const toggleTemplateFields=()=>fieldsOpen?closeTemplateFields():openTemplateFields();
  const appliedProperty=listing.applied.property;
  const appliedName=appliedProperty.name||appliedProperty.address;
  const canvasSource=appliedName?`Canvas: ${appliedName} · ${appliedProperty.transaction==='rent'?'For rent':'For sale'}`:`Canvas: ${listingArtwork?'no listing applied yet':'no listing linked'}`;
  const applyListing=()=>{const result=listing.applyToDesign();setWorkflowError(result.ok?'':result.error);};
  return <div className="v3-editor" data-theme={resolvedTheme} data-panel-open={panelVisible} data-sheet-expanded={sheetExpanded} onFocusCapture={event=>{panelHadFocus.current=!!sheetRef.current?.contains(event.target);if(event.target instanceof HTMLElement&&!panelHadFocus.current)panelOpener.current=event.target;}}>
    <h1 className="sr-only">V3 Editor</h1>
    <header className="v3-header" hidden={isPreviewMode}><Link href="/my-designs" className="v3-logo"><img src="/logo-icon-option6-light.png" alt="" width="28" height="28"/><span>Buildographic</span></Link>
      <Link href="/my-designs" className="v3-projects" aria-label="Projects"><ArrowLeft/><span>Projects</span></Link>
      <div className="v3-title-wrap"><span aria-hidden="true" className="v3-title-measure">{session.title || 'Untitled design'}</span><input aria-label="Design title" className="v3-title" size={1} value={session.title} disabled={!ready} onChange={event=>session.setTitle(event.target.value)}/></div>
      <div className="v3-cloud-wrap"><button className="v3-icon" aria-label="Save status" aria-expanded={cloud} onClick={()=>setCloud(!cloud)}>{status==='Saved'?<Cloud/>:<CloudUpload/>}</button><span className="sr-only" role="status">{status}</span>
        {cloud&&<section className="v3-popover v3-cloud" aria-label="Save status details"><h2>{status==='Saved'?'Changes saved':status==='Saving…'?'Saving changes…':'Changes not saved'}</h2><p>{session.lastSavedAt?`Last saved: ${new Date(session.lastSavedAt).toLocaleTimeString()}`:designId?'Loaded from saved design.':'Save this design to start automatic saving.'}</p>{session.error?.operation==='save'&&<button onClick={()=>void save()}>Retry save</button>}</section>}
      </div>
      <div className="v3-header-actions"><button className="v3-icon v3-desktop-action" aria-label="Undo" disabled={!ready||!history.past.length} onClick={undo}><Undo2/></button><button className="v3-icon v3-desktop-action" aria-label="Redo" disabled={!ready||!history.future.length} onClick={redo}><Redo2/></button><div className="v3-save-split"><button className="v3-save" aria-label="Save" disabled={!ready||session.status==='saving'||!!saveAction||!!session.recoveredDraft} onClick={()=>void save()}><Save/><span>Save</span></button><DropdownMenu><DropdownMenuTrigger asChild><button className="v3-save-options" aria-label="Save options" disabled={!ready||session.status==='saving'||!!saveAction||!!session.recoveredDraft}><ChevronDown/></button></DropdownMenuTrigger><DropdownMenuContent align="end" className="v3-save-menu" data-theme={resolvedTheme} aria-label="Save options"><DropdownMenuLabel>Design</DropdownMenuLabel><DropdownMenuItem onSelect={()=>openSaveDialog('copy')}>Save a copy...</DropdownMenuItem><DropdownMenuItem onSelect={()=>openSaveDialog('template')}>Create reusable template...</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div><button className="v3-export v3-desktop-action" disabled={!ready||exportStatus==='exporting'} onClick={requestExport}><Download/>{listingArtwork?'Review & export':'Export'}</button><button className="v3-icon v3-desktop-action v3-preview-action" aria-label="Preview" title="Preview (P)" data-v3-preview-trigger disabled={!ready} onMouseDown={event=>{previewIntent.current=true;event.preventDefault();}} onClick={()=>setIsPreviewMode(true)}><Maximize2/></button>
        <DropdownMenu><DropdownMenuTrigger asChild><button className="v3-more" aria-label="More actions"><MoreHorizontal/></button></DropdownMenuTrigger><DropdownMenuContent align="end" className="v3-responsive-menu" aria-label="Editor actions">
          <DropdownMenuItem disabled={!ready} onSelect={()=>setIsPreviewMode(true)}><Scan/>Preview</DropdownMenuItem>
          <DropdownMenuItem disabled={!ready||exportStatus==='exporting'} onSelect={requestExport}><Download/>{exportStatus==='exporting'?'Exporting…':'Export'}</DropdownMenuItem>
          <DropdownMenuItem disabled={!ready||!history.past.length} onSelect={undo}><Undo2/>Undo</DropdownMenuItem><DropdownMenuItem disabled={!ready||!history.future.length} onSelect={redo}><Redo2/>Redo</DropdownMenuItem><DropdownMenuSeparator/>
          <DropdownMenuItem disabled={!ready||!listing.pendingChanges} onSelect={applyListing}>Apply to design</DropdownMenuItem>
        </DropdownMenuContent></DropdownMenu>
      </div>
    </header>
    {isPreviewMode&&<button className="v3-exit-preview" aria-label="Exit preview" onClick={()=>setIsPreviewMode(false)}><ArrowLeft/>Exit preview <kbd>Esc</kbd></button>}
    <div hidden={isPreviewMode}>
      {session.error&&<div role="alert" className="v3-alert"><span><strong>{session.error.operation==='save'?'Save failed':session.error.message==='Unsupported design ID'?'Unsupported design ID':'Unable to open design'}</strong> · {session.error.message}</span>{session.error.operation==='save'?<button onClick={()=>void save()}>Retry save</button>:session.error.message!=='Unsupported design ID'&&<button onClick={()=>void session.retryLoad()}>Retry opening</button>}</div>}
      {session.recoveredDraft&&<div role="alert" className="v3-alert">A local recovery draft is available.<button onClick={()=>{session.restoreDraft();setRecoveryNotice(true);}}>Restore draft</button><button onClick={session.discardDraft}>Discard draft</button></div>}
      {recoveryNotice&&status!=='Saved'&&<p role="status" className="v3-alert">Draft restored. Save to upload.</p>}
      {session.draftError&&<p role="alert" className="v3-alert">{session.draftError}</p>}
      {exportStatus==='error'&&<div role="alert" className="v3-alert">Export failed. Your design is unchanged.<button onClick={()=>void exportDesign()}>Retry export</button></div>}
      {exportStatus==='exported'&&<p role="status" className="v3-alert">PNG exported</p>}
      {workflowError&&<p role="alert" className="v3-alert">{workflowError}</p>}
      {workflowNotice&&<p role="status" className="v3-alert">{workflowNotice}{templateCreated&&<Link href="/templates">View in Templates</Link>}{createdCopy&&<Link href={`/editor?editor=v3&designId=${createdCopy}`}>Open created Design</Link>}</p>}
    </div>
    {saveAction&&ready&&<V3SaveDialog key={`${saveAction}:${session.id??'new'}`} action={saveAction} initialName={saveAction==='copy'?`${session.title||'Untitled design'} - Copy`:session.title||'Untitled design'} initialTags={Array.isArray(session.metadata?.tags)?session.metadata.tags.filter((value):value is string=>typeof value==='string'):[]} initialCategory={typeof session.metadata?.category==='string'?session.metadata.category:'real-estate'} hasSourceId={!!session.id} sourceHasChanges={session.hasUnsavedChanges} pendingUpdates={listing.pendingChanges} onClose={closeSaveDialog} onSubmit={submitSave}/>}
    {reviewOpen&&ready&&<V3ExportReview key={designId??'new'} title={session.title} onClose={()=>setReviewOpen(false)}/>}
    <div className="v3-body">
      <nav aria-label="Editor sections" className="v3-rail" hidden={isPreviewMode}>{rail.map(([name,Icon])=><button key={name} disabled={!ready} aria-pressed={!layersOpen&&!colorActive&&!imageEditing&&!effectsActive&&(panel===name||(name==='Details'&&(panel==='Property'||panel==='Agent')))} onClick={()=>{rememberPanelOpener();leaveLayers();if(name==='Elements'){panel==='Elements'&&!colorActive?closeElements():openElements('shapes');return;}closeColorPanel();closeEffects();setElementsReplaceId(null);beforeElements.current=null;setEditingBrandFromColor(false);setImageEditing(false);setPanel(panel===name||(name==='Details'&&(panel==='Property'||panel==='Agent'))?null:name);}}><Icon/>{name}</button>)}</nav>
      <aside ref={sheetRef} className="v3-panel" hidden={!panelVisible} aria-label={colorActive?'Color panel':effectsActive?'Effects panel':imageEditing?'Image editing panel':layersOpen?(sidebarTab==='arrange'?'Arrange panel':'Layers panel'):panel&&panel!=='Tools'?`${panel==='Property'||panel==='Agent'?'Details':panel} panel`:undefined}>
        <div className="v3-sheet-controls"><button type="button" aria-label={sheetExpanded?'Collapse panel':'Expand panel'} aria-expanded={sheetExpanded} onClick={()=>setSheetExpanded(value=>!value)}>{sheetExpanded?<ChevronDown/>:<ChevronUp/>}<span>{sheetExpanded?'Collapse':'Expand'}</span></button><button type="button" aria-label="Close panel" onClick={closeResponsivePanel}><X/></button></div>
        <div className="v3-panel-scroll">
        <div hidden={layersOpen||colorActive||imageEditing||effectsActive}>{ready&&panel==='Elements'&&<V3ElementsPanel tab={elementsTab} replaceId={elementsReplaceId} onTabChange={tab=>{setElementsTab(tab);if(tab!==elementsTab)setElementsReplaceId(null);}} onClose={closeElements}/>}{ready&&panel&&panel!=='Tools'&&panel!=='Elements'&&<V3Panels panel={panel} userId={user?String(user.id):''} onUseTemplate={useTemplate} onNavigate={destination=>{leaveLayers();setPanel(destination);}} onClose={()=>{if(editingBrandFromColor){const previous=beforeBrandColor.current;if(previous){setPanel(previous.panel);setImageEditing(previous.imageEditing);}beforeBrandColor.current=null;setEditingBrandFromColor(false);}else setPanel(null);}}/>}</div>
        <div hidden={layersOpen||colorActive||imageEditing||effectsActive||panel!=='Text'}>{ready&&<V3TextInspector suspended={isPreviewMode} isSuspended={()=>previewIntent.current}/>}</div>
        {ready&&!isPreviewMode&&sidebarVisible&&(sidebarTab==='arrange'
          ?<V3ArrangePanel presentation={layerPresentation} onClose={closeLayers} tabs={sidebarTabs}/>
          :<V3LayersPanel presentation={layerPresentation} onClose={closeLayers} tabs={sidebarTabs} onEditBackground={()=>openColorPanel({slot:'background'})}/>)}
        {ready&&effectsActive&&!colorActive&&selectedShape?.type==='shape'&&<V3EffectsPanel key={selectedShape.id} element={selectedShape} onClose={closeEffects}/>}
        {ready&&imageEditing&&!colorActive&&selectedImage?.type==='image'&&<V3ImageEditor key={selectedImage.id} element={selectedImage} onBack={()=>setImageEditing(false)}/>}
        {ready&&colorActive&&colorTarget&&<V3ColorPanel key={`${colorTarget.elementId??'canvas'}:${colorTarget.slot}`} targetLabel={COLOR_TARGET_LABELS[colorTarget.slot]} currentPaint={getTargetPaint(colorTarget)} designColors={getDesignColors()}
          brandPalettes={[...builtInPalettes,...loadPalettes()].map(palette=>({...palette,colors:palette.colors.map(color=>({type:'solid' as const,color,opacity:1}))}))} defaultColors={defaultPaintColors} supportsGradients={colorTarget.slot!=='shadow'&&colorTarget.slot!=='icon'}
          onDraft={previewColorPaint} onCommit={commitColorPaint} onCancel={clearColorDraft} onClose={closeColorPanel} onEditBrand={()=>{clearColorDraft();beforeBrandColor.current={panel,imageEditing};setEditingBrandFromColor(true);setImageEditing(false);setPanel('Brand');}}/>}
        </div>
      </aside>
      <div className="v3-stage">{ready&&!isPreviewMode&&<div className="v3-listing-bar" aria-label="Canvas information"><span className="v3-canvas-source">{canvasSource}</span>{listing.pendingChanges>0&&<span className="v3-listing-pending">{listing.pendingChanges} pending {listing.pendingChanges===1?'update':'updates'} · Apply first</span>}<div className="v3-canvas-linking" role="group" aria-label="Canvas linking"><button type="button" aria-label="Template Fields" title="Template Fields" aria-pressed={fieldsOpen} onClick={toggleTemplateFields}><Link2/><span>Template Fields</span></button><button type="button" aria-label="Show links" title="Show links" aria-pressed={showLinks} onClick={()=>setShowLinks(value=>!value)}><Eye/><span>Show links</span></button></div></div>}{ready?<V3Canvas isPreviewMode={isPreviewMode} onTemplateFields={toggleTemplateFields} isTemplateFieldsOpen={fieldsOpen} showLinks={showLinks} onToggleLinks={()=>setShowLinks(value=>!value)} onLinkField={openTemplateFields} onAssistant={()=>setAssistant(!assistant)} onLayerPresentation={layersOpen?onLayerPresentation:undefined} onOpenLayers={()=>{rememberPanelOpener();if(sidebarVisible&&sidebarTab==='layers')closeLayers();else if(sidebarVisible)setSidebarTab('layers');else openLayers();}} isLayersSidebarOpen={sidebarVisible&&sidebarTab==='layers'} onEditImage={()=>{rememberPanelOpener();leaveLayers();setImageEditing(true);}} onEditEffects={()=>{rememberPanelOpener();leaveLayers();if(selectedShape){closeColorPanel();setImageEditing(false);setEffectsId(selectedShape.id);}}} onBrowseElements={()=>{const state=useCanvasStore.getState(),target=state.elements.find(el=>el.id===state.selectedElementIds[0]);if(target?.type==='shape')openElements('shapes',target.id);else if(target?.type==='image'&&target.icon)openElements('icons',target.id);}}/>:<main aria-label="Opening workspace" className="v3-opening"><p>{session.error?'Retry opening to load your design.':'Loading your workspace…'}</p></main>}
        {!layersOpen&&!isPreviewMode&&!colorActive&&!effectsActive&&ready&&panel==='Tools'&&<V3Tools onClose={()=>setPanel(null)} onText={addText} onImage={()=>setPanel('Uploads')} onElements={()=>openElements('shapes')}/>}
        <div hidden={isPreviewMode||!ready||!assistant} className="v3-ai-panel">{assistant&&ready&&<><button aria-label="Close Assistant" className="v3-icon" onClick={()=>setAssistant(false)}><X/></button>{assistantError&&<p role="alert">{assistantError}</p>}<AIChatBox isExpanded={assistant&&!isPreviewMode} onClose={()=>setAssistant(false)} onTemplateLoad={template=>void placeTemplate(template)}/></>}</div>
      </div>
      {ready&&!isPreviewMode&&fieldsOpen&&<aside className="v3-inspector" aria-label="Template Fields panel"><V3TemplateFields onClose={closeTemplateFields}/></aside>}
    </div>
  </div>;
}
